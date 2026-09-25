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
        location VARCHAR(255) DEFAULT 'Main Campus',
        city VARCHAR(100) DEFAULT 'Metropolis',
        type VARCHAR(100) DEFAULT 'Autonomous',
        status VARCHAR(50) DEFAULT 'Active',
        contact_email VARCHAR(255) NULL,
        contact_phone VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const colColumns = [
      "location VARCHAR(255) DEFAULT 'Main Campus'",
      "city VARCHAR(100) DEFAULT 'Metropolis'",
      "type VARCHAR(100) DEFAULT 'Autonomous'",
      "status VARCHAR(50) DEFAULT 'Active'",
      "contact_email VARCHAR(255) NULL",
      "contact_phone VARCHAR(50) NULL",
    ];
    for (const c of colColumns) {
      try { await conn.query(`ALTER TABLE colleges ADD COLUMN ${c}`); } catch (_) { }
    }

    // 2. Ensure Departments
    await conn.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        hod_name VARCHAR(100) NULL,
        hod_email VARCHAR(255) NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
      )
    `);

    try { await conn.query(`ALTER TABLE departments ADD COLUMN hod_name VARCHAR(100) NULL`); } catch (_) {}
    try { await conn.query(`ALTER TABLE departments ADD COLUMN hod_email VARCHAR(255) NULL`); } catch (_) {}
    try { await conn.query(`ALTER TABLE departments ADD COLUMN status VARCHAR(50) DEFAULT 'Active'`); } catch (_) {}

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
        gender VARCHAR(50) NULL,
        city VARCHAR(100) NULL,
        emergency_contact VARCHAR(50) NULL,
        linkedin_url VARCHAR(255) NULL,
        target_track VARCHAR(150) NULL,
        two_factor_secret VARCHAR(255) NULL,
        two_factor_enabled BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
      )
    `);

    try { await conn.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT TRUE`); } catch (_) { }
    try { await conn.query(`ALTER TABLE users ADD COLUMN gender VARCHAR(50) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE users ADD COLUMN emergency_contact VARCHAR(50) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(255) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE users ADD COLUMN target_track VARCHAR(150) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE users ADD COLUMN is_profile_updated BOOLEAN DEFAULT FALSE`); } catch (_) { }

    // 4.1 Ensure OTPs Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(20) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        gender VARCHAR(50) NULL,
        city VARCHAR(100) NULL,
        emergency_contact VARCHAR(50) NULL,
        linkedin_url VARCHAR(255) NULL,
        target_track VARCHAR(150) NULL,
        is_profile_updated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
      )
    `);

    try { await conn.query(`ALTER TABLE students ADD COLUMN gender VARCHAR(50) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE students ADD COLUMN city VARCHAR(100) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE students ADD COLUMN emergency_contact VARCHAR(50) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE students ADD COLUMN linkedin_url VARCHAR(255) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE students ADD COLUMN target_track VARCHAR(150) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE students ADD COLUMN is_profile_updated BOOLEAN DEFAULT FALSE`); } catch (_) { }

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
    } catch (_) { }

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
    } catch (_) { }
    try {
      await conn.query(`ALTER TABLE study_materials ADD COLUMN link VARCHAR(500) NULL`);
    } catch (_) { }

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

    try { await conn.query(`ALTER TABLE secure_codes ADD COLUMN max_uses INT DEFAULT 1`); } catch (_) { }
    try { await conn.query(`ALTER TABLE secure_codes ADD COLUMN uses_count INT DEFAULT 0`); } catch (_) { }

    // 18. Ensure Roadmaps Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS roadmaps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        goal_name VARCHAR(255) NOT NULL,
        milestones JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 19. Ensure Defaulters Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS defaulters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        roll_no VARCHAR(100) NOT NULL,
        batch VARCHAR(100) NOT NULL,
        attendance VARCHAR(50),
        missed_assignments VARCHAR(100),
        last_test_score VARCHAR(50),
        reason TEXT,
        risk_level VARCHAR(50) DEFAULT 'High Risk',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 20. Ensure Weekly Reports Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS weekly_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        week_label VARCHAR(100) NOT NULL,
        total_quizzes INT DEFAULT 0,
        total_coding INT DEFAULT 0,
        attendance_pct DECIMAL(5,2) DEFAULT 0.00,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 21. Ensure Interview Sessions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS interview_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        interview_type VARCHAR(100) DEFAULT 'Technical Mock',
        overall_score DECIMAL(5,2) DEFAULT 0.00,
        grade VARCHAR(50) DEFAULT 'Average',
        feedback TEXT,
        conducted_date DATE,
        status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 22. Ensure Roadmap Items Table & Column Compatibility
    await conn.query(`
      CREATE TABLE IF NOT EXISTS roadmap_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roadmap_id INT NULL,
        sequence_order INT DEFAULT 1,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status VARCHAR(50) DEFAULT 'locked',
        progress INT DEFAULT 0,
        tags JSON NULL,
        quizzes INT DEFAULT 0,
        exercises INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    try { await conn.query(`ALTER TABLE roadmap_items ADD COLUMN sequence_order INT DEFAULT 1`); } catch (_) { }
    try { await conn.query(`ALTER TABLE roadmap_items ADD COLUMN description TEXT NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE roadmap_items ADD COLUMN tags JSON NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE roadmap_items ADD COLUMN quizzes INT DEFAULT 0`); } catch (_) { }
    try { await conn.query(`ALTER TABLE roadmap_items ADD COLUMN exercises INT DEFAULT 0`); } catch (_) { }
    try { await conn.query(`ALTER TABLE roadmaps MODIFY COLUMN user_id INT NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE roadmaps MODIFY COLUMN goal_name VARCHAR(255) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE roadmaps ADD COLUMN student_id INT NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE roadmaps ADD COLUMN target_role VARCHAR(255) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE roadmaps ADD COLUMN career_track VARCHAR(255) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters ADD COLUMN student_id INT NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters ADD COLUMN user_id INT NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters ADD COLUMN attendance_score VARCHAR(50) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters ADD COLUMN overall_score DECIMAL(5,2) DEFAULT 0.00`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters ADD COLUMN reasons TEXT NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters ADD COLUMN weak_areas JSON NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN student_id INT NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN start_date DATE NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN end_date DATE NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN overall_score DECIMAL(5,2) DEFAULT 0.00`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN attendance_score VARCHAR(50) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN quiz_score DECIMAL(5,2) DEFAULT 0.00`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN coding_score DECIMAL(5,2) DEFAULT 0.00`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters MODIFY COLUMN student_name VARCHAR(255) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters MODIFY COLUMN roll_no VARCHAR(100) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters MODIFY COLUMN batch VARCHAR(100) NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters ADD COLUMN status VARCHAR(50) DEFAULT 'Needs Attention'`); } catch (_) { }
    try { await conn.query(`ALTER TABLE defaulters ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN interview_score DECIMAL(5,2) DEFAULT 0.00`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN milestones_summary JSON NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN strong_areas JSON NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN weak_areas JSON NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN suggestions JSON NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN trend_status VARCHAR(50) DEFAULT 'On Track'`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN score_delta VARCHAR(50) DEFAULT '+0%'`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN full_payload JSON NULL`); } catch (_) { }
    try { await conn.query(`ALTER TABLE weekly_reports ADD COLUMN generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`); } catch (_) { }
    // 23. Ensure Practice Problems Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS practice_problems (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT DEFAULT 1,
        batch_id INT NULL,
        batch_name VARCHAR(255) DEFAULT 'All Batches',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty VARCHAR(50) DEFAULT 'Medium',
        category VARCHAR(100) DEFAULT 'General DSA',
        tags VARCHAR(255) NULL,
        points INT DEFAULT 100,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 24. Ensure Mock Drives Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS mock_drives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        scheduled_date DATE NULL,
        college_id INT DEFAULT 1,
        eligible_batches JSON NULL,
        status VARCHAR(50) DEFAULT 'Upcoming',
        aptitude_component JSON NULL,
        coding_component JSON NULL,
        interview_component JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
      )
    `);

    // 25. Ensure Drive Participations Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS drive_participations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        drive_id INT NOT NULL,
        student_id INT NOT NULL,
        status VARCHAR(50) DEFAULT 'Completed',
        overall_score DECIMAL(5,2) DEFAULT 0.00,
        grade VARCHAR(50) DEFAULT 'B',
        aptitude_score DECIMAL(5,2) DEFAULT 0.00,
        coding_score DECIMAL(5,2) DEFAULT 0.00,
        interview_score DECIMAL(5,2) DEFAULT 0.00,
        strength_areas JSON NULL,
        weak_areas JSON NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (drive_id) REFERENCES mock_drives(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_drive_student (drive_id, student_id)
      )
    `);

    // 26. Ensure Assessment Answers Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS assessment_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_id INT NOT NULL,
        question_id INT NOT NULL,
        selected_option VARCHAR(255) NULL,
        is_correct TINYINT(1) DEFAULT 0,
        marks_awarded DECIMAL(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 27. Ensure Student Batches Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        batch_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_batch (user_id, batch_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 28. Ensure Batch Tasks Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS batch_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        topic VARCHAR(100) DEFAULT 'General Assignment',
        difficulty VARCHAR(50) DEFAULT 'Medium',
        points INT DEFAULT 100,
        deadline VARCHAR(100) NULL,
        description TEXT NULL,
        test_cases TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 29. Ensure Task Submissions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS task_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        batch_id INT NULL,
        code_submission TEXT NULL,
        status VARCHAR(50) DEFAULT 'submitted',
        marks_obtained INT DEFAULT 0,
        feedback TEXT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES batch_tasks(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 30. Ensure Student Quiz Completions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_quiz_completions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        quiz_id INT NOT NULL DEFAULT 0,
        quiz_title VARCHAR(255) DEFAULT '',
        completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_quiz (user_id, quiz_id),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 31. Ensure Mentor Assignments Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS mentor_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_name VARCHAR(100) NOT NULL,
        mentor_email VARCHAR(150) NULL,
        student_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_mentor_student (mentor_name, student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 32. Ensure Interventions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS interventions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        user_id INT NOT NULL,
        mentor_id INT DEFAULT 1,
        mentor_name VARCHAR(150) DEFAULT 'Assigned Mentor',
        interaction_date DATE NULL,
        notes TEXT NULL,
        action_taken TEXT NULL,
        recommendations TEXT NULL,
        status VARCHAR(50) DEFAULT 'Action Taken',
        next_followup DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 33. Ensure Practice Problem Submissions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS practice_problem_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        problem_id INT NOT NULL,
        user_id INT NOT NULL,
        code_submitted TEXT NULL,
        language VARCHAR(50) DEFAULT 'javascript',
        status VARCHAR(50) DEFAULT 'Solved',
        points_earned INT DEFAULT 100,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (problem_id) REFERENCES practice_problems(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 34. Ensure Interview Submissions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS interview_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        interview_type VARCHAR(100) DEFAULT 'Technical Mock',
        overall_score DECIMAL(5,2) DEFAULT 0.00,
        grade VARCHAR(50) DEFAULT 'Average',
        feedback TEXT,
        conducted_date DATE NULL,
        status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 35. Ensure Interviews Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        interview_title VARCHAR(255) DEFAULT 'Mock Interview',
        score DECIMAL(5,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 36. Ensure Milestones Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roadmap_id INT NULL,
        user_id INT NULL,
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 37. Ensure Trainings Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS trainings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'Technical',
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 38. Ensure Super Admin Account
    try {
      const superEmail = process.env.SUPER_ADMIN_EMAIL || 'super.admin0987@gmail.com';
      const superPass = process.env.SUPER_ADMIN_PASSWORD;
      const [superUsers] = await conn.query(`SELECT id FROM users WHERE email = ?`, [superEmail]);
      if (!superUsers || superUsers.length === 0) {
        await conn.query(
          `INSERT INTO users (name, email, mobile_number, password, password_hash, role, college_id, is_active) VALUES ('Super Admin', ?, '9876543210', ?, ?, 'super_admin', NULL, 1)`,
          [superEmail, superPass, superPass]
        );
        console.log(`[DB Init] Seeded Super Admin account for ${superEmail}`);
      } else {
        if (superPass) {
          await conn.query(`UPDATE users SET role = 'super_admin', password = ?, password_hash = ? WHERE email = ?`, [superPass, superPass, superEmail]);
        } else {
          await conn.query(`UPDATE users SET role = 'super_admin' WHERE email = ?`, [superEmail]);
        }
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
