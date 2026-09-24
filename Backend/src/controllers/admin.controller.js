import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import {
  getAllUsersModel,
  createUser,
  saveStudentDetails,
  updateUserModel,
  deleteUserModel,
  getUserStatsModel,
  findUserByEmailOrMobile,
  findUserById,
} from '../models/user.model.js';
import { getDepartmentByIdModel } from '../models/department.model.js';
import { getBatchByIdModel } from '../models/batch.model.js';
import { ROLES } from '../utils/constants.js';

/**
 * Helper to determine college isolation filter based on caller role
 */
const getCallerCollegeFilter = (req) => {
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return req.query.collegeId ? parseInt(req.query.collegeId, 10) : null;
  }
  return req.user.collegeId;
};

/**
 * Normalize an incoming role string to a canonical role constant.
 */
const normalizeRole = (role) => {
  if (!role) return null;
  const r = String(role).toLowerCase();
  if (r.includes('super')) return ROLES.SUPER_ADMIN;
  if (r.includes('admin') || r.includes('hod')) return ROLES.COLLEGE_ADMIN;
  if (r.includes('coordinator')) return ROLES.COORDINATOR;
  if (r.includes('mentor') || r.includes('faculty')) return ROLES.MENTOR;
  return ROLES.STUDENT;
};

/**
 * Privilege guard: only a super_admin may assign admin-level roles.
 * College admins may only manage coordinator / mentor / student accounts.
 */
const canAssignRole = (callerRole, targetRole) => {
  if (callerRole === ROLES.SUPER_ADMIN) return true;
  return [ROLES.COORDINATOR, ROLES.MENTOR, ROLES.STUDENT].includes(targetRole);
};

/**
 * Whitelist user-editable fields so clients can never inject role /
 * college_id / arbitrary columns through update payloads.
 */
const pickUserUpdateFields = (body = {}) => {
  const allowed = [
    'name',
    'email',
    'mobile_number',
    'phone',
    'department_id',
    'batch_id',
    'roll_number',
    'department',
    'year',
    'division',
    'semester',
    'cgpa',
    'skills',
    'gender',
    'city',
    'emergency_contact',
    'guardianContact',
    'linkedin_url',
    'linkedinUrl',
    'target_track',
    'track',
    'is_active',
  ];
  const picked = {};
  for (const key of allowed) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
};

export const getAdminData = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);
    const stats = await getUserStatsModel(collegeId);
    return sendSuccess(res, 'Admin data retrieved successfully', { stats });
  } catch (error) {
    next(error);
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);
    const stats = await getUserStatsModel(collegeId);
    return sendSuccess(res, 'Admin statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const collegeId = getCallerCollegeFilter(req);

    // Multi-college isolation: strictly partitioned by caller's collegeId unless super_admin
    let users = await getAllUsersModel(collegeId);

    if (role && role !== 'all') {
      const canonicalRole = role.toLowerCase();
      users = users.filter((u) => u.role.toLowerCase() === canonicalRole);
    }

    if (search) {
      const q = search.trim().toLowerCase();
      users = users.filter((u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.mobile_number && u.mobile_number.includes(q)) ||
        (u.roll_number && u.roll_number.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q))
      );
    }

    return sendSuccess(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

/**
 * User Hierarchy Assignment: User -> College -> Department -> Batch -> Role
 */
export const createUserAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      mobile_number,
      role = 'student',
      college_id: requestedCollegeId,
      department_id,
      batch_id,
      roll_number,
      department,
      year,
      division,
      semester,
      cgpa,
      skills,
    } = req.body;

    if (!name || (!email && !mobile_number)) {
      return sendError(res, 'Name and either Email or Mobile Number are required', 400);
    }

    if (email) {
      const existing = await findUserByEmailOrMobile(email);
      if (existing) {
        return sendError(res, 'A user with this email already exists', 409);
      }
    }

    if (mobile_number) {
      const existingMobile = await findUserByEmailOrMobile(mobile_number);
      if (existingMobile) {
        return sendError(res, 'A user with this mobile number already exists', 409);
      }
    }

    // Role mapping
    const canonicalRole = normalizeRole(role) || ROLES.STUDENT;

    // Privilege guard: college admins cannot mint admin-level accounts
    if (!canAssignRole(req.user.role, canonicalRole)) {
      return sendError(res, 'Access forbidden: You cannot assign this role', 403);
    }

    // College Isolation Enforcement:
    // College Admins can ONLY create users within their own college.
    let targetCollegeId = req.user.collegeId;
    if (req.user.role === ROLES.SUPER_ADMIN) {
      targetCollegeId = requestedCollegeId ? parseInt(requestedCollegeId, 10) : 1;
    }

    // Hierarchy validation: verify department & batch belong to the target college if specified
    let validatedDeptName = department || '';
    if (department_id) {
      const deptRecord = await getDepartmentByIdModel(department_id);
      if (deptRecord) {
        if (deptRecord.college_id !== targetCollegeId && req.user.role !== ROLES.SUPER_ADMIN) {
          return sendError(res, 'Cannot assign user to a department from another college', 403);
        }
        validatedDeptName = deptRecord.name;
      }
    }

    if (batch_id) {
      const batchRecord = await getBatchByIdModel(batch_id);
      if (batchRecord && batchRecord.college_id !== targetCollegeId && req.user.role !== ROLES.SUPER_ADMIN) {
        return sendError(res, 'Cannot assign user to a batch from another college', 403);
      }
    }

    const newUser = await createUser({
      name,
      email: email || '',
      mobile_number: mobile_number || '',
      role: canonicalRole,
      college_id: targetCollegeId,
    });

    let studentProfile = null;
    if (canonicalRole === ROLES.STUDENT) {
      studentProfile = await saveStudentDetails({
        user_id: newUser.id,
        college_id: targetCollegeId,
        department_id: department_id ? parseInt(department_id, 10) : null,
        batch_id: batch_id ? parseInt(batch_id, 10) : null,
        roll_number: roll_number || `AUTO_${newUser.id}`,
        department: validatedDeptName,
        year: year || 'TE',
        division: division || 'A',
        semester: semester || 'Semester 6',
        cgpa: cgpa || '8.5',
        skills: skills || '',
      });
    }

    return sendSuccess(
      res,
      'User created and assigned hierarchy successfully',
      {
        ...newUser,
        studentProfile,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const updateUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return sendError(res, 'User not found', 404);
    }

    // College Isolation check: non-super_admin cannot update users belonging to another college
    if (req.user.role !== ROLES.SUPER_ADMIN && existingUser.college_id !== req.user.collegeId) {
      return sendError(res, 'Access forbidden: Cannot modify users from another college', 403);
    }

    // Whitelist editable fields — never trust raw req.body
    const updates = pickUserUpdateFields(req.body);

    // Role changes require role-assignment privileges
    if (req.body.role !== undefined) {
      const targetRole = normalizeRole(req.body.role);
      if (!canAssignRole(req.user.role, targetRole)) {
        return sendError(res, 'Access forbidden: You cannot assign this role', 403);
      }
      updates.role = targetRole;
    }

    // Only super admins may move a user to another college
    if (req.body.college_id !== undefined) {
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        return sendError(res, 'Access forbidden: Only super admins can change college assignment', 403);
      }
      updates.college_id = parseInt(req.body.college_id, 10);
    }

    const updated = await updateUserModel(id, updates);
    return sendSuccess(res, 'User updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return sendError(res, 'User not found', 404);
    }

    // College Isolation check: non-super_admin cannot delete users from another college
    if (req.user.role !== ROLES.SUPER_ADMIN && existingUser.college_id !== req.user.collegeId) {
      return sendError(res, 'Access forbidden: Cannot delete users from another college', 403);
    }

    await deleteUserModel(id);
    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// Practice Problems / Coding Tasks Management
// -------------------------------------------------------------
import {
  getPracticeProblemsModel,
  createPracticeProblemModel,
  deletePracticeProblemModel,
} from '../models/practiceProblem.model.js';

export const getAdminPracticeProblems = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);
    const { batch_id, difficulty } = req.query;
    const problems = await getPracticeProblemsModel({ collegeId, batchId: batch_id, difficulty });
    return sendSuccess(res, 'Practice problems retrieved successfully', problems);
  } catch (error) {
    next(error);
  }
};

export const createAdminPracticeProblem = async (req, res, next) => {
  try {
    const {
      title,
      batch = 'All Batches',
      batch_id = null,
      difficulty = 'Medium',
      category = 'General DSA',
      tags = '',
      description = '',
      points = 100,
    } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, 'Problem title is required', 400);
    }

    const collegeId = getCallerCollegeFilter(req) || 1;
    const newProblem = await createPracticeProblemModel({
      college_id: collegeId,
      batch_id,
      batch_name: batch,
      title: title.trim(),
      description,
      difficulty,
      category,
      tags,
      points,
      created_by: req.user ? req.user.id : 1,
    });

    return sendSuccess(res, 'Coding problem created successfully', newProblem, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteAdminPracticeProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deletePracticeProblemModel(id);
    return sendSuccess(res, 'Coding problem deleted successfully');
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// Admin Profile Management
// -------------------------------------------------------------
export const getAdminProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || 1;
    const user = await findUserById(userId);
    return sendSuccess(res, 'Admin profile retrieved successfully', user || req.user);
  } catch (error) {
    next(error);
  }
};

export const updateAdminProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || 1;
    // Self-service profile edits may never change role, college or activation state
    const updates = pickUserUpdateFields(req.body);
    delete updates.is_active;
    delete updates.department_id;
    delete updates.batch_id;
    delete updates.roll_number;
    const updated = await updateUserModel(userId, updates);
    return sendSuccess(res, 'Admin profile updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// Admin Broadcast Notifications Center
// -------------------------------------------------------------
import {
  getBroadcastsModel,
  createBroadcastModel,
  deleteBroadcastModel,
} from '../models/broadcast.model.js';

export const getAdminBroadcasts = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);
    const broadcasts = await getBroadcastsModel(collegeId);
    return sendSuccess(res, 'Broadcast messages retrieved successfully', broadcasts);
  } catch (error) {
    next(error);
  }
};

export const createAdminBroadcast = async (req, res, next) => {
  try {
    const { title, message, target = 'All Batches', priority = 'General Announcement' } = req.body;
    if (!title || !message) {
      return sendError(res, 'Title and message text are required', 400);
    }
    const collegeId = getCallerCollegeFilter(req) || 1;
    const created = await createBroadcastModel({
      college_id: collegeId,
      title: title.trim(),
      message: message.trim(),
      target,
      priority,
      created_by: req.user ? req.user.id : 1,
    });
    return sendSuccess(res, 'Broadcast sent successfully to all targets', created, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteAdminBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteBroadcastModel(id);
    return sendSuccess(res, 'Broadcast message deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getAdminPerformance = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);

    // 1. Fetch all real students with their attendance and assessment scores
    let studentSql = `
      SELECT u.id, u.name, u.email, s.roll_number, s.department, s.department_id, s.batch_id,
             d.name as dept_name, b.name as batch_name,
             COALESCE(att.attendance_percentage, 0) as attendance_pct,
             COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_assessment,
             sg.overall_status, sg.weak_areas
      FROM users u
      JOIN students s ON u.id = s.user_id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN attendance_summary att ON u.id = att.user_id
      LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
      LEFT JOIN skill_gap_analysis sg ON u.id = sg.user_id
      WHERE u.role = 'student'
    `;
    const params = [];
    if (collegeId) {
      studentSql += ' AND u.college_id = ?';
      params.push(collegeId);
    }
    studentSql += ' GROUP BY u.id, s.id, d.id, b.id, att.id, sg.id ORDER BY u.name ASC';

    const rawStudents = await query(studentSql, params);

    let totalScoreSum = 0;
    let highPerforming = 0;
    let needsImprovement = 0;

    const formattedStudents = rawStudents.map((s) => {
      const attendance = parseFloat(s.attendance_pct) || 0;
      const quiz = parseFloat(s.avg_assessment) || 0;
      const coding = Math.round(quiz * 0.95);
      const interview = Math.round(quiz * 0.9);
      const progress = Math.round((attendance + quiz) / 2);
      const overallScore = Math.round((attendance * 0.3) + (quiz * 0.4) + (coding * 0.3));

      totalScoreSum += overallScore;
      if (overallScore >= 80) highPerforming++;
      else if (overallScore < 60) needsImprovement++;

      let status = 'Average';
      if (overallScore >= 80) status = 'Excellent';
      else if (overallScore < 60) status = 'Needs Work';

      let parsedWeakAreas = [];
      try {
        if (s.weak_areas) {
          const raw = typeof s.weak_areas === 'string' ? JSON.parse(s.weak_areas) : s.weak_areas;
          parsedWeakAreas = Array.isArray(raw) ? raw.map((w) => ({
            skill: typeof w === 'string' ? w : w.skill || w.topic || 'Core Module',
            score: typeof w === 'object' && w.score ? w.score : 55,
            target: 75,
          })) : [];
        }
      } catch (_) {}

      if (parsedWeakAreas.length === 0 && overallScore < 70) {
        if (attendance < 75) parsedWeakAreas.push({ skill: "Attendance", score: Math.round(attendance), target: 75 });
        if (quiz < 65) parsedWeakAreas.push({ skill: "Quiz Assessment", score: Math.round(quiz), target: 75 });
      }

      const strongAreas = [];
      if (quiz >= 75) strongAreas.push("Quiz Assessment");
      if (attendance >= 80) strongAreas.push("Attendance");
      if (coding >= 75) strongAreas.push("Coding / DSA");

      return {
        id: `st-${s.id}`,
        studentId: s.id,
        name: s.name,
        roll: s.roll_number || `R-${s.id}`,
        department: s.dept_name || s.department || 'General',
        batch: s.batch_name || 'Unassigned Batch',
        overallScore,
        quiz: Math.round(quiz),
        coding,
        interview,
        attendance: Math.round(attendance),
        progress,
        status,
        weakAreas: parsedWeakAreas,
        strongAreas,
      };
    });

    const totalStudents = formattedStudents.length;
    const averagePerformance = totalStudents > 0 ? Math.round(totalScoreSum / totalStudents) : 0;

    // 2. Aggregate Department performance
    let deptSql = `SELECT id, name FROM departments`;
    const deptParams = [];
    if (collegeId) {
      deptSql += ` WHERE college_id = ?`;
      deptParams.push(collegeId);
    }
    const rawDepts = await query(deptSql, deptParams);

    const departments = rawDepts.map((d) => {
      const deptStudents = formattedStudents.filter(
        (s) => s.department.toLowerCase() === d.name.toLowerCase()
      );
      const count = deptStudents.length;
      const avgPerf = count > 0 ? Math.round(deptStudents.reduce((sum, s) => sum + s.overallScore, 0) / count) : 0;
      const avgAtt = count > 0 ? Math.round(deptStudents.reduce((sum, s) => sum + s.attendance, 0) / count) : 0;
      const avgQ = count > 0 ? Math.round(deptStudents.reduce((sum, s) => sum + s.quiz, 0) / count) : 0;
      const avgC = count > 0 ? Math.round(deptStudents.reduce((sum, s) => sum + s.coding, 0) / count) : 0;
      const attention = deptStudents.filter((s) => s.overallScore < 65 || s.attendance < 75).length;

      return {
        id: `d-${d.id}`,
        name: d.name,
        students: count,
        avgPerformance: avgPerf,
        avgAttendance: avgAtt,
        avgQuiz: avgQ,
        avgCoding: avgC,
        needsAttention: attention,
      };
    });

    // 3. Aggregate Batch performance
    let batchSql = `SELECT id, name FROM batches`;
    const batchParams = [];
    if (collegeId) {
      batchSql += ` WHERE college_id = ?`;
      batchParams.push(collegeId);
    }
    const rawBatches = await query(batchSql, batchParams);

    const batches = rawBatches.map((b) => {
      const batchStudents = formattedStudents.filter((s) => s.batch === b.name);
      const count = batchStudents.length;
      const avgPerf = count > 0 ? Math.round(batchStudents.reduce((sum, s) => sum + s.overallScore, 0) / count) : 0;
      const avgProg = count > 0 ? Math.round(batchStudents.reduce((sum, s) => sum + s.progress, 0) / count) : 0;
      const attention = batchStudents.filter((s) => s.overallScore < 65 || s.attendance < 75).length;

      return {
        id: `b-${b.id}`,
        name: b.name,
        students: count,
        avgPerformance: avgPerf,
        avgProgress: avgProg,
        needsAttention: attention,
      };
    });

    const performanceData = {
      overview: {
        totalStudents,
        averagePerformance,
        highPerforming,
        needsImprovement,
      },
      departments,
      batches,
      students: formattedStudents,
    };

    return sendSuccess(res, 'College Admin Performance data retrieved successfully', performanceData);
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// C2C Training Enrollments (Placement Season 2029)
// -------------------------------------------------------------
export const getAdminC2CEnrollments = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);
    const { search, branch, payment_status, program_code = 'C2C 2029' } = req.query;

    let sql = `
      SELECT te.id AS enrollment_id, te.training_option, te.fee_amount, te.amount_paid, te.payment_status,
             te.payment_proof_url, te.payment_received_by, te.whatsapp_group_added, te.source_status, te.source_timestamp,
             u.id AS user_id, u.name, u.email, u.mobile_number,
             s.roll_number, s.department, s.department_id,
             b.id AS batch_id, b.name AS batch_name,
             mu.id AS mentor_id, mu.name AS mentor_name, mu.mobile_number AS mentor_phone
      FROM training_enrollments te
      JOIN users u ON u.id = te.student_user_id
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN batches b ON b.id = te.batch_id
      LEFT JOIN mentor_student_assignments msa ON msa.student_id = te.student_user_id
      LEFT JOIN users mu ON mu.id = msa.mentor_id
      WHERE 1=1
    `;
    const params = [];
    if (program_code) {
      sql += ` AND te.program_id IN (SELECT id FROM training_programs WHERE code = ?)`;
      params.push(program_code);
    }
    if (collegeId) {
      sql += ` AND u.college_id = ?`;
      params.push(collegeId);
    }
    if (payment_status) {
      sql += ` AND te.payment_status = ?`;
      params.push(payment_status);
    }
    if (branch) {
      sql += ` AND s.department_id = ?`;
      params.push(parseInt(branch, 10));
    }
    if (search) {
      sql += ` AND (u.name LIKE ? OR s.roll_number LIKE ? OR u.email LIKE ? OR u.mobile_number LIKE ?)`;
      const q = `%${String(search).trim()}%`;
      params.push(q, q, q, q);
    }
    sql += ` ORDER BY s.department IS NULL, u.name ASC`;

    const rows = await query(sql, params);
    const enrollments = (rows || []).map((r) => ({
      enrollmentId: r.enrollment_id,
      trainingOption: r.training_option,
      feeAmount: r.fee_amount,
      amountPaid: r.amount_paid,
      paymentStatus: r.payment_status,
      paymentProofUrl: r.payment_proof_url,
      paymentReceivedBy: r.payment_received_by,
      whatsappGroupAdded: r.whatsapp_group_added,
      sourceStatus: r.source_status,
      sourceTimestamp: r.source_timestamp,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      mobile: r.mobile_number,
      rollNumber: r.roll_number,
      branch: r.department,
      departmentId: r.department_id,
      batchId: r.batch_id,
      batchName: r.batch_name,
      mentorId: r.mentor_id,
      mentorName: r.mentor_name,
      mentorPhone: r.mentor_phone,
    }));

    return sendSuccess(res, 'C2C Training enrollments retrieved successfully', enrollments);
  } catch (error) {
    next(error);
  }
}
