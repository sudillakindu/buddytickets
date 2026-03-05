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
-- promotions table සහ finalize_order_tickets() RPC භාවිතා කරයි.
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

-- users table row update වන සෑම විටම updated_at auto-set කිරීම.
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
    user_id                 UUID            PRIMARY KEY
                                            REFERENCES users(user_id) ON DELETE CASCADE,
    nic_number              VARCHAR(20)     NOT NULL,
    address                 TEXT            NOT NULL,
    bank_name               VARCHAR(100)    NOT NULL,
    bank_branch             VARCHAR(100)    NOT NULL,
    account_holder_name     VARCHAR(150)    NOT NULL,
    account_number          VARCHAR(50)     NOT NULL,
    nic_front_image_url     VARCHAR(255)    NOT NULL,
    nic_back_image_url      VARCHAR(255)    NOT NULL,
    remarks                 TEXT            DEFAULT NULL,
    status                  organizer_status DEFAULT 'PENDING',
    is_submitted            BOOLEAN         DEFAULT FALSE,
    verified_by             UUID            DEFAULT NULL
                                            REFERENCES users(user_id) ON DELETE RESTRICT,
    verified_at             TIMESTAMPTZ     DEFAULT NULL,
    created_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_nic              UNIQUE (nic_number),
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

-- Category filter queries (active categories only) සඳහා index.
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
-- ticket_reservations, promotions tables events.event_id ට
-- foreign key ලෙස link වේ.
CREATE TABLE IF NOT EXISTS events (
    event_id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id    UUID            NOT NULL
                                    REFERENCES users(user_id)
                                    ON DELETE RESTRICT ON UPDATE CASCADE,
    category_id     UUID            NOT NULL
                                    REFERENCES categories(category_id)
                                    ON DELETE RESTRICT ON UPDATE CASCADE,
    name            VARCHAR(255)    NOT NULL,
    subtitle        VARCHAR(255)    NOT NULL,
    description     TEXT            NOT NULL,
    requirements    TEXT            DEFAULT NULL,
    location        VARCHAR(100)    NOT NULL,
    map_link        VARCHAR(255)    NOT NULL,
    start_at        TIMESTAMPTZ     NOT NULL,
    end_at          TIMESTAMPTZ     NOT NULL,
    status          event_status    DEFAULT 'DRAFT',
    is_active       BOOLEAN         DEFAULT FALSE,
    is_vip          BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_event_name UNIQUE (name)
);

-- Organizer dashboard — organizer ගේ events list query සඳහා.
CREATE INDEX idx_events_organizer ON events (organizer_id);

-- pg_cron time-based status update function (auto_update_event_time_statuses)
-- WHERE clause exact match සඳහා covering index.
CREATE INDEX idx_events_lifecycle ON events (status, start_at, end_at);

-- Public events listing page filter query (status + is_active + date).
CREATE INDEX idx_events_search_status ON events (status, is_active, start_at);

-- Location-based event search සඳහා composite index.
CREATE INDEX idx_events_search_location ON events (location, start_at);

-- VIP featured section filter (view_featured_events view) සඳහා index.
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
    event_id        UUID    NOT NULL
                            REFERENCES events(event_id) ON DELETE CASCADE,
    priority_order  INT     NOT NULL,
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

-- check_and_update_event_sold_out trigger function හි
-- SUM(capacity), SUM(qty_sold) aggregate query සඳහා index.
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
-- event_id UNIQUE constraint: එකම event VIP list හි twice
-- appear වීම prevent කරයි. Priority reorder gap-fill logic
-- (priority_order - 1 UPDATE) නිවැරදිව work කිරීමට
-- priority_order globally unique (across all rows) විය යුතු.
-- view_featured_events view මෙම table JOIN කරයි.
CREATE TABLE IF NOT EXISTS vip_events (
    event_id        UUID    NOT NULL
                            REFERENCES events(event_id) ON DELETE CASCADE,
    priority_order  INT     NOT NULL,
    assigned_by     UUID    NOT NULL
                            REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT NULL,

    -- event_id sole PK: එකම event multiple VIP rows ඇතිවීම prevent කිරීම.
    -- (composite PK ගැටළු සමාදානය — handle_vip_status_change ON CONFLICT
    -- clause event_id uniqueness expect කරයි.)
    PRIMARY KEY (event_id),

    -- priority_order global uniqueness: reorder logic නිවැරදිව work කිරීමට.
    CONSTRAINT uq_vip_priority_order UNIQUE (priority_order)
);

-- view_featured_events ORDER BY priority_order query සඳහා index.
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
-- scope_event_id / scope_ticket_type_id NULL නම් platform-wide
-- promotion; set නම් specific event/ticket type සඳහා පමණි.
-- version column OCC: concurrent promotion usage increment
-- collisions prevent කිරීමට finalize_order_tickets() හි use කෙරේ.
-- current_global_usage: finalize_order_tickets() RPC
-- atomically increment කරයි. promotion_usages table per-user
-- usage history track කරයි.
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

-- Checkout promotion validation query (code + is_active + date range) සඳහා.
CREATE INDEX idx_promotions_validity
    ON promotions (code, is_active, start_at, end_at);

CREATE TRIGGER update_promotions_modtime
BEFORE UPDATE ON promotions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: ticket_reservations
-- ─────────────────────────────────────────────────────────────

-- Checkout session inventory lock table.
-- reserve_tickets_occ() RPC PENDING reservations insert කරයි.
-- expire_stale_reservations() cron (every minute) expired
-- ones EXPIRED ලෙස mark කරයි.
-- finalize_order_tickets() RPC PENDING → CONFIRMED කරයි.
-- order_id: payment initiated කළ පසු orders table FK set කෙරේ.
-- reserve_tickets_occ() RPC user ගේ existing PENDING reservations
-- cancel කරලා fresh set insert කරයි — cart update safe කිරීමට.
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
    -- finalize_order_tickets() RPC order_id = p_order_id filter
    -- reservation lookup සඳහා use කරයි.
    order_id        UUID                DEFAULT NULL
                                        REFERENCES orders(order_id) ON DELETE SET NULL
);

-- expire_stale_reservations() cron WHERE clause (status + expires_at) index.
CREATE INDEX idx_reservation_expiry_check
    ON ticket_reservations (status, expires_at);

-- User ගේ active reservations lookup (checkout page display) සඳහා.
CREATE INDEX idx_reservation_user
    ON ticket_reservations (user_id, status);

-- finalize_order_tickets() RPC ORDER JOIN query සඳහා partial index.
CREATE INDEX idx_reservation_order
    ON ticket_reservations (order_id)
    WHERE order_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- TABLE: orders
-- ─────────────────────────────────────────────────────────────

-- Confirmed checkout sessions — one order per checkout attempt.
-- finalize_order_tickets() RPC payment_status PENDING → PAID update.
-- promotions.scope rules checkout layer දී validate කෙරේ.
-- tickets, transactions, promotion_usages tables order_id FK
-- ලෙස reference කරයි. payment_source column finalize_order_tickets()
-- RPC ticket_status (ACTIVE vs ONGATE_PENDING) decide කිරීමට use කෙරේ.
CREATE TABLE IF NOT EXISTS orders (
    order_id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL
                                    REFERENCES users(user_id) ON DELETE RESTRICT,
    event_id        UUID            NOT NULL
                                    REFERENCES events(event_id) ON DELETE RESTRICT,
    promotion_id    UUID            DEFAULT NULL
                                    REFERENCES promotions(promotion_id) ON DELETE SET NULL,
    reservation_id  UUID            DEFAULT NULL,
    remarks         TEXT            DEFAULT NULL,
    subtotal        NUMERIC(15,2)   NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2)   DEFAULT 0.00,
    final_amount    NUMERIC(15,2)   NOT NULL,
    payment_source  payment_source  NOT NULL,
    payment_status  payment_status  DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT NULL
);

-- User order history (wallet/profile page) pagination query සඳහා.
CREATE INDEX idx_orders_user ON orders (user_id, created_at);

-- Event sales report (organizer dashboard) query සඳහා.
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
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id       UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID            NOT NULL
                                    REFERENCES orders(order_id) ON DELETE CASCADE,
    event_id        UUID            NOT NULL
                                    REFERENCES events(event_id) ON DELETE CASCADE,
    ticket_type_id  UUID            NOT NULL
                                    REFERENCES ticket_types(ticket_type_id) ON DELETE RESTRICT,
    owner_user_id   UUID            NOT NULL
                                    REFERENCES users(user_id) ON DELETE CASCADE,
    qr_hash         VARCHAR(255)    NOT NULL,
    status          ticket_status   DEFAULT 'ACTIVE',
    price_purchased NUMERIC(15,2)   NOT NULL,
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_qr_hash UNIQUE (qr_hash)
);

-- Gate scanner QR lookup (event_id + qr_hash) high-frequency query index.
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
-- finalize_order_tickets() RPC ON CONFLICT DO NOTHING upsert
-- PayHere webhook idempotent retries handle කිරීමට use කරයි.
-- (order_id, promotion_id) UNIQUE: එකම order duplicate usage prevent.
-- usage_limit_per_user enforcement: checkout layer COUNT(*) query
-- මෙම table reference කරයි.
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
-- finalize_order_tickets() RPC p_gateway_ref_id NULL නොවේ නම්
-- (PayHere webhook path) INSERT කරයි.
-- gateway_ref_id: PayHere order_id / reference duplicate webhook
-- calls detect කිරීමට index කෙරේ.
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

-- Order transaction history lookup index.
CREATE INDEX idx_transactions_order ON transactions (order_id);

-- Duplicate webhook detection (gateway_ref_id lookup) index.
CREATE INDEX idx_transactions_gateway_ref ON transactions (gateway_ref_id);


-- ─────────────────────────────────────────────────────────────
-- TABLE: scan_logs
-- ─────────────────────────────────────────────────────────────

-- Gate entry QR scan attempt audit log.
-- Scan result (ALLOWED / DENIED_*) සෑම attempt එකක්ම record.
-- ticket_id → tickets table reference: scan history ↔ ticket link.
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

-- Ticket scan history display (admin / organizer audit view) index.
CREATE INDEX idx_scan_history ON scan_logs (ticket_id);


-- ─────────────────────────────────────────────────────────────
-- TABLE: otp_records
-- ─────────────────────────────────────────────────────────────

-- Email OTP authentication flow records.
-- signup, signin, forgot-password, reset-password purposes
-- support කෙරේ. otp_hash: plain OTP store කිරීම වෙනුවට
-- bcrypt/SHA hash store කරන නිසා database leak safe.
-- resend_count + verify_attempts: brute-force protection.
-- expires_at: OTP validity window (typically 5-10 minutes).
-- is_used: OTP replay attack prevention.
CREATE TABLE IF NOT EXISTS otp_records (
    otp_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        REFERENCES users(user_id) ON DELETE CASCADE,
    email           VARCHAR(150) NOT NULL,
    otp_hash        VARCHAR(255) NOT NULL,
    purpose         VARCHAR(50)  NOT NULL
                                 CHECK (purpose IN (
                                     'signup',
                                     'signin',
                                     'forgot-password',
                                     'reset-password'
                                 )),
    resend_count    INTEGER     DEFAULT 0,
    last_sent_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_used         BOOLEAN     DEFAULT FALSE,
    verify_attempts INTEGER     DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- OTP lookup (email + purpose) auth flow query index.
CREATE INDEX idx_otp_email   ON otp_records (email, purpose);

-- Expired OTP cleanup cron job (future) WHERE clause index.
CREATE INDEX idx_otp_expires ON otp_records (expires_at);


-- ─────────────────────────────────────────────────────────────
-- TABLE: auth_flow_tokens
-- ─────────────────────────────────────────────────────────────

-- Multi-step auth flow page access control tokens.
-- OTP verify page, password reset page ආදී sensitive pages
-- direct URL access prevent කිරීමට short-lived tokens.
-- token: cryptographically random, URL-safe string.
-- is_used: one-time-use enforcement (token reuse prevent).
-- expires_at: token validity window (typically 15-30 minutes).
CREATE TABLE IF NOT EXISTS auth_flow_tokens (
    token_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(150) NOT NULL,
    purpose     VARCHAR(50)  NOT NULL
                             CHECK (purpose IN (
                                 'signup',
                                 'signin',
                                 'forgot-password',
                                 'reset-password'
                             )),
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    is_used     BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- Auth flow token validation (token + expires_at) lookup index.
CREATE INDEX idx_auth_flow_token ON auth_flow_tokens (token, expires_at);
