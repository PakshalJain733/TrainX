-- Student-submitted internship tracking records (TPO internship reports)
CREATE TABLE IF NOT EXISTS internship_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  internship_role VARCHAR(255) NOT NULL,
  internship_type ENUM('Paid', 'Unpaid') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  duration_days INT NULL,
  status ENUM('Ongoing', 'Completed') NOT NULL DEFAULT 'Ongoing',
  certificate_path VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_internship_tracking_student_id (student_id),
  INDEX idx_internship_tracking_status (status),
  INDEX idx_internship_tracking_type (internship_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
