CREATE TABLE IF NOT EXISTS machine_submissions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  submited_code TEXT,
  language VARCHAR(50),
  total_test_cases INT,
  passed_cases INT,
  prac_id INT,
  student_id INT,
  output TEXT,
  runTime VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prac (prac_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
