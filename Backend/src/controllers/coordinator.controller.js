import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

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

    const batches = await query(
      `SELECT b.id, b.name, b.schedule, b.status, b.year, b.division, b.mentor,
              COUNT(DISTINCT s.id) as enrolled_students,
              COALESCE(ROUND(AVG(att.attendance_percentage), 1), 0) as avg_attendance,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_quiz_score
       FROM batches b
       LEFT JOIN students s ON b.id = s.batch_id
       LEFT JOIN attendance_summary att ON s.user_id = att.user_id
       LEFT JOIN assessment_attempts aa ON s.user_id = aa.user_id
       WHERE b.college_id = ?
       GROUP BY b.id
       ORDER BY b.id DESC`,
      [collegeId]
    );

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

    const students = await query(
      `SELECT u.id, u.name, u.email, s.roll_number, s.department, b.name as batch_name,
              COALESCE(att.attendance_percentage, 0) as attendance,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_score
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       WHERE u.college_id = ? AND u.role = 'student'
       GROUP BY u.id, s.id, b.id, att.id
       ORDER BY u.name ASC`,
      [collegeId]
    );

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

    const mentors = await query(
      `SELECT u.id, u.name, u.email, u.mobile_number,
              COUNT(DISTINCT ma.batch_id) as assigned_batches_count
       FROM users u
       LEFT JOIN mentor_assignments ma ON u.id = ma.mentor_id
       WHERE u.college_id = ? AND u.role = 'mentor'
       GROUP BY u.id
       ORDER BY u.name ASC`,
      [collegeId]
    );

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

    const requests = await query(
      `SELECT lr.*, u.name as student_name, s.roll_number, b.name as batch_name
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE u.college_id = ?
       ORDER BY lr.id DESC`,
      [collegeId]
    );

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
