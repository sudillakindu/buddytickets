-- 1. ENUM TYPES CREATION (PostgreSQL වලට අදාලව)
CREATE TYPE user_role AS ENUM ('SYSTEM', 'ORGANIZER', 'CO_ORGANIZER', 'STAFF', 'USER');
CREATE TYPE organizer_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'ON_SALE', 'SOLD_OUT', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');
CREATE TYPE payment_source AS ENUM ('PAYHERE_ONLINE', 'ONGATE_MANUAL');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE ticket_status AS ENUM ('ACTIVE', 'ONGATE_PENDING', 'USED', 'CANCELLED');
CREATE TYPE gateway_type AS ENUM ('PAYHERE', 'CASH_DESK');
CREATE TYPE transaction_status AS ENUM ('SUCCESS', 'FAILED');
CREATE TYPE scan_result AS ENUM ('ALLOWED', 'DENIED_SOLD_OUT', 'DENIED_ALREADY_USED', 'DENIED_UNPAID', 'DENIED_INVALID');

-- 2. AUTO-UPDATE TIMESTAMP FUNCTION
-- (MySQL වල ON UPDATE CURRENT_TIMESTAMP වෙනුවට)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';


-- 3. TABLES CREATION

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(150) NOT NULL,
    image_url               VARCHAR(255) DEFAULT NULL,
    email                   VARCHAR(150) NOT NULL,
    is_email_verified       BOOLEAN DEFAULT FALSE,
    mobile                  VARCHAR(20) NOT NULL,
    is_mobile_verified      BOOLEAN DEFAULT FALSE,
    username                VARCHAR(100) NOT NULL,
    password_hash           VARCHAR(255) DEFAULT NULL,
    role                    user_role NOT NULL DEFAULT 'USER',
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL,
    last_login_at           TIMESTAMPTZ DEFAULT NULL,

    CONSTRAINT uq_email UNIQUE (email),
    CONSTRAINT uq_mobile UNIQUE (mobile),
    CONSTRAINT uq_username UNIQUE (username)
);
CREATE INDEX idx_role_status ON users (role, is_active);
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- ORGANIZER DETAILS TABLE
CREATE TABLE IF NOT EXISTS organizer_details (
    user_id                 UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    nic_number              VARCHAR(20) NOT NULL,
    address                 TEXT NOT NULL,
    bank_name               VARCHAR(100) NOT NULL,
    bank_branch             VARCHAR(100) NOT NULL,
    account_holder_name     VARCHAR(150) NOT NULL,
    account_number          VARCHAR(50) NOT NULL,
    nic_front_image_url     VARCHAR(255) NOT NULL,
    nic_back_image_url      VARCHAR(255) NOT NULL,
    remarks                 TEXT DEFAULT NULL,
    status                  organizer_status DEFAULT 'PENDING',
    verified_by             UUID DEFAULT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    verified_at             TIMESTAMPTZ DEFAULT NULL,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL,

    CONSTRAINT uq_nic UNIQUE (nic_number),
    CONSTRAINT uq_user_bank_account UNIQUE (user_id, account_number)
);
CREATE INDEX idx_verification_status ON organizer_details (status, verified_at);
CREATE TRIGGER update_organizer_details_modtime BEFORE UPDATE ON organizer_details FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    category_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(255) NOT NULL,
    description             TEXT DEFAULT NULL,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL,

    CONSTRAINT uq_category_name UNIQUE (name)
);
CREATE INDEX idx_category_status ON categories (is_active);
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    event_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id            UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    category_id             UUID NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    name                    VARCHAR(255) NOT NULL,
    subtitle                VARCHAR(255) NOT NULL,
    description             TEXT NOT NULL,
    requirements            TEXT DEFAULT NULL,
    location                VARCHAR(100) NOT NULL,
    map_link                VARCHAR(255) NOT NULL,
    start_at                TIMESTAMPTZ NOT NULL,
    end_at                  TIMESTAMPTZ NOT NULL,
    status                  event_status DEFAULT 'DRAFT',
    is_active               BOOLEAN DEFAULT FALSE,
    is_vip                  BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL,

    CONSTRAINT uq_event_name UNIQUE (name)
);
CREATE INDEX idx_organizer ON events (organizer_id);
CREATE INDEX idx_event_lifecycle ON events (status, start_at, end_at);
CREATE INDEX idx_search_status ON events (status, is_active, start_at);
CREATE INDEX idx_search_location ON events (location, start_at);
CREATE INDEX idx_is_vip ON events (is_vip);
CREATE TRIGGER update_events_modtime BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- EVENT IMAGES TABLE
CREATE TABLE IF NOT EXISTS event_images (
    event_id                UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    priority_order          INT NOT NULL,
    image_url               VARCHAR(255) NOT NULL,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (event_id, priority_order)
);


-- TICKET TYPES TABLE
CREATE TABLE IF NOT EXISTS ticket_types (
    ticket_type_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id                UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    name                    VARCHAR(100) NOT NULL,
    description             TEXT NOT NULL,
    inclusions              JSONB NOT NULL,
    price                   NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    capacity                INT NOT NULL,
    qty_sold                INT DEFAULT 0,
    sale_start_at           TIMESTAMPTZ DEFAULT NULL,
    sale_end_at             TIMESTAMPTZ DEFAULT NULL,
    is_active               BOOLEAN DEFAULT TRUE,
    version                 INT DEFAULT 1,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL,

    CONSTRAINT uq_event_ticket UNIQUE (event_id, name)
);
CREATE INDEX idx_ticket_capacity ON ticket_types (ticket_type_id, qty_sold, capacity);
CREATE TRIGGER update_ticket_types_modtime BEFORE UPDATE ON ticket_types FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- VIP EVENTS TABLE
CREATE TABLE IF NOT EXISTS vip_events (
    event_id                UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    priority_order          INT NOT NULL,
    assigned_by             UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL,

    PRIMARY KEY (event_id, priority_order),
    CONSTRAINT uq_vip_events_priority_order UNIQUE (event_id, priority_order)
);
CREATE INDEX idx_priority_order ON vip_events (priority_order);
CREATE TRIGGER update_vip_events_modtime BEFORE UPDATE ON vip_events FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- EVENT COMMUNITY TABLE
CREATE TABLE IF NOT EXISTS event_community (
    user_id                 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id                UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    assigned_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (event_id, user_id)
);


-- PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS promotions (
    promotion_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(50) NOT NULL,
    description             VARCHAR(255) DEFAULT NULL,
    discount_type           discount_type NOT NULL,
    discount_value          NUMERIC(15,2) NOT NULL,
    max_discount_cap        NUMERIC(15,2) DEFAULT NULL,
    min_order_amount        NUMERIC(15,2) DEFAULT 0.00,
    start_at                TIMESTAMPTZ NOT NULL,
    end_at                  TIMESTAMPTZ NOT NULL,
    is_active               BOOLEAN DEFAULT TRUE,
    usage_limit_global      INT DEFAULT 0,
    usage_limit_per_user    INT DEFAULT 1,
    current_global_usage    INT DEFAULT 0,
    scope_event_id          UUID DEFAULT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    scope_ticket_type_id    UUID DEFAULT NULL REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    extra_rules_json        JSONB DEFAULT NULL,
    created_by              UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL,
    version                 INT DEFAULT 1,

    CONSTRAINT uq_code UNIQUE (code)
);
CREATE INDEX idx_validity ON promotions (code, is_active, start_at, end_at);
CREATE TRIGGER update_promotions_modtime BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- TICKET RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS ticket_reservations (
    reservation_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id                UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    ticket_type_id          UUID NOT NULL REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    quantity                INT NOT NULL DEFAULT 1,
    reserved_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at              TIMESTAMPTZ NOT NULL,
    status                  reservation_status DEFAULT 'PENDING'
);
CREATE INDEX idx_expiry_check ON ticket_reservations (status, expires_at);
CREATE INDEX idx_user_reservations ON ticket_reservations (user_id, status);


-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    order_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    event_id                UUID NOT NULL REFERENCES events(event_id) ON DELETE RESTRICT,
    promotion_id            UUID DEFAULT NULL REFERENCES promotions(promotion_id) ON DELETE SET NULL,
    reservation_id          UUID DEFAULT NULL,
    remarks                 TEXT DEFAULT NULL,
    subtotal                NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_amount         NUMERIC(15,2) DEFAULT 0.00,
    final_amount            NUMERIC(15,2) NOT NULL,
    payment_source          payment_source NOT NULL,
    payment_status          payment_status DEFAULT 'PENDING',
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX idx_user_orders ON orders (user_id, created_at);
CREATE INDEX idx_event_sales ON orders (event_id, payment_status);
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    event_id                UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    ticket_type_id          UUID NOT NULL REFERENCES ticket_types(ticket_type_id) ON DELETE RESTRICT,
    owner_user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    qr_hash                 VARCHAR(255) NOT NULL,
    status                  ticket_status DEFAULT 'ACTIVE',
    price_purchased         NUMERIC(15,2) NOT NULL,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT NULL,

    CONSTRAINT uq_qr_hash UNIQUE (qr_hash)
);
CREATE INDEX idx_ticket_validation ON tickets (event_id, qr_hash);
CREATE INDEX idx_user_wallet ON tickets (owner_user_id, status);
CREATE TRIGGER update_tickets_modtime BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- PROMOTION USAGES TABLE
CREATE TABLE IF NOT EXISTS promotion_usages (
    usage_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id            UUID NOT NULL REFERENCES promotions(promotion_id) ON DELETE RESTRICT,
    user_id                 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    order_id                UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    discount_received       NUMERIC(15,2) NOT NULL,
    used_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_order_promo UNIQUE (order_id, promotion_id)
);


-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    gateway                 gateway_type NOT NULL,
    gateway_ref_id          VARCHAR(255) DEFAULT NULL,
    amount                  NUMERIC(15,2) NOT NULL,
    status                  transaction_status NOT NULL,
    meta_data               JSONB DEFAULT NULL,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_trans ON transactions (order_id);
CREATE INDEX idx_gateway_ref ON transactions (gateway_ref_id);


-- SCAN LOGS TABLE
CREATE TABLE IF NOT EXISTS scan_logs (
    scan_id                 BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    ticket_id               UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    scanned_by_user_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    result                  scan_result NOT NULL,
    scanned_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_scan_history ON scan_logs (ticket_id);

-- OTP RECORDS TABLE
CREATE TABLE IF NOT EXISTS otp_records (
    otp_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    email           VARCHAR(150) NOT NULL,
    otp_hash        VARCHAR(255) NOT NULL,
    purpose         VARCHAR(50) NOT NULL CHECK (purpose IN ('signup', 'signin', 'forgot-password', 'reset-password')),
    resend_count    INTEGER DEFAULT 0,
    last_sent_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_used         BOOLEAN DEFAULT FALSE,
    verify_attempts INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_records (email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_records (expires_at);

-- AUTH SESSIONS TABLE (for verify-email page access control)
CREATE TABLE IF NOT EXISTS auth_flow_tokens (
    token_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(150) NOT NULL,
    purpose     VARCHAR(50) NOT NULL CHECK (purpose IN ('signup', 'signin', 'forgot-password', 'reset-password')),
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_used     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flow_token ON auth_flow_tokens (token, expires_at);