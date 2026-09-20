import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getBroadcastsModel } from '../models/broadcast.model.js';

/**
 * Resolve the coordinator's scoped department(s) and college.
 * When the coordinator has no assigned departments, falls back to college-wide scope.
 */
const resolveCoordinatorScope = async (userId, collegeId) => {
  const deptRows = await query(
    `SELECT department_id FROM coordinator_departments WHERE coordinator_id = ?`,
    [userId]
  );
  const deptIds = Array.isArray(deptRows) ? deptRows.map((d) => d.department_id).filter(Boolean) : [];
  return {
    collegeId: collegeId || 1,
    deptIds,
    hasDept: deptIds.length > 0,
    deptList: deptIds.length > 0 ? deptIds.join(',') : '-1',
  };
};

/**
 * GET /api/v1/coordinator/overview
 * Real data overview for department coordinator
 */
export const getCoordinatorOverview = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;

    // Fetch user details
    const [user] = await query(
      `SELECT u.id, u.name, u.email, u.mobile_number, u.role, c.name as college_name
       FROM users u
       LEFT JOIN colleges c ON u.college_id = c.id
       WHERE u.id = ?`,
      [userId]
    );

    // Fetch department assigned to coordinator
    const coordDepts = await query(
      `SELECT d.id, d.name, d.code
       FROM coordinator_departments cd
       JOIN departments d ON cd.department_id = d.id
       WHERE cd.coordinator_id = ?`,
      [userId]
    );
    const departmentName = coordDepts.length > 0 ? coordDepts[0].name : 'Engineering & Technology';
    const deptId = coordDepts.length > 0 ? coordDepts[0].id : null;

    // Real stats
    let studentSql = `SELECT COUNT(DISTINCT u.id) as count FROM users u JOIN students s ON u.id = s.user_id WHERE u.college_id = ? AND u.role = 'student'`;
    const studentParams = [collegeId];
    if (deptId) {
      studentSql += ` AND (s.department_id = ? OR s.department = ?)`;
      studentParams.push(deptId, departmentName);
    }
    const [studentCount] = await query(studentSql, studentParams);

    let batchSql = `SELECT COUNT(*) as count FROM batches WHERE college_id = ? AND status = 'active'`;
    const batchParams = [collegeId];
    if (deptId) {
      batchSql += ` AND department_id = ?`;
      batchParams.push(deptId);
    }
    const [batchCount] = await query(batchSql, batchParams);

    let mentorSql = `SELECT COUNT(DISTINCT id) as count FROM users WHERE college_id = ? AND role = 'mentor'`;
    const [mentorCount] = await query(mentorSql, [collegeId]);

    // Average attendance
    const [attData] = await query(
      `SELECT ROUND(AVG(att.attendance_percentage), 1) as avg_attendance
       FROM attendance_summary att
       JOIN users u ON att.user_id = u.id
       WHERE u.college_id = ?`,
      [collegeId]
    );

    // High risk students
    const highRiskStudents = await query(
      `SELECT u.id, u.name, u.email, s.roll_number, s.department, b.name as batch_name,
              COALESCE(att.attendance_percentage, 0) as attendance,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_quiz_score
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       WHERE u.college_id = ? AND u.role = 'student'
       GROUP BY u.id, s.id, b.id, att.id
       HAVING attendance < 75 OR avg_quiz_score < 50
       LIMIT 10`,
      [collegeId]
    );

    const statsList = [
      { id: 'students', label: 'Enrolled Students', value: String(studentCount?.count || 0), hint: `Active in ${departmentName}` },
      { id: 'batches', label: 'Managed Batches', value: `${batchCount?.count || 0} Batches`, hint: 'Current active batches' },
      { id: 'mentors', label: 'Faculty & Mentors', value: `${mentorCount?.count || 0} Trainers`, hint: 'Assigned mentors' },
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
      highRiskStudents: highRiskStudents.map((s) => ({
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
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId);

    let sql = `
      SELECT b.id, b.name, b.schedule, b.status, b.year, b.division, b.mentor,
              COUNT(DISTINCT s.id) as enrolled_students,
              COALESCE(ROUND(AVG(att.attendance_percentage), 1), 0) as avg_attendance,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_quiz_score
       FROM batches b
       LEFT JOIN students s ON b.id = s.batch_id
       LEFT JOIN attendance_summary att ON s.user_id = att.user_id
       LEFT JOIN assessment_attempts aa ON s.user_id = aa.user_id
       WHERE b.college_id = ?`;
    const params = [scope.collegeId];
    if (scope.hasDept) {
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
 */
export const getCoordinatorStudents = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId);

    let sql = `
      SELECT u.id, u.name, u.email, s.roll_number, s.department, b.name as batch_name,
              COALESCE(att.attendance_percentage, 0) as attendance,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_score
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       WHERE u.college_id = ? AND u.role = 'student'`;
    const params = [scope.collegeId];
    if (scope.hasDept) {
      sql += ` AND (b.department_id IN (${scope.deptList}) OR s.department_id IN (${scope.deptList}))`;
    }
    sql += ` GROUP BY u.id, s.id, b.id, att.id ORDER BY u.name ASC`;

    const students = await query(sql, params);

    return sendSuccess(res, 'Students retrieved successfully', {
      students: students.map((s) => {
        const att = parseFloat(s.attendance) || 0;
        const score = parseFloat(s.avg_score) || 0;
        let riskStatus = 'Good Standing';
        if (att < 65 || score < 45) riskStatus = 'High Risk';
        else if (att < 75 || score < 60) riskStatus = 'Moderate Risk';

        return {
          id: `st-${s.id}`,
          studentId: s.id,
          name: s.name,
          email: s.email,
          rollNumber: s.roll_number || `R-${s.id}`,
          department: s.department || 'Engineering',
          batch: s.batch_name || 'General Batch',
          attendance: `${att}%`,
          avgScore: `${score}%`,
          riskStatus,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/coordinator/mentors
 */
export const getCoordinatorMentors = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const scope = await resolveCoordinatorScope(req.user?.userId || req.user?.id, collegeId);

    let sql = `
      SELECT u.id, u.name, u.email, u.mobile_number,
              COUNT(DISTINCT ma.batch_id) as assigned_batches_count
       FROM users u
       LEFT JOIN mentor_assignments ma ON u.id = ma.mentor_id
       WHERE u.college_id = ? AND u.role = 'mentor'`;
    const params = [scope.collegeId];
    if (scope.hasDept) {
      sql += ` AND u.id IN (
                SELECT DISTINCT ma2.mentor_id
                FROM mentor_assignments ma2
                JOIN batches b2 ON ma2.batch_id = b2.id
                WHERE b2.college_id = ? AND b2.department_id IN (${scope.deptList}))`;
      params.push(scope.collegeId);
    }
    sql += ` GROUP BY u.id ORDER BY u.name ASC`;

    const mentors = await query(sql, params);

    return sendSuccess(res, 'Mentors retrieved successfully', { mentors });
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
       LEFT JOIN mentor_assignments ma ON b.id = ma.batch_id
       LEFT JOIN users m ON ma.mentor_id = m.id
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

    let sessionsSql = `
      SELECT ls.*, u.name as mentor_name, b.name as batch_name
       FROM live_sessions ls
       LEFT JOIN users u ON ls.mentor_id = u.id
       LEFT JOIN batches b ON ls.batch_id = b.id
       WHERE ls.batch_id IN (SELECT id FROM batches WHERE college_id = ?) OR ls.mentor_id IN (SELECT id FROM users WHERE college_id = ? AND role = 'mentor')`;
    const sessionsParams = [scope.collegeId, scope.collegeId];
    if (scope.hasDept) {
      sessionsSql += ` AND (
          ls.batch_id IN (SELECT id FROM batches WHERE college_id = ? AND department_id IN (${scope.deptList}))
          OR ls.mentor_id IN (
            SELECT DISTINCT ma.mentor_id FROM mentor_assignments ma
            JOIN batches b2 ON ma.batch_id = b2.id
            WHERE b2.college_id = ? AND b2.department_id IN (${scope.deptList}))
        )`;
      sessionsParams.push(scope.collegeId, scope.collegeId);
    }
    sessionsSql += ` ORDER BY ls.id DESC`;

    const sessions = await query(sessionsSql, sessionsParams);

    return sendSuccess(res, 'Live sessions retrieved successfully', {
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        subject: s.subject,
        batch: s.batch_name || s.batch || 'All Batches',
        trainer: s.mentor_name || 'Assigned Faculty',
        time: `${s.date} ${s.time}`, 
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
