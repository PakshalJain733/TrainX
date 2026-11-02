-- Migration: Create coordinator_company_assignments table
-- Tracks selective company assignments for student coordinators

CREATE TABLE IF NOT EXISTS coordinator_company_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coordinator_id INT NOT NULL,
  company_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coordinator_company (coordinator_id, company_id),
  INDEX idx_coordinator_id (coordinator_id),
  INDEX idx_company_id (company_id),
  CONSTRAINT fk_cca_coordinator FOREIGN KEY (coordinator_id)
    REFERENCES coordinator_details (id) ON DELETE CASCADE,
  CONSTRAINT fk_cca_company FOREIGN KEY (company_id)
    REFERENCES companies (id) ON DELETE CASCADE
);
