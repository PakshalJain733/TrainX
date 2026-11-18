-- One-to-many posting documents (replaces docs/docs2/docs3 columns)
CREATE TABLE IF NOT EXISTS posting_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  posting_type ENUM('job', 'internship') NOT NULL,
  posting_id INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NULL,
  sort_order TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_posting (posting_type, posting_id),
  INDEX idx_sort (posting_type, posting_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
