-- Migration: Create aptitude_report_cache table
-- Caches AI-generated aptitude reports keyed by a stable attempt key
-- (e.g. admin stu_mcq_key) so each report is generated only once.

CREATE TABLE IF NOT EXISTS aptitude_report_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  report LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);