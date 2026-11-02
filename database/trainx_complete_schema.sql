-- ============================================================================
-- TrainX (Training Portal) - Complete Canonical Database Schema
-- Compatible with Career Gateway Database Integration
-- Generated Date: 2026-11-02
-- Database: training_portal_db
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- Total Tables: 90
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `training_portal_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `training_portal_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Table structure for table `ai_milestone_practices`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_milestone_practices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `practice_key` varchar(255) NOT NULL,
  `practice_json` json NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `practice_key` (`practice_key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `ai_milestone_theories`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_milestone_theories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `theory_key` varchar(255) NOT NULL,
  `theory_json` json NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `theory_key` (`theory_key`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `ai_topic_quizzes`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_topic_quizzes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic_title` varchar(255) NOT NULL,
  `questions` json NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `topic_title` (`topic_title`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `alumni_data`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alumni_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `contact` varchar(11) DEFAULT NULL,
  `branch` int DEFAULT NULL,
  `batch` varchar(5) DEFAULT NULL,
  `collegeId` varchar(30) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `category` varchar(20) DEFAULT NULL,
  `grno` varchar(20) DEFAULT NULL,
  `fee_receipt` varchar(255) DEFAULT NULL,
  `offer_admit` varchar(255) DEFAULT NULL,
  `id_photo` varchar(255) DEFAULT NULL,
  `proof_id` varchar(255) DEFAULT NULL,
  `previous_lc` varchar(255) DEFAULT NULL,
  `sem8_marks` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=735 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `assessment_answers`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessment_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attempt_id` int NOT NULL,
  `question_id` int NOT NULL,
  `selected_option` enum('a','b','c','d') DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  `marks_awarded` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `attempt_id` (`attempt_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `assessment_answers_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assessment_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `assessment_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `assessment_attempts`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessment_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `assessment_id` int NOT NULL,
  `score` int DEFAULT '0',
  `percentage` decimal(5,2) DEFAULT '0.00',
  `total_questions` int DEFAULT '0',
  `correct_answers` int DEFAULT '0',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `status` enum('in_progress','completed') DEFAULT 'in_progress',
  `marks_obtained` int DEFAULT '0',
  `total_marks` int DEFAULT '100',
  `correct_count` int DEFAULT '0',
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `assessment_id` (`assessment_id`),
  CONSTRAINT `assessment_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assessment_attempts_ibfk_2` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `assessment_questions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessment_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `question_text` text NOT NULL,
  `option_a` text NOT NULL,
  `option_b` text NOT NULL,
  `option_c` text,
  `option_d` text,
  `correct_option` enum('a','b','c','d') NOT NULL,
  `marks` int DEFAULT '1',
  `question_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `explanation` text,
  PRIMARY KEY (`id`),
  KEY `assessment_id` (`assessment_id`),
  CONSTRAINT `assessment_questions_ibfk_1` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `assessments`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `college_id` int DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `total_marks` int DEFAULT '0',
  `pass_marks` int DEFAULT '0',
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `college_id` (`college_id`),
  KEY `batch_id` (`batch_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `assessments_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assessments_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assessments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `attendance`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT '1',
  `batch_id` int NOT NULL,
  `user_id` int NOT NULL,
  `session_id` int DEFAULT NULL,
  `session_date` date NOT NULL,
  `status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
  `marked_by` int DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_batch_date` (`batch_id`,`user_id`,`session_date`),
  KEY `idx_attendance_user` (`user_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `attendance_scans`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_scans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `batch_id` int DEFAULT NULL,
  `session_id` int DEFAULT NULL,
  `scanned_code` varchar(255) NOT NULL,
  `session_date` date NOT NULL,
  `status` enum('present','late','absent','rejected') NOT NULL DEFAULT 'present',
  `ip_address` varchar(100) DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `scanned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attendance_scans_user` (`user_id`),
  KEY `idx_attendance_scans_date` (`session_date`),
  KEY `idx_attendance_scans_code` (`scanned_code`),
  CONSTRAINT `attendance_scans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `attendance_sessions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT '1',
  `batch_id` int NOT NULL,
  `session_code` varchar(100) DEFAULT NULL,
  `title` varchar(255) DEFAULT 'Training Lecture',
  `session_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `attendance_sessions_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `attendance_summary`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_summary` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `total_classes` int DEFAULT '0',
  `present_count` int DEFAULT '0',
  `absent_count` int DEFAULT '0',
  `late_count` int DEFAULT '0',
  `excused_count` int DEFAULT '0',
  `attendance_percentage` decimal(5,2) DEFAULT '0.00',
  `attendance_status` varchar(50) DEFAULT 'No Records',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `attendance_summary_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `batch_daily_topics`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `batch_daily_topics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `batch_id` int NOT NULL,
  `topic_date` varchar(50) NOT NULL,
  `topic` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(50) DEFAULT 'Scheduled',
  `trainer` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_batch_date` (`batch_id`,`topic_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `batch_tasks`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `batch_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `batch_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `difficulty` enum('Easy','Medium','Hard') DEFAULT 'Medium',
  `points` int DEFAULT '100',
  `deadline` varchar(100) DEFAULT NULL,
  `description` text,
  `test_cases` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `language` varchar(50) DEFAULT 'Java',
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `batch_tasks_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `batch_trainers`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `batch_trainers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_trainer_batch` (`user_id`,`batch_id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `batch_trainers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `batch_trainers_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `batches`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int NOT NULL,
  `department_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `start_year` int DEFAULT NULL,
  `end_year` int DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `mentor` varchar(255) DEFAULT NULL,
  `mentor_id` int DEFAULT NULL,
  `schedule` varchar(255) DEFAULT NULL,
  `join_code` varchar(50) DEFAULT NULL,
  `code_expires_at` bigint DEFAULT NULL,
  `students` int DEFAULT '0',
  `year` varchar(20) DEFAULT 'TE',
  `division` varchar(20) DEFAULT 'A',
  `code` varchar(50) DEFAULT NULL,
  `trainer` varchar(100) DEFAULT 'Faculty Instructor',
  `progress` int DEFAULT '0',
  `topic` varchar(255) DEFAULT NULL,
  `description` text,
  `date` varchar(100) DEFAULT NULL,
  `trainer_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `college_id` (`college_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `batches_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  CONSTRAINT `batches_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `branch`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `branch` (
  `branch_id` int NOT NULL AUTO_INCREMENT,
  `bname` varchar(500) DEFAULT NULL,
  `b_short_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `broadcast_notifications`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `broadcast_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `desc_text` text NOT NULL,
  `type` enum('calendar','alert','success','document') DEFAULT 'calendar',
  `unread` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `broadcasts`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `broadcasts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `desc_text` text,
  `target` varchar(100) DEFAULT 'All Batches',
  `priority` varchar(50) DEFAULT 'General Announcement',
  `type` enum('calendar','alert','success','document','general') DEFAULT 'general',
  `unread` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by_name` varchar(255) DEFAULT 'Admin',
  `sender_role` varchar(100) DEFAULT 'Admin',
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `broadcasts_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `c2c_enrollments`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `c2c_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `response_id` varchar(150) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `roll_number` varchar(100) DEFAULT NULL,
  `college` varchar(255) DEFAULT NULL,
  `branch` varchar(100) DEFAULT NULL,
  `year` varchar(50) DEFAULT NULL,
  `division` varchar(50) DEFAULT NULL,
  `batch` varchar(100) DEFAULT NULL,
  `total_fee` decimal(10,2) NOT NULL DEFAULT '3500.00',
  `amount_paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(10,2) NOT NULL DEFAULT '3500.00',
  `payment_status` varchar(50) NOT NULL DEFAULT 'Pending',
  `utr_number` varchar(100) DEFAULT NULL,
  `payment_date` varchar(100) DEFAULT NULL,
  `payment_proof_url` text,
  `source` varchar(50) DEFAULT 'google_form',
  `raw_payload` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `training_id` int DEFAULT NULL,
  `training_code` varchar(100) DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `approval_status` varchar(50) NOT NULL DEFAULT 'Pending',
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `rejection_reason` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `response_id` (`response_id`),
  KEY `idx_c2c_email` (`email`),
  KEY `idx_c2c_status` (`payment_status`),
  KEY `idx_c2c_utr` (`utr_number`),
  KEY `idx_c2c_training` (`training_id`),
  KEY `idx_c2c_approval` (`approval_status`),
  KEY `idx_c2c_training_email` (`training_id`,`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `c2c_registrations`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `c2c_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `college_id` int NOT NULL DEFAULT '1',
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `roll_number` varchar(100) DEFAULT NULL,
  `branch` varchar(150) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  `fee_amount` int DEFAULT '0',
  `amount_paid` int DEFAULT '0',
  `utr` varchar(128) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `payment_status` enum('pending','part_payment','completed','cancelled') DEFAULT 'pending',
  `payment_mode` varchar(64) DEFAULT NULL,
  `payment_note` varchar(500) DEFAULT NULL,
  `upi_id` varchar(128) DEFAULT NULL,
  `upi_payee_name` varchar(128) DEFAULT NULL,
  `qr_payload` varchar(1024) DEFAULT NULL,
  `qr_issued_at` datetime DEFAULT NULL,
  `registration_token` varchar(64) DEFAULT NULL,
  `registration_link_sent_at` datetime DEFAULT NULL,
  `registered_at` datetime DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `enrollment_id` int DEFAULT NULL,
  `status` enum('awaiting_payment','awaiting_registration','awaiting_approval','enrolled','cancelled') DEFAULT 'awaiting_payment',
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `c2c_registration_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_c2c_registration_token` (`registration_token`),
  UNIQUE KEY `uq_c2c_reg_user_program` (`user_id`,`program_id`),
  UNIQUE KEY `uq_c2c_reg_email_program` (`program_id`,`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `career_gateway_sync_log`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `career_gateway_sync_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sync_direction` enum('inbound_from_cg','outbound_to_cg') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'students',
  `total_records` int NOT NULL DEFAULT '0',
  `success_count` int NOT NULL DEFAULT '0',
  `failure_count` int NOT NULL DEFAULT '0',
  `status` enum('success','partial','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  `details` json DEFAULT NULL,
  `triggered_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled_job',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cg_sync_direction` (`sync_direction`),
  KEY `idx_cg_sync_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `category`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `category` (
  `cat_id` int NOT NULL AUTO_INCREMENT,
  `cat_name` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`cat_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `coding_problems`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coding_problems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` longtext,
  `difficulty` enum('Easy','Medium','Hard') DEFAULT 'Easy',
  `category` varchar(100) DEFAULT 'Algorithms',
  `total_marks` int DEFAULT '100',
  `time_limit_ms` int DEFAULT '2000',
  `memory_limit_mb` int DEFAULT '256',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `coding_submissions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coding_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `problem_id` int NOT NULL,
  `submitted_code` longtext NOT NULL,
  `language` varchar(50) NOT NULL,
  `passed_test_cases` int NOT NULL DEFAULT '0',
  `total_test_cases` int NOT NULL DEFAULT '0',
  `score` decimal(8,2) NOT NULL DEFAULT '0.00',
  `marks` decimal(8,2) NOT NULL DEFAULT '0.00',
  `percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('passed','failed','partial','accepted','wrong_answer','runtime_error','time_limit_exceeded','compilation_error','pending') NOT NULL DEFAULT 'passed',
  `execution_details` json DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `feedback` text,
  `feedback_by` varchar(255) DEFAULT NULL,
  `feedback_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_problem_id` (`problem_id`),
  CONSTRAINT `coding_submissions_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `coding_problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `coding_test_cases`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coding_test_cases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `problem_id` int NOT NULL,
  `input` longtext NOT NULL,
  `expected_output` longtext NOT NULL,
  `is_hidden` tinyint(1) DEFAULT '0',
  `weightage` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `problem_id` (`problem_id`),
  CONSTRAINT `coding_test_cases_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `coding_problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=172 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `colleges`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `colleges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `location` varchar(255) DEFAULT 'Main Campus',
  `city` varchar(100) DEFAULT 'Metropolis',
  `type` varchar(100) DEFAULT 'Autonomous',
  `status` varchar(50) DEFAULT 'Active',
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `admin_name` varchar(255) DEFAULT NULL,
  `domain` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `coordinator_departments`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coordinator_departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coordinator_id` int NOT NULL,
  `department_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_coord_dept` (`coordinator_id`,`department_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `coordinator_departments_ibfk_1` FOREIGN KEY (`coordinator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coordinator_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `copo_branch`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `copo_branch` (
  `idbranch` int NOT NULL AUTO_INCREMENT,
  `branchname` varchar(255) NOT NULL,
  PRIMARY KEY (`idbranch`),
  UNIQUE KEY `branchname_UNIQUE` (`branchname`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `defaulters`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `defaulters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(255) DEFAULT NULL,
  `roll_no` varchar(100) DEFAULT NULL,
  `batch` varchar(100) DEFAULT NULL,
  `attendance` varchar(50) DEFAULT NULL,
  `missed_assignments` varchar(100) DEFAULT NULL,
  `last_test_score` varchar(50) DEFAULT NULL,
  `reason` text,
  `risk_level` varchar(50) DEFAULT 'High Risk',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `student_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `attendance_score` varchar(50) DEFAULT NULL,
  `overall_score` decimal(5,2) DEFAULT '0.00',
  `reasons` text,
  `weak_areas` json DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Needs Attention',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `department`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `department` (
  `depart_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`depart_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `departments`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `hod_name` varchar(100) DEFAULT NULL,
  `hod_email` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_department_code_per_college` (`college_id`,`code`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `drive_participations`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `drive_participations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `drive_id` int NOT NULL,
  `student_id` int NOT NULL,
  `status` varchar(50) DEFAULT 'Completed',
  `overall_score` decimal(5,2) DEFAULT '0.00',
  `grade` varchar(50) DEFAULT 'B',
  `aptitude_score` decimal(5,2) DEFAULT '0.00',
  `coding_score` decimal(5,2) DEFAULT '0.00',
  `interview_score` decimal(5,2) DEFAULT '0.00',
  `strength_areas` json DEFAULT NULL,
  `weak_areas` json DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `current_step` int DEFAULT NULL,
  `final_score` varchar(50) DEFAULT NULL,
  `feedback` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_drive_student` (`drive_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `drive_participations_ibfk_1` FOREIGN KEY (`drive_id`) REFERENCES `mock_drives` (`id`) ON DELETE CASCADE,
  CONSTRAINT `drive_participations_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `faculty`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `faculty` (
  `faculty_id` int NOT NULL AUTO_INCREMENT,
  `uid` int DEFAULT NULL,
  `faculty_clg_id` varchar(100) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `contact` varchar(11) DEFAULT NULL,
  `ftype_id` int DEFAULT NULL,
  `role` varchar(150) DEFAULT NULL,
  `depart_id` int DEFAULT NULL,
  `manager_id` int DEFAULT NULL COMMENT 'Approving HOD: hod_data.hid',
  `previlage` int DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `pan_no` varchar(50) DEFAULT NULL,
  `aadhar_card` varchar(50) DEFAULT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `permanent_address` text,
  `current_address` text,
  `alternate_mobile` varchar(15) DEFAULT NULL,
  `experience_details` text,
  `photo` text,
  `signature` text,
  `cv` text,
  `email` varchar(255) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`faculty_id`),
  KEY `idx_faculty_manager` (`manager_id`)
) ENGINE=InnoDB AUTO_INCREMENT=420 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `faculty_branch_management`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `faculty_branch_management` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `faculty_id` bigint DEFAULT NULL,
  `branch_id` bigint DEFAULT NULL,
  `createAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=211 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `faculty_types`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `faculty_types` (
  `ftype_id` int NOT NULL AUTO_INCREMENT,
  `ftname` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`ftype_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `feature_switches`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feature_switches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `feature_key` varchar(100) NOT NULL,
  `feature_name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'General',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `notice_message` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `feature_key` (`feature_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `interventions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `interventions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT '1',
  `student_id` int NOT NULL,
  `mentor_id` int DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  `type` enum('call','warning','counseling','remedial','meeting','other') DEFAULT 'warning',
  `title` varchar(255) NOT NULL,
  `notes` text,
  `action_taken` text,
  `status` enum('pending','in_progress','resolved') DEFAULT 'pending',
  `date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `mentor_id` (`mentor_id`),
  CONSTRAINT `interventions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interventions_ibfk_2` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `interview_sessions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `interview_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `interview_type` varchar(100) DEFAULT 'Technical Mock',
  `overall_score` decimal(5,2) DEFAULT '0.00',
  `grade` varchar(50) DEFAULT 'Average',
  `feedback` text,
  `conducted_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Completed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `student_id` int DEFAULT NULL,
  `details` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `interview_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `interview_submissions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `interview_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `interview_type` varchar(100) DEFAULT 'Technical Mock',
  `overall_score` decimal(5,2) DEFAULT '0.00',
  `grade` varchar(50) DEFAULT 'Average',
  `feedback` text,
  `conducted_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Completed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `interview_submissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `interviews`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `interview_title` varchar(255) DEFAULT 'Mock Interview',
  `score` decimal(5,2) DEFAULT '0.00',
  `status` varchar(50) DEFAULT 'Completed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `interviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `leave_requests`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `college_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT 'Leave Request',
  `category` varchar(100) DEFAULT 'General Leave',
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `days` int DEFAULT '1',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `reason` text,
  `attachment` varchar(500) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `college_id` (`college_id`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `leave_types`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leave_types` (
  `leave_id` int NOT NULL AUTO_INCREMENT,
  `lname` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`leave_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `live_sessions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `live_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mentor_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `batch` varchar(100) DEFAULT 'All Batches',
  `batch_id` int DEFAULT NULL,
  `date` varchar(50) NOT NULL,
  `time` varchar(50) NOT NULL,
  `duration` varchar(50) DEFAULT '60 mins',
  `meeting_link` varchar(500) DEFAULT NULL,
  `status` enum('Upcoming','Live','Completed') DEFAULT 'Upcoming',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `student_id` varchar(100) DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `mentor_id` (`mentor_id`),
  CONSTRAINT `live_sessions_ibfk_1` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `mentor_assignments`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mentor_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mentor_id` int NOT NULL,
  `batch_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `mentor_name` varchar(150) DEFAULT NULL,
  `mentor_email` varchar(150) DEFAULT NULL,
  `student_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_mentor_batch` (`mentor_id`,`batch_id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `mentor_assignments_ibfk_1` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `mentor_assignments_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `mentor_student_assignments`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mentor_student_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mentor_id` int NOT NULL,
  `student_id` int NOT NULL,
  `batch_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mentor_student` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=325 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `milestones`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `milestones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roadmap_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `mock_drives`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mock_drives` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `scheduled_date` date DEFAULT NULL,
  `college_id` int DEFAULT '1',
  `eligible_batches` json DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Upcoming',
  `aptitude_component` json DEFAULT NULL,
  `coding_component` json DEFAULT NULL,
  `interview_component` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `college_id` (`college_id`),
  CONSTRAINT `mock_drives_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `otps`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `purpose` varchar(50) NOT NULL DEFAULT 'login',
  `attempts` int NOT NULL DEFAULT '0',
  `consumed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_otps_lookup` (`email`,`purpose`,`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `practice_problem_submissions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `practice_problem_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `problem_id` int NOT NULL,
  `user_id` int NOT NULL,
  `code_submitted` text,
  `language` varchar(50) DEFAULT 'javascript',
  `status` varchar(50) DEFAULT 'Solved',
  `points_earned` int DEFAULT '100',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `problem_id` (`problem_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `practice_problem_submissions_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `practice_problems` (`id`) ON DELETE CASCADE,
  CONSTRAINT `practice_problem_submissions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `practice_problems`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `practice_problems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT '1',
  `batch_id` int DEFAULT NULL,
  `batch_name` varchar(100) DEFAULT 'All Batches',
  `title` varchar(255) NOT NULL,
  `description` text,
  `difficulty` enum('Easy','Medium','Hard') NOT NULL DEFAULT 'Medium',
  `category` varchar(100) DEFAULT 'General DSA',
  `tags` varchar(255) DEFAULT NULL,
  `points` int DEFAULT '100',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `due_date` date DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `college_id` (`college_id`),
  KEY `batch_id` (`batch_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `practice_problems_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE SET NULL,
  CONSTRAINT `practice_problems_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `practice_problems_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `remedial_interventions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `remedial_interventions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT '1',
  `skill_gap_id` int DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `assignment_details` json DEFAULT NULL,
  `recommended_problems` json DEFAULT NULL,
  `recommended_materials` json DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `status` enum('assigned','in_progress','completed') DEFAULT 'assigned',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `reports`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT '1',
  `generated_by` int DEFAULT NULL,
  `report_type` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `parameters` json DEFAULT NULL,
  `data` json DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `college_id` (`college_id`),
  KEY `generated_by` (`generated_by`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `roadmap_items`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roadmap_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roadmap_id` int NOT NULL,
  `sequence_order` int DEFAULT '0',
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(50) DEFAULT 'locked',
  `progress` int DEFAULT '0',
  `tags` json DEFAULT NULL,
  `quizzes` int DEFAULT '0',
  `exercises` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `topics` json DEFAULT NULL,
  `syllabus` json DEFAULT NULL,
  `resources` json DEFAULT NULL,
  `completed_topics` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `roadmap_id` (`roadmap_id`),
  CONSTRAINT `roadmap_items_ibfk_1` FOREIGN KEY (`roadmap_id`) REFERENCES `roadmaps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `roadmaps`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roadmaps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `target_role` varchar(255) DEFAULT NULL,
  `career_track` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sequence_order` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `roadmaps_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `role`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `schema_migrations`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `batch` int DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `seat_type`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `seat_type` (
  `seat_type_id` int NOT NULL AUTO_INCREMENT,
  `seat_name` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`seat_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `secure_code_requests`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `secure_code_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'Admin',
  `college_name` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `generated_code` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `secure_codes`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `secure_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `role` varchar(50) NOT NULL,
  `college_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `max_uses` int DEFAULT '1',
  `uses_count` int DEFAULT '0',
  `status` enum('active','used','expired','inactive') DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `used_by` int DEFAULT NULL,
  `used_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code_role` (`code`,`role`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `shared_content`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shared_content` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('quiz','coding','drive','learning','broadcast') NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text,
  `data_json` text,
  `status` varchar(50) DEFAULT 'Active',
  `college_id` int DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `batch_name` varchar(255) DEFAULT 'All Batches',
  `target` varchar(255) DEFAULT 'All',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `batch_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_college` (`college_id`),
  KEY `idx_batch` (`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `shifts_type`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shifts_type` (
  `shift_id` int NOT NULL AUTO_INCREMENT,
  `sname` varchar(100) DEFAULT NULL,
  `in_hour` int DEFAULT NULL,
  `in_min` int DEFAULT NULL,
  `out_hour` int DEFAULT NULL,
  `out_min` int DEFAULT NULL,
  PRIMARY KEY (`shift_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `skill_gap_analysis`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `skill_gap_analysis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `overall_status` varchar(50) DEFAULT 'Needs Improvement',
  `weak_areas_count` int DEFAULT '0',
  `weak_areas` json DEFAULT NULL,
  `all_evaluated_skills` json DEFAULT NULL,
  `suggestions` json DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_skill_gap` (`user_id`),
  CONSTRAINT `skill_gap_analysis_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `skill_gaps`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `skill_gaps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT '1',
  `batch_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'Technical',
  `deficiency_rate` decimal(5,2) DEFAULT '0.00',
  `avg_score` decimal(5,2) DEFAULT '0.00',
  `priority` enum('High','Medium','Low') DEFAULT 'Medium',
  `affected_students_count` int DEFAULT '0',
  `status` enum('open','in_remedial','resolved') DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `student_add`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_add` (
  `sadd_id` int NOT NULL AUTO_INCREMENT,
  `address` varchar(1000) DEFAULT NULL,
  `domicile_number` varchar(500) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `street_name` varchar(255) DEFAULT NULL,
  `building_number` varchar(50) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`sadd_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5331 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `student_batches`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_batch` (`user_id`,`batch_id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `student_batches_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_batches_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=812 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `student_classroom_mapping`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_classroom_mapping` (
  `branch_id` int DEFAULT NULL,
  `student_id` varchar(200) NOT NULL,
  `room_number` int DEFAULT NULL,
  `left_side` tinyint(1) DEFAULT NULL,
  `right_side` tinyint(1) DEFAULT NULL,
  `seat_type` int DEFAULT '1',
  `exam_type` int DEFAULT NULL,
  `exam_date` date DEFAULT NULL,
  `programm_id` int DEFAULT NULL,
  `duration_from` varchar(50) DEFAULT NULL,
  `duration_to` varchar(50) DEFAULT NULL,
  `attendence` int DEFAULT '0',
  `left_sub_code` varchar(100) DEFAULT NULL,
  `right_sub_code` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `student_parentdetail`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_parentdetail` (
  `parent_id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(500) DEFAULT NULL,
  `contact` varchar(10) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `occupation` varchar(200) DEFAULT NULL,
  `designation` varchar(200) DEFAULT NULL,
  `income` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8906 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `student_personaldetails`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_personaldetails` (
  `personal_id` int NOT NULL AUTO_INCREMENT,
  `stud_id` int DEFAULT NULL,
  `name` varchar(500) DEFAULT NULL,
  `gender_id` int DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `religion` varchar(400) DEFAULT NULL,
  `communitee` varchar(400) DEFAULT NULL,
  `minority` varchar(100) DEFAULT NULL,
  `caste` varchar(50) DEFAULT NULL,
  `sub_caste` varchar(100) DEFAULT NULL,
  `nationality` varchar(200) DEFAULT NULL,
  `radd_id` int DEFAULT NULL,
  `padd_id` int DEFAULT NULL,
  `place_of_birth` varchar(500) DEFAULT NULL,
  `child_number` varchar(4) DEFAULT NULL,
  `landline_number` varchar(10) DEFAULT NULL,
  `contact` varchar(10) DEFAULT NULL,
  `bank_account_number` varchar(20) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `married_status` varchar(200) DEFAULT NULL,
  `guardian_relation` varchar(50) DEFAULT NULL,
  `aadhar_number` varchar(100) DEFAULT NULL,
  `apar_id` varchar(100) DEFAULT NULL,
  `ern` varchar(100) DEFAULT NULL,
  `last_college_attended` varchar(500) DEFAULT NULL,
  `is_parent_have_domicile` varchar(3) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `pan` varchar(255) DEFAULT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`personal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3015 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `student_quiz_completions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_quiz_completions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `quiz_id` int NOT NULL DEFAULT '0',
  `quiz_title` varchar(255) DEFAULT '',
  `completed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `score_text` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_quiz` (`user_id`,`quiz_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `student_quiz_completions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `students`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `college_id` int DEFAULT '1',
  `department_id` int DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  `roll_number` varchar(100) NOT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `year` varchar(20) DEFAULT NULL,
  `division` varchar(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `cgpa` varchar(10) DEFAULT '8.5',
  `skills` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `gender` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `emergency_contact` varchar(50) DEFAULT NULL,
  `target_track` varchar(100) DEFAULT NULL,
  `is_profile_updated` tinyint(1) DEFAULT '0',
  `live_kt` int DEFAULT '0',
  `dead_kt` int DEFAULT '0',
  `placement_status` varchar(50) DEFAULT 'Unplaced',
  `placed_company` varchar(255) DEFAULT NULL,
  `placement_opt_in` tinyint(1) DEFAULT '1',
  `portfolio_link` varchar(255) DEFAULT NULL,
  `resume_url` varchar(255) DEFAULT NULL,
  `cg_synced_at` timestamp NULL DEFAULT NULL,
  `mentor_name` varchar(150) DEFAULT NULL,
  `mentor_id` int DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `college_id` (`college_id`),
  KEY `department_id` (`department_id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_4` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=178 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `students_erp_backup`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students_erp_backup` (
  `sid` int NOT NULL AUTO_INCREMENT,
  `stud_clg_id` varchar(30) DEFAULT NULL,
  `uid` int DEFAULT NULL,
  `programm_id` int DEFAULT NULL,
  `cat_id` int DEFAULT NULL,
  `seat_type_id` int DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `gr_number` varchar(50) DEFAULT NULL,
  `personal_details_id` int DEFAULT NULL,
  `father_id` int DEFAULT NULL,
  `mother_id` int DEFAULT NULL,
  `guardian_id` int DEFAULT NULL,
  `physically_handicap` int DEFAULT NULL,
  `defence_status` int DEFAULT NULL,
  `received_scholership` int DEFAULT NULL,
  `details_of_prize` int DEFAULT NULL,
  `speacial_talent` int DEFAULT NULL,
  `doc_ids` int DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `final_submit` int DEFAULT '0',
  `HDegree` varchar(200) DEFAULT NULL,
  `part_payment` int DEFAULT NULL,
  `dd_id` int DEFAULT NULL,
  `neft_id` int DEFAULT NULL,
  `cancelled_app` int DEFAULT '0',
  `cancelled_app_date` varchar(20) DEFAULT NULL,
  `cancelled_app_document` varchar(255) DEFAULT NULL,
  `RowNum` bigint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`sid`)
) ENGINE=InnoDB AUTO_INCREMENT=3035 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `students_prn_mapping`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students_prn_mapping` (
  `stud_clg_id` varchar(100) DEFAULT NULL,
  `prn_num` varchar(100) DEFAULT NULL,
  `semester` int DEFAULT NULL,
  `branch` int DEFAULT NULL,
  `acad_year` varchar(100) DEFAULT NULL,
  `sheet_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `students_sem_mapping`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students_sem_mapping` (
  `stud_id` varchar(50) DEFAULT NULL,
  `sem` int DEFAULT NULL,
  `acad_year` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `study_materials`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `study_materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uploaded_by` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `batch` varchar(100) DEFAULT 'All Batches',
  `batch_id` int DEFAULT NULL,
  `type` varchar(50) DEFAULT 'PDF',
  `file_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text,
  `link` varchar(500) DEFAULT NULL,
  `deadline` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `study_materials_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `subjects`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_code` varchar(200) NOT NULL,
  `subject_name` varchar(255) DEFAULT NULL,
  `semester` int DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `acad_year` varchar(100) DEFAULT NULL,
  `experiments` text,
  `num_experiments` int DEFAULT NULL,
  `num_assignments` int DEFAULT NULL,
  `theory` text,
  `num_modules` int DEFAULT NULL,
  `professor_assign` varchar(255) DEFAULT NULL,
  `totalcredits` float DEFAULT NULL,
  `max_marks` int DEFAULT '0',
  `isoral` varchar(20) DEFAULT 'No',
  `ispractical` varchar(20) DEFAULT 'No',
  `oral_marks` int DEFAULT '0',
  `practical_marks` int DEFAULT '0',
  `passing_marks` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=524 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `support_tickets`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'Technical',
  `priority` enum('Low','Medium','High','Urgent') DEFAULT 'Medium',
  `status` varchar(50) DEFAULT 'Open',
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolution_note` text,
  `is_escalated` tinyint(1) DEFAULT '0',
  `escalation_reason` text,
  `escalated_by` int DEFAULT NULL,
  `escalated_at` timestamp NULL DEFAULT NULL,
  `target_role` varchar(50) DEFAULT 'mentor',
  `escalated_to` varchar(50) DEFAULT NULL,
  `mentor_note` text,
  `admin_note` text,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `syllabus_tracker`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `syllabus_tracker` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `syllabus_link` varchar(255) DEFAULT NULL,
  `academic_id` bigint DEFAULT NULL,
  `sem` int DEFAULT NULL,
  `createdBy` bigint DEFAULT NULL,
  `creayedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `task_submissions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `task_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `status` varchar(50) DEFAULT 'submitted',
  `score` int DEFAULT '0',
  `submitted_code` longtext,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `batch_id` int DEFAULT NULL,
  `code_submission` text,
  `marks_obtained` int DEFAULT '0',
  `feedback` text,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `task_submissions_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `batch_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_submissions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `tbl_student_batch_sem_div_mapping`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tbl_student_batch_sem_div_mapping` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stud_clg_id` varchar(20) DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  `sem` enum('1','2','3','4','5','6','7','8') DEFAULT NULL,
  `batch` varchar(2) DEFAULT NULL,
  `division` varchar(2) DEFAULT NULL,
  `academic_id` int DEFAULT NULL,
  `isSubject` tinyint(1) DEFAULT '0',
  `subjectId` int DEFAULT NULL,
  `createdBy` bigint DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1760 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `tbl_student_exam_classrom_mapping`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tbl_student_exam_classrom_mapping` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `exam_time_mapping_id` bigint DEFAULT NULL,
  `stud_clg_id` varchar(20) DEFAULT NULL,
  `room_id` bigint DEFAULT NULL,
  `left_flag` int DEFAULT NULL,
  `subject_code` varchar(50) DEFAULT NULL,
  `attendance` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `time_table_batch_subject`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `time_table_batch_subject` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `time_table_detailed_id` bigint DEFAULT NULL,
  `typeOfLecture` enum('Lecture','Lab') DEFAULT NULL,
  `subjectCode` varchar(100) DEFAULT NULL,
  `facultyid` bigint DEFAULT NULL,
  `batch` varchar(2) DEFAULT NULL,
  `createdBy` bigint DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_extra` int DEFAULT '0',
  `lect_on_dehalf` bigint DEFAULT NULL,
  `reason` varchar(1000) DEFAULT NULL,
  `room_number` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1776 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `training_enrollments`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_user_id` int NOT NULL,
  `program_id` int NOT NULL,
  `batch_id` int DEFAULT NULL,
  `training_option` varchar(255) DEFAULT NULL,
  `fee_amount` int DEFAULT '0',
  `amount_paid` int DEFAULT '0',
  `payment_status` enum('pending','part_payment','completed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_proof_url` varchar(2048) DEFAULT NULL,
  `payment_received_by` varchar(255) DEFAULT NULL,
  `whatsapp_group_added` varchar(10) DEFAULT 'No',
  `source_status` varchar(255) DEFAULT NULL,
  `source_timestamp` varchar(64) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `c2c_registration_id` int DEFAULT NULL,
  `access_status` enum('not_activated','pending','active','suspended','revoked') DEFAULT 'not_activated',
  `payment_mode` varchar(64) DEFAULT NULL,
  `utr` varchar(128) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_enroll` (`student_user_id`,`program_id`)
) ENGINE=InnoDB AUTO_INCREMENT=812 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `training_programs`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `short_name` varchar(100) DEFAULT NULL,
  `placement_season_year` int DEFAULT NULL,
  `graduation_year` int DEFAULT NULL,
  `description` text,
  `fee_amount` int DEFAULT '0',
  `status` varchar(50) DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `upi_id` varchar(128) DEFAULT NULL,
  `upi_payee_name` varchar(128) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `registration_open_date` date DEFAULT NULL,
  `registration_close_date` date DEFAULT NULL,
  `payment_instructions` text,
  `payment_qr_url` text,
  `eligibility_criteria` text,
  `restrictions` json DEFAULT NULL,
  `google_form_url` varchar(500) DEFAULT NULL,
  `google_sheet_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_program_college_code` (`college_id`,`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `trainings`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trainings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'Technical',
  `status` varchar(50) DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `user_auth_token`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_auth_token` (
  `auth_id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `user_type` int NOT NULL,
  `login_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `uid` int DEFAULT NULL,
  PRIMARY KEY (`auth_id`),
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=46593 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `user_oauth_tokens`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_oauth_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `provider` varchar(50) NOT NULL DEFAULT 'google',
  `email` varchar(255) DEFAULT NULL,
  `refresh_token` text,
  `access_token` text,
  `expiry_date` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_provider` (`user_id`,`provider`),
  CONSTRAINT `user_oauth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `user_types`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_types` (
  `utid` int NOT NULL,
  `base` varchar(50) NOT NULL,
  PRIMARY KEY (`utid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `users`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `role` enum('super_admin','college_admin','coordinator','mentor','student','trainer') NOT NULL DEFAULT 'student',
  `college_id` int DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `password_hash` varchar(255) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `emergency_contact` varchar(50) DEFAULT NULL,
  `target_track` varchar(100) DEFAULT NULL,
  `is_profile_updated` tinyint(1) DEFAULT '0',
  `remember_me` tinyint(1) DEFAULT '0',
  `department` varchar(100) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `is_approved` tinyint(1) DEFAULT '0',
  `profile_pic` varchar(255) DEFAULT NULL,
  `cg_synced_at` timestamp NULL DEFAULT NULL,
  `google_calendar_email` varchar(255) DEFAULT NULL,
  `google_refresh_token` text,
  `mentor_name` varchar(150) DEFAULT NULL,
  `mentor_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`),
  UNIQUE KEY `email_44` (`email`),
  UNIQUE KEY `email_45` (`email`),
  UNIQUE KEY `email_46` (`email`),
  UNIQUE KEY `email_47` (`email`),
  UNIQUE KEY `email_48` (`email`),
  UNIQUE KEY `email_49` (`email`),
  UNIQUE KEY `email_50` (`email`),
  UNIQUE KEY `email_51` (`email`),
  UNIQUE KEY `email_52` (`email`),
  UNIQUE KEY `email_53` (`email`),
  UNIQUE KEY `email_54` (`email`),
  UNIQUE KEY `email_55` (`email`),
  UNIQUE KEY `email_56` (`email`),
  UNIQUE KEY `email_57` (`email`),
  UNIQUE KEY `email_58` (`email`),
  UNIQUE KEY `email_59` (`email`),
  UNIQUE KEY `email_60` (`email`),
  UNIQUE KEY `email_61` (`email`),
  UNIQUE KEY `email_62` (`email`),
  KEY `college_id` (`college_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1754 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- Table structure for table `weekly_reports`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `weekly_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_id` int DEFAULT '1',
  `batch_id` int DEFAULT NULL,
  `mentor_id` int DEFAULT NULL,
  `week_number` int NOT NULL,
  `year` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `summary` text,
  `attendance_rate` decimal(5,2) DEFAULT '0.00',
  `avg_quiz_score` decimal(5,2) DEFAULT '0.00',
  `topics_covered` text,
  `challenges_faced` text,
  `recommendations` text,
  `metrics` json DEFAULT NULL,
  `status` enum('draft','submitted','reviewed') DEFAULT 'submitted',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `student_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `overall_score` decimal(5,2) DEFAULT '0.00',
  `attendance_score` varchar(50) DEFAULT NULL,
  `quiz_score` decimal(5,2) DEFAULT '0.00',
  `coding_score` decimal(5,2) DEFAULT '0.00',
  `interview_score` decimal(5,2) DEFAULT '0.00',
  `milestones_summary` json DEFAULT NULL,
  `strong_areas` json DEFAULT NULL,
  `weak_areas` json DEFAULT NULL,
  `suggestions` json DEFAULT NULL,
  `trend_status` varchar(50) DEFAULT 'On Track',
  `score_delta` varchar(50) DEFAULT '+0%',
  `full_payload` json DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `week_label` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `college_id` (`college_id`),
  KEY `batch_id` (`batch_id`),
  KEY `mentor_id` (`mentor_id`),
  CONSTRAINT `weekly_reports_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  CONSTRAINT `weekly_reports_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `weekly_reports_ibfk_3` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================================
-- End of TrainX Complete Database Schema
-- ============================================================================
