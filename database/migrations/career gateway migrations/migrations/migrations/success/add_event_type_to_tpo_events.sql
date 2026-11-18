-- Event format type (Mock Drive, Seminar, Alumni Talk, Other). Run once against your DB.
ALTER TABLE tpo_events
  ADD COLUMN eventType VARCHAR(64) NOT NULL DEFAULT 'Other'
  AFTER category;
