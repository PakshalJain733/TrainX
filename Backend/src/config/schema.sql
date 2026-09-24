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
  college_id INT DEFAULT 1,
  department_id INT DEFAULT 1,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NULL,
  join_code VARCHAR(50) NULL,
  code_expires_at VARCHAR(100) NULL,
  trainer VARCHAR(100) DEFAULT 'Faculty Instructor',
  schedule VARCHAR(100) DEFAULT 'Mon, Wed, Fri (10:00 AM - 12:00 PM)',
  students INT DEFAULT 0,
  progress INT DEFAULT 0,
  year VARCHAR(20) DEFAULT 'TE',
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3b. Student Batches (Enrollments)
CREATE TABLE IF NOT EXISTS student_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  batch_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_batch (user_id, batch_id)
);

-- 3c. Batch Tasks Table
CREATE TABLE IF NOT EXISTS batch_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(100) DEFAULT 'General Assignment',
  difficulty VARCHAR(50) DEFAULT 'Medium',
  points INT DEFAULT 100,
  deadline VARCHAR(100) NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(15) UNIQUE,
  role ENUM('super_admin', 'college_admin', 'coordinator', 'mentor', 'student') NOT NULL DEFAULT 'student',
  college_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
);

-- 5. Students Table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  college_id INT NULL,
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

-- 11a. Attendance Sessions Table (Lecture / Training Sessions & QR Session Codes)
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
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 11b. Attendance Records Table (Per-Student Attendance Log Entries)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_batch_date (batch_id, user_id, session_date)
);

-- 11c. Attendance Summary Table (Persistent Calculated Student Metrics)
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


-- 12. Practice Problems / Coding Tasks Table
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 13. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(100) DEFAULT 'Medical Leave',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT DEFAULT 1,
  reason TEXT NULL,
  attachment VARCHAR(255) NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Broadcast Notifications Table (Replaces local storage notifications)
CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NULL,
  title VARCHAR(255) NOT NULL,
  desc_text TEXT NOT NULL,
  type ENUM('calendar', 'alert', 'success', 'document') DEFAULT 'calendar',
  unread BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- 15. Live Sessions Table (Replaces local storage live sessions)
CREATE TABLE IF NOT EXISTS live_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mentor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  batch VARCHAR(100) DEFAULT 'All Batches',
  date VARCHAR(50) NOT NULL,
  time VARCHAR(50) NOT NULL,
  duration VARCHAR(50) DEFAULT '60 mins',
  meeting_link VARCHAR(500) NULL,
  status ENUM('Upcoming', 'Live', 'Completed') DEFAULT 'Upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 16. Study Materials Table (Replaces local storage study materials)
CREATE TABLE IF NOT EXISTS study_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploaded_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  batch VARCHAR(100) DEFAULT 'All Batches',
  type VARCHAR(50) DEFAULT 'PDF',
  file_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 17. Support Tickets Table (Replaces local storage support tickets)
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

-- 18. Skill Gap Analysis Table (Stores student AI performance skill gap results)
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
