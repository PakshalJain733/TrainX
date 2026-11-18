-- Migration: Add per-company (per aptitude test) question bank table.
-- Questions are AI-generated once per aptitude test and reused for all
-- students taking that company's/drive's aptitude test.
CREATE TABLE IF NOT EXISTS aptitude_test_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aid INT NOT NULL,
  question TEXT,
  options TEXT,
  answer INT,
  solution TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_aptitude_test_questions_aid (aid)
);