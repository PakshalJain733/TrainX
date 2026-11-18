-- HR contacts for internship companies (Company Master > Internship HR Contact)
CREATE TABLE IF NOT EXISTS intern_hr (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  post VARCHAR(255) NOT NULL,
  alternate_contact VARCHAR(255) NULL,
  communication_mode VARCHAR(32) NOT NULL DEFAULT 'contact',
  company_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES intershiip_companies(id) ON DELETE CASCADE,
  INDEX idx_intern_hr_company_id (company_id)
);
