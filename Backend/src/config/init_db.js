import mysql from 'mysql2/promise';
import { config } from './env.js';

export async function initializeDatabase() {
  try {
    const conn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    });

    console.log('[DB Init] Connected to MySQL database:', config.db.database);

    // 1. Ensure Colleges
    await conn.query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Ensure Departments
    await conn.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
      )
    `);

    // 3. Ensure Batches table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL DEFAULT 1,
        department_id INT NULL,
        name VARCHAR(255) NOT NULL,
        mentor VARCHAR(255) NULL,
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
      )
    `);

    // 4. Ensure Users Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile_number VARCHAR(20),
        password VARCHAR(255) NULL,
        role ENUM('super_admin', 'college_admin', 'coordinator', 'mentor', 'student') NOT NULL DEFAULT 'student',
        college_id INT DEFAULT 1,
        two_factor_secret VARCHAR(255) NULL,
        two_factor_enabled BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
      )
    `);

    try { await conn.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL`); } catch (_) {}
    try { await conn.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL`); } catch (_) {}
    try { await conn.query(`ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) NULL`); } catch (_) {}
    try { await conn.query(`ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT TRUE`); } catch (_) {}

    // 5. Ensure Students Table
    await conn.query(`
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
      )
    `);

    // 6. Ensure Assessments Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT DEFAULT 1,
        batch_id INT NULL,
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
      )
    `);

    // 7. Ensure Assessment Questions Table
    await conn.query(`
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
      )
    `);

    // 8. Ensure Assessment Attempts Table
    await conn.query(`
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
      )
    `);

    // 9a. Ensure Attendance Sessions Table
    await conn.query(`
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
      )
    `);

    // 9b. Ensure Attendance Records Table
    await conn.query(`
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
      )
    `);

    try {
      await conn.query(`ALTER TABLE attendance ADD COLUMN session_id INT NULL`);
    } catch (_) {}

    // 9c. Ensure Attendance Summary Table
    await conn.query(`
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
      )
    `);

    // 10. Ensure Broadcast Notifications Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS broadcast_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NULL,
        title VARCHAR(255) NOT NULL,
        desc_text TEXT NOT NULL,
        type ENUM('calendar', 'alert', 'success', 'document') DEFAULT 'calendar',
        unread BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Ensure Live Sessions Table
    await conn.query(`
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
      )
    `);

    // 12. Ensure Study Materials Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS study_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uploaded_by INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        subject VARCHAR(100) NOT NULL,
        batch VARCHAR(100) DEFAULT 'All Batches',
        type VARCHAR(50) DEFAULT 'PDF',
        file_url VARCHAR(500) NULL,
        link VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    try {
      await conn.query(`ALTER TABLE study_materials ADD COLUMN description TEXT NULL`);
    } catch (_) {}
    try {
      await conn.query(`ALTER TABLE study_materials ADD COLUMN link VARCHAR(500) NULL`);
    } catch (_) {}

    // 13. Ensure Support Tickets Table
    await conn.query(`
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
      )
    `);

    // 14. Ensure Skill Gap Analysis Table
    await conn.query(`
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
      )
    `);

    // 15. Ensure Leave Requests Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        college_id INT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'General Leave',
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        days INT DEFAULT 1,
        start_date DATE NULL,
        end_date DATE NULL,
        reason TEXT NULL,
        remarks VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
      )
    `);

    // 16. Ensure Shared Content Table (cross-dashboard sync: quiz, coding, drive, learning, broadcast)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS shared_content (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        type        ENUM('quiz','coding','drive','learning','broadcast') NOT NULL,
        title       VARCHAR(500) NOT NULL,
        description TEXT,
        data_json   TEXT,
        status      VARCHAR(50)  DEFAULT 'Active',
        college_id  INT          DEFAULT 1,
        created_by  INT          DEFAULT NULL,
        batch_name  VARCHAR(255) DEFAULT 'All Batches',
        target      VARCHAR(255) DEFAULT 'All',
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type    (type),
        INDEX idx_college (college_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 17. Ensure Secure Codes Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS secure_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL,
        college_name VARCHAR(255) NULL,
        description VARCHAR(255) NULL,
        max_uses INT DEFAULT 1,
        uses_count INT DEFAULT 0,
        status ENUM('active', 'used', 'expired', 'inactive') DEFAULT 'active',
        created_by INT NULL,
        used_by INT NULL,
        used_at DATETIME NULL,
        expires_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code_role (code, role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    try { await conn.query(`ALTER TABLE secure_codes ADD COLUMN max_uses INT DEFAULT 1`); } catch (_) {}
    try { await conn.query(`ALTER TABLE secure_codes ADD COLUMN uses_count INT DEFAULT 0`); } catch (_) {}

    // 18. Ensure Super Admin Account (training.portal0987@gmail.com)
    try {
      const [superUsers] = await conn.query(`SELECT id FROM users WHERE email = 'training.portal0987@gmail.com'`);
      if (!superUsers || superUsers.length === 0) {
        await conn.query(
          `INSERT INTO users (name, email, mobile_number, role, college_id, is_active) VALUES ('Super Admin', 'training.portal0987@gmail.com', '9876543210', 'super_admin', NULL, 1)`
        );
        console.log('[DB Init] Seeded Super Admin account for training.portal0987@gmail.com');
      } else {
        await conn.query(`UPDATE users SET role = 'super_admin' WHERE email = 'training.portal0987@gmail.com'`);
      }
    } catch (e) {
      console.warn('[DB Init] Super Admin seed notice:', e.message);
    }

    console.log('[DB Init] All database tables (including secure_codes) successfully created and verified!');

    await conn.end();
    return true;
  } catch (err) {
    console.error('[DB Init Error]', err);
    return false;
  }
}

if (process.argv[1] && process.argv[1].endsWith('init_db.js')) {
  initializeDatabase();
}
