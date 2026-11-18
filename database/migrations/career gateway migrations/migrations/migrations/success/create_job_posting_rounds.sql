-- One-to-many: interview / process rounds per job posting (atomic with job create/update).
-- Run once on MySQL/MariaDB.

CREATE TABLE IF NOT EXISTS job_posting_rounds (
  id INT NOT NULL AUTO_INCREMENT,
  job_posting_id INT NOT NULL,
  sort_order INT NOT NULL,
  round_name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_job_posting_round_order (job_posting_id, sort_order),
  CONSTRAINT fk_job_posting_rounds_job
    FOREIGN KEY (job_posting_id) REFERENCES job_postings (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
