-- ============================================================================
-- Training Portal — Canonical Database Schema
-- ----------------------------------------------------------------------------
-- NOTE: This file mirrors Backend/src/config/init_db.js, which is the
-- runtime source of truth (invoked by server.js on startup). Keep both in
-- sync when the schema changes.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS training_portal_db;
USE training_portal_db;

-- 1. Colleges
CREATE TABLE IF NOT EXISTS colleges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- 3. Batches
CREATE TABLE IF NOT EXISTS batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL DEFAULT 1,
  department_id INT NULL,
  name VARCHAR(255) NOT NULL,
  mentor VARCHAR(255) NULL,
  mentor_id INT NULL,
  schedule VARCHAR(255) NULL,
  join_code VARCHAR(50) NULL,
  code_expires_at BIGINT NULL,
  students INT DEFAULT 0,
  year VARCHAR(20) DEFAULT 'TE',
  division VARCHAR(20) DEFAULT 'A',
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  start_year INT NULL,
  end_year INT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20),
  role ENUM('super_admin', 'college_admin', 'coordinator', 'mentor', 'student') NOT NULL DEFAULT 'student',
  college_id INT DEFAULT 1,
  password_hash VARCHAR(255) NULL,
  gender VARCHAR(20) NULL,
  city VARCHAR(100) NULL,
  emergency_contact VARCHAR(50) NULL,
  linkedin_url VARCHAR(255) NULL,
  target_track VARCHAR(100) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
);

-- 5. Students
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
  gender VARCHAR(20) NULL,
  city VARCHAR(100) NULL,
  emergency_contact VARCHAR(50) NULL,
  linkedin_url VARCHAR(255) NULL,
  target_track VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
);

-- 6. OTP Store
CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_otp (email, otp)
);

-- 7. Student Batches (multi-batch enrollment)
CREATE TABLE IF NOT EXISTS student_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  batch_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_batch (user_id, batch_id)
);

-- 8. Mentor Assignments
CREATE TABLE IF NOT EXISTS mentor_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mentor_id INT NOT NULL,
  batch_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_mentor_batch (mentor_id, batch_id)
);

-- 9. Coordinator Departments
CREATE TABLE IF NOT EXISTS coordinator_departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coordinator_id INT NOT NULL,
  department_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_coord_dept (coordinator_id, department_id)
);

-- 10. Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  batch_id INT NULL,
  department_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Technical Quiz',
  duration_minutes INT DEFAULT 30,
  total_marks INT DEFAULT 50,
  pass_marks INT DEFAULT 0,
  passing_percentage DECIMAL(5,2) DEFAULT 60.00,
  created_by INT NULL,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 11. Assessment Questions
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
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

-- 12. Assessment Attempts
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
  status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
);

-- 13. Assessment Answers
CREATE TABLE IF NOT EXISTS assessment_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option ENUM('a', 'b', 'c', 'd') NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  marks_awarded INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE
);

-- 14. Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  batch_id INT NOT NULL,
  session_code VARCHAR(100) NULL,
  title VARCHAR(255) DEFAULT 'Training Lecture',
  session_date DATE NOT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  faculty_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- 15. Attendance Records
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  batch_id INT NOT NULL,
  user_id INT NOT NULL,
  session_id INT NULL,
  session_date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
  marked_by INT NULL,
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 16. Attendance Summary
CREATE TABLE IF NOT EXISTS attendance_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  total_classes INT DEFAULT 0,
  present_count INT DEFAULT 0,
  absent_count INT DEFAULT 0,
  late_count INT DEFAULT 0,
  excused_count INT DEFAULT 0,
  attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
  attendance_status VARCHAR(50) DEFAULT 'No Records',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 17. Broadcasts
CREATE TABLE IF NOT EXISTS broadcasts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  desc_text TEXT NULL,
  target VARCHAR(100) DEFAULT 'All Batches',
  priority VARCHAR(50) DEFAULT 'General Announcement',
  type ENUM('calendar', 'alert', 'success', 'document', 'general') DEFAULT 'general',
  unread BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 18. Live Sessions
CREATE TABLE IF NOT EXISTS live_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mentor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  batch VARCHAR(100) DEFAULT 'All Batches',
  batch_id INT NULL,
  date VARCHAR(50) NOT NULL,
  time VARCHAR(50) NOT NULL,
  duration VARCHAR(50) DEFAULT '60 mins',
  meeting_link VARCHAR(500) NULL,
  status ENUM('Upcoming', 'Live', 'Completed') DEFAULT 'Upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 19. Study Materials
CREATE TABLE IF NOT EXISTS study_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploaded_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  batch VARCHAR(100) DEFAULT 'All Batches',
  batch_id INT NULL,
  type VARCHAR(50) DEFAULT 'PDF',
  file_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 20. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Technical',
  priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 21. Skill Gap Analysis
CREATE TABLE IF NOT EXISTS skill_gap_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  overall_status VARCHAR(50) DEFAULT 'Needs Improvement',
  weak_areas_count INT DEFAULT 0,
  weak_areas JSON NULL,
  all_evaluated_skills JSON NULL,
  suggestions JSON NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_skill_gap (user_id)
);

-- 22. Skill Gaps
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
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 23. Remedial Interventions
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
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 24. General Defaulter / Mentor Interventions
CREATE TABLE IF NOT EXISTS interventions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  student_id INT NOT NULL,
  mentor_id INT NULL,
  batch_id INT NULL,
  type ENUM('call', 'warning', 'counseling', 'remedial', 'meeting', 'other') DEFAULT 'warning',
  title VARCHAR(255) NOT NULL,
  notes TEXT NULL,
  action_taken TEXT NULL,
  status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
  date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 25. Weekly Reports
CREATE TABLE IF NOT EXISTS weekly_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  batch_id INT NULL,
  mentor_id INT NULL,
  week_number INT NOT NULL,
  year INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NULL,
  attendance_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_quiz_score DECIMAL(5,2) DEFAULT 0.00,
  topics_covered TEXT NULL,
  challenges_faced TEXT NULL,
  recommendations TEXT NULL,
  metrics JSON NULL,
  status ENUM('draft', 'submitted', 'reviewed') DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 26. Reports
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  generated_by INT NULL,
  report_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  parameters JSON NULL,
  data JSON NULL,
  file_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 27. Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  college_id INT NULL,
  title VARCHAR(255) DEFAULT 'Leave Request',
  category VARCHAR(100) DEFAULT 'General Leave',
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  days INT DEFAULT 1,
  start_date DATE NULL,
  end_date DATE NULL,
  reason TEXT NULL,
  attachment VARCHAR(500) NULL,
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
);

-- 28. Practice Problems / Coding Tasks
CREATE TABLE IF NOT EXISTS practice_problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT DEFAULT 1,
  batch_id INT NULL,
  batch_name VARCHAR(100) DEFAULT 'All Batches',
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Medium',
  category VARCHAR(100) DEFAULT 'General DSA',
  tags VARCHAR(255) NULL,
  points INT DEFAULT 100,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 29. Batch Tasks
CREATE TABLE IF NOT EXISTS batch_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
  points INT DEFAULT 100,
  deadline VARCHAR(100) NULL,
  description TEXT NULL,
  test_cases JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- 30. Task Submissions
CREATE TABLE IF NOT EXISTS task_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'submitted',
  score INT DEFAULT 0,
  submitted_code LONGTEXT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES batch_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 31. Roadmaps
CREATE TABLE IF NOT EXISTS roadmaps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  target_role VARCHAR(255) NULL,
  career_track VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 32. Roadmap Items
CREATE TABLE IF NOT EXISTS roadmap_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roadmap_id INT NOT NULL,
  sequence_order INT DEFAULT 0,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status VARCHAR(50) DEFAULT 'locked',
  progress INT DEFAULT 0,
  tags JSON NULL,
  quizzes INT DEFAULT 0,
  exercises INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);
