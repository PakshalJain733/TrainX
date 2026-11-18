-- ============================================================================
-- TrainX Production Database Migration
-- Purpose:
--   1. Fix support_tickets priority column truncation (support 'Normal', 'High', etc.)
--   2. Ensure all escalation and resolution columns exist
--   3. Restrict ticket routing target_role to 'admin' (College Admin & Super Admin)
--   4. Ensure Super Admin account (trainx.admin@gmail.com / Admin@123) is active
-- ============================================================================

-- 1. Ensure support_tickets table exists with full schema
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Batches & Tasks',
  priority VARCHAR(50) DEFAULT 'Normal',
  status VARCHAR(50) DEFAULT 'Open',
  description TEXT NULL,
  resolution_note TEXT NULL,
  is_escalated TINYINT(1) DEFAULT 0,
  escalation_reason TEXT NULL,
  escalated_by INT NULL,
  escalated_at TIMESTAMP NULL,
  escalated_to VARCHAR(100) NULL,
  target_role VARCHAR(100) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ticket_user (user_id),
  INDEX idx_ticket_status (status),
  INDEX idx_ticket_role (target_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Update column data types to prevent truncation warnings
ALTER TABLE support_tickets MODIFY COLUMN priority VARCHAR(50) DEFAULT 'Normal';
ALTER TABLE support_tickets MODIFY COLUMN status VARCHAR(50) DEFAULT 'Open';

-- 3. Safely update any existing mentor-targeted tickets to College Admin
UPDATE support_tickets 
SET target_role = 'admin' 
WHERE target_role IS NULL OR target_role = '' OR target_role = 'mentor';

-- 4. Ensure Super Admin primary account (trainx.admin@gmail.com / Admin@123)
INSERT INTO users (name, email, mobile_number, password_hash, role, college_id, is_active, is_verified, is_approved)
VALUES (
  'Super Admin',
  'trainx.admin@gmail.com',
  '9876543210',
  '$2b$12$oR5hATHElKSTotvEQwBdmeJZmnNHq33ub8g25vAj9Q5O3nSXenGvi',
  'super_admin',
  NULL,
  1,
  1,
  1
)
ON DUPLICATE KEY UPDATE 
  role = 'super_admin', 
  password_hash = '$2b$12$oR5hATHElKSTotvEQwBdmeJZmnNHq33ub8g25vAj9Q5O3nSXenGvi',
  is_active = 1, 
  is_verified = 1, 
  is_approved = 1;

-- 5. Ensure Super Admin fallback account (admin@trainingportal.com / Admin@123)
INSERT INTO users (name, email, mobile_number, password_hash, role, college_id, is_active, is_verified, is_approved)
VALUES (
  'Super Admin',
  'admin@trainingportal.com',
  '9876543210',
  '$2b$12$oR5hATHElKSTotvEQwBdmeJZmnNHq33ub8g25vAj9Q5O3nSXenGvi',
  'super_admin',
  NULL,
  1,
  1,
  1
)
ON DUPLICATE KEY UPDATE 
  role = 'super_admin', 
  password_hash = '$2b$12$oR5hATHElKSTotvEQwBdmeJZmnNHq33ub8g25vAj9Q5O3nSXenGvi',
  is_active = 1, 
  is_verified = 1, 
  is_approved = 1;

