import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getBroadcastsModel } from '../models/broadcast.model.js';
import { getShortDept, isSameDepartment } from '../utils/departmentHelper.js';

/**
 * Resolve the coordinator's scoped department(s) and college.
 * Strictly separates academic branches (e.g. CS vs ECS) without substring leakage.
 */
const resolveCoordinatorScope = async (userId, collegeId, reqDept = null) => {
  let deptIds = [];
  let deptNames = [];
  let detectedDept = reqDept && String(reqDept).trim() && String(reqDept).toLowerCase() !== 'all'
    ? String(reqDept).trim()
    : null;

  // 1. Check coordinator_departments table
  if (userId) {
    try {
      const deptRows = await query(
        `SELECT cd.department_id, d.name, d.code
         FROM coordinator_departments cd
         JOIN departments d ON cd.department_id = d.id
         WHERE cd.coordinator_id = ?`,
        [userId]
      );
      if (Array.isArray(deptRows) && deptRows.length > 0) {
        deptRows.forEach((d) => {
          if (d.department_id && !deptIds.includes(d.department_id)) deptIds.push(d.department_id);
          if (d.name && !deptNames.includes(d.name)) deptNames.push(d.name);
          if (d.code && !deptNames.includes(d.code)) deptNames.push(d.code);
          if (!detectedDept) detectedDept = d.code || d.name;
        });
      }
    } catch (_) {}
  }

  // 2. Check users table
  if (userId) {
    try {
      const uRows = await query(`SELECT department, department_id, college_id FROM users WHERE id = ?`, [userId]);
      if (uRows && uRows[0]) {
        const uDept = (uRows[0].department || '').trim();
        const uDeptId = uRows[0].department_id ? parseInt(uRows[0].department_id, 10) : null;
        if (uDeptId && !deptIds.includes(uDeptId)) deptIds.push(uDeptId);
        if (uDept && !deptNames.includes(uDept)) deptNames.push(uDept);
        if (!detectedDept && (uDept || uDeptId)) detectedDept = uDept || String(uDeptId);
      }
    } catch (_) {}
  }

  // Canonical branch code: 'CS', 'ECS', 'IT', 'AIDS', 'EXTC', 'MECH', etc.
  const targetShort = detectedDept
    ? getShortDept(detectedDept)
    : deptNames.length > 0
    ? getShortDept(deptNames[0])
    : null;

  // Strictly match college departments belonging only to this exact branch family
  if (targetShort) {
    try {
      const allCollegeDepts = await query(
        `SELECT id, name, code FROM departments WHERE college_id = ? OR college_id IS NULL`,
        [collegeId || 1]
      );
      allCollegeDepts.forEach((d) => {
        const dShortName = getShortDept(d.name);
        const dShortCode = getShortDept(d.code);
        if (dShortName === targetShort || dShortCode === targetShort) {
          if (d.id && !deptIds.includes(d.id)) deptIds.push(d.id);
          if (d.name && !deptNames.includes(d.name)) deptNames.push(d.name);
          if (d.code && !deptNames.includes(d.code)) deptNames.push(d.code);
        }
      });
    } catch (_) {}
  }

  const primaryDeptName =
    deptNames.find((n) => n && n.length > 3) ||
    deptNames[0] ||
    (targetShort === 'CS'
      ? 'Computer Engineering'
      : targetShort === 'ECS'
      ? 'Electronics & Computer Science'
      : targetShort === 'IT'
      ? 'Information Technology'
      : targetShort === 'AIDS'
      ? 'Artificial Intelligence & Data Science'
      : targetShort || null);

  return {
    collegeId: collegeId || 1,
    deptIds,
    deptNames,
    targetShort,
    hasDept: Boolean(targetShort || deptIds.length > 0 || deptNames.length > 0),
    deptList: deptIds.length > 0 ? deptIds.join(',') : '-1',
    primaryDeptName,
  };
};

/**
 * Helper to construct SQL where clauses for students strictly adhering to coordinator's branch
 */
const buildDeptStudentConditions = (scope, sTableAlias = 's') => {
  const conds = [];
  const params = [];
  if (scope.deptIds.length > 0) {
    conds.push(`${sTableAlias}.department_id IN (${scope.deptIds.map(() => '?').join(',')})`);
    params.push(...scope.deptIds);
  }
  if (scope.targetShort === 'CS') {
    conds.push(`(
      LOWER(${sTableAlias}.department) IN ('computer engineering', 'computer science', 'cs', 'ce', 'cse')
      OR LOWER(${sTableAlias}.department) LIKE '%computer%'
    )`);
  } else if (scope.targetShort === 'ECS') {
    conds.push(`(
      LOWER(${sTableAlias}.department) IN ('electronics & computer science', 'electronics and computer science', 'ecs')
      OR LOWER(${sTableAlias}.department) LIKE '%electronic%'
      OR LOWER(${sTableAlias}.department) = 'ecs'
    )`);
  } else if (scope.targetShort === 'IT') {
    conds.push(`(
      LOWER(${sTableAlias}.department) IN ('information technology', 'it')
      OR LOWER(${sTableAlias}.department) LIKE '%information tech%'
    )`);
  } else if (scope.targetShort === 'AIDS') {
    conds.push(`(
      LOWER(${sTableAlias}.department) IN ('artificial intelligence & data science', 'artificial intelligence and data science', 'aids', 'ai&ds', 'ai-ds')
      OR LOWER(${sTableAlias}.department) LIKE '%data science%'
      OR LOWER(${sTableAlias}.department) LIKE '%artificial intelligence%'
    )`);
  } else if (scope.deptNames.length > 0) {
    scope.deptNames.forEach((dName) => {
      conds.push(`LOWER(${sTableAlias}.department) = ?`);
      params.push(dName.toLowerCase().trim());
    });
  }

  let sqlClause = conds.length > 0 ? `(${conds.join(' OR ')})` : '';
  if (scope.targetShort === 'CS') {
    sqlClause += (sqlClause ? ' AND ' : '') + `(LOWER(COALESCE(${sTableAlias}.department, '')) NOT LIKE '%electronic%' AND LOWER(COALESCE(${sTableAlias}.department, '')) != 'ecs')`;
  }
  return { sqlClause, params };
};

/**
 * GET /api/v1/coordinator/overview
 * Real data overview for department coordinator
 */
export const getCoordinatorOverview = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(userId, collegeId, req.query?.department);

    // Fetch user details
    const [user] = await query(
      `SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.department, c.name as college_name
       FROM users u
       LEFT JOIN colleges c ON u.college_id = c.id
       WHERE u.id = ?`,
      [userId]
    );

    const departmentName = scope.primaryDeptName || user?.department || 'Engineering';

    // Real stats: Strictly scoped students
    let studentSql = `SELECT COUNT(DISTINCT u.id) as count FROM users u JOIN students s ON u.id = s.user_id WHERE (u.college_id = ? OR u.college_id IS NULL) AND u.role = 'student'`;
    const studentParams = [collegeId];
    if (scope.hasDept) {
      const { sqlClause, params: deptParams } = buildDeptStudentConditions(scope, 's');
      if (sqlClause) {
        studentSql += ` AND ${sqlClause}`;
        studentParams.push(...deptParams);
      }
    }
    const [studentCount] = await query(studentSql, studentParams);

    let batchSql = `SELECT COUNT(*) as count FROM batches WHERE (college_id = ? OR college_id IS NULL) AND status = 'active'`;
    const batchParams = [collegeId];
    if (scope.hasDept && scope.deptIds.length > 0) {
      batchSql += ` AND department_id IN (${scope.deptList})`;
    }
    const [batchCount] = await query(batchSql, batchParams);

    // Filter mentors strictly assigned to / belonging to this branch
    let mentorCount = 0;
    try {
      const allMentorsSql = `
        SELECT u.id, u.department as user_department, u.department_id as user_department_id,
               GROUP_CONCAT(DISTINCT b.name SEPARATOR ', ') as assignedBatch,
               GROUP_CONCAT(DISTINCT d.name SEPARATOR ', ') as batch_dept_names,
               (
                 SELECT GROUP_CONCAT(DISTINCT s2.department SEPARATOR ', ')
                 FROM mentor_student_assignments msa4
                 JOIN students s2 ON msa4.student_id = s2.user_id
                 WHERE msa4.mentor_id = u.id
               ) as student_departments
        FROM users u
        LEFT JOIN batches b ON (
          b.mentor = u.name 
          OR b.trainer = u.name 
          OR b.id IN (SELECT msa2.batch_id FROM mentor_student_assignments msa2 WHERE msa2.mentor_id = u.id)
        )
        LEFT JOIN departments d ON b.department_id = d.id
        WHERE (u.college_id = ? OR u.college_id IS NULL) AND u.role = 'mentor'
        GROUP BY u.id`;
      const allMentors = await query(allMentorsSql, [collegeId]);
      const targetShort = scope.targetShort;
      const deptMentors = targetShort
        ? (allMentors || []).filter((m) => {
            if (m.user_department && isSameDepartment(m.user_department, targetShort)) return true;
            if (m.user_department_id && scope.deptIds.includes(Number(m.user_department_id))) return true;
            if (m.batch_dept_names && m.batch_dept_names.split(',').some((name) => isSameDepartment(name, targetShort))) return true;
            if (m.assignedBatch && m.assignedBatch.split(',').some((b) => isSameDepartment(b, targetShort))) return true;
            if (m.student_departments && m.student_departments.split(',').some((d) => isSameDepartment(d, targetShort))) return true;
            return false;
          })
        : allMentors;
      mentorCount = deptMentors.length;
    } catch (_) {}

    // Average attendance for department students
    let attSql = `SELECT ROUND(AVG(att.attendance_percentage), 1) as avg_attendance
       FROM attendance_summary att
       JOIN users u ON att.user_id = u.id
       JOIN students s ON u.id = s.user_id
       WHERE (u.college_id = ? OR u.college_id IS NULL)`;
    const attParams = [collegeId];
    if (scope.hasDept) {
      const { sqlClause, params: deptParams } = buildDeptStudentConditions(scope, 's');
      if (sqlClause) {
        attSql += ` AND ${sqlClause}`;
        attParams.push(...deptParams);
      }
    }
    const [attData] = await query(attSql, attParams);

    // High risk students in department
    let highRiskSql = `SELECT u.id, u.name, u.email, s.roll_number, s.department, b.name as batch_name,
              COALESCE(att.attendance_percentage, 0) as attendance,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_quiz_score
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       WHERE (u.college_id = ? OR u.college_id IS NULL) AND u.role = 'student'`;
    const highRiskParams = [collegeId];
    if (scope.hasDept) {
      const { sqlClause, params: deptParams } = buildDeptStudentConditions(scope, 's');
      if (sqlClause) {
        highRiskSql += ` AND ${sqlClause}`;
        highRiskParams.push(...deptParams);
      }
    }
    highRiskSql += ` GROUP BY u.id, s.id, b.id, att.id HAVING attendance < 75 OR avg_quiz_score < 50 LIMIT 10`;
    const highRiskStudents = await query(highRiskSql, highRiskParams);

    const statsList = [
      { id: 'students', label: 'Enrolled Students', value: String(studentCount?.count || 0), hint: `Active in ${departmentName}` },
      { id: 'batches', label: 'Managed Batches', value: `${batchCount?.count || 0} Batches`, hint: 'Current active batches' },
      { id: 'mentors', label: 'Faculty & Mentors', value: `${mentorCount} Trainers`, hint: `Assigned to ${departmentName}` },
      { id: 'attendance', label: 'Attendance Rate', value: `${attData?.avg_attendance || 0}%`, hint: 'Department average' },
    ];

    return sendSuccess(res, 'Coordinator overview retrieved successfully', {
      profile: {
        id: user?.id,
        name: user?.name || 'Coordinator',
        email: user?.email,
        phone: user?.mobile_number || '',
        role: 'Department Coordinator',
        department: departmentName,
        college: user?.college_name || 'Engineering College',
      },
      stats: statsList,
      highRiskStudents: (highRiskStudents || []).map((s) => ({
        id: `st-${s.id}`,
        studentId: s.id,
        name: s.name,
        rollNumber: s.roll_number,
        batch: s.batch_name || 'General Batch',
        attendance: `${s.attendance}%`,
        avgScore: `${s.avg_quiz_score}%`,
        riskStatus: s.attendance < 65 ? 'High Risk' : 'Moderate Risk',
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/batches
 */
export const getCoordinatorBatches = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId, req.query?.department);

    let sql = `
      SELECT b.id, b.name, b.schedule, b.status, b.year, b.division, b.mentor,
              COUNT(DISTINCT s.id) as enrolled_students,
              COALESCE(ROUND(AVG(att.attendance_percentage), 1), 0) as avg_attendance,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_quiz_score
       FROM batches b
       LEFT JOIN students s ON b.id = s.batch_id
       LEFT JOIN attendance_summary att ON s.user_id = att.user_id
       LEFT JOIN assessment_attempts aa ON s.user_id = aa.user_id
       WHERE (b.college_id = ? OR b.college_id IS NULL)`;
    const params = [scope.collegeId];
    if (scope.hasDept && scope.deptIds.length > 0) {
      sql += ` AND b.department_id IN (${scope.deptList})`;
    }
    sql += ` GROUP BY b.id ORDER BY b.id DESC`;

    const batches = await query(sql, params);

    return sendSuccess(res, 'Batches retrieved successfully', {
      batches: batches.map((b) => ({
        id: b.id,
        name: b.name,
        schedule: b.schedule || 'Regular Schedule',
        mentor: b.mentor || 'Assigned Faculty',
        status: b.status === 'active' ? 'Active' : 'Inactive',
        enrolledStudents: b.enrolled_students || 0,
        avgAttendance: parseFloat(b.avg_attendance) || 0,
        avgQuizScore: parseFloat(b.avg_quiz_score) || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/students
 * Strictly returns students belonging only to the coordinator's department
 */
export const getCoordinatorStudents = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const reqDept = req.query?.department || req.query?.dept;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId, reqDept);

    let sql = `
      SELECT u.id as student_id, u.name, u.email, u.mobile_number,
             s.roll_number, s.department, s.department_id, s.target_track, s.cgpa,
             b.name as batch_name,
             (
               SELECT ROUND(AVG(CASE WHEN LOWER(att.status) = 'present' THEN 100 ELSE 0 END), 0)
               FROM attendance att
               WHERE att.user_id = u.id
             ) as attendance_from_table,
             (
               SELECT ROUND(atts.attendance_percentage, 0)
               FROM attendance_summary atts
               WHERE atts.user_id = u.id
               LIMIT 1
             ) as attendance_from_summary,
             (
               SELECT ROUND(AVG(aa.percentage), 0)
               FROM assessment_attempts aa
               WHERE aa.user_id = u.id
             ) as avg_assessment_score,
             (
               SELECT ROUND(AVG(iv.overall_score), 0)
               FROM interview_submissions iv
               WHERE iv.user_id = u.id
             ) as avg_interview_score,
             (
               SELECT COALESCE(r.target_role, r.career_track, 'Fullstack Web Development')
                FROM roadmaps r
                WHERE (r.student_id = u.id OR r.student_id = s.id)
                ORDER BY r.id DESC
                LIMIT 1
             ) as roadmap_title
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE u.role = 'student'`;

    const params = [];
    if (scope.collegeId) {
      sql += ` AND (u.college_id = ? OR u.college_id IS NULL)`;
      params.push(scope.collegeId);
    }

    if (scope.hasDept) {
      const { sqlClause, params: deptParams } = buildDeptStudentConditions(scope, 's');
      if (sqlClause) {
        sql += ` AND ${sqlClause}`;
        params.push(...deptParams);
      }
    }

    sql += ` GROUP BY u.id, s.id, b.id ORDER BY u.name ASC`;

    const students = await query(sql, params);

    // In-memory filter as absolute guarantee against cross-branch bleed (e.g. CS vs ECS)
    const filteredStudents = scope.targetShort
      ? (students || []).filter((s) => {
          if (s.department) {
            return isSameDepartment(s.department, scope.targetShort);
          }
          if (s.department_id && scope.deptIds.length > 0) {
            return scope.deptIds.includes(Number(s.department_id));
          }
          return false;
        })
      : students;

    const formatted = (filteredStudents || []).map((s) => {
      const rawAtt = s.attendance_from_table !== null && s.attendance_from_table !== undefined
        ? s.attendance_from_table
        : s.attendance_from_summary;
      const attVal = rawAtt !== null && rawAtt !== undefined && !isNaN(Number(rawAtt))
        ? Number(rawAtt)
        : null;
      const scoreVal = s.avg_assessment_score !== null && s.avg_assessment_score !== undefined && !isNaN(Number(s.avg_assessment_score))
        ? Number(s.avg_assessment_score)
        : null;
      const interviewVal = s.avg_interview_score !== null && s.avg_interview_score !== undefined && !isNaN(Number(s.avg_interview_score))
        ? Number(s.avg_interview_score)
        : null;

      let riskStatus = 'Good';
      if (attVal !== null || scoreVal !== null) {
        const att = attVal ?? 100;
        const scr = scoreVal ?? 100;
        if (att < 65 || scr < 45) riskStatus = 'High Risk';
        else if (att < 75 || scr < 60) riskStatus = 'Moderate';
        else if (att >= 90 && scr >= 80) riskStatus = 'Top Performer';
      }

      return {
        id: `st-${s.student_id}`,
        studentId: s.student_id,
        userId: s.student_id,
        name: s.name,
        email: s.email,
        phone: s.mobile_number || '—',
        rollNo: s.roll_number || '—',
        rollNumber: s.roll_number || '—',
        department: s.department || scope.primaryDeptName || 'Engineering',
        batch: s.batch_name || 'Unassigned',
        attendance: attVal !== null ? `${attVal}%` : '—',
        attendanceNum: attVal,
        avgScore: scoreVal !== null ? `${scoreVal}%` : '—',
        quizScore: scoreVal !== null ? `${scoreVal}%` : '—',
        interviewScore: interviewVal !== null ? `${interviewVal}%` : '—',
        selectedGoalName: s.roadmap_title || s.target_track || null,
        riskStatus,
        cgpa: s.cgpa || '—',
      };
    });

    return sendSuccess(res, 'Students retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/mentors
 * Strictly returns only mentors assigned to or belonging to coordinator's branch
 */
export const getCoordinatorMentors = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const reqDept = req.query?.department || req.query?.dept;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId, reqDept);

    let sql = `
      SELECT u.id, u.name, u.email, u.mobile_number, u.target_track as specialization,
             u.department as user_department, u.department_id as user_department_id,
             GROUP_CONCAT(DISTINCT b.name SEPARATOR ', ') as assignedBatch,
             GROUP_CONCAT(DISTINCT b.department_id) as batch_dept_ids,
             GROUP_CONCAT(DISTINCT d.name SEPARATOR ', ') as batch_dept_names,
             GROUP_CONCAT(DISTINCT d.code SEPARATOR ', ') as batch_dept_codes,
             COALESCE((
               SELECT COUNT(DISTINCT msa.student_id)
               FROM mentor_student_assignments msa
               WHERE msa.mentor_id = u.id
             ), 0) as studentsCount,
             (
               SELECT GROUP_CONCAT(DISTINCT s2.department SEPARATOR ', ')
               FROM mentor_student_assignments msa4
               JOIN students s2 ON msa4.student_id = s2.user_id
               WHERE msa4.mentor_id = u.id
             ) as student_departments
      FROM users u
      LEFT JOIN batches b ON (
        b.mentor = u.name 
        OR b.trainer = u.name 
        OR b.id IN (SELECT msa2.batch_id FROM mentor_student_assignments msa2 WHERE msa2.mentor_id = u.id)
      )
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE (u.college_id = ? OR u.college_id IS NULL) AND u.role = 'mentor'
      GROUP BY u.id
      ORDER BY u.name ASC`;

    const mentors = await query(sql, [scope.collegeId]);

    const targetShort = scope.targetShort;
    const filteredMentors = targetShort
      ? (mentors || []).filter((m) => {
          // 1. Direct user department
          if (m.user_department && isSameDepartment(m.user_department, targetShort)) return true;
          if (m.user_department_id && scope.deptIds.includes(Number(m.user_department_id))) return true;

          // 2. Batch department names or codes
          if (m.batch_dept_names && m.batch_dept_names.split(',').some((name) => isSameDepartment(name, targetShort))) {
            return true;
          }
          if (m.batch_dept_codes && m.batch_dept_codes.split(',').some((code) => isSameDepartment(code, targetShort))) {
            return true;
          }

          // 3. Batch names
          if (m.assignedBatch) {
            const batchNames = m.assignedBatch.split(',').map((s) => s.trim());
            if (batchNames.some((bName) => isSameDepartment(bName, targetShort))) return true;
          }

          // 4. Assigned student departments
          if (m.student_departments) {
            const studentDepts = m.student_departments.split(',').map((s) => s.trim());
            if (studentDepts.some((dept) => isSameDepartment(dept, targetShort))) return true;
          }

          return false;
        })
      : mentors;

    const formattedMentors = (filteredMentors || []).map((m) => {
      let deptName = scope.primaryDeptName || 'Engineering';
      if (m.user_department && isSameDepartment(m.user_department, targetShort)) {
        deptName = m.user_department;
      } else if (m.batch_dept_names) {
        const matching = m.batch_dept_names.split(',').map((s) => s.trim()).find((d) => isSameDepartment(d, targetShort));
        if (matching) deptName = matching;
      }

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        mobile_number: m.mobile_number,
        specialization: m.specialization || 'Full Stack Software Engineering',
        department: deptName,
        assignedBatch: m.assignedBatch || 'Unassigned',
        studentsCount: m.studentsCount || 0,
        status: 'Active',
      };
    });

    return sendSuccess(res, 'Mentors retrieved successfully', { mentors: formattedMentors });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/coordinator/mentors
 * Add or assign a new mentor within coordinator's branch
 */
export const createCoordinatorMentor = async (req, res, next) => {
  try {
    const { name, email, specialization, assignedBatch, department } = req.body;
    if (!name || !email) {
      return sendError(res, 'Name and email are required', 400);
    }
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId, req.query?.department);
    const mentorDept = department || scope.primaryDeptName || 'Computer Engineering';

    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    let mentorId;
    if (existing) {
      mentorId = existing.id;
      await query('UPDATE users SET role = ?, department = ?, college_id = ? WHERE id = ?', ['mentor', mentorDept, collegeId, mentorId]);
    } else {
      const result = await query(
        'INSERT INTO users (name, email, role, department, college_id, password) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, 'mentor', mentorDept, collegeId, '$2a$10$abcdefghijklmnopqrstuu']
      );
      mentorId = result.insertId;
    }

    if (assignedBatch && assignedBatch !== 'Unassigned') {
      await query('UPDATE batches SET mentor = ? WHERE name = ? AND (college_id = ? OR college_id IS NULL)', [name, assignedBatch, collegeId]);
    }

    return sendSuccess(res, 'Mentor created/assigned successfully', {
      id: mentorId,
      name,
      email,
      department: mentorDept,
      assignedBatch: assignedBatch || 'Unassigned',
      status: 'Active',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/mentors/:id/students
 * Retrieve real allotted students for a given mentor from the database, strictly scoped to coordinator branch
 */
export const getCoordinatorMentorStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId, req.query?.department);

    // 1. Direct mentor_student_assignments
    let sql = `
      SELECT u.id, u.name, s.roll_number as rollNo, s.department as department,
             u.is_active as status
      FROM users u
      JOIN students s ON u.id = s.user_id
      JOIN mentor_student_assignments msa ON u.id = msa.student_id
      WHERE msa.mentor_id = ?
      ORDER BY u.name ASC`;
    let students = await query(sql, [id]);

    // 2. Batch assignments based on batch mentor/trainer
    if (!students || students.length === 0) {
      sql = `
        SELECT u.id, u.name, s.roll_number as rollNo, s.department as department,
               u.is_active as status
        FROM users u
        JOIN students s ON u.id = s.user_id
        JOIN batches b ON s.batch_id = b.id
        JOIN users m ON (b.mentor = m.name OR b.trainer = m.name)
        WHERE m.id = ?
        ORDER BY u.name ASC`;
      students = await query(sql, [id]);
    }

    // Filter students by coordinator's branch if scoped
    const filtered = scope.targetShort
      ? (students || []).filter((s) => isSameDepartment(s.department, scope.targetShort))
      : students;

    const formattedStudents = (filtered || []).map((s) => ({
      id: s.id,
      name: s.name,
      rollNo: s.rollNo || 'N/A',
      department: s.department || scope.primaryDeptName || 'N/A',
      status: s.status !== false ? 'Active' : 'Inactive',
    }));

    return sendSuccess(res, 'Allotted students retrieved successfully', { students: formattedStudents });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/requests
 */
export const getCoordinatorRequests = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId);

    let sql = `
      SELECT lr.*, u.name as student_name, s.roll_number, b.name as batch_name
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE u.college_id = ?`;
    const params = [scope.collegeId];
    if (scope.hasDept) {
      sql += ` AND (b.department_id IN (${scope.deptList}) OR s.department_id IN (${scope.deptList}))`;
    }
    sql += ` ORDER BY lr.id DESC`;

    const requests = await query(sql, params);

    return sendSuccess(res, 'Requests retrieved successfully', { requests });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/coordinator/requests/:id
 */
export const updateCoordinatorRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    await query(
      `UPDATE leave_requests SET status = ?, remarks = COALESCE(?, remarks) WHERE id = ?`,
      [status, remarks || null, id]
    );

    return sendSuccess(res, `Request marked as ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/notifications
 * Real broadcasts scoped to the coordinator's college
 */
export const getCoordinatorNotifications = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const broadcasts = await getBroadcastsModel(collegeId);
    return sendSuccess(res, 'Notifications retrieved successfully', broadcasts);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/coordinator/broadcast
 */
export const createCoordinatorBroadcast = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const { title, message, target, priority } = req.body;

    if (!title || !message) {
      return sendError(res, 'Title and message are required', 400);
    }

    const result = await query(
      `INSERT INTO broadcasts (college_id, title, message, desc_text, target, priority, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [collegeId, title, message, message, target || 'Department Students', priority || 'General', userId]
    );

    return sendSuccess(res, 'Broadcast announcement sent successfully', { id: result.insertId }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/skill-gaps
 * Per-student skill gaps from the real skill_gaps table
 */
export const getCoordinatorSkillGaps = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId);

    let rowsSql = `
      SELECT sg.id, sg.topic, sg.category, sg.deficiency_rate, sg.avg_score, sg.priority, sg.status,
              u.id as student_id, u.name as student_name, s.roll_number, s.department,
              b.id as batch_id, b.name as batch_name, m.name as mentor_name
       FROM skill_gaps sg
       JOIN users u ON sg.student_id = u.id
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN users m ON (b.mentor = m.name OR b.trainer = m.name)
       WHERE sg.college_id = ? AND sg.student_id IS NOT NULL`;
    const rowsParams = [scope.collegeId];
    if (scope.hasDept) {
      rowsSql += ` AND (b.department_id IN (${scope.deptList}) OR sg.batch_id IN (SELECT id FROM batches WHERE college_id = ? AND department_id IN (${scope.deptList})))`;
      rowsParams.push(scope.collegeId);
    }
    rowsSql += ` ORDER BY CASE sg.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, u.name ASC`;

    const rows = await query(rowsSql, rowsParams);

    const studentsMap = {};
    rows.forEach((row) => {
      if (!studentsMap[row.student_id]) {
        studentsMap[row.student_id] = {
          id: `st-${row.student_id}`,
          studentId: row.student_id,
          studentName: row.student_name,
          rollNo: row.roll_number || `R-${row.student_id}`,
          department: row.department || 'Engineering',
          batch: row.batch_name || 'General Batch',
          assignedMentor: row.mentor_name || 'Assigned',
          weakSkills: [],
          priorityScores: { High: 0, Medium: 0, Low: 0 },
        };
      }
      const deficit = parseFloat(row.deficiency_rate) || 0;
      const avg = parseFloat(row.avg_score) || 0;
      studentsMap[row.student_id].weakSkills.push({
        skillName: row.topic,
        currentScore: Math.round(deficit > 0 ? 100 - deficit : avg),
        level: row.priority || 'Moderate',
        source: row.category || 'Assessment',
        suggestedImprovement: '',
        status: row.status,
      });
      studentsMap[row.student_id].priorityScores[row.priority || 'Medium'] += 1;
    });

    const students = Object.values(studentsMap).map((s) => {
      const avgWeak = s.weakSkills.length > 0
        ? Math.round(s.weakSkills.reduce((acc, w) => acc + w.currentScore, 0) / s.weakSkills.length)
        : 0;
      const priority = s.priorityScores.High > 0 ? 'High' : s.priorityScores.Medium > 0 ? 'Medium' : 'Low';
      return {
        ...s,
        overallPerformance: avgWeak,
        weakSkillsCount: s.weakSkills.length,
        priority,
        trendStatus: '—',
      };
    }).sort((a, b) => a.weakSkillsCount > b.weakSkillsCount ? -1 : 1);

    return sendSuccess(res, 'Skill gaps retrieved successfully', { students });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/weekly-reports
 * Weekly governance reports scoped to the coordinator's college
 */
export const getCoordinatorWeeklyReports = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId);

    let reportsSql = `
      SELECT wr.id, wr.title, wr.week_number, wr.year, wr.summary, wr.attendance_rate,
              wr.avg_quiz_score, wr.created_at, b.name as batch_name
       FROM weekly_reports wr
       LEFT JOIN batches b ON wr.batch_id = b.id
       WHERE wr.college_id = ?`;
    const reportsParams = [scope.collegeId];
    if (scope.hasDept) {
      reportsSql += ` AND (b.department_id IN (${scope.deptList}) OR wr.batch_id IS NULL)`;
    }
    reportsSql += ` ORDER BY wr.id DESC`;

    const reports = await query(reportsSql, reportsParams);

    return sendSuccess(res, 'Weekly reports retrieved successfully', {
      reports: reports.map((r) => ({
        id: r.id,
        title: r.title || `Week ${r.week_number} ${r.year} Report`,
        batch: r.batch_name || 'All Batches',
        date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '—',
        status: 'Generated',
        attendance: Math.round(parseFloat(r.attendance_rate) || 0),
        quiz: Math.round(parseFloat(r.avg_quiz_score) || 0),
        summary: r.summary,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/live-sessions
 * College-scoped live training sessions
 */
export const getCoordinatorLiveSessions = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId);
    const { date: filterDate } = req.query;

    let sessionsSql = `
      SELECT ls.*, u.name as mentor_name, b.name as batch_name
       FROM live_sessions ls
       LEFT JOIN users u ON ls.mentor_id = u.id
       LEFT JOIN batches b ON (ls.batch = b.name OR ls.batch = b.code)
       WHERE (u.college_id = ? OR u.college_id IS NULL)`;
    const sessionsParams = [scope.collegeId];

    if (filterDate) {
      sessionsSql += ` AND (ls.date = ? OR ls.date IS NULL)`;
      sessionsParams.push(filterDate);
    }

    if (scope.hasDept) {
      sessionsSql += ` AND (
          b.department_id IN (${scope.deptList})
          OR b.department_id IS NULL
          OR ls.batch = 'All Batches'
          OR ls.mentor_id IN (
            SELECT u2.id FROM users u2
            LEFT JOIN batches b2 ON (b2.mentor = u2.name OR b2.trainer = u2.name)
            WHERE b2.department_id IN (${scope.deptList})
          )
        )`;
    }
    sessionsSql += ` ORDER BY ls.id DESC`;

    const sessions = await query(sessionsSql, sessionsParams);

    return sendSuccess(res, 'Live sessions retrieved successfully', {
      sessions: (sessions || []).map((s) => ({
        id: s.id,
        title: s.title,
        subject: s.subject,
        batch: s.batch_name || s.batch || 'All Batches',
        trainer: s.mentor_name || 'Assigned Faculty',
        time: s.time ? `${s.date || ''} ${s.time}`.trim() : 'Scheduled', 
        meetLink: s.meeting_link || '',
        status: s.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/coordinator/live-sessions
 * Schedule a new live training session for a batch
 */
export const createCoordinatorLiveSession = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const { title, subject, batch, batchId, time, duration, meetLink, mentorId } = req.body;

    if (!title || !subject || !time) {
      return sendError(res, 'Title, subject and time are required', 400);
    }

    const [mentorRes] = await query(
      `SELECT id FROM users WHERE id = ? AND college_id = ? AND role = 'mentor'`,
      [mentorId || null, collegeId]
    );

    const [batchRes] = await query(
      `SELECT id, name FROM batches WHERE id = ? AND college_id = ?`,
      [batchId || null, collegeId]
    );

    const result = await query(
      `INSERT INTO live_sessions (mentor_id, title, subject, batch, batch_id, date, time, duration, meeting_link, status)
       VALUES (?, ?, ?, ?, ?, CURRENT_DATE, ?, ?, ?, 'Upcoming')`,
      [
        mentorRes?.id || null,
        title,
        subject,
        batch || batchRes?.name || 'All Batches',
        batchRes?.id || null,
        time,
        duration || '60 mins',
        meetLink || null,
      ]
    );

    return sendSuccess(res, 'Live session scheduled successfully', { id: result.insertId }, 201);
  } catch (error) {
    next(error);
  }
};
