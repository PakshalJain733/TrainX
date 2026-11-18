-- Migration: 20261109_notifications_persistence.sql
-- Description: Unified database tables for notifications and per-user read/delete status tracking

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  college_id INT DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'alert',
  category VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(50) DEFAULT 'General Announcement',
  target VARCHAR(100) DEFAULT 'All Batches',
  created_by INT DEFAULT NULL,
  created_by_name VARCHAR(100) DEFAULT NULL,
  sender_role VARCHAR(50) DEFAULT NULL,
  action_url VARCHAR(255) DEFAULT NULL,
  action_label VARCHAR(100) DEFAULT NULL,
  action_color VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_college (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_user_states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  notification_id VARCHAR(100) NOT NULL,
  is_read TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_notif (user_id, notification_id),
  INDEX idx_user_notif_state (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'notif_milestones');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN notif_milestones TINYINT(1) DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'notif_weekly_report');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN notif_weekly_report TINYINT(1) DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'notif_interview');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN notif_interview TINYINT(1) DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
