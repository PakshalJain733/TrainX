-- ============================================================================
-- Migration: Career Gateway Contract Alignment (clg_id, batch, tenant mapping)
-- Database: training_portal_db (TrainX)
-- Date: 2026-11-06
-- Description:
--   Non-destructive idempotent migration adding `clg_id` to students and mappings,
--   `assigned_batch` to mappings, and college tenant mapping attributes.
-- ============================================================================

-- 1. Extend `students` table with `clg_id`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'clg_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN clg_id VARCHAR(100) NULL AFTER roll_number', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Extend `career_gateway_student_mappings` table with `clg_id` and `assigned_batch`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'career_gateway_student_mappings' AND column_name = 'clg_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE career_gateway_student_mappings ADD COLUMN clg_id VARCHAR(100) NULL AFTER career_gateway_student_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'career_gateway_student_mappings' AND column_name = 'assigned_batch');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE career_gateway_student_mappings ADD COLUMN assigned_batch VARCHAR(100) NULL AFTER eligibility_status', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add index on `clg_id` in mappings
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'career_gateway_student_mappings' AND index_name = 'idx_mapping_clg_id');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE career_gateway_student_mappings ADD INDEX idx_mapping_clg_id (clg_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Extend `colleges` table with optional `career_gateway_college_id` for multi-tenant isolation
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'colleges' AND column_name = 'career_gateway_college_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE colleges ADD COLUMN career_gateway_college_id VARCHAR(100) NULL AFTER code', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

