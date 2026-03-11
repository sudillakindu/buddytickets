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

-- Set Sri Lanka timezone (UTC+5:30) at database level.
-- Without this, NOW() returns UTC causing incorrect
-- event start/end time comparisons and pg_cron job calculations.
ALTER DATABASE postgres SET timezone TO 'Asia/Colombo';


-- ─────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────────────────────

-- Platform user roles.
-- SYSTEM = internal automation, ORGANIZER = event creators,
-- STAFF = gate staff, USER = ticket buyers.
-- RLS policies depend on these values — rename with caution.
CREATE TYPE user_role AS ENUM (
    'SYSTEM',
    'ORGANIZER',
    'STAFF',
    'USER'
);

-- Organizer verification workflow states.
-- PENDING → awaiting admin review,
-- APPROVED → can create events,
-- REJECTED → can re-submit.
-- Used by organizer_details table.
CREATE TYPE organizer_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

-- Event life-cycle state machine.
-- DRAFT → PUBLISHED → ON_SALE → ONGOING → COMPLETED/SOLD_OUT/CANCELLED.
-- DRAFT and CANCELLED never auto-transition — manual change only.
-- Used by auto_update_event_time_statuses() function.
-- reserve_tickets_occ() RPC only accepts ON_SALE events — FCFS gate.
CREATE TYPE event_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ON_SALE',
    'SOLD_OUT',
    'ONGOING',
    'COMPLETED',
    'CANCELLED'
);

-- Promotion discount calculation logic.
-- PERCENTAGE = percentage of order amount, FIXED_AMOUNT = fixed LKR amount.
-- Used by promotions table, finalize_order_tickets() RPC,
-- and events.platform_fee_type column.
CREATE TYPE discount_type AS ENUM (
    'PERCENTAGE',
    'FIXED_AMOUNT'
);

-- Ticket reservation state machine.
-- PENDING → user checkout session active,
-- CONFIRMED → payment complete,
-- EXPIRED → timer expired (expire_stale_reservations cron),
-- CANCELLED → user abandoned or new session started.
-- Transitions handled by reserve_tickets_occ() and finalize_order_tickets() RPCs.
CREATE TYPE reservation_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'EXPIRED',
    'CANCELLED'
);

-- Order creation / payment method identification.
-- PAYMENT_GATEWAY = online payment gateway (PayHere, Stripe, etc.),
-- BANK_TRANSFER = direct bank deposit (admin confirms),
-- ONGATE = gate staff cash-desk entry.
-- finalize_order_tickets() RPC sets ticket status to
-- ACTIVE (paid) or PENDING (awaiting confirmation) based on this value.
-- events.allowed_payment_methods uses this enum as array for
-- per-event payment method restrictions.
CREATE TYPE payment_source AS ENUM (
    'PAYMENT_GATEWAY',
    'BANK_TRANSFER',
    'ONGATE'
);

-- Order payment lifecycle states.
-- PENDING → payment initiated, PAID → confirmed,
-- FAILED → gateway error, REFUNDED → refund processed.
-- Used by orders table and finalize_order_tickets() RPC.
CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);

-- Physical ticket validity states.
-- ACTIVE = valid for entry (paid online),
-- PENDING = awaiting payment confirmation (cash at gate / bank transfer),
-- USED = already scanned at gate, CANCELLED = voided.
-- Used by tickets and scan_logs tables.
CREATE TYPE ticket_status AS ENUM (
    'ACTIVE',
    'PENDING',
    'USED',
    'CANCELLED'
);

-- Payment gateway / method identification.
-- Used for recording in transactions table.
-- PAYMENT_GATEWAY = online gateway (PayHere, etc.),
-- BANK_TRANSFER = direct bank deposit, ONGATE = cash at gate.
CREATE TYPE gateway_type AS ENUM (
    'PAYMENT_GATEWAY',
    'BANK_TRANSFER',
    'ONGATE'
);

-- Transaction attempt result states.
-- Used only by transactions table.
CREATE TYPE transaction_status AS ENUM (
    'SUCCESS',
    'FAILED'
);

-- Gate scanner QR code scan attempt results.
-- ALLOWED = valid entry, DENIED_SOLD_OUT = oversell check,
-- DENIED_ALREADY_USED = duplicate scan, DENIED_UNPAID = cash pending,
-- DENIED_INVALID = fake/unknown QR code.
-- Used for recording in scan_logs table.
CREATE TYPE scan_result AS ENUM (
    'ALLOWED',
    'DENIED_SOLD_OUT',
    'DENIED_ALREADY_USED',
    'DENIED_UNPAID',
    'DENIED_INVALID'
);

-- Platform commission & organizer payout workflow
-- payout lifecycle states.
-- PENDING = payout request initiated, PROCESSING = bank transfer underway,
-- COMPLETED = funds received by organizer, FAILED = transfer error.
-- Used by payouts table status column.
CREATE TYPE payout_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);

-- Refund request workflow states.
-- PENDING = user submitted + awaiting admin review,
-- APPROVED = admin approved + gateway refund initiated,
-- REJECTED = admin rejected (reason required),
-- REFUNDED = gateway confirmed refund success.
-- Used by refund_requests table status column.
CREATE TYPE refund_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'REFUNDED'
);

-- Waitlist entry states.
-- WAITING = in queue, NOTIFIED = slot available email sent,
-- CONVERTED = waitlist → ticket purchase completed,
-- EXPIRED = notification window lapsed without purchase.
-- Used by waitlists table status column.
CREATE TYPE waitlist_status AS ENUM (
    'WAITING',
    'NOTIFIED',
    'CONVERTED',
    'EXPIRED'
);


-- ─────────────────────────────────────────────────────────────
-- SHARED UTILITY FUNCTION — AUTO-UPDATE updated_at
-- ─────────────────────────────────────────────────────────────

-- PostgreSQL equivalent of MySQL ON UPDATE CURRENT_TIMESTAMP.
-- BEFORE UPDATE trigger that auto-sets updated_at column.
-- Attached to all mutable tables: users, events, ticket_types, orders, tickets, etc.
-- Domain-specific trigger functions are in 02_procedures_triggers_views.sql.
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

-- Central identity table for all platform users (ticket buyers, organizers, staff, system).
-- email, mobile, username uniqueness enforced at database level.
-- password_hash = NULL for OAuth/OTP-only login users.
-- Referenced by organizer_details (user_id FK).
-- tickets, orders, ticket_reservations, scan_logs all link to user_id.
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

-- Composite index for RLS policy evaluations and
-- role-based user listings (admin dashboard).
CREATE INDEX idx_users_role_status ON users (role, is_active);

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: organizer_details
-- ─────────────────────────────────────────────────────────────

-- KYC + banking info for organizer verification.
-- 1:1 relationship with users where role='ORGANIZER'.
-- After admin verification, status='APPROVED' and verified_by, verified_at are set.
-- nic_number + bank account uniqueness enforced for fraud prevention.
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

-- Composite index for pending verifications admin dashboard query.
CREATE INDEX idx_organizer_verification_status
    ON organizer_details (status, verified_at);

CREATE TRIGGER update_organizer_details_modtime
BEFORE UPDATE ON organizer_details
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: categories
-- ─────────────────────────────────────────────────────────────

-- Event categories (Music, Sports, Comedy, etc.).
-- Referenced by events table via category_id FK.
-- name uniqueness enforced.
-- is_active=FALSE categories are hidden in event creation UI.
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
-- status auto-updated to ONGOING/COMPLETED via auto_update_event_time_statuses()
-- cron function (every minute).
-- is_vip column activates trigger_vip_status_change trigger
-- — vip_events table managed automatically.
-- ticket_types, event_images, orders, tickets, event_community,
-- ticket_reservations, promotions, payouts, waitlists, reviews
-- tables link to events.event_id as foreign key.
-- platform_fee_type, platform_fee_value, platform_fee_cap:
-- BuddyTicket commission structure configured per-event.
-- payouts platform_fee_amount calculated by aggregating gross revenue
-- after event COMPLETED and deducting based on fee type.
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
    -- platform_fee_type: PERCENTAGE (e.g. 3%) or FIXED_AMOUNT (e.g. LKR 50 per ticket).
    -- platform_fee_value: actual fee value (% or LKR amount).
    -- platform_fee_cap: PERCENTAGE mode maximum fee ceiling (LKR). NULL = no cap.
    platform_fee_type   discount_type   NOT NULL DEFAULT 'PERCENTAGE',
    platform_fee_value  NUMERIC(15,2)   NOT NULL DEFAULT 3.00,
    platform_fee_cap    NUMERIC(15,2)   DEFAULT NULL,
    -- Per-event payment method control.
    -- NULL = all payment methods allowed (PAYMENT_GATEWAY, BANK_TRANSFER, ONGATE).
    -- Array = only listed methods allowed for this event.
    allowed_payment_methods payment_source[] DEFAULT NULL,
    created_at          TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT uq_event_name UNIQUE (name),
    -- Ensure only valid non-empty arrays are stored. NULL = all methods.
    CONSTRAINT chk_allowed_payment_methods_not_empty
        CHECK (allowed_payment_methods IS NULL OR array_length(allowed_payment_methods, 1) > 0)
);

-- Index for organizer dashboard events list query.
CREATE INDEX idx_events_organizer ON events (organizer_id);

-- Covering index for pg_cron time-based status function WHERE clause.
-- Also used by reserve_tickets_occ() event status + is_active validation.
CREATE INDEX idx_events_lifecycle ON events (status, start_at, end_at);

-- Public events listing page filter query (status + is_active + date).
CREATE INDEX idx_events_search_status ON events (status, is_active, start_at);

-- Composite index for location-based event search.
CREATE INDEX idx_events_search_location ON events (location, start_at);

-- Index for VIP featured section filter (view_featured_events).
CREATE INDEX idx_events_is_vip ON events (is_vip);

CREATE TRIGGER update_events_modtime
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


-- ─────────────────────────────────────────────────────────────
-- TABLE: event_images
-- ─────────────────────────────────────────────────────────────

-- Ordered event gallery images.
-- (event_id, priority_order) composite PK prevents duplicate ordering at DB level.
-- ON DELETE CASCADE removes images when event is deleted.
-- Supabase Storage bucket URLs stored in image_url column.
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

-- Ticket tiers per event (VIP, Regular, Early Bird, etc.).
-- trigger_check_sold_out fires on every qty_sold UPDATE to check event sold-out status.
-- version column used by finalize_order_tickets() OCC mechanism to prevent race conditions.
-- capacity, qty_sold, version are used in critical read-and-update paths
-- with FOR UPDATE lock in both reserve_tickets_occ() and finalize_order_tickets() RPCs.
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
-- handle_vip_status_change() trigger auto inserts/deletes/reorders
-- when events.is_vip column changes.
-- event_id sole PK: ensures ON CONFLICT (event_id) works correctly.
-- priority_order global UNIQUE: supports gap-fill reorder logic.
-- Joined by view_featured_events view.
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

-- Assigns event organizer team members (STAFF).
-- Used for gate scanning permission and event management access control.
-- Many-to-many: users ↔ events.
-- (event_id, user_id) composite PK prevents duplicate assignments.
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

-- Discount coupon codes management.
-- scope_event_id / scope_ticket_type_id NULL = platform-wide;
-- when set, applies to specific event/ticket type only.
-- version column OCC: prevents concurrent promotion usage increment collisions
-- in finalize_order_tickets() RPC.
-- current_global_usage: atomically incremented with FOR UPDATE lock + limit check
-- in finalize_order_tickets() RPC.
-- usage_limit_global = 0 → unlimited (no cap enforced).
-- FCFS guarantee: finalize_order_tickets() locks promotions row and validates
-- current_global_usage < usage_limit_global — concurrent users serialize at table level.
-- promotion_usages table tracks per-user usage history.
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
-- TABLE: orders
-- ─────────────────────────────────────────────────────────────

-- Confirmed checkout sessions — one order per checkout attempt.
-- finalize_order_tickets() RPC updates payment_status PENDING → PAID.
-- Promotions global limit enforced at DB layer via FOR UPDATE lock + FCFS
-- validation (not app layer).
-- Referenced by tickets, transactions, promotion_usages tables via order_id FK.
-- payment_source column used by finalize_order_tickets() RPC to determine
-- ticket_status (ACTIVE vs PENDING).
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
-- TABLE: ticket_reservations
-- ─────────────────────────────────────────────────────────────

-- Checkout session inventory lock table — FCFS core mechanism.
-- reserve_tickets_occ() RPC:
--   ticket_types row SELECT FOR UPDATE lock → PENDING insert.
--   First user to acquire the lock = first served.
-- expire_stale_reservations() cron (every minute):
--   marks expired PENDING ones as EXPIRED.
-- finalize_order_tickets() RPC:
--   validates PENDING + expires_at > NOW() → CONFIRMED.
--   expires_at check prevents oversell from cron delay edge case
--   — enforced at DB layer.
-- order_id: set as orders table FK after payment initiation.
--   Used by finalize_order_tickets() RPC for r.order_id = p_order_id
--   reservation lookup.
-- reserve_tickets_occ() RPC: cancels user's existing PENDING reservations
--   → inserts fresh set — safe cart update handling.
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
    -- Linked to order_id after payment is initiated.
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
-- TABLE: tickets
-- ─────────────────────────────────────────────────────────────

-- QR code gate entry tickets — finalize_order_tickets() RPC
-- inserts individual rows based on reservation.quantity count.
-- qr_hash: unique backend hash validated by gate scanner.
-- USED status → scan_logs records ALLOWED entry.
-- PENDING tickets: payment confirmation pending (cash/bank), gate entry denied.
-- owner_user_id also used for ticket transfer feature (future).
-- attendee_name/nic/email/mobile: captures individual details
-- when a buyer purchases multiple tickets for different attendees.
-- Used for NIC verification during gate scanning for security-sensitive events.
-- NULL = optional (organizer configurable).
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
    -- Can be populated at finalize_order_tickets() RPC call time
    -- or via post-purchase edit flow.
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
-- finalize_order_tickets() RPC uses ON CONFLICT DO NOTHING upsert:
-- safe handling for PayHere webhook idempotent retries.
-- (order_id, promotion_id) UNIQUE: prevents duplicate usage.
-- usage_limit_per_user enforcement: checkout app layer
-- uses COUNT(*) query referencing this table.
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
-- Inserted by finalize_order_tickets() RPC when p_gateway_ref_id IS NOT NULL
-- (PayHere webhook path).
-- gateway_ref_id: PayHere reference — indexed for duplicate webhook detection.
-- Central table for financial reconciliation reports.
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
-- Records every scan attempt result (ALLOWED / DENIED_*).
-- scanned_by_user_id: STAFF role user from event_community table.
-- BIGINT IDENTITY PK: more efficient than UUID for high-volume inserts.
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
-- Supports signup, signin, forgot-password, reset-password purposes.
-- otp_hash: stores bcrypt/SHA hash instead of plain OTP — safe against DB leaks.
-- resend_count + verify_attempts: brute-force rate limiting.
-- expires_at: OTP validity window (typically 5-10 minutes).
-- is_used: prevents OTP replay attacks.
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

-- Short-lived tokens for multi-step auth flow page access control.
-- Prevents direct URL access to OTP verify page, password reset page.
-- token: cryptographically random, URL-safe string.
-- is_used: one-time-use enforcement (prevents token reuse).
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

-- Tracks net amount payable to organizer after BuddyTicket platform
-- commission deduction when event is COMPLETED.
-- gross_revenue: SUM of final_amount from event orders (payment_status='PAID').
-- platform_fee_amount: calculated based on events.platform_fee_* config.
-- net_payout_amount: gross_revenue - platform_fee_amount.
-- bank_transfer_ref: actual bank transfer reference (manual entry).
-- processed_by: admin user ID who approved the payout.
-- One record per event (uq_payout_event): prevents double-payout.
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

-- User refund requests and admin approval workflow tracking.
-- ticket_id: specific single ticket refund. NULL = full order refund.
-- reason: user-submitted refund reason (required).
-- admin_note: admin approval/rejection decision note.
-- gateway_refund_ref: PayHere refund API reference.
--   NULL = ONGATE orders (manual bank transfer needed).
-- refund_amount: supports partial refunds.
-- reviewed_by: admin user ID who approved/rejected the refund.
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

-- User queue for ticket slots after event is SOLD_OUT.
-- ticket_type_id: specific type waitlist. NULL = any type (event-level).
-- notify_email: notification email (can differ from account email).
-- position_order: queue position (1 = first, FCFS ordering).
--   Application layer calculates MAX(position_order)+1 on insert.
-- converted_order_id: links to completed purchase order when CONVERTED.
--
-- [BUG FIX] NULL uniqueness: PostgreSQL UNIQUE constraints treat NULLs
-- as distinct. When ticket_type_id IS NULL,
-- UNIQUE(event_id, ticket_type_id, user_id) does not prevent duplicate entries.
-- Fix: removed table-level constraints, use conditional partial unique
-- indexes — handles typed (IS NOT NULL) and untyped (IS NULL) cases separately.
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

-- Star rating and written review for COMPLETED events by actual attendees
-- (USED ticket holders).
-- ticket_id FK: proof of attendance — prevents fake reviews.
--   USED status validation enforced at app layer.
-- rating: 1–5 star CHECK constraint enforced.
-- is_visible: admin moderation hide flag (spam/abuse).
-- Used for organizer credibility, event quality analytics,
-- and future event ranking.
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