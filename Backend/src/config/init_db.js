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

    const [colleges] = await conn.query('SELECT id FROM colleges WHERE id = 1');
    if (colleges.length === 0) {
      await conn.query(`INSERT INTO colleges (id, name, code) VALUES (1, 'Vasantdada Patil Pratishthan College of Engineering', 'PVPPCOE')`);
      console.log('[DB Init] Inserted default college PVPPCOE (ID: 1)');
    }

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

    const [depts] = await conn.query('SELECT id FROM departments');
    if (depts.length === 0) {
      await conn.query(`
        INSERT INTO departments (college_id, name, code) VALUES 
        (1, 'Computer Engineering', 'COMPS'),
        (1, 'Information Technology', 'IT'),
        (1, 'Artificial Intelligence & Data Science', 'AIDS'),
        (1, 'Electronics & Telecommunication', 'EXTC')
      `);
      console.log('[DB Init] Inserted standard departments');
    }

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
    console.log('[DB Init] Batches table verified/created');

    // 4. Ensure Users Table
    await conn.query(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Ensure students table has all needed columns
    const addColIfMissing = async (table, colDef, colName) => {
      try {
        const [cols] = await conn.query('DESCRIBE ' + table);
        const exists = cols.some(c => c.Field.toLowerCase() === colName.toLowerCase());
        if (!exists) {
          await conn.query('ALTER TABLE ' + table + ' ADD COLUMN ' + colDef);
          console.log('[DB Init] Added ' + colName + ' to ' + table);
        }
      } catch (e) {
        console.warn('[DB Init] Error altering ' + table + ' for ' + colName, e.message);
      }
    };

    await addColIfMissing('students', 'college_id INT DEFAULT 1', 'college_id');
    await addColIfMissing('students', 'department_id INT NULL', 'department_id');
    await addColIfMissing('students', 'batch_id INT NULL', 'batch_id');
    await addColIfMissing('students', 'cgpa VARCHAR(10) DEFAULT "8.5"', 'cgpa');
    await addColIfMissing('students', 'skills TEXT NULL', 'skills');
    await addColIfMissing('users', 'is_active BOOLEAN DEFAULT TRUE', 'is_active');
    await addColIfMissing('users', 'college_id INT DEFAULT 1', 'college_id');

    // 7. Ensure Attendance Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT DEFAULT 1,
        batch_id INT NOT NULL,
        user_id INT NOT NULL,
        session_date DATE NOT NULL,
        status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
        marked_by INT NULL,
        remarks VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_user_batch_date (batch_id, user_id, session_date)
      )
    `);

    // 8. Ensure Practice Problems / Coding Tasks Table
    await conn.query(`
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
      )
    `);

    // 9. Ensure Broadcast Messages Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT DEFAULT 1,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        target VARCHAR(100) DEFAULT 'All Batches',
        priority VARCHAR(100) DEFAULT 'General Announcement',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
      )
    `);

    // 10. Ensure Assessments Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT DEFAULT 1,
        batch_id INT NULL,
        batch_name VARCHAR(100) DEFAULT 'All Batches',
        department_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        category VARCHAR(100) DEFAULT 'Technical Quiz',
        duration_minutes INT DEFAULT 30,
        total_marks INT DEFAULT 50,
        pass_marks INT DEFAULT 0,
        passing_percentage DECIMAL(5,2) DEFAULT 60.00,
        created_by INT NULL,
        status ENUM('draft', 'published', 'archived') DEFAULT 'published',
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 11. Ensure Assessment Questions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS assessment_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assessment_id INT NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NULL,
        option_d TEXT NULL,
        correct_option ENUM('a', 'b', 'c', 'd') NOT NULL,
        marks INT DEFAULT 10,
        explanation TEXT NULL,
        question_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
      )
    `);

    // 12. Ensure Assessment Attempts Table
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

    console.log('[DB Init] All tables (including assessments & questions) successfully created and verified in MySQL!');

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
