CREATE DATABASE IF NOT EXISTS training_portal_db;
USE training_portal_db;

-- 1. Colleges Table
CREATE TABLE IF NOT EXISTS colleges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  UNIQUE KEY unique_department_code_per_college (college_id, code)
);


-- 3. Batches Table
CREATE TABLE IF NOT EXISTS batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  department_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  year VARCHAR(20) DEFAULT 'TE',
  division VARCHAR(20) DEFAULT 'A',
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  start_year INT,
  end_year INT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);


-- 4. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20),
  role ENUM('super_admin', 'college_admin', 'coordinator', 'mentor', 'student') NOT NULL DEFAULT 'student',
  college_id INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
);

-- 5. Students Table (User -> College -> Department -> Batch)
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  college_id INT DEFAULT 1,
  department_id INT NULL,
  batch_id INT NULL,
  roll_number VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  year VARCHAR(20),
  division VARCHAR(20),
  semester VARCHAR(20),
  cgpa VARCHAR(10) DEFAULT '8.5',
  skills TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
);

-- 6. OTP Store Table
CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  batch_id INT,
  department_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Technical Quiz',
  duration_minutes INT DEFAULT 30,
  total_marks INT DEFAULT 50,
  pass_marks INT DEFAULT 0,
  passing_percentage DECIMAL(5,2) DEFAULT 60.00,
  created_by INT,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 8. Assessment Questions Table
CREATE TABLE IF NOT EXISTS assessment_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  correct_option ENUM('a', 'b', 'c', 'd') NOT NULL,
  marks INT DEFAULT 10,
  explanation TEXT NULL,
  question_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

-- 9. Assessment Attempts Table
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT NOT NULL,
  user_id INT NOT NULL,
  college_id INT DEFAULT 1,
  score INT DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  attempted_questions INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  correct_answers INT DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  unattempted_count INT NOT NULL DEFAULT 0,
  marks_obtained INT NOT NULL DEFAULT 0,
  total_marks INT NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  status ENUM('in_progress', 'passed', 'failed', 'completed') NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Assessment Answers Table
CREATE TABLE IF NOT EXISTS assessment_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option ENUM('a', 'b', 'c', 'd') NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  marks_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE
);

-- 11. Coding Problems Table
CREATE TABLE IF NOT EXISTS coding_problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
  category VARCHAR(100) DEFAULT 'Algorithms',
  total_marks INT DEFAULT 100,
  time_limit_ms INT DEFAULT 2000,
  memory_limit_mb INT DEFAULT 256,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 12. Coding Test Cases Table
CREATE TABLE IF NOT EXISTS coding_test_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  input LONGTEXT NOT NULL,
  expected_output LONGTEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  weightage INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES coding_problems(id) ON DELETE CASCADE
);

-- 13. Coding Submissions (Attempts) Table
CREATE TABLE IF NOT EXISTS coding_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  problem_id INT NOT NULL,
  submitted_code LONGTEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  passed_test_cases INT NOT NULL DEFAULT 0,
  total_test_cases INT NOT NULL DEFAULT 0,
  score DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  marks DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  status ENUM('passed', 'failed', 'partial', 'accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded', 'compilation_error', 'pending') NOT NULL DEFAULT 'passed',
  execution_details JSON NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES coding_problems(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_problem_id (problem_id)
);

-- 14. Skill Gaps Table (Batch or Student level diagnostics)
CREATE TABLE IF NOT EXISTS skill_gaps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  batch_id INT NULL,
  student_id INT NULL,
  topic VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Technical',
  deficiency_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_score DECIMAL(5,2) DEFAULT 0.00,
  priority ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
  affected_students_count INT DEFAULT 0,
  status ENUM('open', 'in_remedial', 'resolved') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. Remedial Interventions Table
CREATE TABLE IF NOT EXISTS remedial_interventions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  skill_gap_id INT NULL,
  batch_id INT NULL,
  student_id INT NULL,
  topic VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assignment_details JSON NULL,
  recommended_problems JSON NULL,
  recommended_materials JSON NULL,
  created_by INT NULL,
  status ENUM('assigned', 'in_progress', 'completed') DEFAULT 'assigned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_gap_id) REFERENCES skill_gaps(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);


