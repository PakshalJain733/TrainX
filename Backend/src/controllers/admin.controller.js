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
import { sendWelcomeEmail } from '../services/email.service.js';

/**
 * Helper to determine college isolation filter based on caller role
 */
const getCallerCollegeFilter = (req) => {
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return req.query.collegeId ? parseInt(req.query.collegeId, 10) : null;
  }
  return req.user.collegeId;
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
    let canonicalRole = ROLES.STUDENT;
    if (role) {
      const r = role.toLowerCase();
      if (r.includes('super')) canonicalRole = ROLES.SUPER_ADMIN;
      else if (r.includes('admin') || r.includes('hod')) canonicalRole = ROLES.COLLEGE_ADMIN;
      else if (r.includes('coordinator')) canonicalRole = ROLES.COORDINATOR;
      else if (r.includes('mentor') || r.includes('faculty')) canonicalRole = ROLES.MENTOR;
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

    if (newUser.email && newUser.email.includes('@')) {
      sendWelcomeEmail({
        to: newUser.email,
        name: newUser.name,
        role: canonicalRole,
      }).catch((err) => {
        console.warn(`[Admin User Creation Email Notice] ${err.message}`);
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

    const updated = await updateUserModel(id, req.body);
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
    const updated = await updateUserModel(userId, req.body);
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
    const senderName = req.user ? (req.user.name || req.user.username || 'Admin') : 'Admin';
    const senderRole = req.user ? (req.user.role || 'Admin') : 'Admin';

    const created = await createBroadcastModel({
      college_id: collegeId,
      title: title.trim(),
      message: message.trim(),
      target: target || 'All Batches',
      priority: priority || 'General Announcement',
      created_by: req.user ? req.user.id : 1,
      created_by_name: senderName,
      sender_role: senderRole,
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
    const collegeId = getCallerCollegeFilter(req); // Optional filter
    
    // Mock performance payload scoped for College Admin
    const performanceData = {
      overview: {
        totalStudents: 450,
        averagePerformance: 76,
        highPerforming: 120,
        needsImprovement: 45,
      },
      departments: [
        { id: "d1", name: "Computer Science", students: 180, avgPerformance: 82, avgAttendance: 88, avgQuiz: 80, avgCoding: 84, needsAttention: 12 },
        { id: "d2", name: "Information Tech", students: 150, avgPerformance: 74, avgAttendance: 82, avgQuiz: 75, avgCoding: 73, needsAttention: 20 },
        { id: "d3", name: "Electronics", students: 120, avgPerformance: 69, avgAttendance: 76, avgQuiz: 70, avgCoding: 68, needsAttention: 13 },
      ],
      batches: [
        { id: "b1", name: "Batch A - 2026", students: 220, avgPerformance: 78, avgProgress: 80, needsAttention: 25 },
        { id: "b2", name: "Batch B - 2026", students: 230, avgPerformance: 74, avgProgress: 75, needsAttention: 20 },
      ],
      students: [
        {
          id: "st-1", name: "Ganesh Shinde", roll: "CS-101", department: "Computer Science", batch: "Batch A - 2026",
          overallScore: 71, quiz: 78, coding: 65, interview: 58, attendance: 82, progress: 74,
          status: "Average",
          weakAreas: [{ skill: "AI Mock Interview", score: 58, target: 75 }, { skill: "Coding / DSA", score: 65, target: 80 }],
          strongAreas: ["Quiz Assessment", "Attendance"]
        },
        {
          id: "st-2", name: "Priya Nair", roll: "CS-102", department: "Computer Science", batch: "Batch A - 2026",
          overallScore: 85, quiz: 88, coding: 82, interview: 79, attendance: 91, progress: 86,
          status: "Excellent",
          weakAreas: [],
          strongAreas: ["Coding / DSA", "AI Mock Interview", "Quiz Assessment"]
        },
        {
          id: "st-3", name: "Rahul Mehta", roll: "IT-201", department: "Information Tech", batch: "Batch B - 2026",
          overallScore: 52, quiz: 55, coding: 48, interview: 42, attendance: 68, progress: 50,
          status: "Needs Work",
          weakAreas: [{ skill: "AI Mock Interview", score: 42, target: 65 }, { skill: "Coding / DSA", score: 48, target: 70 }, { skill: "Attendance", score: 68, target: 75 }],
          strongAreas: []
        },
        {
          id: "st-4", name: "Sneha Patil", roll: "EC-301", department: "Electronics", batch: "Batch B - 2026",
          overallScore: 68, quiz: 72, coding: 60, interview: 64, attendance: 78, progress: 66,
          status: "Average",
          weakAreas: [{ skill: "Coding / DSA", score: 60, target: 70 }],
          strongAreas: ["Quiz Assessment", "Attendance"]
        },
      ]
    };
    
    return sendSuccess(res, 'College Admin Performance data retrieved successfully', performanceData);
  } catch (error) {
    next(error);
  }
};

/**
 * Assign Faculty Mentor to Students - Database Persistence
 */
export const assignMentorToStudents = async (req, res, next) => {
  try {
    const { mentorName, mentorEmail, studentIds } = req.body;
    if (!mentorName) {
      return sendError(res, 'Faculty Mentor Name is required', 400);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS mentor_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_name VARCHAR(100) NOT NULL,
        mentor_email VARCHAR(150) NULL,
        student_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_mentor_student (mentor_name, student_id)
      )
    `);

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      for (const sid of studentIds) {
        await query(
          `INSERT INTO mentor_assignments (mentor_name, mentor_email, student_id)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE mentor_name = VALUES(mentor_name), mentor_email = VALUES(mentor_email)`,
          [mentorName, mentorEmail || null, String(sid)]
        );
        try {
          await query(`UPDATE students SET mentor_name = ? WHERE user_id = ? OR id = ?`, [mentorName, sid, sid]);
        } catch (e) {}
      }
    }

    return sendSuccess(res, `Successfully mapped ${studentIds?.length || 0} mentees to mentor ${mentorName} in database`, {
      mentorName,
      assignedCount: studentIds?.length || 0
    });
  } catch (error) {
    next(error);
  }
};

export const getMentorAssignments = async (req, res, next) => {
  try {
    let assignments = [];
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS mentor_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          mentor_name VARCHAR(100) NOT NULL,
          mentor_email VARCHAR(150) NULL,
          student_id VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_mentor_student (mentor_name, student_id)
        )
      `);
      assignments = await query(`SELECT * FROM mentor_assignments ORDER BY id DESC`);
    } catch (e) {
      console.warn('[DB getMentorAssignments fallback]', e.message);
    }
    return sendSuccess(res, 'Mentor assignments retrieved from database', assignments || []);
  } catch (error) {
    next(error);
  }
};

