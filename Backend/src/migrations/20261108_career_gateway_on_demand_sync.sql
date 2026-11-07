-- Migration: 20261108_career_gateway_on_demand_sync.sql
-- Description: Adds synchronization execution tracking for Career Gateway on-demand manual sync (student and college-wide)

CREATE TABLE IF NOT EXISTS career_gateway_sync_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_id VARCHAR(100) NOT NULL UNIQUE,
  request_id VARCHAR(100) NULL,
  sync_type ENUM('manual_student', 'manual_college', 'scheduled_daily') NOT NULL DEFAULT 'manual_student',
  trigger_source ENUM('career_gateway', 'trainx_admin', 'scheduler') NOT NULL DEFAULT 'career_gateway',
  requested_by VARCHAR(150) NULL,
  college_id INT NULL,
  career_gateway_college_id VARCHAR(100) NULL,
  career_gateway_student_id INT NULL,
  trainx_user_id INT NULL,
  export_id VARCHAR(100) NULL,
  status ENUM('queued', 'processing', 'completed', 'partial', 'failed') NOT NULL DEFAULT 'queued',
  records_processed INT NOT NULL DEFAULT 0,
  records_failed INT NOT NULL DEFAULT 0,
  payload_summary JSON NULL,
  error_summary TEXT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cg_sync_request_id (request_id),
  INDEX idx_cg_sync_status (status),
  INDEX idx_cg_sync_college_id (college_id),
  INDEX idx_cg_sync_student_id (career_gateway_student_id),
  INDEX idx_cg_sync_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

