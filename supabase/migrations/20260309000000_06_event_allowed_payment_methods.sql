-- ============================================================
--  BUDDYTICKET — EVENT-LEVEL PAYMENT METHOD CONTROL
--  Adds allowed_payment_methods column to events table.
--  NULL = all payment methods allowed (backward compatible).
--  Depends: 01, 02, 03, 04, 05 migrations already applied
-- ============================================================

-- Add allowed_payment_methods column as an array of payment_source enum.
-- NULL default means all methods are available (PAYMENT_GATEWAY, BANK_TRANSFER, ONGATE).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS allowed_payment_methods payment_source[] DEFAULT NULL;

-- Add a CHECK constraint to ensure only valid non-empty arrays are stored.
-- NULL is allowed (means all methods), but an empty array is not.
ALTER TABLE events
  ADD CONSTRAINT chk_allowed_payment_methods_not_empty
  CHECK (allowed_payment_methods IS NULL OR array_length(allowed_payment_methods, 1) > 0);
