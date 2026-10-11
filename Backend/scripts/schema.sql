-- ====================================================================
-- TrainX Complete Production Database Schema & Initial Seeds
-- Self-Hosted VPS Deployment Ready (MySQL 8.0+ / MariaDB 10.5+)
--
-- Quick Import on Ubuntu VPS:
--   mysql -u root -p < schema.sql
-- ====================================================================

-- 1. Colleges Table
CREATE TABLE IF NOT EXISTS `colleges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `location` VARCHAR(255) DEFAULT 'Main Campus',
  `city` VARCHAR(100) DEFAULT 'Metropolis',
  `type` VARCHAR(100) DEFAULT 'Autonomous',
  `status` VARCHAR(50) DEFAULT 'Active',
  `contact_email` VARCHAR(255) NULL,
  `contact_phone` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `college_id` INT NOT NULL DEFAULT 1,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `hod_name` VARCHAR(100) NULL,
  `hod_email` VARCHAR(255) NULL,
  `status` VARCHAR(50) DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`college_id`) REFERENCES `colleges`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Batches Table
CREATE TABLE IF NOT EXISTS `batches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `college_id` INT NOT NULL DEFAULT 1,
  `department_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `mentor` VARCHAR(255) NULL,
  `schedule` VARCHAR(255) NULL,
  `join_code` VARCHAR(50) NULL,
  `code_expires_at` BIGINT NULL,
  `students` INT DEFAULT 0,
  `year` VARCHAR(20) DEFAULT 'TE',
  `division` VARCHAR(20) DEFAULT 'A',
  `academic_year` VARCHAR(20) DEFAULT '2025-2026',
  `start_year` INT NULL,
  `end_year` INT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`college_id`) REFERENCES `colleges`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `college_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `mobile_number` VARCHAR(50) NULL,
  `role` ENUM('student', 'mentor', 'college_admin', 'super_admin') NOT NULL,
  `password` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_approved` TINYINT(1) DEFAULT 0,
  `avatar` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_college` (`college_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. OTPs Table
CREATE TABLE IF NOT EXISTS `otps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `otp` VARCHAR(10) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otps_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Students Table
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNIQUE NOT NULL,
  `batch_id` INT NULL,
  `college_id` INT NULL,
  `enrollment_number` VARCHAR(100) NULL,
  `phone` VARCHAR(50) NULL,
  `attendance_percentage` DECIMAL(5,2) DEFAULT 0.00,
  `performance_score` DECIMAL(5,2) DEFAULT 0.00,
  `status` VARCHAR(50) DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Training Programs Table (Multi-Training System)
CREATE TABLE IF NOT EXISTS `training_programs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `college_id` INT NULL DEFAULT 1,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `short_name` VARCHAR(100) NULL,
  `placement_season_year` INT NULL,
  `graduation_year` INT NULL,
  `description` TEXT NULL,
  `fee_amount` INT DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'Open',
  `upi_id` VARCHAR(128) NULL,
  `upi_payee_name` VARCHAR(128) NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `registration_open_date` DATE NULL,
  `registration_close_date` DATE NULL,
  `payment_instructions` TEXT NULL,
  `payment_qr_url` TEXT NULL,
  `eligibility_criteria` TEXT NULL,
  `restrictions` JSON NULL,
  `google_form_url` VARCHAR(500) NULL,
  `google_sheet_url` VARCHAR(500) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Trainings Table (Catalog / Grouping)
CREATE TABLE IF NOT EXISTS `trainings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Technical',
  `status` VARCHAR(50) DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. C2C / Training Enrollments Table
CREATE TABLE IF NOT EXISTS `c2c_enrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `training_id` INT NULL,
  `training_code` VARCHAR(100) NULL,
  `student_id` INT NULL,
  `response_id` VARCHAR(150) NULL UNIQUE,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(50) NULL,
  `roll_number` VARCHAR(100) NULL,
  `college` VARCHAR(255) NULL,
  `branch` VARCHAR(100) NULL,
  `year` VARCHAR(50) NULL,
  `division` VARCHAR(50) NULL,
  `batch` VARCHAR(100) NULL,
  `total_fee` DECIMAL(10,2) NOT NULL DEFAULT 3500.00,
  `amount_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `balance` DECIMAL(10,2) NOT NULL DEFAULT 3500.00,
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `approval_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `approved_at` DATETIME NULL,
  `approved_by` INT NULL,
  `rejection_reason` TEXT NULL,
  `utr_number` VARCHAR(100) NULL,
  `payment_date` VARCHAR(100) NULL,
  `payment_proof_url` TEXT NULL,
  `source` VARCHAR(50) DEFAULT 'google_form',
  `raw_payload` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_c2c_training` (`training_id`),
  INDEX `idx_c2c_email` (`email`),
  INDEX `idx_c2c_status` (`payment_status`),
  INDEX `idx_c2c_approval` (`approval_status`),
  INDEX `idx_c2c_utr` (`utr_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. AI Interview Sessions Table
CREATE TABLE IF NOT EXISTS `interview_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `student_id` INT NULL,
  `interview_type` VARCHAR(100) DEFAULT 'Technical Mock',
  `overall_score` DECIMAL(5,2) DEFAULT 0.00,
  `grade` VARCHAR(50) DEFAULT 'Average',
  `feedback` TEXT NULL,
  `conducted_date` DATE NULL,
  `status` VARCHAR(50) DEFAULT 'Completed',
  `details` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_interview_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Practice Problems Table
CREATE TABLE IF NOT EXISTS `practice_problems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `topic` VARCHAR(100) DEFAULT 'General',
  `difficulty` ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
  `description` TEXT NOT NULL,
  `starter_code` JSON NULL,
  `test_cases` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Practice Problem Submissions Table
CREATE TABLE IF NOT EXISTS `practice_problem_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `problem_id` INT NOT NULL,
  `language` VARCHAR(50) NOT NULL,
  `code` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `passed_count` INT DEFAULT 0,
  `total_count` INT DEFAULT 0,
  `error_output` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Attendance Sessions & Records
CREATE TABLE IF NOT EXISTS `attendance_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `batch_id` INT NOT NULL,
  `college_id` INT NULL,
  `created_by` INT NOT NULL,
  `session_name` VARCHAR(255) NOT NULL,
  `token` VARCHAR(100) UNIQUE NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `status` ENUM('present', 'absent', 'late') DEFAULT 'present',
  `ip_address` VARCHAR(100) NULL,
  `marked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_attendance` (`session_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Roadmaps & Items
CREATE TABLE IF NOT EXISTS `roadmaps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `career_path` VARCHAR(255) NOT NULL,
  `target_companies` VARCHAR(255) NULL,
  `target_timeline` VARCHAR(100) NULL,
  `current_skill_level` VARCHAR(100) NULL,
  `skills_gap` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `roadmap_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `roadmap_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `phase` INT DEFAULT 1,
  `order_index` INT DEFAULT 1,
  `is_completed` TINYINT(1) DEFAULT 0,
  `resources` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`roadmap_id`) REFERENCES `roadmaps`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Support Tickets
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'General',
  `priority` ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  `status` ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
  `message` TEXT NOT NULL,
  `admin_reply` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Secure Access Codes
CREATE TABLE IF NOT EXISTS `secure_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `college_id` INT NULL,
  `max_uses` INT DEFAULT 1,
  `times_used` INT DEFAULT 0,
  `expires_at` DATETIME NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- ESSENTIAL SEED DATA
-- ====================================================================

-- Default College
INSERT INTO `colleges` (`id`, `name`, `code`, `location`, `city`, `type`, `status`)
VALUES (1, 'Vasantdada Patil Pratishthan College of Engineering', 'VPPCOE', 'Main Campus', 'Mumbai', 'Autonomous', 'Active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Default Department
INSERT INTO `departments` (`id`, `college_id`, `name`, `code`, `status`)
VALUES (1, 1, 'Computer Engineering', 'CE', 'Active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Default Batch
INSERT INTO `batches` (`id`, `college_id`, `department_id`, `name`, `status`, `year`, `division`)
VALUES (1, 1, 1, 'Batch A', 'active', 'TE', 'A')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Default C2C Training Program
INSERT INTO `training_programs` (`id`, `college_id`, `name`, `code`, `short_name`, `fee_amount`, `status`, `start_date`, `end_date`, `registration_open_date`, `registration_close_date`, `description`)
VALUES (4, 1, 'Campus to Corporate Training 2026', 'C2C 2026', 'C2C', 3500, 'Open', '2026-07-01', '2026-12-31', '2026-06-01', '2026-07-15', 'Flagship placement preparation program covering Full Stack, Aptitude, System Design, and Mock Drives.')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Default Super Admin User (password: TrainX@2026)
INSERT INTO `users` (`name`, `email`, `mobile_number`, `password`, `password_hash`, `role`, `college_id`, `is_active`, `is_approved`)
VALUES ('Super Admin', 'super.admin0987@gmail.com', '9876543210', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'super_admin', 1, 1, 1)
ON DUPLICATE KEY UPDATE `role`='super_admin';
