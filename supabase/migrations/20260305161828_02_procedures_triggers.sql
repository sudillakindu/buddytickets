-- ============================================================
--  BUDDYTICKET — STORED PROCEDURES, TRIGGERS, VIEWS & CRON
--  File   : 02_procedures_triggers_views.sql
--  Depends: 01_tables_schema.sql (must run first),
--           pg_cron extension (enable via Supabase dashboard)
-- ============================================================
-- Sections:
--   1. Time-based event status automation  (pg_cron, every minute)
--   2. Inventory-based sold-out trigger    (ticket_types.qty_sold)
--   3. VIP priority management trigger     (events.is_vip)
--   4. Database views                      (featured + all active)
--   5. RPC: reserve_tickets_occ            (checkout inventory lock)
--   6. RPC: finalize_order_tickets         (payment → tickets create)
--   7. Stale reservation expiry            (pg_cron, every minute)
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- SECTION 1 · TIME-BASED EVENT STATUS AUTOMATION
-- ─────────────────────────────────────────────────────────────

-- events table හි start_at / end_at columns compare කරමින්
-- event status ONGOING සහ COMPLETED ලෙස automatically update
-- කිරීමේ function. pg_cron extension හරහා සෑම විනාඩියකටම
-- (every minute) ක්‍රියාත්මක වේ.
--
-- Transition rules:
--   PUBLISHED / ON_SALE → ONGOING   : start_at <= NOW() < end_at
--   PUBLISHED / ON_SALE / SOLD_OUT /
--   ONGOING             → COMPLETED : end_at <= NOW()
--
-- DRAFT හා CANCELLED events කිසිවිටෙකත් auto-promote නොවේ.
-- is_active = FALSE events ද skip කෙරේ — soft-deleted events
-- status changes receive නොකිරීම සහතික කිරීමට.
-- updated_at SECURITY DEFINER context හි NOW() set කිරීම
-- update_modified_column() trigger fire නොවන instances handle කිරීමට.
--
-- Related tables  : events
-- Related cron job: update_event_time_status_job (Section 1 end)
CREATE OR REPLACE FUNCTION auto_update_event_time_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1a. Start time පහු වී ඇති active events ONGOING ලෙස promote කිරීම.
    UPDATE events
    SET    status     = 'ONGOING',
           updated_at = NOW()
    WHERE  is_active  = TRUE
      AND  status     IN ('PUBLISHED', 'ON_SALE')
      AND  start_at   <= NOW()
      AND  end_at     >  NOW();

    -- 1b. End time පහු වී ඇති සියලු active events COMPLETED ලෙස mark කිරීම.
    UPDATE events
    SET    status     = 'COMPLETED',
           updated_at = NOW()
    WHERE  is_active  = TRUE
      AND  status     IN ('PUBLISHED', 'ON_SALE', 'SOLD_OUT', 'ONGOING')
      AND  end_at     <= NOW();
END;
$$;


-- pg_cron extension enable කිරීම (Supabase dashboard SQL editor
-- හෝ superuser connection හරහා එක් වරක් run කරන්න).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotent migration: stale schedule තිබේ නම් ඉවත් කිරීම.
-- Re-run safe: duplicate job names error prevent කිරීමට.
SELECT cron.unschedule('update_event_time_status_job')
WHERE  EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'update_event_time_status_job'
);

-- සෑම විනාඩියකටම (every minute) auto_update_event_time_statuses
-- function execute කිරීමට cron job schedule කිරීම.
SELECT cron.schedule(
    'update_event_time_status_job',
    '* * * * *',
    $$ SELECT auto_update_event_time_statuses(); $$
);


-- ─────────────────────────────────────────────────────────────
-- SECTION 2 · INVENTORY-BASED SOLD-OUT TRIGGER
-- ─────────────────────────────────────────────────────────────

-- ticket_types.qty_sold column UPDATE වන සෑම විටම ක්‍රියාත්මක
-- වන trigger function. Event එකේ සියලු active ticket types
-- (is_active=TRUE) ගේ total capacity සහ total qty_sold ගණනය
-- කර sold out check කරයි.
--
-- Logic:
--   SUM(qty_sold) >= SUM(capacity) AND capacity > 0
--   → event status = 'SOLD_OUT'
--
-- Guard conditions (oversell / wrong status prevent):
--   - Capacity > 0 check: empty/inactive ticket types false trigger prevent.
--   - status IN guard: DRAFT, COMPLETED, CANCELLED events touch නොකිරීම.
--   - is_active = TRUE: soft-deleted events skip කිරීම.
--
-- Race condition protection:
--   finalize_order_tickets() RPC ticket_types row SELECT FOR UPDATE
--   lock කරන නිසා concurrent qty_sold updates serialized වේ.
--   මෙම trigger ඒ same transaction context හි fire වේ.
--
-- Related tables   : ticket_types, events
-- Related trigger  : trigger_check_sold_out (Section 2 end)
-- Related function : finalize_order_tickets() (Section 6)
CREATE OR REPLACE FUNCTION check_and_update_event_sold_out()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_capacity  BIGINT;
    v_total_sold      BIGINT;
BEGIN
    -- NEW.event_id event ගේ active ticket types aggregate කිරීම.
    SELECT
        COALESCE(SUM(capacity), 0),
        COALESCE(SUM(qty_sold),  0)
    INTO v_total_capacity, v_total_sold
    FROM ticket_types
    WHERE event_id  = NEW.event_id
      AND is_active = TRUE;

    -- Capacity > 0 guard: ticket types නොමැති events false sold-out prevent.
    -- Sold-out condition met නම් eligible status events update කිරීම.
    IF v_total_capacity > 0 AND v_total_sold >= v_total_capacity THEN
        UPDATE events
        SET    status     = 'SOLD_OUT',
               updated_at = NOW()
        WHERE  event_id   = NEW.event_id
          AND  status     IN ('PUBLISHED', 'ON_SALE', 'ONGOING')
          AND  is_active  = TRUE;
    END IF;

    RETURN NEW;
END;
$$;

-- Idempotent: re-run safe migration සඳහා stale trigger drop.
DROP TRIGGER IF EXISTS trigger_check_sold_out ON ticket_types;

-- AFTER UPDATE OF qty_sold: qty_sold column පමණක් update වූ
-- විට fire වේ — unnecessary trigger executions minimize කිරීමට.
CREATE TRIGGER trigger_check_sold_out
AFTER UPDATE OF qty_sold ON ticket_types
FOR EACH ROW
EXECUTE FUNCTION check_and_update_event_sold_out();


-- ─────────────────────────────────────────────────────────────
-- SECTION 3 · VIP PRIORITY MANAGEMENT TRIGGER
-- ─────────────────────────────────────────────────────────────

-- events.is_vip column change වන විට vip_events table
-- automatically manage කිරීමේ trigger function.
--
-- Case A — FALSE → TRUE (VIP promotion):
--   vip_events table හි MAX(priority_order) + 1 ලෙස
--   new row insert කෙරේ. ON CONFLICT upsert safety:
--   race condition හෝ accidental re-trigger safe handling.
--
-- Case B — TRUE → FALSE (VIP demotion):
--   vip_events table හෙන් row delete කෙරේ.
--   ඉවත් කළ priority_order ට වඩා high (numerically larger)
--   priority rows priority_order - 1 ලෙස update (gap-fill reorder).
--   උදාහරණ: [1,2,3,4] හෙන් priority=2 remove → [1,2,3] ලෙස renumber.
--
-- WHEN clause: is_vip value actually changed විටක් පමණක් fire —
-- unrelated column updates trigger skip කිරීමට.
--
-- Related tables  : events, vip_events
-- Related trigger : trigger_vip_status_change (Section 3 end)
-- Related view    : view_featured_events (Section 4)
CREATE OR REPLACE FUNCTION handle_vip_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_next_priority    INT;
    v_current_priority INT;
BEGIN
    -- ── Case A: Event VIP ලෙස promote කිරීම ─────────────────
    IF NEW.is_vip = TRUE AND OLD.is_vip = FALSE THEN

        -- දැනට ඇති highest priority_order + 1 (list end append).
        SELECT COALESCE(MAX(priority_order), 0) + 1
        INTO   v_next_priority
        FROM   vip_events;

        INSERT INTO vip_events (event_id, priority_order, assigned_by)
        VALUES (NEW.event_id, v_next_priority, NEW.organizer_id)
        -- Re-trigger / race condition safety: duplicate event_id
        -- attempt නම් priority_order update කිරීම පමණි.
        ON CONFLICT (event_id) DO UPDATE
            SET priority_order = EXCLUDED.priority_order,
                assigned_by    = EXCLUDED.assigned_by;

    -- ── Case B: Event VIP ලෙස demote කිරීම ──────────────────
    ELSIF NEW.is_vip = FALSE AND OLD.is_vip = TRUE THEN

        SELECT priority_order
        INTO   v_current_priority
        FROM   vip_events
        WHERE  event_id = NEW.event_id;

        -- vip_events row නොමැති edge case skip කිරීම.
        IF v_current_priority IS NOT NULL THEN
            DELETE FROM vip_events WHERE event_id = NEW.event_id;

            -- Priority gap close: removed row ට below ඇති rows
            -- priority_order 1 කින් decrement (compact reorder).
            UPDATE vip_events
            SET    priority_order = priority_order - 1
            WHERE  priority_order > v_current_priority;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- Idempotent drop.
DROP TRIGGER IF EXISTS trigger_vip_status_change ON events;

-- WHEN guard: is_vip value unchanged update calls trigger skip.
CREATE TRIGGER trigger_vip_status_change
AFTER UPDATE OF is_vip ON events
FOR EACH ROW
WHEN (OLD.is_vip IS DISTINCT FROM NEW.is_vip)
EXECUTE FUNCTION handle_vip_status_change();


-- ─────────────────────────────────────────────────────────────
-- SECTION 4 · DATABASE VIEWS
-- ─────────────────────────────────────────────────────────────

-- Homepage / featured section සඳහා event listing view.
-- Ordering priority:
--   1. VIP events (is_vip=TRUE) non-VIP events ට ඉහළින්.
--   2. VIP events ඇතුළේ priority_order ASC (vip_events table).
--   3. ඊටපස්සෙ start_at ASC (ළඟම upcoming event first).
-- Filter:
--   - is_active = TRUE (soft-deleted skip)
--   - status IN (ONGOING, ON_SALE, PUBLISHED) — live/upcoming only.
--     SOLD_OUT, COMPLETED, CANCELLED exclude කෙරේ.
--
-- Related tables: events, vip_events
-- Related trigger: trigger_vip_status_change (VIP data maintain)
CREATE OR REPLACE VIEW view_featured_events AS
SELECT
    e.*,
    v.priority_order AS vip_priority_order
FROM events e
LEFT JOIN vip_events v ON e.event_id = v.event_id
WHERE e.is_active = TRUE
  AND e.status IN ('ONGOING', 'ON_SALE', 'PUBLISHED')
ORDER BY
    CASE WHEN e.is_vip THEN 0 ELSE 1 END    ASC,
    v.priority_order                         ASC NULLS LAST,
    e.start_at                               ASC;


-- /events page සහ admin dashboard සඳහා full event listing view.
-- Filter:
--   - is_active = TRUE
--   - DRAFT හැර සියලු relevant statuses.
-- Ordering:
--   1. Status priority (ONGOING > ON_SALE > PUBLISHED > SOLD_OUT
--      > COMPLETED > CANCELLED).
--   2. VIP events same-status group ඇතුළේ ඉහළට.
--   3. VIP priority_order ASC.
--   4. start_at ASC (tiebreaker).
--
-- Related tables: events, vip_events
CREATE OR REPLACE VIEW view_all_active_events AS
SELECT
    e.*,
    v.priority_order AS vip_priority_order
FROM events e
LEFT JOIN vip_events v ON e.event_id = v.event_id
WHERE e.is_active = TRUE
  AND e.status IN (
      'ONGOING', 'ON_SALE', 'PUBLISHED',
      'SOLD_OUT', 'COMPLETED', 'CANCELLED'
  )
ORDER BY
    CASE e.status
        WHEN 'ONGOING'   THEN 1
        WHEN 'ON_SALE'   THEN 2
        WHEN 'PUBLISHED' THEN 3
        WHEN 'SOLD_OUT'  THEN 4
        WHEN 'COMPLETED' THEN 5
        WHEN 'CANCELLED' THEN 6
        ELSE                  7
    END                                      ASC,
    CASE WHEN e.is_vip THEN 0 ELSE 1 END     ASC,
    v.priority_order                         ASC NULLS LAST,
    e.start_at                               ASC;


-- ─────────────────────────────────────────────────────────────
-- SECTION 5 · RPC: reserve_tickets_occ
-- ─────────────────────────────────────────────────────────────

-- Checkout page "Add to Cart / Proceed to Payment" action සඳහා
-- inventory reservation RPC. SELECT FOR UPDATE (row-level lock)
-- භාවිතා කිරීමෙන් concurrent requests (ලිපිය ලිව්ව ගෙය parallel
-- checkout attempts) oversell prevent කරයි.
--
-- Algorithm (per ticket type item):
--   1. ticket_types row FOR UPDATE lock — concurrent requests serialize.
--   2. User ගේ existing PENDING reservations (this event) cancel.
--   3. Ticket type validity checks:
--        - NOT FOUND → TICKET_TYPE_NOT_FOUND error.
--        - is_active = FALSE → TICKET_TYPE_INACTIVE error.
--        - sale_start_at > NOW() → SALE_NOT_STARTED error.
--        - sale_end_at < NOW() → SALE_ENDED error.
--   4. Quantity validation:
--        - quantity <= 0 → INVALID_QUANTITY error.
--        - quantity > 10 → EXCEEDS_MAX_PER_ORDER error.
--   5. Availability check:
--        qty_sold + other_users_pending + new_qty > capacity
--        → SOLD_OUT error.
--   6. New PENDING reservation insert.
--
-- Returns JSONB: { reservation_ids, primary_id, expires_at }
-- Supabase client reservation_ids store කොට finalize step
-- ට pass කරයි.
--
-- Related tables   : ticket_types, ticket_reservations, events
-- Related function : finalize_order_tickets() (Section 6)
-- Related cron     : expire_stale_reservations_job (Section 7)
CREATE OR REPLACE FUNCTION reserve_tickets_occ(
    p_user_id       UUID,
    p_event_id      UUID,
    p_items         JSONB,              -- [{"ticket_type_id":"...","quantity":2}, ...]
    p_expires_mins  INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item              JSONB;
    v_ticket_type_id    UUID;
    v_quantity          INT;
    v_capacity          INT;
    v_qty_sold          INT;
    v_is_active         BOOLEAN;
    v_sale_start_at     TIMESTAMPTZ;
    v_sale_end_at       TIMESTAMPTZ;
    v_pending_others    INT;
    v_reservation_id    UUID;
    v_reservation_ids   UUID[]      := '{}';
    v_expires_at        TIMESTAMPTZ;
BEGIN
    -- Input validation: empty items array reject.
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'INVALID_INPUT:No items provided';
    END IF;

    v_expires_at := NOW() + (p_expires_mins || ' minutes')::INTERVAL;

    -- User ගේ existing PENDING reservations (this event) cancel කිරීම.
    -- Fresh checkout session = previous incomplete session replace.
    -- Cart update (quantity change, type change) safe handling.
    UPDATE ticket_reservations
    SET    status = 'CANCELLED'
    WHERE  user_id   = p_user_id
      AND  event_id  = p_event_id
      AND  status    = 'PENDING';

    -- Requested ticket types loop.
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_ticket_type_id := (v_item->>'ticket_type_id')::UUID;
        v_quantity       := (v_item->>'quantity')::INT;

        -- Per-item quantity validation.
        IF v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'INVALID_QUANTITY:%', v_ticket_type_id;
        END IF;

        -- Per-type max quantity cap (abuse prevention).
        IF v_quantity > 10 THEN
            RAISE EXCEPTION 'EXCEEDS_MAX_PER_ORDER:% max 10 per type',
                v_ticket_type_id;
        END IF;

        -- Ticket type row lock: concurrent checkout requests serialize.
        -- event_id filter: cross-event ticket type use prevent.
        SELECT capacity, qty_sold, is_active, sale_start_at, sale_end_at
        INTO   v_capacity, v_qty_sold, v_is_active,
               v_sale_start_at, v_sale_end_at
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

        -- Sale window validation (NULL = no window restriction).
        IF v_sale_start_at IS NOT NULL AND NOW() < v_sale_start_at THEN
            RAISE EXCEPTION 'SALE_NOT_STARTED:%', v_ticket_type_id;
        END IF;

        IF v_sale_end_at IS NOT NULL AND NOW() > v_sale_end_at THEN
            RAISE EXCEPTION 'SALE_ENDED:%', v_ticket_type_id;
        END IF;

        -- Other users ගේ active (non-expired) PENDING reservations
        -- count කිරීම — temporarily locked inventory.
        -- ඔවුන්ගේ sessions expire වෙන දක්වා ඒ seats reserve ලෙස count.
        SELECT COALESCE(SUM(quantity), 0)
        INTO   v_pending_others
        FROM   ticket_reservations
        WHERE  ticket_type_id = v_ticket_type_id
          AND  status         = 'PENDING'
          AND  expires_at     > NOW()
          AND  user_id       != p_user_id;

        -- Core availability check:
        --   Confirmed sold + others holding + this request <= capacity
        IF v_qty_sold + v_pending_others + v_quantity > v_capacity THEN
            RAISE EXCEPTION 'SOLD_OUT:%', v_ticket_type_id;
        END IF;

        -- New PENDING reservation insert.
        INSERT INTO ticket_reservations (
            user_id, event_id, ticket_type_id, quantity, expires_at, status
        )
        VALUES (
            p_user_id, p_event_id, v_ticket_type_id,
            v_quantity, v_expires_at, 'PENDING'
        )
        RETURNING reservation_id INTO v_reservation_id;

        v_reservation_ids := array_append(v_reservation_ids, v_reservation_id);
    END LOOP;

    -- Client ට reservation IDs, primary ID, expiry time return.
    RETURN jsonb_build_object(
        'reservation_ids', to_json(v_reservation_ids)::JSONB,
        'primary_id',      to_json(v_reservation_ids[1])::JSONB,
        'expires_at',      to_json(v_expires_at)::JSONB
    );
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- SECTION 6 · RPC: finalize_order_tickets
-- ─────────────────────────────────────────────────────────────

-- PayHere webhook callback හෝ cash-desk manual confirmation
-- receive කළ විට tickets create කිරීමේ RPC.
-- OCC (Optimistic Concurrency Control) + SELECT FOR UPDATE
-- combination: concurrent finalize calls (webhook retries,
-- parallel requests) safe ලෙස handle කරයි.
--
-- Algorithm:
--   1. Order validate: PENDING status + correct user ownership.
--   2. payment_source → ticket_status decide:
--        ONGATE_MANUAL → ONGATE_PENDING
--        otherwise     → ACTIVE
--   3. Per reservation (linked to this order):
--        a. ticket_types row FOR UPDATE lock.
--        b. OCC version check + qty_sold increment:
--              UPDATE ... WHERE version = expected_version
--                          AND qty_sold + qty <= capacity
--           rows_updated = 0 → OCC_CONFLICT_OR_SOLD_OUT error
--           (transaction rollback, client retry).
--        c. Individual ticket rows insert (qty count).
--        d. Reservation status PENDING → CONFIRMED.
--   4. Order payment_status → PAID (or provided status).
--   5. Transaction record insert (gateway ref provided නම්).
--   6. Promotion usage counters update + audit insert.
--
-- Returns JSONB: { order_id, ticket_count }
-- OCC conflict = client must retry from reserve_tickets_occ.
--
-- Related tables   : orders, ticket_reservations, ticket_types,
--                    tickets, transactions, promotions,
--                    promotion_usages
-- Related function : reserve_tickets_occ() (Section 5)
-- Related trigger  : trigger_check_sold_out (Section 2)
CREATE OR REPLACE FUNCTION finalize_order_tickets(
    p_order_id          UUID,
    p_user_id           UUID,
    p_payment_status    payment_status  DEFAULT 'PAID',
    p_gateway_ref_id    TEXT            DEFAULT NULL,
    p_ticket_qr_data    JSONB           DEFAULT '[]'::JSONB
    -- Structure: [{"reservation_id":"...","ticket_type_version":N,"qr_hashes":["...",...]}]
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
    -- Order validate: PENDING status + user ownership.
    -- FOR UPDATE: duplicate webhook calls serialize.
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

    -- Payment source → ticket status mapping.
    v_ticket_status := CASE
        WHEN v_order.payment_source = 'ONGATE_MANUAL'
            THEN 'ONGATE_PENDING'::ticket_status
        ELSE 'ACTIVE'::ticket_status
    END;

    -- Order linked reservations process (lock ticket_types rows).
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
        -- p_ticket_qr_data හෙන් this reservation ගේ
        -- qr_hashes සහ expected version find කිරීම.
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

        -- OCC atomic inventory update:
        -- version mismatch (concurrent update) හෝ capacity exceed
        -- නම් rows_updated = 0 → rollback + retry signal.
        UPDATE ticket_types
        SET    qty_sold = qty_sold + v_reservation.quantity,
               version  = version  + 1
        WHERE  ticket_type_id = v_reservation.ticket_type_id
          AND  version        = v_expected_version
          AND  qty_sold + v_reservation.quantity <= capacity;

        GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

        -- OCC conflict: transaction rollback, client retry required.
        IF v_rows_updated = 0 THEN
            RAISE EXCEPTION 'OCC_CONFLICT_OR_SOLD_OUT:%',
                v_reservation.ticket_type_id;
        END IF;

        -- Individual ticket rows insert (one per seat).
        -- qr_hash client-provided නොමැති නම් UUID fallback.
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

        -- Reservation PENDING → CONFIRMED.
        UPDATE ticket_reservations
        SET    status = 'CONFIRMED'
        WHERE  reservation_id = v_reservation.reservation_id;
    END LOOP;

    -- Order payment status update.
    UPDATE orders
    SET    payment_status = p_payment_status
    WHERE  order_id = p_order_id;

    -- Gateway transaction record insert (PayHere webhook path).
    -- p_gateway_ref_id NULL නම් (manual/cash path) skip කෙරේ.
    IF p_gateway_ref_id IS NOT NULL THEN
        INSERT INTO transactions (
            order_id, gateway, gateway_ref_id, amount, status, meta_data
        )
        SELECT
            p_order_id,
            CASE
                WHEN v_order.payment_source = 'PAYHERE_ONLINE'
                    THEN 'PAYHERE'::gateway_type
                ELSE 'CASH_DESK'::gateway_type
            END,
            p_gateway_ref_id,
            final_amount,
            'SUCCESS'::transaction_status,
            jsonb_build_object('finalized_at', NOW())
        FROM orders
        WHERE order_id = p_order_id;
    END IF;

    -- Promotion usage counters update (discount use කළේ නම් පමණි).
    IF v_order.promotion_id IS NOT NULL AND v_order.discount_amount > 0 THEN
        UPDATE promotions
        SET    current_global_usage = current_global_usage + 1,
               version              = version + 1
        WHERE  promotion_id = v_order.promotion_id;

        -- ON CONFLICT DO NOTHING: idempotent webhook retry safe handling.
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


-- ─────────────────────────────────────────────────────────────
-- SECTION 7 · STALE RESERVATION EXPIRY
-- ─────────────────────────────────────────────────────────────

-- Expired checkout session reservations PENDING → EXPIRED ලෙස
-- mark කිරීමේ cleanup function.
-- expires_at <= NOW() + status = PENDING conditions match
-- කරන reservations bulk update කෙරේ.
-- Inventory release: EXPIRED reservations reserve_tickets_occ()
-- pending_others count හෙන් exclude වේ (expires_at > NOW() filter)
-- — manual inventory rollback function අවශ්‍ය නොවේ.
-- pg_cron හරහා සෑම විනාඩියකටම execute කෙරේ.
--
-- Related tables: ticket_reservations
-- Related function: reserve_tickets_occ() (pending_others check)
-- Related cron   : expire_stale_reservations_job (Section 7 end)
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

-- Idempotent migration.
SELECT cron.unschedule('expire_stale_reservations_job')
WHERE  EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'expire_stale_reservations_job'
);

-- සෑම විනාඩියකටම stale reservations expire කිරීම.
SELECT cron.schedule(
    'expire_stale_reservations_job',
    '* * * * *',
    $$ SELECT expire_stale_reservations(); $$
);


-- ─────────────────────────────────────────────────────────────
-- VERIFY: Database හි schedule වී ඇති cron jobs confirm කිරීම.
-- ─────────────────────────────────────────────────────────────
SELECT jobid, jobname, schedule, command, active
FROM   cron.job
ORDER  BY jobname;