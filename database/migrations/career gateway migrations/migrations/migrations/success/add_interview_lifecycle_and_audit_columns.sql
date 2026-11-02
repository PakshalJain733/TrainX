-- ---------------------------------------------------------------------------
-- Migration: server-authoritative interview lifecycle + hardened audit log
-- ---------------------------------------------------------------------------
-- Why this exists
--
-- The controllers now write lifecycle columns that no migration creates:
--
--   startLiveInterview  -> started_at, status, version
--   heartbeat/resume    -> status, started_at
--   storeTalentScoutResult -> status='STORED', stored_at, ended_at,
--                             ended_naturally, terminated_at/by/reason,
--                             violation_count, strike_1_at, strike_2_at
--   logInterviewActivity -> event_id, client_ts, server_ts, source, version
--
-- models/interviews/interview.js declares them, but the model definition does
-- not create DDL on its own — an environment provisioned from tpoStructure.sql
-- plus migrations/ is missing all of them, so every one of those queries fails
-- with ER_BAD_FIELD_ERROR and the server-authoritative store can never run.
--
-- The audit log is hardened in the same file because the store's verdict is
-- replayed from it: event_detail becomes JSON so structured proctoring detail
-- stops being truncated to 500 characters, and event_id/client_ts/server_ts/
-- source are what make the replay ordered, dedupable and clock-skew visible.
--
-- Applied automatically on boot by scripts/migrator.js, which records each file
-- in schema_migrations with a checksum. The statements are plain on purpose: the
-- migrator does not support DELIMITER, and it treats ER_DUP_FIELDNAME /
-- ER_DUP_KEYNAME / ER_TABLE_EXISTS_ERROR as "already applied", so this file is
-- safe on a hand-built schema too.
-- ---------------------------------------------------------------------------

-- ── Lifecycle / enforcement columns on `interviews` ──────────────────────────

-- `status` IS NOT a new column on every database. tpoStructure.sql already
-- creates `interviews.status` as VARCHAR(255) NULL, and it is dead: no model
-- declared it and nothing wrote it, so every existing row holds NULL. A plain
-- ADD COLUMN here would fail with ER_DUP_FIELDNAME, which the migrator treats as
-- "already applied", silently leaving the lifecycle state machine reading a
-- nullable column with no default — exactly the gap this migration closes.
--
-- So the pre-existing column is claimed deliberately: backfill NULL to CREATED,
-- then tighten it. Order matters — MODIFY to NOT NULL with NULLs present fails
-- in strict mode, which is the default.
--
-- Verified before writing: 83/83 rows had status NULL, and no code outside this
-- feature reads or writes the column.
UPDATE `interviews` SET `status` = 'CREATED' WHERE `status` IS NULL OR `status` = '';
ALTER TABLE `interviews` MODIFY COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'CREATED';

ALTER TABLE `interviews` ADD COLUMN `started_at` TIMESTAMP NULL;
ALTER TABLE `interviews` ADD COLUMN `ended_at` TIMESTAMP NULL;
ALTER TABLE `interviews` ADD COLUMN `ended_naturally` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `interviews` ADD COLUMN `terminated_at` TIMESTAMP NULL;
ALTER TABLE `interviews` ADD COLUMN `terminated_by` VARCHAR(40) NULL;
ALTER TABLE `interviews` ADD COLUMN `termination_reason` VARCHAR(120) NULL;
ALTER TABLE `interviews` ADD COLUMN `violation_count` INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `interviews` ADD COLUMN `strike_1_at` TIMESTAMP NULL;
ALTER TABLE `interviews` ADD COLUMN `strike_2_at` TIMESTAMP NULL;
ALTER TABLE `interviews` ADD COLUMN `max_duration_minutes` INT UNSIGNED NULL;
ALTER TABLE `interviews` ADD COLUMN `version` INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE `interviews` ADD COLUMN `stored_at` TIMESTAMP NULL;

-- Optimistic locking and the lookups the controller actually issues.
ALTER TABLE `interviews` ADD INDEX `idx_interviews_version` (`id`, `version`);
ALTER TABLE `interviews` ADD INDEX `idx_interviews_user_status` (`userId`, `status`);
ALTER TABLE `interviews` ADD INDEX `idx_interviews_status_ended` (`status`, `ended_at`);
ALTER TABLE `interviews` ADD INDEX `idx_interviews_detail_user` (`interviewDetailId`, `userId`);

-- ── Audit log hardening ─────────────────────────────────────────────────────

-- Rows written before this migration may hold TRUNCATED JSON: the old
-- logInterviewActivity() did `String(eventDetail).substring(0, 500)`, which
-- happily cut a detail object in half mid-key. MODIFY ... JSON validates every
-- existing row and fails the whole statement on the first invalid one, so those
-- rows are blanked first.
--
-- This loses only the tail of a proctoring detail blob on historical rows. The
-- event_type and created_at of those rows are untouched, and the row itself is
-- kept, so the strike replay (which counts event_type, not detail) still works.
UPDATE `interview_activity_log`
SET `event_detail` = NULL
WHERE `event_detail` IS NOT NULL AND `event_detail` <> '' AND JSON_VALID(`event_detail`) = 0;

ALTER TABLE `interview_activity_log` MODIFY COLUMN `event_detail` JSON NULL;
ALTER TABLE `interview_activity_log` ADD COLUMN `event_id` CHAR(36) NULL;
ALTER TABLE `interview_activity_log` ADD COLUMN `client_ts` BIGINT UNSIGNED NULL;
ALTER TABLE `interview_activity_log` ADD COLUMN `server_ts` BIGINT UNSIGNED NULL;
ALTER TABLE `interview_activity_log` ADD COLUMN `source` VARCHAR(20) NULL;
ALTER TABLE `interview_activity_log` ADD COLUMN `version` SMALLINT UNSIGNED NULL;

-- The store replays this table ordered by time, scoped to one interview or one
-- session. The pre-existing indexes lead with interview_id/student_id alone, so
-- every replay was a filesort over the whole table.
ALTER TABLE `interview_activity_log` ADD INDEX `idx_ial_interview_created` (`interview_id`, `created_at`);
ALTER TABLE `interview_activity_log` ADD INDEX `idx_ial_session_created` (`session_id`, `created_at`);
ALTER TABLE `interview_activity_log` ADD INDEX `idx_ial_student_created` (`student_id`, `created_at`);
ALTER TABLE `interview_activity_log` ADD INDEX `idx_ial_event_created` (`event_type`, `created_at`);