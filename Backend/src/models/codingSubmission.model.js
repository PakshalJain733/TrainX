import { query } from '../config/db.js';

// Fallback mock stores in case of database unavailability
const mockCodingProblems = [
  { id: 1, title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', difficulty: 'Easy', category: 'Arrays & Hashing', total_marks: 100 },
  { id: 2, title: 'Valid Palindrome', description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.', difficulty: 'Easy', category: 'Two Pointers', total_marks: 100 },
  { id: 3, title: 'Longest Substring Without Repeating Characters', description: 'Given a string s, find the length of the longest substring without repeating characters.', difficulty: 'Medium', category: 'Sliding Window', total_marks: 150 },
  { id: 4, title: 'Reverse Linked List', description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.', difficulty: 'Easy', category: 'Linked List', total_marks: 100 },
  { id: 5, title: 'Maximum Subarray (Kadane\'s Algorithm)', description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.', difficulty: 'Medium', category: 'Dynamic Programming', total_marks: 150 },
  { id: 6, title: 'Binary Tree Level Order Traversal', description: 'Given the root of a binary tree, return the level order traversal of its nodes\' values.', difficulty: 'Medium', category: 'Trees & Graphs', total_marks: 150 },
  { id: 7, title: 'Merge k Sorted Lists', description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.', difficulty: 'Hard', category: 'Heap / Priority Queue', total_marks: 250 },
  { id: 8, title: 'Trapping Rain Water', description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.', difficulty: 'Hard', category: 'Two Pointers', total_marks: 250 },
];

const mockSubmissions = [];

let tablesInitialized = false;

/**
 * Ensure MySQL tables and initial seeds exist.
 */
export const ensureCodingTablesExist = async () => {
  if (tablesInitialized) return;
  try {
    await query(`
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
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS coding_test_cases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        problem_id INT NOT NULL,
        input LONGTEXT NOT NULL,
        expected_output LONGTEXT NOT NULL,
        is_hidden BOOLEAN DEFAULT FALSE,
        weightage INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (problem_id) REFERENCES coding_problems(id) ON DELETE CASCADE
      )
    `);

    await query(`
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
      )
    `);

    // Seed default problems if table is empty
    const rows = await query('SELECT COUNT(*) as cnt FROM coding_problems');
    if (rows && rows[0] && rows[0].cnt === 0) {
      for (const p of mockCodingProblems) {
        await query(
          'INSERT INTO coding_problems (id, title, description, difficulty, category, total_marks) VALUES (?, ?, ?, ?, ?, ?)',
          [p.id, p.title, p.description, p.difficulty, p.category, p.total_marks]
        );
        for (let i = 1; i <= 5; i++) {
          await query(
            'INSERT INTO coding_test_cases (problem_id, input, expected_output, is_hidden, weightage) VALUES (?, ?, ?, ?, ?)',
            [p.id, `sample_input_${i}`, `sample_output_${i}`, i > 2, 20]
          );
        }
      }
    }

    tablesInitialized = true;
  } catch (error) {
    console.warn(`[Coding Model] Auto table initialization fallback: ${error.message}`);
  }
};

/**
 * Find student/user by ID (verifying in MySQL users or students table)
 */
export const findStudentById = async (studentId) => {
  const numId = parseInt(studentId, 10);
  if (isNaN(numId)) return null;

  try {
    const users = await query('SELECT id, name, email, role, college_id FROM users WHERE id = ?', [numId]);
    if (users && users.length > 0) return users[0];

    const students = await query(`
      SELECT s.id as student_table_id, s.user_id, u.id, u.name, u.email, u.role, u.college_id
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [numId]);
    if (students && students.length > 0) return students[0];
  } catch (error) {
    console.warn(`[Coding Model] findStudentById fallback: ${error.message}`);
  }

  return { id: numId, name: 'Student', email: `student_${numId}@trainingportal.com`, role: 'student' };
};

/**
 * Find coding problem by ID
 */
export const findCodingProblemById = async (problemId) => {
  await ensureCodingTablesExist();
  const numId = parseInt(problemId, 10);
  if (isNaN(numId)) return null;

  try {
    const rows = await query('SELECT * FROM coding_problems WHERE id = ?', [numId]);
    if (rows && rows.length > 0) return rows[0];
  } catch (error) {
    console.warn(`[Coding Model] findCodingProblemById fallback: ${error.message}`);
  }

  return mockCodingProblems.find((p) => p.id === numId) || null;
};

/**
 * Find test cases for a problem
 */
export const findCodingTestCasesByProblemId = async (problemId) => {
  await ensureCodingTablesExist();
  const numId = parseInt(problemId, 10);
  if (isNaN(numId)) return [];

  try {
    const rows = await query('SELECT * FROM coding_test_cases WHERE problem_id = ? ORDER BY id ASC', [numId]);
    if (rows && Array.isArray(rows) && rows.length > 0) return rows;
  } catch (error) {
    console.warn(`[Coding Model] findCodingTestCasesByProblemId fallback: ${error.message}`);
  }

  return [
    { id: 1, problem_id: numId, input: 'sample_input_1', expected_output: 'sample_output_1', is_hidden: false, weightage: 20 },
    { id: 2, problem_id: numId, input: 'sample_input_2', expected_output: 'sample_output_2', is_hidden: false, weightage: 20 },
    { id: 3, problem_id: numId, input: 'sample_input_3', expected_output: 'sample_output_3', is_hidden: true, weightage: 20 },
    { id: 4, problem_id: numId, input: 'sample_input_4', expected_output: 'sample_output_4', is_hidden: true, weightage: 20 },
    { id: 5, problem_id: numId, input: 'sample_input_5', expected_output: 'sample_output_5', is_hidden: true, weightage: 20 },
  ];
};

/**
 * Create and save a coding submission attempt
 */
export const createSubmissionModel = async (submissionData) => {
  await ensureCodingTablesExist();
  const {
    student_id,
    problem_id,
    submitted_code,
    language,
    passed_test_cases,
    total_test_cases,
    score,
    marks,
    percentage,
    status,
    execution_details = null,
  } = submissionData;

  const numStudentId = parseInt(student_id, 10);
  const numProblemId = parseInt(problem_id, 10);
  const numPassed = parseInt(passed_test_cases, 10) || 0;
  const numTotal = parseInt(total_test_cases, 10) || 0;
  const numScore = parseFloat(score) || 0.00;
  const numMarks = parseFloat(marks !== undefined ? marks : score) || 0.00;
  const numPercentage = parseFloat(percentage) || 0.00;
  const executionJson = execution_details ? JSON.stringify(execution_details) : null;

  try {
    const res = await query(
      `INSERT INTO coding_submissions 
        (student_id, problem_id, submitted_code, language, passed_test_cases, total_test_cases, score, marks, percentage, status, execution_details, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        numStudentId,
        numProblemId,
        submitted_code,
        language,
        numPassed,
        numTotal,
        numScore,
        numMarks,
        numPercentage,
        status,
        executionJson,
      ]
    );

    if (res && res.insertId) {
      return await getSubmissionByIdModel(res.insertId);
    }
  } catch (error) {
    console.warn(`[Coding Model] createSubmissionModel insert fallback: ${error.message}`);
  }

  const mockSubmission = {
    id: mockSubmissions.length + 1,
    student_id: numStudentId,
    problem_id: numProblemId,
    submitted_code,
    language,
    passed_test_cases: numPassed,
    total_test_cases: numTotal,
    score: numScore,
    marks: numMarks,
    percentage: numPercentage,
    status,
    execution_details,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  mockSubmissions.push(mockSubmission);
  return mockSubmission;
};

/**
 * Get coding submission by ID
 */
export const getSubmissionByIdModel = async (id) => {
  await ensureCodingTablesExist();
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return null;

  try {
    const rows = await query(
      `SELECT cs.*,
              cp.title AS problem_title,
              cp.difficulty AS problem_difficulty,
              cp.category AS problem_category,
              cp.total_marks AS problem_total_marks,
              u.name AS student_name,
              u.email AS student_email
       FROM coding_submissions cs
       LEFT JOIN coding_problems cp ON cs.problem_id = cp.id
       LEFT JOIN users u ON cs.student_id = u.id
       WHERE cs.id = ?`,
      [numId]
    );
    if (rows && rows.length > 0) {
      const submission = rows[0];
      if (typeof submission.execution_details === 'string') {
        try {
          submission.execution_details = JSON.parse(submission.execution_details);
        } catch {
          // ignore parse error
        }
      }
      return submission;
    }
  } catch (error) {
    console.warn(`[Coding Model] getSubmissionByIdModel fallback: ${error.message}`);
  }

  const found = mockSubmissions.find((s) => s.id === numId);
  if (!found) return null;
  const problem = mockCodingProblems.find((p) => p.id === found.problem_id);
  return {
    ...found,
    problem_title: problem?.title || 'Coding Problem',
    problem_difficulty: problem?.difficulty || 'Medium',
    problem_category: problem?.category || 'Algorithms',
    problem_total_marks: problem?.total_marks || 100,
  };
};

/**
 * Get all coding submissions for a given student ID
 */
export const getStudentSubmissionsModel = async (studentId) => {
  await ensureCodingTablesExist();
  const numStudentId = parseInt(studentId, 10);
  if (isNaN(numStudentId)) return [];

  try {
    const rows = await query(
      `SELECT cs.*,
              cp.title AS problem_title,
              cp.difficulty AS problem_difficulty,
              cp.category AS problem_category,
              cp.total_marks AS problem_total_marks
       FROM coding_submissions cs
       LEFT JOIN coding_problems cp ON cs.problem_id = cp.id
       WHERE cs.student_id = ?
       ORDER BY cs.submitted_at DESC, cs.id DESC`,
      [numStudentId]
    );
    if (rows && Array.isArray(rows)) {
      return rows.map((r) => {
        if (typeof r.execution_details === 'string') {
          try {
            r.execution_details = JSON.parse(r.execution_details);
          } catch {
            // ignore
          }
        }
        return r;
      });
    }
  } catch (error) {
    console.warn(`[Coding Model] getStudentSubmissionsModel fallback: ${error.message}`);
  }

  return mockSubmissions
    .filter((s) => s.student_id === numStudentId)
    .sort((a, b) => (new Date(b.submitted_at) - new Date(a.submitted_at)))
    .map((s) => {
      const problem = mockCodingProblems.find((p) => p.id === s.problem_id);
      return {
        ...s,
        problem_title: problem?.title || 'Coding Problem',
        problem_difficulty: problem?.difficulty || 'Medium',
        problem_category: problem?.category || 'Algorithms',
        problem_total_marks: problem?.total_marks || 100,
      };
    });
};
