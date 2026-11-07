-- ============================================================================
-- Migration: Career Gateway Integration Architecture Schema
-- Database: training_portal_db (TrainX)
-- Date: 2026-11-06
-- Description:
--   Extends TrainX schema for secure student provisioning from Career Gateway
--   and daily training data synchronization.
-- ============================================================================

-- 1. Extend `users` table with external identity mapping
-- Tolerates idempotent execution via ALTER IGNORE / procedural safety
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'career_gateway_student_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN career_gateway_student_id INT NULL UNIQUE AFTER college_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'source_system');
SET @sql = IF(@col_exists = 0, "ALTER TABLE users ADD COLUMN source_system VARCHAR(50) DEFAULT 'trainx' AFTER career_gateway_student_id", 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'provisioned_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN provisioned_at TIMESTAMP NULL DEFAULT NULL AFTER source_system', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Extend `students` table with external identity mapping
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'career_gateway_student_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN career_gateway_student_id INT NULL UNIQUE AFTER user_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'source_system');
SET @sql = IF(@col_exists = 0, "ALTER TABLE students ADD COLUMN source_system VARCHAR(50) DEFAULT 'trainx' AFTER career_gateway_student_id", 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'last_synced_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN last_synced_at TIMESTAMP NULL DEFAULT NULL AFTER source_system', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Dedicated `career_gateway_student_mappings` Table
CREATE TABLE IF NOT EXISTS career_gateway_student_mappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trainx_user_id INT NOT NULL,
  career_gateway_student_id INT NOT NULL,
  source_system VARCHAR(50) NOT NULL DEFAULT 'career_gateway',
  eligibility_status ENUM('eligible', 'revoked', 'pending') NOT NULL DEFAULT 'eligible',
  provisioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP NULL DEFAULT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  metadata JSON NULL,
  UNIQUE KEY unique_cg_student (career_gateway_student_id),
  UNIQUE KEY unique_tx_user (trainx_user_id),
  FOREIGN KEY (trainx_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_mapping_status (eligibility_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Account Activations Table for Provisioned Students
CREATE TABLE IF NOT EXISTS account_activations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_activation_user (user_id),
  INDEX idx_activation_token (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Training Export Batches Table
CREATE TABLE IF NOT EXISTS trainx_training_export_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  export_id VARCHAR(100) UNIQUE NOT NULL,
  sync_type VARCHAR(50) NOT NULL DEFAULT 'daily_training_sync',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  total_records INT NOT NULL DEFAULT 0,
  successful_records INT NOT NULL DEFAULT 0,
  failed_records INT NOT NULL DEFAULT 0,
  status ENUM('running', 'completed', 'partial', 'failed') NOT NULL DEFAULT 'running',
  error_summary TEXT NULL,
  INDEX idx_export_status (status),
  INDEX idx_export_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Training Export Items Table
CREATE TABLE IF NOT EXISTS trainx_training_export_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  export_batch_id INT NOT NULL,
  source_record_type ENUM('attendance', 'assessment', 'progress', 'batch') NOT NULL,
  source_record_id VARCHAR(100) NOT NULL,
  external_student_id INT NOT NULL,
  status ENUM('pending', 'sent', 'acknowledged', 'failed') NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  synced_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (export_batch_id) REFERENCES trainx_training_export_batches(id) ON DELETE CASCADE,
  INDEX idx_export_item_status (status),
  INDEX idx_export_item_student (external_student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Sync Checkpoints Table
CREATE TABLE IF NOT EXISTS career_gateway_sync_checkpoints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_type VARCHAR(50) UNIQUE NOT NULL,
  last_successful_cursor VARCHAR(255) NULL,
  last_successful_sync_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Integration Events Outbox & Audit Table
CREATE TABLE IF NOT EXISTS career_gateway_integration_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type ENUM('student_provisioned', 'student_updated', 'eligibility_revoked', 'training_exported') NOT NULL,
  external_student_id INT NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'processed',
  retry_count INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_event_type (event_type),
  INDEX idx_event_student (external_student_id),
  INDEX idx_event_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

