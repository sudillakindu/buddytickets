ALTER DATABASE postgres SET timezone TO 'Asia/Colombo';

ALTER TABLE organizer_details
ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN NOT NULL DEFAULT FALSE;