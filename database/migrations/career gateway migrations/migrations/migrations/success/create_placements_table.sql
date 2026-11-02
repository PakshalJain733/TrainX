-- Create placements table
CREATE TABLE IF NOT EXISTS placements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  company_id INT NOT NULL,
  job_posting_id INT NOT NULL,
  package_amount DECIMAL(10, 2) NOT NULL,
  package_currency VARCHAR(10) NOT NULL DEFAULT 'LPA',
  role VARCHAR(255) NOT NULL,
  offer_letter_path VARCHAR(500) NULL,
  placement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'confirmed', 'rejected') NOT NULL DEFAULT 'pending',
  remarks TEXT NULL,
  created_by INT NOT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (student_id) REFERENCES student_details(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE,
  
  -- Indexes for better performance
  INDEX idx_student_id (student_id),
  INDEX idx_company_id (company_id),
  INDEX idx_job_posting_id (job_posting_id),
  INDEX idx_status (status),
  INDEX idx_placement_date (placement_date),
  
  -- Unique constraint to prevent duplicate placements
  UNIQUE KEY unique_student_company (student_id, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
