import { query } from '../config/db.js';

// Fallback mock stores in case of database unavailability
let mockSkillGaps = [
  {
    id: 1,
    topic: 'Database Indexing & B-Trees',
    batch: 'Batch TE-A (2026)',
    batch_id: 1,
    college_id: 1,
    deficiencyRate: '48%',
    avgScore: '52%',
    priority: 'High',
    affectedStudentsCount: 26,
    status: 'open',
  },
  {
    id: 2,
    topic: 'Dynamic Programming & Memoization',
    batch: 'Batch TE-A (2026)',
    batch_id: 1,
    college_id: 1,
    deficiencyRate: '42%',
    avgScore: '58%',
    priority: 'High',
    affectedStudentsCount: 22,
    status: 'open',
  },
  {
    id: 3,
    topic: 'REST API Authentication & JWT Security',
    batch: 'Batch TE-A (2026)',
    batch_id: 1,
    college_id: 1,
    deficiencyRate: '35%',
    avgScore: '64%',
    priority: 'Medium',
    affectedStudentsCount: 18,
    status: 'in_remedial',
  },
  {
    id: 4,
    topic: 'Graph Algorithms (BFS / DFS / Shortest Path)',
    batch: 'Batch TE-A (2026)',
    batch_id: 1,
    college_id: 1,
    deficiencyRate: '31%',
    avgScore: '66%',
    priority: 'Medium',
    affectedStudentsCount: 15,
    status: 'open',
  },
  {
    id: 5,
    topic: 'CSS Flexbox & Responsive Layouts',
    batch: 'Batch TE-A (2026)',
    batch_id: 1,
    college_id: 1,
    deficiencyRate: '16%',
    avgScore: '81%',
    priority: 'Low',
    affectedStudentsCount: 7,
    status: 'resolved',
  },
];

let mockRemedialInterventions = [];
let tablesInitialized = false;

/**
 * Ensure MySQL tables exist for skill_gaps and remedial_interventions
 */
export const ensureSkillGapTablesExist = async () => {
  if (tablesInitialized) return;
  try {
    await query(`
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await query(`
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    tablesInitialized = true;
  } catch (error) {
    console.warn(`[SkillGap Model] Ensure tables warning: ${error.message}`);
  }
};

/**
 * Retrieve batch skill gaps aggregated from assessments/coding submissions or stored records
 * Computes from REAL data, saves to skill_gaps, then returns from DB.
 */
export const getBatchSkillGapsModel = async (collegeId = null, batchId = null) => {
  await ensureSkillGapTablesExist();

  let dbAvailable = true;

  // ── 1. Compute batch-level skill gaps from REAL assessment data ──
  try {
    let assessmentSql = `
      SELECT 
        COALESCE(a.title, 'Technical Quiz') as topic,
        'Quiz & Conceptual' as category,
        a.batch_id,
        a.college_id,
        ROUND(AVG(COALESCE(aa.percentage, aa.score, 0)), 1) as avg_score,
        ROUND(SUM(CASE WHEN COALESCE(aa.percentage, aa.score, 0) < 60 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT aa.user_id), 1) as deficiency_rate,
        COUNT(DISTINCT CASE WHEN COALESCE(aa.percentage, aa.score, 0) < 60 THEN aa.user_id END) as affected_students_count
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.status != 'in_progress'
    `;
    const assessmentParams = [];
    if (collegeId) {
      assessmentSql += ' AND a.college_id = ?';
      assessmentParams.push(Number(collegeId));
    }
    if (batchId) {
      assessmentSql += ' AND a.batch_id = ?';
      assessmentParams.push(Number(batchId));
    }
    assessmentSql += ' GROUP BY a.title, a.batch_id, a.college_id';
    const assessmentRows = await query(assessmentSql, assessmentParams).catch(() => { dbAvailable = false; return []; });

    // ── 2. Compute batch-level skill gaps from REAL coding submission data ──
    let codingSql = `
      SELECT 
        cp.category as topic,
        'Coding & Implementation' as category,
        COALESCE(st.batch_id, NULL) as batch_id,
        COALESCE(st.college_id, u.college_id, 1) as college_id,
        ROUND(AVG(cs.percentage), 1) as avg_score,
        ROUND(SUM(CASE WHEN cs.percentage < 60 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT cs.student_id), 1) as deficiency_rate,
        COUNT(DISTINCT CASE WHEN cs.percentage < 60 THEN cs.student_id END) as affected_students_count
      FROM coding_submissions cs
      JOIN coding_problems cp ON cs.problem_id = cp.id
      JOIN users u ON cs.student_id = u.id
      LEFT JOIN students st ON st.user_id = u.id
      WHERE 1=1
    `;
    const codingParams = [];
    if (collegeId) {
      codingSql += ' AND COALESCE(st.college_id, u.college_id, 1) = ?';
      codingParams.push(Number(collegeId));
    }
    if (batchId) {
      codingSql += ' AND st.batch_id = ?';
      codingParams.push(Number(batchId));
    }
    codingSql += ' GROUP BY cp.category, st.batch_id, st.college_id, u.college_id';
    const codingRows = await query(codingSql, codingParams).catch((e) => {
      console.warn('[SkillGap Model] Coding batch query warning: ' + e.message);
      return [];
    });

    // ── 3. Save each computed gap into skill_gaps table (preserve history) ──
    const allComputed = [...(assessmentRows || []), ...(codingRows || [])];
    for (const row of allComputed) {
      const defRate = Math.min(100, Math.max(0, parseFloat(row.deficiency_rate) || 0));
      const avg = Math.min(100, Math.max(0, parseFloat(row.avg_score) || 0));
      const priority = defRate >= 40 || avg < 55 ? 'High' : defRate >= 25 ? 'Medium' : 'Low';
      const effCollegeId = row.college_id || collegeId || 1;
      const effBatchId = row.batch_id || null;

      try {
        const existing = await query(
          'SELECT id, status FROM skill_gaps WHERE topic = ? AND (batch_id = ? OR (batch_id IS NULL AND ? IS NULL)) AND student_id IS NULL LIMIT 1',
          [row.topic, effBatchId, effBatchId]
        );

        if (existing && existing.length > 0) {
          const preservedStatus = existing[0].status === 'in_remedial' ? 'in_remedial' : existing[0].status === 'resolved' ? 'resolved' : 'open';
          await query(
            'UPDATE skill_gaps SET deficiency_rate = ?, avg_score = ?, priority = ?, affected_students_count = ?, category = ?, updated_at = NOW() WHERE id = ?',
            [defRate, avg, priority, row.affected_students_count || 0, row.category || 'Technical', existing[0].id]
          );
        } else {
          await query(
            `INSERT INTO skill_gaps (college_id, batch_id, topic, category, deficiency_rate, avg_score, priority, affected_students_count, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
            [effCollegeId, effBatchId, row.topic, row.category || 'Technical', defRate, avg, priority, row.affected_students_count || 0]
          );
        }
      } catch (saveErr) {
        console.warn(`[SkillGap Model] Save batch gap warning: ${saveErr.message}`);
      }
    }
  } catch (error) {
    dbAvailable = false;
    console.warn(`[SkillGap Model] Compute & save batch gaps warning: ${error.message}`);
  }

  // ── 4. Read all batch-level skill gaps from skill_gaps table ──
  try {
    let sql = `
      SELECT sg.*, b.name as batch_name 
      FROM skill_gaps sg
      LEFT JOIN batches b ON sg.batch_id = b.id
      WHERE sg.student_id IS NULL
    `;
    const params = [];

    if (collegeId) {
      sql += ' AND (sg.college_id = ? OR sg.college_id IS NULL)';
      params.push(Number(collegeId));
    }
    if (batchId) {
      sql += ' AND sg.batch_id = ?';
      params.push(Number(batchId));
    }

    sql += ' ORDER BY FIELD(sg.priority, "High", "Medium", "Low"), sg.deficiency_rate DESC';

    const results = await query(sql, params);
    if (results && results.length > 0) {
      return results.map((r) => ({
        id: r.id,
        topic: r.topic,
        batch: r.batch_name || (r.batch_id ? `Batch ${r.batch_id}` : 'All Batches'),
        batchId: r.batch_id,
        collegeId: r.college_id,
        deficiencyRate: `${Math.round(r.deficiency_rate)}%`,
        avgScore: `${Math.round(r.avg_score)}%`,
        priority: r.priority,
        affectedStudentsCount: r.affected_students_count || 0,
        status: r.status,
      }));
    }
  } catch (error) {
    console.warn(`[SkillGap Model] Read batch gaps warning: ${error.message}`);
  }

  // Fallback to mock only when DB is completely unavailable
  if (!dbAvailable) {
    return mockSkillGaps.filter((g) => {
      if (collegeId && g.college_id && g.college_id !== Number(collegeId)) return false;
      if (batchId && g.batch_id && g.batch_id !== Number(batchId)) return false;
      return true;
    });
  }
  return [];
};

/**
 * Retrieve individual student weak areas and scores
 * Computes from REAL data, saves to skill_gaps, then returns.
 */
export const getStudentSkillGapsModel = async (userId) => {
  await ensureSkillGapTablesExist();
  const uId = Number(userId);

  // Resolve student's batch_id and college_id for saving
  let studentBatchId = null;
  let studentCollegeId = 1;
  try {
    const stuInfo = await query(
      'SELECT batch_id, college_id FROM students WHERE user_id = ? LIMIT 1',
      [uId]
    );
    if (stuInfo && stuInfo.length > 0) {
      studentBatchId = stuInfo[0].batch_id || null;
      studentCollegeId = stuInfo[0].college_id || 1;
    }
  } catch (e) {
    // Student info lookup failed, continue with defaults
  }

  let dbAvailable = true;
  const weakAreas = [];

  try {
    // Check assessment attempts for weak categories (<65%)
    const quizQuery = `
      SELECT 
        COALESCE(a.title, 'Technical Assessment') as topic,
        'Quiz & Conceptual' as category,
        ROUND(AVG(COALESCE(aa.percentage, aa.score, 0)), 1) as avg_score,
        COUNT(aa.id) as attempts_count,
        MIN(COALESCE(aa.percentage, aa.score, 0)) as lowest_score
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.user_id = ? AND aa.status != 'in_progress'
      GROUP BY a.title
    `;
    const quizResults = await query(quizQuery, [uId]).catch(() => { dbAvailable = false; return []; });

    // Check coding submissions for weak categories (<65%)
    const codingQuery = `
      SELECT 
        cp.category as topic,
        'Coding & Implementation' as category,
        ROUND(AVG(cs.percentage), 1) as avg_score,
        COUNT(cs.id) as attempts_count,
        SUM(CASE WHEN cs.status IN ('passed', 'accepted') THEN 1 ELSE 0 END) as passed_count
      FROM coding_submissions cs
      JOIN coding_problems cp ON cs.problem_id = cp.id
      WHERE cs.student_id = ?
      GROUP BY cp.category
    `;
    const codingResults = await query(codingQuery, [uId]).catch(() => { dbAvailable = false; return []; });

    // Collect all weak quiz topics and save to skill_gaps
    const quizWeakTopics = [];
    if (quizResults && quizResults.length > 0) {
      for (const qr of quizResults) {
        const avg = parseFloat(qr.avg_score) || 0;
        if (avg < 65) {
          const deficiencyRate = Math.min(100, Math.max(0, 100 - avg));
          const priority = avg < 50 ? 'High' : avg < 60 ? 'Medium' : 'Low';
          quizWeakTopics.push({ qr, avg, deficiencyRate, priority });
          weakAreas.push({
            topic: qr.topic || 'Technical Assessment',
            category: qr.category || 'Quiz & Conceptual',
            avgScore: `${Math.round(avg)}%`,
            severity: avg < 50 ? 'Critical' : 'Moderate',
            recommendation: `Review fundamental concepts in ${qr.topic} and retake unit quizzes`,
          });
        }
      }
    }

    // Collect all weak coding topics and save to skill_gaps
    const codingWeakTopics = [];
    if (codingResults && codingResults.length > 0) {
      for (const cr of codingResults) {
        const avg = parseFloat(cr.avg_score) || 0;
        if (avg < 65) {
          const deficiencyRate = Math.min(100, Math.max(0, 100 - avg));
          const priority = avg < 50 ? 'High' : avg < 60 ? 'Medium' : 'Low';
          codingWeakTopics.push({ cr, avg, deficiencyRate, priority });
          weakAreas.push({
            topic: cr.topic || 'Data Structures & Algorithms',
            category: 'Coding & Implementation',
            avgScore: `${Math.round(avg)}%`,
            severity: avg < 50 ? 'Critical' : 'Moderate',
            recommendation: `Practice 3 medium problems for ${cr.topic} in Practice Arena`,
          });
        }
      }
    }

    // Save all student skill gaps to skill_gaps table with proper await
    for (const { qr, avg, deficiencyRate, priority } of quizWeakTopics) {
      try {
        const existing = await query(
          'SELECT id FROM skill_gaps WHERE topic = ? AND student_id = ? LIMIT 1',
          [qr.topic, uId]
        );
        if (existing && existing.length > 0) {
          await query(
            'UPDATE skill_gaps SET deficiency_rate = ?, avg_score = ?, priority = ?, category = ?, updated_at = NOW() WHERE id = ?',
            [deficiencyRate, avg, priority, qr.category || 'Quiz & Conceptual', existing[0].id]
          );
        } else {
          await query(
            `INSERT INTO skill_gaps (college_id, batch_id, student_id, topic, category, deficiency_rate, avg_score, priority, affected_students_count, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'open')`,
            [studentCollegeId, studentBatchId, uId, qr.topic, qr.category || 'Quiz & Conceptual', deficiencyRate, avg, priority]
          );
        }
      } catch (e) {
        console.warn(`[SkillGap Model] Save student quiz gap warning: ${e.message}`);
      }
    }

    for (const { cr, avg, deficiencyRate, priority } of codingWeakTopics) {
      try {
        const existing = await query(
          'SELECT id FROM skill_gaps WHERE topic = ? AND student_id = ? LIMIT 1',
          [cr.topic, uId]
        );
        if (existing && existing.length > 0) {
          await query(
            'UPDATE skill_gaps SET deficiency_rate = ?, avg_score = ?, priority = ?, category = ?, updated_at = NOW() WHERE id = ?',
            [deficiencyRate, avg, priority, 'Coding & Implementation', existing[0].id]
          );
        } else {
          await query(
            `INSERT INTO skill_gaps (college_id, batch_id, student_id, topic, category, deficiency_rate, avg_score, priority, affected_students_count, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'open')`,
            [studentCollegeId, studentBatchId, uId, cr.topic, 'Coding & Implementation', deficiencyRate, avg, priority]
          );
        }
      } catch (e) {
        console.warn(`[SkillGap Model] Save student coding gap warning: ${e.message}`);
      }
    }

    if (weakAreas.length > 0) {
      return weakAreas;
    }
  } catch (error) {
    dbAvailable = false;
    console.warn(`[SkillGap Model] Student gap lookup warning: ${error.message}`);
  }

  // Only fall back to mock when DB is completely unavailable
  if (!dbAvailable) {
    return [
      {
        topic: 'SQL Indexing & Query Optimization',
        category: 'Database Systems',
        avgScore: '54%',
        severity: 'Moderate',
        recommendation: 'Complete Transactions & Indexing practice module',
      },
      {
        topic: 'FastAPI / Express Validation & Middleware',
        category: 'Backend Architecture',
        avgScore: '48%',
        severity: 'Critical',
        recommendation: 'Build a JWT auth and validation demo project',
      },
      {
        topic: 'Dynamic Programming (Knapsack & Subsequences)',
        category: 'Algorithms',
        avgScore: '40%',
        severity: 'Critical',
        recommendation: 'Solve 3 top DP patterns in Practice Problems Arena',
      },
    ];
  }

  // DB works but student has no weak areas — return empty
  return [];
};

/**
 * Save a new remedial intervention to database or mock store
 */
export const saveRemedialInterventionModel = async (interventionData) => {
  await ensureSkillGapTablesExist();
  const {
    college_id = 1,
    skill_gap_id = null,
    batch_id = null,
    student_id = null,
    topic,
    title,
    description,
    assignment_details = {},
    recommended_problems = [],
    recommended_materials = [],
    created_by = null,
    status = 'assigned',
  } = interventionData;

  try {
    const res = await query(
      `INSERT INTO remedial_interventions 
        (college_id, skill_gap_id, batch_id, student_id, topic, title, description, assignment_details, recommended_problems, recommended_materials, created_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        college_id,
        skill_gap_id,
        batch_id,
        student_id,
        topic,
        title,
        description,
        JSON.stringify(assignment_details),
        JSON.stringify(recommended_problems),
        JSON.stringify(recommended_materials),
        created_by,
        status,
      ]
    );

    if (res && res.insertId) {
      // If linked to a skill gap, update status to in_remedial
      if (skill_gap_id) {
        await query('UPDATE skill_gaps SET status = "in_remedial" WHERE id = ?', [skill_gap_id]).catch(() => {});
      }
      return { id: res.insertId, ...interventionData };
    }
  } catch (error) {
    console.warn(`[SkillGap Model] Save remedial intervention warning: ${error.message}`);
  }

  // Update in mock store
  if (skill_gap_id) {
    const gap = mockSkillGaps.find((g) => g.id === Number(skill_gap_id));
    if (gap) gap.status = 'in_remedial';
  }

  const newIntervention = {
    id: mockRemedialInterventions.length + 1,
    ...interventionData,
    created_at: new Date().toISOString(),
  };
  mockRemedialInterventions.push(newIntervention);
  return newIntervention;
};

/**
 * Retrieve all remedial interventions
 */
export const getRemedialInterventionsModel = async (collegeId = null, batchId = null) => {
  await ensureSkillGapTablesExist();
  try {
    let sql = 'SELECT * FROM remedial_interventions WHERE 1=1';
    const params = [];
    if (collegeId) {
      sql += ' AND (college_id = ? OR college_id IS NULL)';
      params.push(Number(collegeId));
    }
    if (batchId) {
      sql += ' AND batch_id = ?';
      params.push(Number(batchId));
    }
    sql += ' ORDER BY id DESC';

    const rows = await query(sql, params);
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        ...r,
        assignment_details: typeof r.assignment_details === 'string' ? JSON.parse(r.assignment_details) : r.assignment_details,
        recommended_problems: typeof r.recommended_problems === 'string' ? JSON.parse(r.recommended_problems) : r.recommended_problems,
        recommended_materials: typeof r.recommended_materials === 'string' ? JSON.parse(r.recommended_materials) : r.recommended_materials,
      }));
    }
  } catch (error) {
    console.warn(`[SkillGap Model] Fetch interventions warning: ${error.message}`);
  }

  return mockRemedialInterventions;
};

// Get stored skill gap analysis for a student from MySQL DB
export const getSkillGapByUserId = async (userId) => {
  const numId = parseInt(userId, 10);
  if (!numId) return null;

  try {
    const rows = await query('SELECT * FROM skill_gap_analysis WHERE user_id = ?', [numId]);
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        ...r,
        weak_areas: typeof r.weak_areas === 'string' ? JSON.parse(r.weak_areas) : (r.weak_areas || []),
        all_evaluated_skills: typeof r.all_evaluated_skills === 'string' ? JSON.parse(r.all_evaluated_skills) : (r.all_evaluated_skills || []),
        suggestions: typeof r.suggestions === 'string' ? JSON.parse(r.suggestions) : (r.suggestions || []),
      };
    }
  } catch (error) {
    console.warn(`[Skill Gap Model] Query error: ${error.message}`);
  }
  return null;
};

// Save or update skill gap analysis result in MySQL DB
export const saveSkillGapAnalysis = async (userId, data) => {
  const numId = parseInt(userId, 10);
  if (!numId) return;

  const { overall_status, weak_areas_count, weak_areas, all_evaluated_skills, suggestions } = data;

  const weakAreasJson = JSON.stringify(weak_areas || []);
  const allSkillsJson = JSON.stringify(all_evaluated_skills || []);
  const suggestionsJson = JSON.stringify(suggestions || []);

  try {
    // Check if user exists before inserting foreign key
    const userCheck = await query('SELECT id FROM users WHERE id = ?', [numId]);
    if (userCheck && userCheck.length > 0) {
      await query(
        `INSERT INTO skill_gap_analysis 
          (user_id, overall_status, weak_areas_count, weak_areas, all_evaluated_skills, suggestions)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          overall_status = VALUES(overall_status),
          weak_areas_count = VALUES(weak_areas_count),
          weak_areas = VALUES(weak_areas),
          all_evaluated_skills = VALUES(all_evaluated_skills),
          suggestions = VALUES(suggestions)`,
        [numId, overall_status, weak_areas_count, weakAreasJson, allSkillsJson, suggestionsJson]
      );
    }
  } catch (error) {
    console.warn(`[Skill Gap Model] Insert/Update warning: ${error.message}`);
  }
};
