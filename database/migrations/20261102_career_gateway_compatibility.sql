-- ============================================================================
-- Migration: Career Gateway Compatibility & Data Bridge
-- Database: training_portal_db (TrainX)
-- Date: 2026-11-02
-- Description:
--   Idempotent MySQL 8.0+ migration that extends TrainX schema with placement
--   readiness fields, profile assets, batch associations, and sync audit logging.
-- ============================================================================

DROP PROCEDURE IF EXISTS _tx_add_column;
DELIMITER $$
CREATE PROCEDURE _tx_add_column(
  IN p_table VARCHAR(64),
  IN p_col   VARCHAR(64),
  IN p_def   TEXT,
  IN p_after VARCHAR(64)
)
BEGIN
  DECLARE v_tbl   INT DEFAULT 0;
  DECLARE v_col   INT DEFAULT 0;
  DECLARE v_after INT DEFAULT 0;

  SELECT COUNT(*) INTO v_tbl FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = p_table;

  SELECT COUNT(*) INTO v_col FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_col;

  IF v_tbl > 0 AND v_col = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_def);

    IF p_after IS NOT NULL AND p_after <> '' THEN
      SELECT COUNT(*) INTO v_after FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_after;
      IF v_after > 0 THEN
        SET @sql = CONCAT(@sql, ' AFTER `', p_after, '`');
      END IF;
    END IF;

    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- 1. Extend `users` table
CALL _tx_add_column('users', 'profile_pic', 'VARCHAR(255) NULL', 'emergency_contact');
CALL _tx_add_column('users', 'cg_synced_at', 'TIMESTAMP NULL DEFAULT NULL', 'updated_at');

-- 2. Extend `students` table with Academic & Placement attributes from Career Gateway
CALL _tx_add_column('students', 'cgpa', 'DECIMAL(4, 2) DEFAULT 8.50', 'semester');
CALL _tx_add_column('students', 'live_kt', 'INT DEFAULT 0', 'cgpa');
CALL _tx_add_column('students', 'dead_kt', 'INT DEFAULT 0', 'live_kt');
CALL _tx_add_column('students', 'placement_status', 'VARCHAR(50) DEFAULT \'Unplaced\'', 'dead_kt');
CALL _tx_add_column('students', 'placed_company', 'VARCHAR(255) NULL', 'placement_status');
CALL _tx_add_column('students', 'placement_opt_in', 'BOOLEAN DEFAULT TRUE', 'placed_company');
CALL _tx_add_column('students', 'linkedin_url', 'VARCHAR(255) NULL', 'placement_opt_in');
CALL _tx_add_column('students', 'portfolio_link', 'VARCHAR(255) NULL', 'linkedin_url');
CALL _tx_add_column('students', 'resume_url', 'VARCHAR(255) NULL', 'portfolio_link');
CALL _tx_add_column('students', 'cg_synced_at', 'TIMESTAMP NULL DEFAULT NULL', 'created_at');

-- 3. Extend `batches` table with mentor and trainer associations
CALL _tx_add_column('batches', 'mentor', 'VARCHAR(255) NULL', 'name');
CALL _tx_add_column('batches', 'mentor_id', 'INT NULL', 'mentor');
CALL _tx_add_column('batches', 'trainer_id', 'INT NULL', 'mentor_id');

-- Clean up helper procedure
DROP PROCEDURE IF EXISTS _tx_add_column;

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
