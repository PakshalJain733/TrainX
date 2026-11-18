-- Create user_read_timestamps table for tracking when students last read messages
CREATE TABLE IF NOT EXISTS user_read_timestamps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  job_company_id INT NOT NULL,
  last_read_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_company (user_id, job_company_id),
  INDEX idx_user_id (user_id),
  INDEX idx_job_company_id (job_company_id),
  INDEX idx_last_read_timestamp (last_read_timestamp)
);

-- Create admin_read_timestamps table for tracking when admins last read messages
CREATE TABLE IF NOT EXISTS admin_read_timestamps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id VARCHAR(255) NOT NULL,
  job_company_id INT NOT NULL,
  last_read_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_admin_company (admin_id, job_company_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_job_company_id (job_company_id),
  INDEX idx_last_read_timestamp (last_read_timestamp)
);

-- Add some sample data for testing (optional)
-- INSERT INTO user_read_timestamps (user_id, job_company_id) VALUES ('test_user_1', 1);
-- INSERT INTO admin_read_timestamps (admin_id, job_company_id) VALUES ('test_admin_1', 1);
