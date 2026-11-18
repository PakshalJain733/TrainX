-- ============================================================================
-- Migration: Career Gateway Compatibility & Data Bridge
-- Database: training_portal_db (TrainX)
-- Date: 2026-11-02
-- Description:
--   Idempotent MySQL 8.0+ migration that extends TrainX schema with placement
--   readiness fields, profile assets, batch associations, and sync audit logging.
-- ============================================================================

-- 1. Extend `users` table
ALTER TABLE `users` ADD COLUMN `profile_pic` VARCHAR(255) NULL;
ALTER TABLE `users` ADD COLUMN `cg_synced_at` TIMESTAMP NULL DEFAULT NULL;

-- 2. Extend `students` table with Academic & Placement attributes from Career Gateway
ALTER TABLE `students` ADD COLUMN `cgpa` DECIMAL(4, 2) DEFAULT 8.50;
ALTER TABLE `students` ADD COLUMN `live_kt` INT DEFAULT 0;
ALTER TABLE `students` ADD COLUMN `dead_kt` INT DEFAULT 0;
ALTER TABLE `students` ADD COLUMN `placement_status` VARCHAR(50) DEFAULT 'Unplaced';
ALTER TABLE `students` ADD COLUMN `placed_company` VARCHAR(255) NULL;
ALTER TABLE `students` ADD COLUMN `placement_opt_in` BOOLEAN DEFAULT TRUE;
ALTER TABLE `students` ADD COLUMN `linkedin_url` VARCHAR(255) NULL;
ALTER TABLE `students` ADD COLUMN `portfolio_link` VARCHAR(255) NULL;
ALTER TABLE `students` ADD COLUMN `resume_url` VARCHAR(255) NULL;
ALTER TABLE `students` ADD COLUMN `cg_synced_at` TIMESTAMP NULL DEFAULT NULL;

-- 3. Extend `batches` table with mentor and trainer associations
ALTER TABLE `batches` ADD COLUMN `mentor` VARCHAR(255) NULL;
ALTER TABLE `batches` ADD COLUMN `mentor_id` INT NULL;
ALTER TABLE `batches` ADD COLUMN `trainer_id` INT NULL;

-- 4. Ensure `batch_trainers` join table exists
CREATE TABLE IF NOT EXISTS `batch_trainers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `batch_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_trainer_batch` (`user_id`, `batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Ensure `mentor_assignments` table exists with mentor_id & batch_id linkage
CREATE TABLE IF NOT EXISTS `mentor_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `mentor_id` INT NOT NULL,
  `batch_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_mentor_batch` (`mentor_id`, `batch_id`),
  INDEX `idx_mentor_assignments_mentor` (`mentor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create `career_gateway_sync_log` audit table
CREATE TABLE IF NOT EXISTS `career_gateway_sync_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sync_direction` ENUM('inbound_from_cg', 'outbound_to_cg') NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL DEFAULT 'students',
  `total_records` INT NOT NULL DEFAULT 0,
  `success_count` INT NOT NULL DEFAULT 0,
  `failure_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('success', 'partial', 'failed') NOT NULL DEFAULT 'success',
  `details` JSON NULL,
  `triggered_by` VARCHAR(100) DEFAULT 'scheduled_job',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cg_sync_direction` (`sync_direction`),
  INDEX `idx_cg_sync_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
