-- Add reminder_email_sent_at to remarks and intership_remarks tables.
-- MySQL 8 does not support `ADD COLUMN IF NOT EXISTS` / `CREATE INDEX IF NOT
-- EXISTS`, so these are plain statements. The migrator treats ER_DUP_FIELDNAME
-- (1060) and ER_DUP_KEYNAME (1061) as "already applied", which makes a re-run
-- safe. It also fires `ensureReminderTrackingColumns()` before this file so an
-- existing database gets the column even if this file was previously skipped.
ALTER TABLE remarks ADD COLUMN reminder_email_sent_at DATETIME NULL;
ALTER TABLE intership_remarks ADD COLUMN reminder_email_sent_at DATETIME NULL;

-- Indexes on reminder_date for high performance sweep queries
CREATE INDEX idx_remarks_reminder_date ON remarks(reminder_date);
CREATE INDEX idx_intership_remarks_reminder_date ON intership_remarks(reminder_date);

