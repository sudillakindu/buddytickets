-- ============================================================
--  BUDDYTICKET — DATABASE SCHEMA  (Tables & Types)
--  File   : 01_tables_schema.sql
--  Depends: PostgreSQL 15+, pgcrypto (gen_random_uuid)
--  Note   : Stored procedures / triggers / views are in
--           02_procedures_triggers_views.sql
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- DATABASE TIMEZONE
-- ─────────────────────────────────────────────────────────────

-- ශ්‍රී ලංකා කාල කලාපය (UTC+5:30) database level එකේදීම set කිරීම.
-- මෙය නොකළොත් TIMESTAMPTZ columns වල NOW() function UTC
-- time return කරන නිසා event start/end time comparisons
-- සහ pg_cron jobs වල වැරදි time calculations ඇතිවිය හැක.
ALTER DATABASE postgres SET timezone TO 'Asia/Colombo';


-- ─────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────────────────────

-- Platform එකේ user roles define කිරීම.
-- SYSTEM = internal automation, ORGANIZER = event creators,
-- CO_ORGANIZER = organizer assistants, STAFF = gate staff,
-- USER = ticket buyers.
-- RLS (Row Level Security) policies මේ enum values මත
-- depend වන නිසා rename කිරීමේදී ඉතා සැලකිලිමත් විය යුතු.
CREATE TYPE user_role AS ENUM (
    'SYSTEM',
    'ORGANIZER',
    'CO_ORGANIZER',
    'STAFF',
    'USER'
);

-- Organizer verification workflow එකේ states.
-- PENDING → admin review await කරයි,
-- APPROVED → events create කිරීමට හැකි,
-- REJECTED → re-submission කිරීමට හැකි.
-- organizer_details table භාවිතා කරයි.
CREATE TYPE organizer_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

-- Event life-cycle state machine.
-- DRAFT → PUBLISHED → ON_SALE → ONGOING → COMPLETED/SOLD_OUT/CANCELLED.
-- DRAFT හා CANCELLED auto-transitions (pg_cron, triggers) හරහා
-- කිසිවිටෙකත් වෙනස් නොවේ — manual change පමණක් allowed.
-- auto_update_event_time_statuses() function මෙම enum use කරයි.
-- reserve_tickets_occ() RPC: ON_SALE status events පමණක්
-- ticket reservations accept කරයි — FCFS gate.
CREATE TYPE event_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ON_SALE',
    'SOLD_OUT',
    'ONGOING',
    'COMPLETED',
    'CANCELLED'
);

-- Promotion discount calculation logic define කිරීම.
-- PERCENTAGE = order amount % ක්, FIXED_AMOUNT = fixed LKR ප්‍රමාණය.
-- promotions table, finalize_order_tickets() RPC,
-- සහ events.platform_fee_type column භාවිතා කරයි.
CREATE TYPE discount_type AS ENUM (
    'PERCENTAGE',
    'FIXED_AMOUNT'
);

-- Ticket reservation state machine.
-- PENDING → user checkout session active,
-- CONFIRMED → payment complete,
-- EXPIRED → timer expired (expire_stale_reservations cron),
-- CANCELLED → user abandoned or new session started.
-- reserve_tickets_occ() සහ finalize_order_tickets() RPCs
-- මෙම transitions handle කරයි.
CREATE TYPE reservation_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'EXPIRED',
    'CANCELLED'
);

-- Order creation method identify කිරීම.
-- PAYHERE_ONLINE = online payment gateway,
-- ONGATE_MANUAL = gate staff cash-desk entry.
-- finalize_order_tickets() RPC මේ value අනුව ticket status
-- ACTIVE හෝ ONGATE_PENDING ලෙස set කරයි.
CREATE TYPE payment_source AS ENUM (
    'PAYHERE_ONLINE',
    'ONGATE_MANUAL'
);

-- Order payment lifecycle states.
-- PENDING → payment initiate කළ, PAID → confirmed,
-- FAILED → gateway error, REFUNDED → refund processed.
-- orders table සහ finalize_order_tickets() RPC භාවිතා කරයි.
CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);

-- Physical ticket validity states.
-- ACTIVE = valid for entry, ONGATE_PENDING = cash payment pending,
-- USED = already scanned at gate, CANCELLED = voided.
-- tickets table සහ scan_logs table මෙය use කරයි.
CREATE TYPE ticket_status AS ENUM (
    'ACTIVE',
    'ONGATE_PENDING',
    'USED',
    'CANCELLED'
);

-- Payment gateway identify කිරීම.
-- transactions table record කිරීමට භාවිතා වේ.
CREATE TYPE gateway_type AS ENUM (
    'PAYHERE',
    'CASH_DESK'
);

-- Transaction attempt result states.
-- transactions table සඳහා පමණි.
CREATE TYPE transaction_status AS ENUM (
    'SUCCESS',
    'FAILED'
);

-- Gate scanner QR code scan attempt ප්‍රතිඵල.
-- ALLOWED = valid entry, DENIED_SOLD_OUT = oversell check,
-- DENIED_ALREADY_USED = duplicate scan, DENIED_UNPAID = cash pending,
-- DENIED_INVALID = fake/unknown QR code.
-- scan_logs table record කිරීමට භාවිතා වේ.
CREATE TYPE scan_result AS ENUM (
    'ALLOWED',
    'DENIED_SOLD_OUT',
    'DENIED_ALREADY_USED',
    'DENIED_UNPAID',
    'DENIED_INVALID'
);

-- Platform commission & organizer payout workflow සඳහා
-- payout lifecycle states define කිරීම.
-- PENDING = payout request initiated, PROCESSING = bank transfer underway,
-- COMPLETED = organizer ට funds received, FAILED = transfer error.
-- payouts table status column භාවිතා කරයි.
CREATE TYPE payout_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);

-- Refund request workflow states define කිරීම.
-- PENDING = user submitted + awaiting admin review,
-- APPROVED = admin approved + gateway refund initiated,
-- REJECTED = admin rejected (reason required),
-- REFUNDED = gateway confirmed refund success.
-- refund_requests table status column භාවිතා කරයි.
CREATE TYPE refund_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'REFUNDED'
);

-- Waitlist entry states define කිරීම.
-- WAITING = queue හි, NOTIFIED = slot available email sent,
-- CONVERTED = waitlist → ticket purchase completed,
-- EXPIRED = notification window lapsed without purchase.
-- waitlists table status column භාවිතා කරයි.
CREATE TYPE waitlist_status AS ENUM (
    'WAITING',
    'NOTIFIED',
    'CONVERTED',
    'EXPIRED'
);


-- ─────────────────────────────────────────────────────────────
-- SHARED UTILITY FUNCTION — AUTO-UPDATE updated_at
-- ─────────────────────────────────────────────────────────────

-- MySQL වල ON UPDATE CURRENT_TIMESTAMP වෙනුවට PostgreSQL හි
-- BEFORE UPDATE trigger function ලෙස updated_at column auto-set
-- කිරීම. users, events, ticket_types, orders, tickets ඇතුළු
-- සියලු mutable tables හි trigger ලෙස attach කෙරේ.
-- 02_procedures_triggers_views.sql file හි domain-specific
-- trigger functions වෙන් කර ඇත.
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- TABLE: users
-- ─────────────────────────────────────────────────────────────

-- Platform සියලු users (ticket buyers, organizers, staff, system)
-- store කරන central identity table.
-- email, mobile, username uniqueness database level දී enforce
-- කෙරේ. password_hash = NULL නම් OAuth/OTP-only login user.
-- organizer_details table user_id FK ලෙස reference කරයි.
-- tickets, orders, ticket_reservations, scan_logs tables
-- සියල්ල user_id ට link වේ.
CREATE TABLE IF NOT EXISTS users (
    user_id             UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150)    NOT NULL,
    image_url           VARCHAR(255)    DEFAULT NULL,
    email               VARCHAR(150)    NOT NULL,
    is_email_verified   BOOLEAN         DEFAULT FALSE,
    mobile              VARCHAR(20)     NOT NULL,
    is_mobile_verified  BOOLEAN         DEFAULT FALSE,
    username            VARCHAR(100)    NOT NULL,
    password_hash       VARCHAR(255)    DEFAULT NULL,
    role                user_role       NOT NULL DEFAULT 'USER',
    is_active           BOOLEAN         DEFAULT TRUE,
    created_at          TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     DEFAULT NULL,
    last_login_at       TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_email    UNIQUE (email),
    CONSTRAINT uq_mobile   UNIQUE (mobile),
    CONSTRAINT uq_username UNIQUE (username)
);

-- role + is_active composite index: RLS policy evaluations සහ
-- role-based user listings (admin dashboard) වේගවත් කිරීමට.
CREATE INDEX idx_users_role_status ON users (role, is_active);

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: organizer_details
-- ─────────────────────────────────────────────────────────────

-- Organizer verification process සඳහා KYC + banking info.
-- users table හි role='ORGANIZER' user කෙනෙකුට 1:1 relationship.
-- Admin විසින් verify කළ පසු status='APPROVED' සහ verified_by,
-- verified_at columns set කෙරේ.
-- nic_number + bank account uniqueness enforce කිරීම financial
-- fraud prevention සඳහා.
CREATE TABLE IF NOT EXISTS organizer_details (
    user_id                 UUID             PRIMARY KEY
                                             REFERENCES users(user_id) ON DELETE CASCADE,
    nic_number              VARCHAR(20)      NOT NULL,
    address                 TEXT             NOT NULL,
    bank_name               VARCHAR(100)     NOT NULL,
    bank_branch             VARCHAR(100)     NOT NULL,
    account_holder_name     VARCHAR(150)     NOT NULL,
    account_number          VARCHAR(50)      NOT NULL,
    nic_front_image_url     VARCHAR(255)     NOT NULL,
    nic_back_image_url      VARCHAR(255)     NOT NULL,
    remarks                 TEXT             DEFAULT NULL,
    status                  organizer_status DEFAULT 'PENDING',
    is_submitted            BOOLEAN          DEFAULT FALSE,
    verified_by             UUID             DEFAULT NULL
                                             REFERENCES users(user_id) ON DELETE RESTRICT,
    verified_at             TIMESTAMPTZ      DEFAULT NULL,
    created_at              TIMESTAMPTZ      DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ      DEFAULT NULL,

    CONSTRAINT uq_nic               UNIQUE (nic_number),
    CONSTRAINT uq_user_bank_account UNIQUE (user_id, account_number)
);

-- Pending verifications admin dashboard query සඳහා composite index.
CREATE INDEX idx_organizer_verification_status
    ON organizer_details (status, verified_at);

CREATE TRIGGER update_organizer_details_modtime
BEFORE UPDATE ON organizer_details
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: categories
-- ─────────────────────────────────────────────────────────────

-- Event categories (Music, Sports, Comedy, etc.) manage කිරීමට.
-- events table category_id FK ලෙස reference කරයි.
-- name uniqueness enforce කෙරේ.
-- is_active=FALSE categories event creation UI හි hide කෙරේ.
CREATE TABLE IF NOT EXISTS categories (
    category_id     UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)    NOT NULL,
    description     TEXT            DEFAULT NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_category_name UNIQUE (name)
);

CREATE INDEX idx_category_status ON categories (is_active);

CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: events
-- ─────────────────────────────────────────────────────────────

-- Platform core entity — ticket selling events.
-- status column auto_update_event_time_statuses() cron function
-- (every minute) හරහා ONGOING/COMPLETED ලෙස update කෙරේ.
-- is_vip column trigger_vip_status_change trigger activate කරයි
-- — vip_events table ස්වයංක්‍රීයව manage කෙරේ.
-- ticket_types, event_images, orders, tickets, event_community,
-- ticket_reservations, promotions, payouts, waitlists, reviews
-- tables events.event_id ට foreign key ලෙස link වේ.
-- platform_fee_type, platform_fee_value, platform_fee_cap:
-- BuddyTicket commission structure per-event level දී configure
-- කිරීමට. payouts table ගේ platform_fee_amount calculation
-- event COMPLETED පසු gross revenue aggregate කර fee type
-- අනුව deduct කරයි.
CREATE TABLE IF NOT EXISTS events (
    event_id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id        UUID            NOT NULL
                                        REFERENCES users(user_id)
                                        ON DELETE RESTRICT ON UPDATE CASCADE,
    category_id         UUID            NOT NULL
                                        REFERENCES categories(category_id)
                                        ON DELETE RESTRICT ON UPDATE CASCADE,
    name                VARCHAR(255)    NOT NULL,
    subtitle            VARCHAR(255)    NOT NULL,
    description         TEXT            NOT NULL,
    requirements        TEXT            DEFAULT NULL,
    location            VARCHAR(100)    NOT NULL,
    map_link            VARCHAR(255)    NOT NULL,
    start_at            TIMESTAMPTZ     NOT NULL,
    end_at              TIMESTAMPTZ     NOT NULL,
    status              event_status    DEFAULT 'DRAFT',
    is_active           BOOLEAN         DEFAULT FALSE,
    is_vip              BOOLEAN         DEFAULT FALSE,
    -- Platform commission configuration (per event).
    -- platform_fee_type: PERCENTAGE (e.g. 3%) හෝ FIXED_AMOUNT (e.g. LKR 50 per ticket).
    -- platform_fee_value: actual fee value (% හෝ LKR amount).
    -- platform_fee_cap: PERCENTAGE mode maximum fee ceiling (LKR). NULL = no cap.
    platform_fee_type   discount_type   NOT NULL DEFAULT 'PERCENTAGE',
    platform_fee_value  NUMERIC(15,2)   NOT NULL DEFAULT 3.00,
    platform_fee_cap    NUMERIC(15,2)   DEFAULT NULL,
    created_at          TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_event_name UNIQUE (name)
);

-- Organizer dashboard events list query සඳහා.
CREATE INDEX idx_events_organizer ON events (organizer_id);

-- pg_cron time-based status function WHERE clause covering index.
-- reserve_tickets_occ() event status + is_active validation ද use කරයි.
CREATE INDEX idx_events_lifecycle ON events (status, start_at, end_at);

-- Public events listing page filter query (status + is_active + date).
CREATE INDEX idx_events_search_status ON events (status, is_active, start_at);

-- Location-based event search සඳහා composite index.
CREATE INDEX idx_events_search_location ON events (location, start_at);

-- VIP featured section filter (view_featured_events) සඳහා index.
CREATE INDEX idx_events_is_vip ON events (is_vip);

CREATE TRIGGER update_events_modtime
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: event_images
-- ─────────────────────────────────────────────────────────────

-- Event gallery images ordered display සඳහා.
-- (event_id, priority_order) composite PK duplicate ordering
-- database level දීම prevent කරයි.
-- Event delete කළ විට ON DELETE CASCADE images ද delete කෙරේ.
-- Supabase Storage bucket URLs image_url column හි store කෙරේ.
CREATE TABLE IF NOT EXISTS event_images (
    event_id        UUID         NOT NULL
                                 REFERENCES events(event_id) ON DELETE CASCADE,
    priority_order  INT          NOT NULL,
    image_url       VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (event_id, priority_order)
);


-- ─────────────────────────────────────────────────────────────
-- TABLE: ticket_types
-- ─────────────────────────────────────────────────────────────

-- Event එකක් සඳහා ticket tiers (VIP, Regular, Early Bird, etc.).
-- qty_sold column UPDATE වන සෑම විටම trigger_check_sold_out
-- trigger ක්‍රියාත්මක වී event sold out status check කරයි.
-- version column finalize_order_tickets() OCC (Optimistic
-- Concurrency Control) mechanism සඳහා race condition prevent කරයි.
-- capacity, qty_sold, version columns reserve_tickets_occ() සහ
-- finalize_order_tickets() RPCs දෙකෙහිම critical read-and-update
-- path හි FOR UPDATE lock සමඟ use කෙරේ.
CREATE TABLE IF NOT EXISTS ticket_types (
    ticket_type_id  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID            NOT NULL
                                    REFERENCES events(event_id) ON DELETE CASCADE,
    name            VARCHAR(100)    NOT NULL,
    description     TEXT            NOT NULL,
    inclusions      JSONB           NOT NULL,
    price           NUMERIC(15,2)   NOT NULL DEFAULT 0.00,
    capacity        INT             NOT NULL,
    qty_sold        INT             DEFAULT 0,
    sale_start_at   TIMESTAMPTZ     DEFAULT NULL,
    sale_end_at     TIMESTAMPTZ     DEFAULT NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    version         INT             DEFAULT 1,
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_event_ticket UNIQUE (event_id, name)
);

-- check_and_update_event_sold_out trigger SUM aggregate query index.
CREATE INDEX idx_ticket_capacity
    ON ticket_types (ticket_type_id, qty_sold, capacity);

CREATE TRIGGER update_ticket_types_modtime
BEFORE UPDATE ON ticket_types
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: vip_events
-- ─────────────────────────────────────────────────────────────

-- Featured section VIP event priority order list.
-- handle_vip_status_change() trigger function events.is_vip
-- column change වන විට AUTO insert/delete/reorder කරයි.
-- event_id sole PK: handle_vip_status_change ON CONFLICT (event_id)
-- clause නිවැරදිව work වීමට composite PK නොව sole PK.
-- priority_order global UNIQUE: gap-fill reorder logic සඳහා.
-- view_featured_events view මෙම table JOIN කරයි.
CREATE TABLE IF NOT EXISTS vip_events (
    event_id        UUID    NOT NULL
                            REFERENCES events(event_id) ON DELETE CASCADE,
    priority_order  INT     NOT NULL,
    assigned_by     UUID    NOT NULL
                            REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT NULL,

    PRIMARY KEY (event_id),
    CONSTRAINT uq_vip_priority_order UNIQUE (priority_order)
);

-- view_featured_events ORDER BY priority_order query index.
CREATE INDEX idx_vip_priority_order ON vip_events (priority_order);

CREATE TRIGGER update_vip_events_modtime
BEFORE UPDATE ON vip_events
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: event_community
-- ─────────────────────────────────────────────────────────────

-- Event organizer team members (CO_ORGANIZER, STAFF) assign
-- කිරීමට. Gate scanning permission, event management access
-- control මෙම table reference කරයි. Many-to-many: users ↔ events.
-- (event_id, user_id) composite PK duplicate assignments prevent කරයි.
CREATE TABLE IF NOT EXISTS event_community (
    user_id     UUID        NOT NULL
                            REFERENCES users(user_id) ON DELETE CASCADE,
    event_id    UUID        NOT NULL
                            REFERENCES events(event_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (event_id, user_id)
);


-- ─────────────────────────────────────────────────────────────
-- TABLE: promotions
-- ─────────────────────────────────────────────────────────────

-- Discount coupon codes manage කිරීම.
-- scope_event_id / scope_ticket_type_id NULL නම් platform-wide;
-- set නම් specific event/ticket type සඳහා පමණි.
-- version column OCC: finalize_order_tickets() RPC හි concurrent
-- promotion usage increment collisions prevent කිරීමට.
-- current_global_usage: finalize_order_tickets() RPC promotions
-- row SELECT FOR UPDATE lock + limit check සමඟ atomically increment.
-- usage_limit_global = 0 → unlimited (no cap enforced).
-- FCFS guarantee: finalize_order_tickets() promotions row lock
-- කොට current_global_usage < usage_limit_global validate කරයි —
-- concurrent users promotions table level දී serialize වේ.
-- promotion_usages table per-user usage history track කරයි.
CREATE TABLE IF NOT EXISTS promotions (
    promotion_id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(50)     NOT NULL,
    description             VARCHAR(255)    DEFAULT NULL,
    discount_type           discount_type   NOT NULL,
    discount_value          NUMERIC(15,2)   NOT NULL,
    max_discount_cap        NUMERIC(15,2)   DEFAULT NULL,
    min_order_amount        NUMERIC(15,2)   DEFAULT 0.00,
    start_at                TIMESTAMPTZ     NOT NULL,
    end_at                  TIMESTAMPTZ     NOT NULL,
    is_active               BOOLEAN         DEFAULT TRUE,
    usage_limit_global      INT             DEFAULT 0,
    usage_limit_per_user    INT             DEFAULT 1,
    current_global_usage    INT             DEFAULT 0,
    scope_event_id          UUID            DEFAULT NULL
                                            REFERENCES events(event_id) ON DELETE CASCADE,
    scope_ticket_type_id    UUID            DEFAULT NULL
                                            REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    extra_rules_json        JSONB           DEFAULT NULL,
    created_by              UUID            NOT NULL
                                            REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     DEFAULT NULL,
    version                 INT             DEFAULT 1,

    CONSTRAINT uq_promo_code UNIQUE (code)
);

-- Checkout promotion validation query (code + is_active + date range).
CREATE INDEX idx_promotions_validity
    ON promotions (code, is_active, start_at, end_at);

CREATE TRIGGER update_promotions_modtime
BEFORE UPDATE ON promotions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: ticket_reservations
-- ─────────────────────────────────────────────────────────────

-- Checkout session inventory lock table — FCFS core mechanism.
-- reserve_tickets_occ() RPC:
--   ticket_types row SELECT FOR UPDATE lock → PENDING insert.
--   First user to acquire the lock = first served.
-- expire_stale_reservations() cron (every minute):
--   expired PENDING ones EXPIRED ලෙස mark කරයි.
-- finalize_order_tickets() RPC:
--   PENDING + expires_at > NOW() validate → CONFIRMED.
--   expires_at check: cron delay edge case oversell prevent
--   — DB layer දීම enforce කෙරේ.
-- order_id: payment initiate කළ පසු orders table FK set කෙරේ.
--   finalize_order_tickets() RPC r.order_id = p_order_id filter
--   reservation lookup සඳහා use කරයි.
-- reserve_tickets_occ() RPC: user ගේ existing PENDING reservations
--   cancel → fresh set insert — cart update safe handling.
CREATE TABLE IF NOT EXISTS ticket_reservations (
    reservation_id  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                NOT NULL
                                        REFERENCES users(user_id) ON DELETE CASCADE,
    event_id        UUID                NOT NULL
                                        REFERENCES events(event_id) ON DELETE CASCADE,
    ticket_type_id  UUID                NOT NULL
                                        REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    quantity        INT                 NOT NULL DEFAULT 1,
    reserved_at     TIMESTAMPTZ         DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMPTZ         NOT NULL,
    status          reservation_status  DEFAULT 'PENDING',
    -- Payment initiated වූ පසු order_id link කෙරේ.
    -- NULL = payment not yet initiated.
    order_id        UUID                DEFAULT NULL
                                        REFERENCES orders(order_id) ON DELETE SET NULL
);

-- expire_stale_reservations() cron WHERE clause index.
CREATE INDEX idx_reservation_expiry_check
    ON ticket_reservations (status, expires_at);

-- User active reservations lookup (checkout page display) index.
CREATE INDEX idx_reservation_user
    ON ticket_reservations (user_id, status);

-- finalize_order_tickets() RPC order JOIN query partial index.
CREATE INDEX idx_reservation_order
    ON ticket_reservations (order_id)
    WHERE order_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- TABLE: orders
-- ─────────────────────────────────────────────────────────────

-- Confirmed checkout sessions — one order per checkout attempt.
-- finalize_order_tickets() RPC payment_status PENDING → PAID update.
-- promotions global limit: finalize_order_tickets() DB layer
-- FOR UPDATE lock + FCFS validate — app layer නොව DB layer enforce.
-- tickets, transactions, promotion_usages tables order_id FK
-- ලෙස reference කරයි.
-- payment_source column finalize_order_tickets() RPC ticket_status
-- (ACTIVE vs ONGATE_PENDING) decide කිරීමට use කෙරේ.
CREATE TABLE IF NOT EXISTS orders (
    order_id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL
                                    REFERENCES users(user_id) ON DELETE RESTRICT,
    event_id        UUID            NOT NULL
                                    REFERENCES events(event_id) ON DELETE RESTRICT,
    promotion_id    UUID            DEFAULT NULL
                                    REFERENCES promotions(promotion_id) ON DELETE SET NULL,
    remarks         TEXT            DEFAULT NULL,
    subtotal        NUMERIC(15,2)   NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2)   DEFAULT 0.00,
    final_amount    NUMERIC(15,2)   NOT NULL,
    payment_source  payment_source  NOT NULL,
    payment_status  payment_status  DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT NULL
);

-- User order history (wallet/profile page) pagination query.
CREATE INDEX idx_orders_user ON orders (user_id, created_at);

-- Event sales report (organizer dashboard) query.
CREATE INDEX idx_orders_event_sales ON orders (event_id, payment_status);

CREATE TRIGGER update_orders_modtime
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: tickets
-- ─────────────────────────────────────────────────────────────

-- QR code gate entry tickets — finalize_order_tickets() RPC
-- reservation.quantity ගේ count අනුව individual rows insert කරයි.
-- qr_hash: backend unique hash, gate scanner validate කරයි.
-- status USED → scan_logs ALLOWED entry record කෙරේ.
-- ONGATE_PENDING tickets: cash payment pending, gate entry DENY.
-- owner_user_id ticket transfer feature (future) සඳහා ද use කෙරේ.
-- attendee_name/nic/email/mobile: buyer ටිකට් 5ක් ගත්තොත්
-- ඒ 5 දෙනාගේ individual details capture කිරීමට.
-- Security-sensitive events සඳහා NIC verification gate scanning
-- process හිදී use කෙරේ. NULL = optional (organizer configure).
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID            NOT NULL
                                        REFERENCES orders(order_id) ON DELETE CASCADE,
    event_id            UUID            NOT NULL
                                        REFERENCES events(event_id) ON DELETE CASCADE,
    ticket_type_id      UUID            NOT NULL
                                        REFERENCES ticket_types(ticket_type_id) ON DELETE RESTRICT,
    owner_user_id       UUID            NOT NULL
                                        REFERENCES users(user_id) ON DELETE CASCADE,
    qr_hash             VARCHAR(255)    NOT NULL,
    status              ticket_status   DEFAULT 'ACTIVE',
    price_purchased     NUMERIC(15,2)   NOT NULL,
    -- Individual attendee details (buyer ≠ attendee use case).
    -- finalize_order_tickets() RPC call time හෝ post-purchase
    -- edit flow හරහා populate කළ හැක.
    attendee_name       VARCHAR(150)    DEFAULT NULL,
    attendee_nic        VARCHAR(20)     DEFAULT NULL,
    attendee_email      VARCHAR(150)    DEFAULT NULL,
    attendee_mobile     VARCHAR(20)     DEFAULT NULL,
    created_at          TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_qr_hash UNIQUE (qr_hash)
);

-- Gate scanner QR lookup (event_id + qr_hash) high-frequency index.
CREATE INDEX idx_ticket_validation ON tickets (event_id, qr_hash);

-- User wallet / my-tickets page (owner + status filter) index.
CREATE INDEX idx_ticket_user_wallet ON tickets (owner_user_id, status);

CREATE TRIGGER update_tickets_modtime
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: promotion_usages
-- ─────────────────────────────────────────────────────────────

-- Per-user promotion usage audit log.
-- finalize_order_tickets() RPC ON CONFLICT DO NOTHING upsert:
-- PayHere webhook idempotent retries safe handling.
-- (order_id, promotion_id) UNIQUE: duplicate usage prevent.
-- usage_limit_per_user enforcement: checkout app layer
-- COUNT(*) query මෙම table reference කරයි.
CREATE TABLE IF NOT EXISTS promotion_usages (
    usage_id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id        UUID            NOT NULL
                                        REFERENCES promotions(promotion_id) ON DELETE RESTRICT,
    user_id             UUID            NOT NULL
                                        REFERENCES users(user_id) ON DELETE CASCADE,
    order_id            UUID            NOT NULL
                                        REFERENCES orders(order_id) ON DELETE CASCADE,
    discount_received   NUMERIC(15,2)   NOT NULL,
    used_at             TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_order_promo UNIQUE (order_id, promotion_id)
);


-- ─────────────────────────────────────────────────────────────
-- TABLE: transactions
-- ─────────────────────────────────────────────────────────────

-- Payment gateway transaction records audit log.
-- finalize_order_tickets() RPC p_gateway_ref_id IS NOT NULL නම්
-- (PayHere webhook path) INSERT කරයි.
-- gateway_ref_id: PayHere reference — duplicate webhook calls
-- detect කිරීමට index කෙරේ.
-- financial reconciliation reports සඳහා central table.
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID                NOT NULL
                                        REFERENCES orders(order_id) ON DELETE CASCADE,
    gateway         gateway_type        NOT NULL,
    gateway_ref_id  VARCHAR(255)        DEFAULT NULL,
    amount          NUMERIC(15,2)       NOT NULL,
    status          transaction_status  NOT NULL,
    meta_data       JSONB               DEFAULT NULL,
    created_at      TIMESTAMPTZ         DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_order       ON transactions (order_id);
CREATE INDEX idx_transactions_gateway_ref ON transactions (gateway_ref_id);


-- ─────────────────────────────────────────────────────────────
-- TABLE: scan_logs
-- ─────────────────────────────────────────────────────────────

-- Gate entry QR scan attempt audit log.
-- Scan result (ALLOWED / DENIED_*) සෑම attempt එකක්ම record.
-- scanned_by_user_id: event_community table හි STAFF role user.
-- BIGINT IDENTITY PK: UUID ට වඩා high-volume inserts efficient.
CREATE TABLE IF NOT EXISTS scan_logs (
    scan_id             BIGINT      GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    ticket_id           UUID        NOT NULL
                                    REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    scanned_by_user_id  UUID        NOT NULL
                                    REFERENCES users(user_id) ON DELETE CASCADE,
    result              scan_result NOT NULL,
    scanned_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scan_history ON scan_logs (ticket_id);


-- ─────────────────────────────────────────────────────────────
-- TABLE: otp_records
-- ─────────────────────────────────────────────────────────────

-- Email OTP authentication flow records.
-- signup, signin, forgot-password, reset-password purposes support.
-- otp_hash: plain OTP store නොකොට bcrypt/SHA hash — DB leak safe.
-- resend_count + verify_attempts: brute-force rate limiting.
-- expires_at: OTP validity window (typically 5-10 minutes).
-- is_used: OTP replay attack prevention.
CREATE TABLE IF NOT EXISTS otp_records (
    otp_id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         REFERENCES users(user_id) ON DELETE CASCADE,
    email           VARCHAR(150) NOT NULL,
    otp_hash        VARCHAR(255) NOT NULL,
    purpose         VARCHAR(50)  NOT NULL
                                 CHECK (purpose IN (
                                     'signup', 'signin',
                                     'forgot-password', 'reset-password'
                                 )),
    resend_count    INTEGER      DEFAULT 0,
    last_sent_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMPTZ  NOT NULL,
    is_used         BOOLEAN      DEFAULT FALSE,
    verify_attempts INTEGER      DEFAULT 0,
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_email   ON otp_records (email, purpose);
CREATE INDEX idx_otp_expires ON otp_records (expires_at);


-- ─────────────────────────────────────────────────────────────
-- TABLE: auth_flow_tokens
-- ─────────────────────────────────────────────────────────────

-- Multi-step auth flow page access control short-lived tokens.
-- OTP verify page, password reset page direct URL access prevent.
-- token: cryptographically random, URL-safe string.
-- is_used: one-time-use enforcement (token reuse prevent).
-- expires_at: token validity window (typically 15-30 minutes).
CREATE TABLE IF NOT EXISTS auth_flow_tokens (
    token_id    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(150) NOT NULL,
    purpose     VARCHAR(50)  NOT NULL
                             CHECK (purpose IN (
                                 'signup', 'signin',
                                 'forgot-password', 'reset-password'
                             )),
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    is_used     BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_flow_token ON auth_flow_tokens (token, expires_at);


-- ─────────────────────────────────────────────────────────────
-- TABLE: payouts
-- ─────────────────────────────────────────────────────────────

-- Event COMPLETED වූ පසු BuddyTicket platform commission
-- deduct කොට organizer ට ගෙවිය යුතු net amount track කිරීම.
-- gross_revenue: event orders (payment_status='PAID') final_amount SUM.
-- platform_fee_amount: events.platform_fee_* config අනුව calculated.
-- net_payout_amount: gross_revenue - platform_fee_amount.
-- bank_transfer_ref: actual bank transfer reference (manual entry).
-- processed_by: payout approve කළ admin user ID.
-- Event per payout one record (uq_payout_event): double-payout prevent.
CREATE TABLE IF NOT EXISTS payouts (
    payout_id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id                UUID            NOT NULL
                                            REFERENCES events(event_id) ON DELETE RESTRICT,
    organizer_id            UUID            NOT NULL
                                            REFERENCES users(user_id) ON DELETE RESTRICT,
    gross_revenue           NUMERIC(15,2)   NOT NULL,
    platform_fee_amount     NUMERIC(15,2)   NOT NULL,
    net_payout_amount       NUMERIC(15,2)   NOT NULL,
    status                  payout_status   NOT NULL DEFAULT 'PENDING',
    bank_transfer_ref       VARCHAR(255)    DEFAULT NULL,
    processed_by            UUID            DEFAULT NULL
                                            REFERENCES users(user_id) ON DELETE RESTRICT,
    processed_at            TIMESTAMPTZ     DEFAULT NULL,
    remarks                 TEXT            DEFAULT NULL,
    created_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_payout_event UNIQUE (event_id)
);

CREATE INDEX idx_payouts_status    ON payouts (status, created_at);
CREATE INDEX idx_payouts_organizer ON payouts (organizer_id, status);

CREATE TRIGGER update_payouts_modtime
BEFORE UPDATE ON payouts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: refund_requests
-- ─────────────────────────────────────────────────────────────

-- User refund requests සහ admin approval workflow track කිරීම.
-- ticket_id: specific single ticket refund. NULL = full order refund.
-- reason: user submitted refund reason (required).
-- admin_note: admin approval/rejection decision note.
-- gateway_refund_ref: PayHere refund API reference.
--   NULL = ONGATE_MANUAL orders (manual bank transfer needed).
-- refund_amount: partial refund support.
-- reviewed_by: refund approve/reject කළ admin user ID.
CREATE TABLE IF NOT EXISTS refund_requests (
    refund_id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID            NOT NULL
                                            REFERENCES orders(order_id) ON DELETE RESTRICT,
    ticket_id               UUID            DEFAULT NULL
                                            REFERENCES tickets(ticket_id) ON DELETE SET NULL,
    user_id                 UUID            NOT NULL
                                            REFERENCES users(user_id) ON DELETE RESTRICT,
    reason                  TEXT            NOT NULL,
    refund_amount           NUMERIC(15,2)   NOT NULL,
    status                  refund_status   NOT NULL DEFAULT 'PENDING',
    admin_note              TEXT            DEFAULT NULL,
    gateway_refund_ref      VARCHAR(255)    DEFAULT NULL,
    reviewed_by             UUID            DEFAULT NULL
                                            REFERENCES users(user_id) ON DELETE RESTRICT,
    reviewed_at             TIMESTAMPTZ     DEFAULT NULL,
    created_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     DEFAULT NULL
);

CREATE INDEX idx_refunds_status ON refund_requests (status, created_at);
CREATE INDEX idx_refunds_user   ON refund_requests (user_id, status);

CREATE TRIGGER update_refund_requests_modtime
BEFORE UPDATE ON refund_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: waitlists
-- ─────────────────────────────────────────────────────────────

-- Event SOLD_OUT වූ පසු ticket available slot සඳහා user queue.
-- ticket_type_id: specific type waitlist. NULL = any type (event-level).
-- notify_email: notification email (account email ට වෙනස් allow).
-- position_order: queue position (1 = first, FCFS ordering).
--   Application layer MAX(position_order)+1 calculate + insert.
-- converted_order_id: CONVERTED status — completed purchase order link.
--
-- [BUG FIX] NULL uniqueness: PostgreSQL UNIQUE constraints NULLs
-- distinct ලෙස treat කරයි. ticket_type_id IS NULL නම්
-- UNIQUE(event_id, ticket_type_id, user_id) duplicate entries
-- prevent නොකරයි.
-- Fix: table-level constraints ඉවත් කොට conditional partial unique
-- indexes use — typed (IS NOT NULL) සහ untyped (IS NULL) cases
-- separately handle කෙරේ.
CREATE TABLE IF NOT EXISTS waitlists (
    waitlist_id             UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id                UUID            NOT NULL
                                            REFERENCES events(event_id) ON DELETE CASCADE,
    ticket_type_id          UUID            DEFAULT NULL
                                            REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    user_id                 UUID            NOT NULL
                                            REFERENCES users(user_id) ON DELETE CASCADE,
    notify_email            VARCHAR(150)    NOT NULL,
    position_order          INT             NOT NULL,
    status                  waitlist_status NOT NULL DEFAULT 'WAITING',
    notified_at             TIMESTAMPTZ     DEFAULT NULL,
    converted_order_id      UUID            DEFAULT NULL
                                            REFERENCES orders(order_id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     DEFAULT NULL
);

-- [BUG FIX] User uniqueness per event + specific ticket type.
-- ticket_type_id IS NOT NULL case.
CREATE UNIQUE INDEX uq_waitlist_user_event_typed
    ON waitlists (event_id, ticket_type_id, user_id)
    WHERE ticket_type_id IS NOT NULL;

-- [BUG FIX] User uniqueness per event + any type (event-level).
-- ticket_type_id IS NULL case — NULL != NULL in standard UNIQUE.
CREATE UNIQUE INDEX uq_waitlist_user_event_untyped
    ON waitlists (event_id, user_id)
    WHERE ticket_type_id IS NULL;

-- [BUG FIX] Position uniqueness: specific ticket type queue.
CREATE UNIQUE INDEX uq_waitlist_position_typed
    ON waitlists (event_id, ticket_type_id, position_order)
    WHERE ticket_type_id IS NOT NULL;

-- [BUG FIX] Position uniqueness: event-level (any type) queue.
CREATE UNIQUE INDEX uq_waitlist_position_untyped
    ON waitlists (event_id, position_order)
    WHERE ticket_type_id IS NULL;

-- Slot available notify: lowest WAITING position lookup.
CREATE INDEX idx_waitlist_queue
    ON waitlists (event_id, ticket_type_id, position_order)
    WHERE status = 'WAITING';

CREATE TRIGGER update_waitlists_modtime
BEFORE UPDATE ON waitlists
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: reviews
-- ─────────────────────────────────────────────────────────────

-- Event COMPLETED වූ පසු actual attendees (USED ticket holders)
-- ට star rating සහ written review submit කිරීමට.
-- ticket_id FK: proof of attendance — fake review prevent.
--   USED status validate: app layer enforce.
-- rating: 1–5 star CHECK constraint enforce.
-- is_visible: admin moderation hide flag (spam/abuse).
-- Organizer credibility, event quality analytics,
-- future event ranking සඳහා use කෙරේ.
CREATE TABLE IF NOT EXISTS reviews (
    review_id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id                UUID        NOT NULL
                                        REFERENCES events(event_id) ON DELETE CASCADE,
    user_id                 UUID        NOT NULL
                                        REFERENCES users(user_id) ON DELETE CASCADE,
    ticket_id               UUID        NOT NULL
                                        REFERENCES tickets(ticket_id) ON DELETE RESTRICT,
    rating                  SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text             TEXT        DEFAULT NULL,
    is_visible              BOOLEAN     DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL,

    CONSTRAINT uq_review_user_event UNIQUE (event_id, user_id)
);

CREATE INDEX idx_reviews_event ON reviews (event_id, is_visible, rating);
CREATE INDEX idx_reviews_user  ON reviews (user_id);

CREATE TRIGGER update_reviews_modtime
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();