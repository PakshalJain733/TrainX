-- ---------------------------------------------------------------------------
-- Migration: create the AI-interview tables
-- ---------------------------------------------------------------------------
-- Why this exists
--
-- No migration has ever created the AI-interview tables. `interviews`,
-- `interview_details` and `interview_contents` are defined only in
-- tpoStructure.sql, which is gitignored and untracked, so a database
-- provisioned from the repo alone never gets them. The app then fails with
-- ER_NO_SUCH_TABLE / ER_BAD_FIELD_ERROR, and because docker-entrypoint.sh runs
-- migrations under `set -e`, the blocked trigger files in failure/ never get
-- their turn either.
--
-- Symptom: 500 from POST /students/ai-interview/start-live,
--           /my-history, /my-details/:id.
--
-- Columns are the union of tpoStructure.sql and what models/interviews/*.js
-- declares, so the tables work standalone:
--   - interview_details gets `roles` (JSON, add_roles_to_interview_details.sql),
--     `max_duration_minutes` and `num_questions` (collective migration), and
--     deliberately NOT `is_active`, which drop_is_active_from_interview_details.sql
--     removes and no code reads. The model uses camelCase `isActive`.
--   - interviews already carries the TalentScout columns
--     (interviewDetailId, confidence, verdict, flagged, violation_summary,
--     session_id) from add_talentscout_interview_columns.sql. They are repeated
--     here on purpose: that migration is already recorded as applied on servers
--     that ran it, so it will never run again, and creating the table without
--     these columns would leave the app permanently broken with no way for the
--     migrator to notice.
--
-- No FOREIGN KEY constraints. models/interviews declares references, but
-- enforcing them needs student_details to exist first, and sync() already fails
-- on interviews for exactly that reason
-- ("Column 'userId' cannot be NOT NULL: needed in a foreign key constraint").
-- Plain indexes are enough for the lookups the app does.
--
-- CREATE TABLE IF NOT EXISTS throughout, so this is safe to run against a
-- database where the tables already exist, and safe to re-run.
--
-- interview_questions is intentionally not created: no model and no code
-- reference it. interview_retake_allowed is created by
-- add_talentscout_interview_columns.sql.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `interviewDetailId` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `role` varchar(255) NOT NULL,
  `complexity` varchar(255) NOT NULL,
  `language` varchar(255) NOT NULL,
  `performance` varchar(255) DEFAULT NULL,
  `score` int DEFAULT NULL,
  `confidence` double DEFAULT NULL,
  `verdict` varchar(255) DEFAULT NULL,
  `flagged` tinyint(1) NOT NULL DEFAULT 0,
  `violation_summary` text,
  `session_id` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_interviews_user` (`userId`),
  KEY `idx_interviews_detail` (`interviewDetailId`),
  KEY `idx_interviews_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `interview_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` varchar(255) NOT NULL,
  `roles` json DEFAULT NULL,
  `difficulty` varchar(50) NOT NULL,
  `language` varchar(50) NOT NULL,
  `deadline` datetime NOT NULL,
  `title` varchar(500) DEFAULT NULL,
  `batch` varchar(255) DEFAULT NULL,
  `event_id` int DEFAULT NULL,
  `max_duration_minutes` int DEFAULT NULL,
  `num_questions` int DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_interview_details_batch` (`batch`),
  KEY `idx_interview_details_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `interview_contents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `interviewId` int DEFAULT NULL,
  `content` text NOT NULL,
  `answer` text,
  `ideal_answer` text,
  `score` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_interview_contents_interview` (`interviewId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Attempt guard for the one-attempt-per-interview rule enforced by
-- checkInterviewAttemptAllowed() in controllers/aiInterviewController.js.
-- Normally created by add_talentscout_interview_columns.sql; repeated here so
-- this file alone is enough to make the AI-interview endpoints work.
CREATE TABLE IF NOT EXISTS `interview_retake_allowed` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `interview_detail_id` int NOT NULL,
  `student_id` int NOT NULL,
  `allowed_by` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_retake` (`interview_detail_id`, `student_id`),
  KEY `idx_interview_detail` (`interview_detail_id`),
  KEY `idx_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
