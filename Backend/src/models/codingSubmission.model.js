import { query } from '../config/db.js';

// Fallback mock stores in case of database unavailability
const mockCodingProblems = [
  { id: 1, title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Each input has exactly one solution and the same element may not be used twice.\n\nInput: line 1 = n target, line 2 = n integers space-separated.\nOutput: the two indices space-separated.', difficulty: 'Easy', category: 'Arrays & Hashing', total_marks: 100 },
  { id: 2, title: 'Valid Palindrome', description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nInput: single line (the phrase).\nOutput: true if palindrome, else false.', difficulty: 'Easy', category: 'Two Pointers', total_marks: 100 },
  { id: 3, title: 'Longest Substring Without Repeating Characters', description: "Given a string s, find the length of the longest substring without repeating characters.\n\nInput: single line (the string).\nOutput: the length of the longest substring.", difficulty: 'Medium', category: 'Sliding Window', total_marks: 150 },
  { id: 4, title: 'Reverse Linked List', description: 'Given the head of a singly linked list, reverse it and return the reversed list.\n\nInput: line 1 = n, line 2 = n values space-separated.\nOutput: the reversed values space-separated.', difficulty: 'Easy', category: 'Linked List', total_marks: 100 },
  { id: 5, title: "Maximum Subarray (Kadane's Algorithm)", description: "Given an integer array nums, find the contiguous subarray with the largest sum, and return its sum.\n\nInput: line 1 = n, line 2 = n integers space-separated.\nOutput: maximum subarray sum.", difficulty: 'Medium', category: 'Dynamic Programming', total_marks: 150 },
  { id: 6, title: 'Binary Tree Level Order Traversal', description: "Given the root of a binary tree, return the level order traversal of its nodes' values (left to right, level by level).\n\nInput: level-order values space-separated, 'null' for empty nodes.\nOutput: each level on its own line, values space-separated.", difficulty: 'Medium', category: 'Trees & Graphs', total_marks: 150 },
  { id: 7, title: 'Merge k Sorted Lists', description: 'You are given k sorted linked lists. Merge them into one sorted list and return it.\n\nInput: line 1 = k, then k lines, each a space-separated sorted list.\nOutput: merged sorted values space-separated.', difficulty: 'Hard', category: 'Heap / Priority Queue', total_marks: 250 },
  { id: 8, title: 'Trapping Rain Water', description: 'Given n non-negative integers representing an elevation map, compute how much water it can trap after raining.\n\nInput: line 1 = n, line 2 = n heights space-separated.\nOutput: total trapped water units.', difficulty: 'Hard', category: 'Two Pointers', total_marks: 250 },
];

// Real, executable test cases for the built-in problems. Each problem gets
// 2 public + 2 hidden cases. Input/output follow the I/O contracts in the
// descriptions above so that student solutions can be judged automatically.
const mockTestCases = {
  1: [
    { input: '4 9\n2 7 11 15', expected_output: '0 1', is_hidden: false },
    { input: '3 6\n3 2 4', expected_output: '1 2', is_hidden: false },
    { input: '2 6\n3 3', expected_output: '0 1', is_hidden: true },
    { input: '4 0\n-1 0 1 2', expected_output: '0 2', is_hidden: true },
  ],
  2: [
    { input: 'A man, a plan, a canal: Panama', expected_output: 'true', is_hidden: false },
    { input: 'race a car', expected_output: 'false', is_hidden: false },
    { input: 'a.', expected_output: 'true', is_hidden: true },
    { input: 'abc', expected_output: 'false', is_hidden: true },
  ],
  3: [
    { input: 'abcabcbb', expected_output: '3', is_hidden: false },
    { input: 'bbbbb', expected_output: '1', is_hidden: false },
    { input: ' ', expected_output: '0', is_hidden: true },
    { input: 'pwwkew', expected_output: '3', is_hidden: true },
  ],
  4: [
    { input: '5\n1 2 3 4 5', expected_output: '5 4 3 2 1', is_hidden: false },
    { input: '1\n1', expected_output: '1', is_hidden: false },
    { input: '3\n1 2 3', expected_output: '3 2 1', is_hidden: true },
    { input: '4\n4 3 2 1', expected_output: '1 2 3 4', is_hidden: true },
  ],
  5: [
    { input: '2\n-2 1', expected_output: '1', is_hidden: false },
    { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expected_output: '6', is_hidden: false },
    { input: '1\n-1', expected_output: '-1', is_hidden: true },
    { input: '5\n5 4 -1 7 8', expected_output: '23', is_hidden: true },
  ],
  6: [
    { input: '3 9 20 null null 15 7', expected_output: '3\n9 20\n15 7', is_hidden: false },
    { input: '1', expected_output: '1', is_hidden: false },
    { input: '1 2 3 4 null null 5', expected_output: '1\n2 3\n4 5', is_hidden: true },
    { input: '2 1 3', expected_output: '2\n1 3', is_hidden: true },
  ],
  7: [
    { input: '3\n1 4 5\n1 3 4\n2 6', expected_output: '1 1 2 3 4 4 5 6', is_hidden: false },
    { input: '2\n1 3\n2 4', expected_output: '1 2 3 4', is_hidden: false },
    { input: '1\n1 2 3', expected_output: '1 2 3', is_hidden: true },
    { input: '2\n1\n2', expected_output: '1 2', is_hidden: true },
  ],
  8: [
    { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expected_output: '6', is_hidden: false },
    { input: '6\n4 2 0 3 2 5', expected_output: '9', is_hidden: false },
    { input: '3\n3 1 3', expected_output: '2', is_hidden: true },
    { input: '4\n0 0 0 0', expected_output: '0', is_hidden: true },
  ],
};

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
      }
    }

    // Reconcile built-in problems: update descriptions and replace placeholder
    // test cases (older seeds) with real, executable ones.
    const reconcile = async () => {
      for (const p of mockCodingProblems) {
        await updateProblemWithTestCases(p);
      }
    };
    await reconcile();

    tablesInitialized = true;
  } catch (error) {
    console.warn(`[Coding Model] Auto table initialization fallback: ${error.message}`);
  }
};

/**
 * Upsert a built-in problem's metadata and its real test cases.
 */
const updateProblemWithTestCases = async (problem) => {
  const numId = parseInt(problem.id, 10);
  try {
    await query(
      `INSERT INTO coding_problems (id, title, description, difficulty, category, total_marks)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         difficulty = VALUES(difficulty),
         category = VALUES(category),
         total_marks = VALUES(total_marks)
      `,
      [numId, problem.title, problem.description, problem.difficulty, problem.category, problem.total_marks]
    );

    const existing = await query('SELECT COUNT(*) AS cnt FROM coding_test_cases WHERE problem_id = ?', [numId]);
    const totalCount = existing && existing[0] ? parseInt(existing[0].cnt, 10) : 0;

    let needsReseed = false;
    if (totalCount === 0) {
      needsReseed = true;
    } else {
      const ph = await query(
        `SELECT COUNT(*) AS cnt FROM coding_test_cases
         WHERE problem_id = ? AND (input LIKE 'sample_input_%' OR expected_output LIKE 'sample_output_%')`,
        [numId]
      );
      const phCount = ph && ph[0] ? parseInt(ph[0].cnt, 10) : 0;

      const pubRows = await query('SELECT COUNT(*) AS cnt FROM coding_test_cases WHERE problem_id = ? AND is_hidden = 0', [numId]);
      const pubCount = pubRows && pubRows[0] ? parseInt(pubRows[0].cnt, 10) : 0;
      const hidRows = await query('SELECT COUNT(*) AS cnt FROM coding_test_cases WHERE problem_id = ? AND is_hidden = 1', [numId]);
      const hidCount = hidRows && hidRows[0] ? parseInt(hidRows[0].cnt, 10) : 0;

      // Multiple test cases required, with both public and hidden coverage.
      needsReseed = phCount > 0 || totalCount < 2 || pubCount === 0 || hidCount === 0;
    }

    if (needsReseed) {
      await query('DELETE FROM coding_test_cases WHERE problem_id = ?', [numId]);
      const cases = mockTestCases[numId] || [];
      for (const tc of cases) {
        await query(
          'INSERT INTO coding_test_cases (problem_id, input, expected_output, is_hidden, weightage) VALUES (?, ?, ?, ?, ?)',
          [numId, tc.input, tc.expected_output, tc.is_hidden ? 1 : 0, 25]
        );
      }
      console.log(`[Coding Model] Seeded ${cases.length} real test cases for problem ${numId}.`);
    }
  } catch (error) {
    console.warn(`[Coding Model] Test-case reconcile skipped for problem ${numId}: ${error.message}`);
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
