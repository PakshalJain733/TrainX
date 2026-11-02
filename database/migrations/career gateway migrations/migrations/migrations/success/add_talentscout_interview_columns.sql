-- ---------------------------------------------------------------------------
-- Migration: TalentScout / proctoring columns on `interviews`
-- ---------------------------------------------------------------------------
-- Why this exists
--
-- The AI-interview TalentScout flow (start-live -> text/next ->
-- store-talentscout-result -> generate-report) and the proctoring verdict
-- policy read and write columns on `interviews` that no migration created:
--
--   startLiveInterview -> checkInterviewAttemptAllowed()
--       SELECT id FROM interviews
--        WHERE userId = ? AND interviewDetailId = ? AND score IS NOT NULL
--       and ensureInterviewRetakeTable() -> interview_retake_allowed
--
--   my-history, my-details/:id
--       SELECT i.performance, i.confidence, i.verdict, i.flagged,
--              i.violation_summary, i.session_id
--
-- tpoStructure.sql still describes the pre-TalentScout table (id, title,
-- status, createdAt, updatedAt, userId, role, complexity, language,
-- performance, score) and migrations/ has no CREATE TABLE for `interviews`
-- and no ADD COLUMN for any of the TalentScout columns. An environment
-- provisioned from that dump plus migrations/ is therefore missing them and
-- every one of those queries fails with ER_BAD_FIELD_ERROR.
--
-- Symptom: works on a developer machine whose database was hand-patched, but
--   POST /students/ai-interview/start-live  -> 500 {"error":"Failed to start live interview."}
--   GET  /students/ai-interview/my-history  -> 500
--   GET  /students/ai-interview/my-details/:id -> 500
-- while /active-interviews, which reads interview_details, returns 200.
--
-- Only interviewDetailId was self-healing, via ensureInterviewDetailIdColumn()
-- in aiInterviewController.js, which runs at request time. That helper wraps
-- its ALTER in a try/catch that only logs, so a DB user without ALTER
-- privilege fails silently and the next query throws instead.
--
-- Applied automatically on boot by scripts/migrator.js, which runs every file
-- in migrations/ in order and records it in schema_migrations with a checksum.
-- The statements below are plain on purpose: the migrator does not support
-- DELIMITER, and it treats ER_DUP_FIELDNAME / ER_TABLE_EXISTS_ERROR as
-- "already applied", so this file is safe on a hand-built schema too.
--
-- Can also be applied by hand when provisioning a database that has not booted:
--   mysql -u <user> -p tpo_test < backend/migrations/add_talentscout_interview_columns.sql
-- ---------------------------------------------------------------------------

ALTER TABLE `interviews` ADD COLUMN `interviewDetailId` INT NULL;
ALTER TABLE `interviews` ADD COLUMN `performance` VARCHAR(255) NULL;
ALTER TABLE `interviews` ADD COLUMN `score` INT NULL;
ALTER TABLE `interviews` ADD COLUMN `confidence` DOUBLE NULL;
ALTER TABLE `interviews` ADD COLUMN `verdict` VARCHAR(255) NULL;
ALTER TABLE `interviews` ADD COLUMN `flagged` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `interviews` ADD COLUMN `violation_summary` TEXT NULL;
ALTER TABLE `interviews` ADD COLUMN `session_id` VARCHAR(255) NULL;

-- Attempt guard: one attempt per student per interview detail unless an admin
-- granted a retake. Matches INTERVIEW_RETAKE_ALLOWED_TABLE in
-- controllers/aiInterviewController.js, which creates this with a bare
-- CREATE TABLE IF NOT EXISTS and no error handling at all.
CREATE TABLE IF NOT EXISTS `interview_retake_allowed` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `interview_detail_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `allowed_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_retake` (`interview_detail_id`, `student_id`),
  INDEX `idx_interview_detail` (`interview_detail_id`),
  INDEX `idx_student` (`student_id`)
);
