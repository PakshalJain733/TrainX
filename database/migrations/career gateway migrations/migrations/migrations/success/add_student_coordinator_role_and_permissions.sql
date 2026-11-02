-- Migration: Add Student Coordinator Role and Permissions to coordinator_details
-- MySQL 8.0.46 doesn't support multi-column ADD COLUMN IF NOT EXISTS,
-- so use separate ALTER statements (idempotent via ER_DUP_FIELDNAME tolerance).
ALTER TABLE coordinator_details
  ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'coordinator';

ALTER TABLE coordinator_details
  ADD COLUMN email VARCHAR(255) NULL;

ALTER TABLE coordinator_details
  ADD COLUMN permissions LONGTEXT NULL;

INSERT IGNORE INTO user_types (utid, base)
VALUES (4, 'student_coordinator');
