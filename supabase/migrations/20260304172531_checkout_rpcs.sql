-- ============================================================
-- BUDDYTICKET — CHECKOUT & ORDER PROCESSING RPCs
-- ============================================================
-- Contains:
--   1. reserve_tickets_occ      — OCC reservation with inventory lock
--   2. finalize_order_tickets   — Create tickets + update qty_sold (OCC)
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- RPC 1: reserve_tickets_occ
-- Creates ticket reservations for one or more ticket types in a
-- single atomic transaction using SELECT FOR UPDATE to prevent
-- concurrent overselling (Optimistic Concurrency Control).
--
-- Algorithm:
--   For each item in p_items:
--     1. Lock the ticket_type row FOR UPDATE
--     2. Sum up PENDING (non-expired) reservations from OTHER users
--     3. Cancel any stale PENDING reservation this user already holds
--     4. Check: qty_sold + others_pending + new_qty <= capacity
--     5. Insert new PENDING reservation
--
-- Returns: { "reservation_ids": ["uuid", ...], "primary_id": "uuid" }
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reserve_tickets_occ(
  p_user_id      UUID,
  p_event_id     UUID,
  p_items        JSONB,          -- [{"ticket_type_id":"...","quantity":2}, ...]
  p_expires_mins INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item             JSONB;
  v_ticket_type_id   UUID;
  v_quantity         INT;
  v_capacity         INT;
  v_qty_sold         INT;
  v_is_active        BOOLEAN;
  v_sale_start_at    TIMESTAMPTZ;
  v_sale_end_at      TIMESTAMPTZ;
  v_pending_others   INT;
  v_reservation_id   UUID;
  v_reservation_ids  UUID[] := '{}';
  v_expires_at       TIMESTAMPTZ;
BEGIN
  -- Validate input
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT:No items provided';
  END IF;

  v_expires_at := NOW() + (p_expires_mins || ' minutes')::INTERVAL;

  -- Cancel ALL existing PENDING reservations for this user+event
  -- (fresh checkout replaces any previous incomplete session)
  UPDATE ticket_reservations
  SET    status = 'CANCELLED'
  WHERE  user_id   = p_user_id
    AND  event_id  = p_event_id
    AND  status    = 'PENDING';

  -- Process each requested ticket type
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_ticket_type_id := (v_item->>'ticket_type_id')::UUID;
    v_quantity       := (v_item->>'quantity')::INT;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY:%', v_ticket_type_id;
    END IF;

    IF v_quantity > 10 THEN
      RAISE EXCEPTION 'EXCEEDS_MAX_PER_ORDER:% max 10 per type', v_ticket_type_id;
    END IF;

    -- Lock this ticket_type row to serialize concurrent requests
    SELECT capacity, qty_sold, is_active, sale_start_at, sale_end_at
    INTO   v_capacity, v_qty_sold, v_is_active, v_sale_start_at, v_sale_end_at
    FROM   ticket_types
    WHERE  ticket_type_id = v_ticket_type_id
      AND  event_id       = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'TICKET_TYPE_NOT_FOUND:%', v_ticket_type_id;
    END IF;

    IF NOT v_is_active THEN
      RAISE EXCEPTION 'TICKET_TYPE_INACTIVE:%', v_ticket_type_id;
    END IF;

    -- Check sale window (if defined)
    IF v_sale_start_at IS NOT NULL AND NOW() < v_sale_start_at THEN
      RAISE EXCEPTION 'SALE_NOT_STARTED:%', v_ticket_type_id;
    END IF;

    IF v_sale_end_at IS NOT NULL AND NOW() > v_sale_end_at THEN
      RAISE EXCEPTION 'SALE_ENDED:%', v_ticket_type_id;
    END IF;

    -- Count PENDING reservations held by OTHER users (temporarily locked inventory)
    SELECT COALESCE(SUM(quantity), 0)
    INTO   v_pending_others
    FROM   ticket_reservations
    WHERE  ticket_type_id = v_ticket_type_id
      AND  status         = 'PENDING'
      AND  expires_at     > NOW()
      AND  user_id       != p_user_id;

    -- Availability check: confirmed sold + others holding + new request <= capacity
    IF v_qty_sold + v_pending_others + v_quantity > v_capacity THEN
      RAISE EXCEPTION 'SOLD_OUT:%', v_ticket_type_id;
    END IF;

    -- Create the reservation
    INSERT INTO ticket_reservations (
      user_id, event_id, ticket_type_id, quantity, expires_at, status
    )
    VALUES (
      p_user_id, p_event_id, v_ticket_type_id, v_quantity, v_expires_at, 'PENDING'
    )
    RETURNING reservation_id INTO v_reservation_id;

    v_reservation_ids := array_append(v_reservation_ids, v_reservation_id);
  END LOOP;

  RETURN jsonb_build_object(
    'reservation_ids', to_json(v_reservation_ids)::JSONB,
    'primary_id',      to_json(v_reservation_ids[1])::JSONB,
    'expires_at',      to_json(v_expires_at)::JSONB
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- RPC 2: finalize_order_tickets
-- Called after payment confirmation (PayHere webhook) OR for
-- manual/cash-desk payments.
--
-- Algorithm:
--   1. Re-validate all reservations are PENDING and not expired
--   2. Update order payment_status to PAID (or PENDING for manual)
--   3. For each reservation:
--        a. UPDATE ticket_types SET qty_sold += qty, version = version + 1
--           WHERE version = p_version AND qty_sold + qty <= capacity
--        b. If rows_updated = 0 → raise OCC_CONFLICT (another tx won)
--        c. INSERT individual ticket records with provided qr_hashes
--        d. UPDATE reservation status = CONFIRMED
--   4. Handle promotion usage
--
-- Returns: { "order_id": "uuid", "ticket_count": N }
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION finalize_order_tickets(
  p_order_id          UUID,
  p_user_id           UUID,
  p_payment_status    payment_status DEFAULT 'PAID',
  p_gateway_ref_id    TEXT           DEFAULT NULL,
  p_ticket_qr_data    JSONB          DEFAULT '[]'::JSONB
  -- Structure: [{"reservation_id":"...","ticket_type_version":N,"qr_hashes":["...","..."]}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order             RECORD;
  v_reservation       RECORD;
  v_qr_item           JSONB;
  v_qr_hashes         JSONB;
  v_qr_hash           TEXT;
  v_expected_version  INT;
  v_rows_updated      INT;
  v_ticket_status     ticket_status;
  v_ticket_count      INT := 0;
  v_hash_idx          INT;
BEGIN
  -- Load and validate the order
  SELECT order_id, user_id, event_id, promotion_id, discount_amount, payment_source
  INTO   v_order
  FROM   orders
  WHERE  order_id        = p_order_id
    AND  user_id         = p_user_id
    AND  payment_status  = 'PENDING'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND_OR_ALREADY_PROCESSED:%', p_order_id;
  END IF;

  -- Determine ticket status
  v_ticket_status := CASE
    WHEN v_order.payment_source = 'ONGATE_MANUAL' THEN 'ONGATE_PENDING'::ticket_status
    ELSE 'ACTIVE'::ticket_status
  END;

  -- Process each reservation linked to this order
  FOR v_reservation IN
    SELECT r.reservation_id, r.ticket_type_id, r.quantity,
           r.event_id,
           tt.price, tt.qty_sold, tt.capacity, tt.version
    FROM   ticket_reservations r
    JOIN   ticket_types tt ON tt.ticket_type_id = r.ticket_type_id
    WHERE  r.order_id  = p_order_id
      AND  r.user_id   = p_user_id
      AND  r.status    = 'PENDING'
    FOR UPDATE OF tt
  LOOP
    -- Find the expected version for this reservation from qr_data
    v_expected_version := v_reservation.version;
    v_qr_hashes        := NULL;

    FOR v_qr_item IN SELECT * FROM jsonb_array_elements(p_ticket_qr_data)
    LOOP
      IF (v_qr_item->>'reservation_id')::UUID = v_reservation.reservation_id THEN
        v_qr_hashes        := v_qr_item->'qr_hashes';
        v_expected_version := COALESCE((v_qr_item->>'ticket_type_version')::INT, v_reservation.version);
        EXIT;
      END IF;
    END LOOP;

    -- OCC: increment qty_sold only if version matches and capacity allows
    UPDATE ticket_types
    SET    qty_sold = qty_sold + v_reservation.quantity,
           version  = version  + 1
    WHERE  ticket_type_id = v_reservation.ticket_type_id
      AND  version        = v_expected_version
      AND  qty_sold + v_reservation.quantity <= capacity;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    IF v_rows_updated = 0 THEN
      -- Either version mismatch (concurrent update) or sold out
      RAISE EXCEPTION 'OCC_CONFLICT_OR_SOLD_OUT:%', v_reservation.ticket_type_id;
    END IF;

    -- Insert individual ticket records
    FOR v_hash_idx IN 0..(v_reservation.quantity - 1)
    LOOP
      v_qr_hash := COALESCE(v_qr_hashes->>v_hash_idx, gen_random_uuid()::TEXT);

      INSERT INTO tickets (
        order_id, event_id, ticket_type_id, owner_user_id,
        qr_hash, status, price_purchased
      )
      VALUES (
        p_order_id,
        v_reservation.event_id,
        v_reservation.ticket_type_id,
        p_user_id,
        v_qr_hash,
        v_ticket_status,
        v_reservation.price
      );

      v_ticket_count := v_ticket_count + 1;
    END LOOP;

    -- Confirm this reservation
    UPDATE ticket_reservations
    SET    status = 'CONFIRMED'
    WHERE  reservation_id = v_reservation.reservation_id;
  END LOOP;

  -- Update order to paid/confirmed
  UPDATE orders
  SET    payment_status = p_payment_status
  WHERE  order_id = p_order_id;

  -- Record transaction (if gateway ref provided — PayHere webhook path)
  IF p_gateway_ref_id IS NOT NULL THEN
    INSERT INTO transactions (order_id, gateway, gateway_ref_id, amount, status, meta_data)
    SELECT
      p_order_id,
      CASE WHEN v_order.payment_source = 'PAYHERE_ONLINE' THEN 'PAYHERE'::gateway_type
           ELSE 'CASH_DESK'::gateway_type END,
      p_gateway_ref_id,
      final_amount,
      'SUCCESS'::transaction_status,
      jsonb_build_object('finalized_at', NOW())
    FROM orders WHERE order_id = p_order_id;
  END IF;

  -- Update promotion usage counters
  IF v_order.promotion_id IS NOT NULL AND v_order.discount_amount > 0 THEN
    UPDATE promotions
    SET    current_global_usage = current_global_usage + 1,
           version              = version + 1
    WHERE  promotion_id = v_order.promotion_id;

    -- Upsert to handle idempotent webhook retries
    INSERT INTO promotion_usages (promotion_id, user_id, order_id, discount_received)
    VALUES (v_order.promotion_id, p_user_id, p_order_id, v_order.discount_amount)
    ON CONFLICT (order_id, promotion_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'order_id',     p_order_id,
    'ticket_count', v_ticket_count
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- Helper: expire_stale_reservations
-- Marks PENDING reservations as EXPIRED if their expires_at has
-- passed. Should be called by pg_cron every minute.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_stale_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ticket_reservations
  SET    status = 'EXPIRED'
  WHERE  status    = 'PENDING'
    AND  expires_at <= NOW();
END;
$$;

-- Schedule expiry job (idempotent)
SELECT cron.unschedule('expire_stale_reservations_job')
WHERE  EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'expire_stale_reservations_job'
);

SELECT cron.schedule(
  'expire_stale_reservations_job',
  '* * * * *',
  $$ SELECT expire_stale_reservations(); $$
);


-- ─────────────────────────────────────────────────────────────
-- IMPORTANT: Add order_id FK to ticket_reservations for linking
-- reservations to orders at payment initiation time.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE ticket_reservations
  ADD COLUMN IF NOT EXISTS order_id UUID DEFAULT NULL
    REFERENCES orders(order_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservation_order
  ON ticket_reservations (order_id)
  WHERE order_id IS NOT NULL;