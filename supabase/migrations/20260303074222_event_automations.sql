-- ============================================================
-- EVENT PLATFORM — COMPLETE SUPABASE AUTOMATION SCRIPTS
-- ============================================================
-- Covers:
--   1. Auto ONGOING / COMPLETED  (time-based, pg_cron every minute)
--   2. Auto SOLD_OUT             (inventory-based trigger)
--   3. VIP priority management   (insert / remove / reorder trigger)
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- SECTION 1 · TIME-BASED STATUS AUTOMATION
-- Runs every minute via pg_cron.
-- ONGOING  → start_at <= NOW() < end_at  AND status IN (PUBLISHED, ON_SALE)
-- COMPLETED → end_at  <= NOW()           AND status IN (PUBLISHED, ON_SALE, SOLD_OUT, ONGOING)
-- DRAFT & CANCELLED are intentionally excluded — they must never
-- be auto-progressed by time alone.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auto_update_event_time_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as the function owner, bypasses RLS
SET search_path = public
AS $$
BEGIN
    -- 1a. Promote to ONGOING
    UPDATE events
    SET    status     = 'ONGOING',
           updated_at = NOW()
    WHERE  is_active  = TRUE
      AND  status     IN ('PUBLISHED', 'ON_SALE')
      AND  start_at   <= NOW()
      AND  end_at     >  NOW();

    -- 1b. Promote to COMPLETED
    UPDATE events
    SET    status     = 'COMPLETED',
           updated_at = NOW()
    WHERE  is_active  = TRUE
      AND  status     IN ('PUBLISHED', 'ON_SALE', 'SOLD_OUT', 'ONGOING')
      AND  end_at     <= NOW();
END;
$$;


-- Enable pg_cron (run once as superuser / via Supabase dashboard SQL editor)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any stale schedule before recreating (idempotent)
SELECT cron.unschedule('update_event_time_status_job')
WHERE  EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'update_event_time_status_job'
);

-- Schedule: every minute
SELECT cron.schedule(
    'update_event_time_status_job',
    '* * * * *',
    $$ SELECT auto_update_event_time_statuses(); $$
);


-- ─────────────────────────────────────────────────────────────
-- SECTION 2 · INVENTORY-BASED SOLD-OUT TRIGGER
-- Fires AFTER UPDATE OF qty_sold on ticket_types.
-- Checks if ALL active ticket types for the same event have
-- qty_sold >= capacity; if so, marks the event SOLD_OUT.
-- Guard: only promotes PUBLISHED / ON_SALE / ONGOING events —
-- never touches DRAFT, COMPLETED, CANCELLED.
-- ─────────────────────────────────────────────────────────────

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
    -- Aggregate only the ACTIVE ticket types for this event
    SELECT
        COALESCE(SUM(capacity), 0),
        COALESCE(SUM(qty_sold),  0)
    INTO v_total_capacity, v_total_sold
    FROM ticket_types
    WHERE event_id  = NEW.event_id
      AND is_active = TRUE;

    -- Only flip to SOLD_OUT when at least one ticket exists AND
    -- every active seat is gone
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

-- Drop old trigger if exists (idempotent migration)
DROP TRIGGER IF EXISTS trigger_check_sold_out ON ticket_types;

CREATE TRIGGER trigger_check_sold_out
AFTER UPDATE OF qty_sold ON ticket_types
FOR EACH ROW
EXECUTE FUNCTION check_and_update_event_sold_out();


-- ─────────────────────────────────────────────────────────────
-- SECTION 3 · VIP PRIORITY MANAGEMENT TRIGGER
-- Fires AFTER UPDATE OF is_vip on events.
--
-- Case A — is_vip: FALSE → TRUE
--   Insert into vip_events with priority_order = MAX + 1
--
-- Case B — is_vip: TRUE → FALSE
--   Delete from vip_events, then close the gap by decrementing
--   priority_order of all rows that were ranked below it.
-- ─────────────────────────────────────────────────────────────

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
    -- ── Case A: promoted to VIP ──────────────────────────────
    IF NEW.is_vip = TRUE AND OLD.is_vip = FALSE THEN

        SELECT COALESCE(MAX(priority_order), 0) + 1
        INTO   v_next_priority
        FROM   vip_events;

        INSERT INTO vip_events (event_id, priority_order, assigned_by)
        VALUES (NEW.event_id, v_next_priority, NEW.organizer_id)
        ON CONFLICT (event_id) DO UPDATE          -- safety: avoid dup if
            SET priority_order = EXCLUDED.priority_order,  -- re-inserted
                assigned_by    = EXCLUDED.assigned_by;

    -- ── Case B: demoted from VIP ─────────────────────────────
    ELSIF NEW.is_vip = FALSE AND OLD.is_vip = TRUE THEN

        SELECT priority_order
        INTO   v_current_priority
        FROM   vip_events
        WHERE  event_id = NEW.event_id;

        IF v_current_priority IS NOT NULL THEN
            -- Remove the demoted event
            DELETE FROM vip_events WHERE event_id = NEW.event_id;

            -- Close the gap: shift everything ranked below it up by 1
            UPDATE vip_events
            SET    priority_order = priority_order - 1
            WHERE  priority_order > v_current_priority;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- Drop old trigger if exists (idempotent)
DROP TRIGGER IF EXISTS trigger_vip_status_change ON events;

CREATE TRIGGER trigger_vip_status_change
AFTER UPDATE OF is_vip ON events
FOR EACH ROW
WHEN (OLD.is_vip IS DISTINCT FROM NEW.is_vip)
EXECUTE FUNCTION handle_vip_status_change();


-- ─────────────────────────────────────────────────────────────
-- SECTION 4 · DATABASE VIEWS
-- ─────────────────────────────────────────────────────────────

-- Featured Events view
-- Ordering: VIP first (by priority_order ASC), then start_at ASC
-- Filter: is_active=TRUE, status IN (ONGOING, ON_SALE, PUBLISHED)
CREATE OR REPLACE VIEW view_featured_events AS
SELECT
    e.*,
    v.priority_order AS vip_priority_order
FROM events e
LEFT JOIN vip_events v ON e.event_id = v.event_id
WHERE e.is_active = TRUE
  AND e.status IN ('ONGOING', 'ON_SALE', 'PUBLISHED')
ORDER BY
    CASE WHEN e.is_vip THEN 0 ELSE 1 END ASC,  -- VIP first
    v.priority_order                    ASC NULLS LAST,
    e.start_at                          ASC;


-- All Active Events view (used on /events listing page)
-- Ordering: status priority → start_at → vip
CREATE OR REPLACE VIEW view_all_active_events AS
SELECT
    e.*,
    v.priority_order AS vip_priority_order
FROM events e
LEFT JOIN vip_events v ON e.event_id = v.event_id
WHERE e.is_active = TRUE
  AND e.status IN ('ONGOING', 'ON_SALE', 'PUBLISHED', 'SOLD_OUT', 'COMPLETED', 'CANCELLED')
ORDER BY
    CASE e.status
        WHEN 'ONGOING'   THEN 1
        WHEN 'ON_SALE'   THEN 2
        WHEN 'PUBLISHED' THEN 3
        WHEN 'SOLD_OUT'  THEN 4
        WHEN 'COMPLETED' THEN 5
        WHEN 'CANCELLED' THEN 6
        ELSE                  7
    END ASC,
    CASE WHEN e.is_vip THEN 0 ELSE 1 END ASC,
    v.priority_order ASC NULLS LAST,
    e.start_at       ASC;


-- ─────────────────────────────────────────────────────────────
-- SECTION 5 · VERIFY SCHEDULED JOBS
-- ─────────────────────────────────────────────────────────────
SELECT jobid, jobname, schedule, command, active
FROM   cron.job
ORDER  BY jobname;