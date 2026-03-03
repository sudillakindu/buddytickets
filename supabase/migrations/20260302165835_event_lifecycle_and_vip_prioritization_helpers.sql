-- ටිකට් විකිණීමේදී Event එකේ Status එක Auto Sold Out කරන Function එක
CREATE OR REPLACE FUNCTION check_and_update_event_sold_out()
RETURNS TRIGGER AS $$
DECLARE
    total_capacity INT;
    total_sold INT;
BEGIN
    -- අදාල Event එකේ සියලුම Active Ticket types වල මුළු ධාරිතාව (capacity) සහ විකිණී ඇති ප්‍රමාණය (qty_sold) ගණනය කිරීම
    SELECT COALESCE(SUM(capacity), 0), COALESCE(SUM(qty_sold), 0)
    INTO total_capacity, total_sold
    FROM ticket_types
    WHERE event_id = NEW.event_id AND is_active = TRUE;

    -- මුළු ටිකට් ප්‍රමාණය විකිණී අවසන් නම් පමණක් Event Status එක 'SOLD_OUT' කිරීම
    IF total_sold > 0 AND total_sold >= total_capacity THEN
        UPDATE events 
        SET status = 'SOLD_OUT' 
        WHERE event_id = NEW.event_id 
          AND status IN ('PUBLISHED', 'ON_SALE', 'ONGOING'); -- Draft හෝ Cancelled ඒවා වෙනස් නොවන බව සහතික කිරීම
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ticket types table එකේ qty_sold update වන සෑම විටම ඉහත function එක run කරවීම
CREATE TRIGGER trigger_check_sold_out
AFTER UPDATE OF qty_sold ON ticket_types
FOR EACH ROW
EXECUTE FUNCTION check_and_update_event_sold_out();





-- VIP Status වෙනස් වන විට Priority Order එක Auto Update කරන Function එක
CREATE OR REPLACE FUNCTION handle_vip_status_change()
RETURNS TRIGGER AS $$
DECLARE
    current_priority INT;
    next_priority INT;
BEGIN
    -- 1. සාමාන්‍ය Event එකක් VIP බවට පත් කළ විට (is_vip=TRUE)
    IF NEW.is_vip = TRUE AND OLD.is_vip = FALSE THEN
        -- දැනට තියෙන උපරිම priority_order එක අරන් ඊළඟ අගය (MAX + 1) හදාගැනීම
        SELECT COALESCE(MAX(priority_order), 0) + 1 INTO next_priority FROM vip_events;
        
        -- අලුත් VIP event එක add කිරීම. (මෙහි assigned_by ලෙස දැනට event organizer ව යොදා ඇත)
        INSERT INTO vip_events (event_id, priority_order, assigned_by)
        VALUES (NEW.event_id, next_priority, NEW.organizer_id);

    -- 2. VIP Event එකක් සාමාන්‍ය Event එකක් බවට පත් කළ විට (is_vip=FALSE)
    ELSIF NEW.is_vip = FALSE AND OLD.is_vip = TRUE THEN
        -- අදාල Event එකේ දැනට තියෙන priority_order එක හොයාගැනීම
        SELECT priority_order INTO current_priority FROM vip_events WHERE event_id = NEW.event_id;

        IF current_priority IS NOT NULL THEN
            -- VIP ලැයිස්තුවෙන් එම Event එක ඉවත් කිරීම
            DELETE FROM vip_events WHERE event_id = NEW.event_id;
            
            -- ඉවත් කළ Event එකට වඩා පහලින් තිබුණු VIP events වල priority_order එක 1 කින් අඩු කිරීම (Auto Re-order)
            UPDATE vip_events
            SET priority_order = priority_order - 1
            WHERE priority_order > current_priority;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Events table එකේ is_vip අගය වෙනස් වන විට පමණක් මෙය ක්‍රියාත්මක වීම
CREATE TRIGGER trigger_vip_status_change
AFTER UPDATE OF is_vip ON events
FOR EACH ROW
WHEN (OLD.is_vip IS DISTINCT FROM NEW.is_vip)
EXECUTE FUNCTION handle_vip_status_change();





-- කාලය අනුව Event Status එක ඔටෝමැටික් ONGOING හෝ COMPLETED කරන Function එක
CREATE OR REPLACE FUNCTION auto_update_event_time_statuses()
RETURNS void AS $$
BEGIN
    -- 1. Start time එක පහු වෙලා, ඒත් තවමත් අවසන් වී නැති Events වල Status එක 'ONGOING' කිරීම
    UPDATE events
    SET status = 'ONGOING'
    WHERE status IN ('PUBLISHED', 'ON_SALE') 
      AND start_at <= NOW() 
      AND end_at > NOW();

    -- 2. End time එක පහු වෙච්ච Events වල Status එක 'COMPLETED' කිරීම
    UPDATE events
    SET status = 'COMPLETED'
    WHERE status IN ('PUBLISHED', 'ON_SALE', 'SOLD_OUT', 'ONGOING') 
      AND end_at <= NOW();
END;
$$ LANGUAGE plpgsql;





-- Featured Events සඳහා View එක (ඔබ ඉල්ලූ පිළිවෙලට සකසා ඇත)
CREATE OR REPLACE VIEW view_featured_events AS
SELECT 
    e.*, 
    v.priority_order
FROM events e
LEFT JOIN vip_events v ON e.event_id = v.event_id
WHERE e.is_active = TRUE 
  AND e.status IN ('ONGOING', 'ON_SALE', 'PUBLISHED')
ORDER BY 
    CASE WHEN e.is_vip THEN 0 ELSE 1 END, -- VIP ඒවා මුලින් එන්න
    v.priority_order ASC,                 -- ඊටපස්සෙ VIP priority එක අනුව
    e.start_at ASC;                       -- ඊටපස්සෙ ළඟම තියෙන Event දිනය අනුව

-- සාමාන්‍ය Events Page එක සඳහා View එක
CREATE OR REPLACE VIEW view_all_active_events AS
SELECT e.*
FROM events e
WHERE e.is_active = TRUE
  AND e.status IN ('ONGOING', 'ON_SALE', 'PUBLISHED', 'SOLD_OUT', 'COMPLETED', 'CANCELLED')
ORDER BY 
    -- Status එක අනුව පිළිවෙලකට ගැනීම (අවශ්‍ය නම් පමණක්)
    CASE e.status 
        WHEN 'ONGOING' THEN 1
        WHEN 'ON_SALE' THEN 2
        WHEN 'PUBLISHED' THEN 3
        WHEN 'SOLD_OUT' THEN 4
        WHEN 'COMPLETED' THEN 5
        WHEN 'CANCELLED' THEN 6
        ELSE 7
    END ASC,
    e.start_at ASC;




-- pg_cron extension එක database එක තුළ enable කිරීම
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 'update_event_status_job' කියන නමින් අලුත් job එකක් හැදීම
-- '* * * * *' කියන්නේ හැම විනාඩියකටම සැරයක් (Every minute) run වෙන්න කියන එකයි
SELECT cron.schedule(
    'update_event_status_job', 
    '* * * * *', 
    $$SELECT auto_update_event_time_statuses();$$
);




-- දැනට database එකේ schedule වී ඇති සියලුම cron jobs බලාගැනීම
SELECT * FROM cron.job;