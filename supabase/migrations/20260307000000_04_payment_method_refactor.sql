-- ============================================================
--  BUDDYTICKET — PAYMENT METHOD REFACTOR
--  Adds BANK_TRANSFER payment source + renames enums
--  Depends: 01, 02, 03 migrations already applied
-- ============================================================

-- Step 1: Add new values to payment_source enum
ALTER TYPE payment_source ADD VALUE IF NOT EXISTS 'PAYMENT_GATEWAY';
ALTER TYPE payment_source ADD VALUE IF NOT EXISTS 'ONGATE';
ALTER TYPE payment_source ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';

-- Step 2: Migrate existing data to new enum values
UPDATE orders
  SET payment_source = 'PAYMENT_GATEWAY'
  WHERE payment_source = 'PAYHERE_ONLINE';

UPDATE orders
  SET payment_source = 'ONGATE'
  WHERE payment_source = 'ONGATE_MANUAL';

-- Step 3: Add new values to gateway_type enum
ALTER TYPE gateway_type ADD VALUE IF NOT EXISTS 'PAYMENT_GATEWAY';
ALTER TYPE gateway_type ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';

-- Step 4: Migrate existing transaction gateway values
UPDATE transactions
  SET gateway = 'PAYMENT_GATEWAY'
  WHERE gateway = 'PAYHERE';

-- Step 5: Update finalize_order_tickets() RPC
CREATE OR REPLACE FUNCTION finalize_order_tickets(
    p_order_id          UUID,
    p_user_id           UUID,
    p_payment_status    payment_status  DEFAULT 'PAID',
    p_gateway_ref_id    TEXT            DEFAULT NULL,
    p_ticket_qr_data    JSONB           DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order             RECORD;
    v_promotion         RECORD;
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
    SELECT order_id, user_id, event_id, promotion_id,
           discount_amount, payment_source
    INTO   v_order
    FROM   orders
    WHERE  order_id        = p_order_id
      AND  user_id         = p_user_id
      AND  payment_status  = 'PENDING'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND_OR_ALREADY_PROCESSED:%', p_order_id;
    END IF;

    -- UPDATED: 3-way payment source → ticket status mapping
    -- PAYMENT_GATEWAY = paid online  → ACTIVE (can enter immediately)
    -- ONGATE          = cash at gate → ONGATE_PENDING (pay at gate first)
    -- BANK_TRANSFER   = bank deposit → ONGATE_PENDING (admin confirms first)
    v_ticket_status := CASE
        WHEN v_order.payment_source = 'ONGATE'
            THEN 'ONGATE_PENDING'::ticket_status
        WHEN v_order.payment_source = 'BANK_TRANSFER'
            THEN 'ONGATE_PENDING'::ticket_status
        ELSE 'ACTIVE'::ticket_status  -- PAYMENT_GATEWAY
    END;

    IF v_order.promotion_id IS NOT NULL AND v_order.discount_amount > 0 THEN
        SELECT promotion_id, usage_limit_global, current_global_usage
        INTO   v_promotion
        FROM   promotions
        WHERE  promotion_id = v_order.promotion_id
        FOR UPDATE;

        IF v_promotion.usage_limit_global > 0
           AND v_promotion.current_global_usage >= v_promotion.usage_limit_global
        THEN
            RAISE EXCEPTION 'PROMOTION_LIMIT_EXCEEDED:%', v_order.promotion_id;
        END IF;
    END IF;

    FOR v_reservation IN
        SELECT r.reservation_id, r.ticket_type_id, r.quantity,
               r.event_id, r.expires_at,
               tt.price, tt.qty_sold, tt.capacity, tt.version
        FROM   ticket_reservations r
        JOIN   ticket_types tt ON tt.ticket_type_id = r.ticket_type_id
        WHERE  r.order_id  = p_order_id
          AND  r.user_id   = p_user_id
          AND  r.status    = 'PENDING'
        FOR UPDATE OF tt
    LOOP
        IF v_reservation.expires_at <= NOW() THEN
            RAISE EXCEPTION 'RESERVATION_EXPIRED:%', v_reservation.reservation_id;
        END IF;

        v_expected_version := v_reservation.version;
        v_qr_hashes        := NULL;

        FOR v_qr_item IN SELECT * FROM jsonb_array_elements(p_ticket_qr_data)
        LOOP
            IF (v_qr_item->>'reservation_id')::UUID = v_reservation.reservation_id THEN
                v_qr_hashes        := v_qr_item->'qr_hashes';
                v_expected_version := COALESCE(
                    (v_qr_item->>'ticket_type_version')::INT,
                    v_reservation.version
                );
                EXIT;
            END IF;
        END LOOP;

        UPDATE ticket_types
        SET    qty_sold = qty_sold + v_reservation.quantity,
               version  = version  + 1
        WHERE  ticket_type_id = v_reservation.ticket_type_id
          AND  version        = v_expected_version
          AND  qty_sold + v_reservation.quantity <= capacity;

        GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

        IF v_rows_updated = 0 THEN
            RAISE EXCEPTION 'OCC_CONFLICT_OR_SOLD_OUT:%', v_reservation.ticket_type_id;
        END IF;

        FOR v_hash_idx IN 0..(v_reservation.quantity - 1)
        LOOP
            v_qr_hash := COALESCE(
                v_qr_hashes->>v_hash_idx,
                gen_random_uuid()::TEXT
            );

            INSERT INTO tickets (
                order_id, event_id, ticket_type_id, owner_user_id,
                qr_hash, status, price_purchased
            )
            VALUES (
                p_order_id, v_reservation.event_id, v_reservation.ticket_type_id,
                p_user_id, v_qr_hash, v_ticket_status, v_reservation.price
            );

            v_ticket_count := v_ticket_count + 1;
        END LOOP;

        UPDATE ticket_reservations
        SET    status = 'CONFIRMED'
        WHERE  reservation_id = v_reservation.reservation_id;
    END LOOP;

    UPDATE orders
    SET    payment_status = p_payment_status
    WHERE  order_id = p_order_id;

    -- UPDATED: gateway_type mapping for 3 payment sources
    IF p_gateway_ref_id IS NOT NULL THEN
        INSERT INTO transactions (
            order_id, gateway, gateway_ref_id, amount, status, meta_data
        )
        SELECT
            p_order_id,
            CASE
                WHEN v_order.payment_source = 'PAYMENT_GATEWAY'
                    THEN 'PAYMENT_GATEWAY'::gateway_type
                WHEN v_order.payment_source = 'BANK_TRANSFER'
                    THEN 'BANK_TRANSFER'::gateway_type
                ELSE 'CASH_DESK'::gateway_type  -- ONGATE
            END,
            p_gateway_ref_id,
            final_amount,
            'SUCCESS'::transaction_status,
            jsonb_build_object('finalized_at', NOW())
        FROM orders
        WHERE order_id = p_order_id;
    END IF;

    IF v_order.promotion_id IS NOT NULL AND v_order.discount_amount > 0 THEN
        UPDATE promotions
        SET    current_global_usage = current_global_usage + 1,
               version              = version + 1
        WHERE  promotion_id = v_order.promotion_id;

        INSERT INTO promotion_usages (
            promotion_id, user_id, order_id, discount_received
        )
        VALUES (
            v_order.promotion_id, p_user_id,
            p_order_id, v_order.discount_amount
        )
        ON CONFLICT (order_id, promotion_id) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'order_id',     p_order_id,
        'ticket_count', v_ticket_count
    );
END;
$$;

-- NOTE: Old enum values (PAYHERE_ONLINE, ONGATE_MANUAL, PAYHERE) cannot be
-- dropped in PostgreSQL without recreating the type. They remain in the enum
-- but are no longer used by any code. Data has been migrated above.
-- To fully remove them, a full type recreation with column migration is required
-- in a future maintenance window.
