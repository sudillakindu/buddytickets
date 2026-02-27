-- Run this SQL in your Supabase SQL editor

-- OTP RECORDS TABLE
CREATE TABLE IF NOT EXISTS otp_records (
    otp_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    email           VARCHAR(150) NOT NULL,
    otp_hash        VARCHAR(255) NOT NULL,
    purpose         VARCHAR(50) NOT NULL CHECK (purpose IN ('signup', 'signin', 'forgot-password')),
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
    purpose     VARCHAR(50) NOT NULL CHECK (purpose IN ('signup', 'signin', 'forgot-password')),
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_used     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flow_token ON auth_flow_tokens (token, expires_at);