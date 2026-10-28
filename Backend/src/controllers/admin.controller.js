import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import {
  getAllUsersModel,
  getPendingUsersModel,
  createUser,
  saveStudentDetails,
  updateUserModel,
  deleteUserModel,
  getUserStatsModel,
  findUserByEmailOrMobile,
  findUserById,
  updateUserTwoFactorSecret,
  resetUserTwoFactorSecret,
  triggerUserTwoFactorReset,
} from '../models/user.model.js';
import { getDepartmentByIdModel } from '../models/department.model.js';
import { getBatchByIdModel } from '../models/batch.model.js';
import { ROLES } from '../utils/constants.js';
import { sendWelcomeEmail, sendAccountApprovedEmail, sendAdminCredentialsEmail } from '../services/email.service.js';
import { findSecureCode, createSecureCode } from '../models/secureCode.model.js';
import { generateTotpSetup } from '../services/auth.service.js';

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
    const { role, search, department } = req.query;
    const collegeId = getCallerCollegeFilter(req);

    // Multi-college isolation: strictly partitioned by caller's collegeId unless super_admin
    let users = await getAllUsersModel(collegeId);

    // College Admins can only view/manage Students, Mentors, and Coordinators (not other Admins)
    if (req.user?.role !== ROLES.SUPER_ADMIN) {
      users = users.filter((u) => {
        const r = String(u.role || '').toLowerCase();
        return !r.includes('admin');
      });
    }

    if (role && role !== 'all') {
      const canonicalRole = role.toLowerCase();
      users = users.filter((u) => u.role.toLowerCase() === canonicalRole);
    }

    if (department && department !== 'all') {
      const d = department.trim().toLowerCase();
      users = users.filter((u) => {
        const ud = String(u.department || '').trim().toLowerCase();
        return ud === d || ud.includes(d) || d.includes(ud);
      });
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

export const getAdminPendingUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const collegeId = getCallerCollegeFilter(req);

    let users = await getPendingUsersModel(collegeId);

    // Super Admin exclusively reviews and approves Admin accounts (College Admins, Department Admins, HODs)
    // College Admins review and approve non-Admin users (Students, Mentors, Coordinators) belonging to their college
    if (req.user?.role === ROLES.SUPER_ADMIN) {
      users = users.filter((u) => {
        const r = String(u.role || '').toLowerCase();
        return (r === 'college_admin' || r === 'admin' || r === 'hod' || r.includes('admin')) && r !== 'super_admin';
      });
    } else {
      users = users.filter((u) => {
        const r = String(u.role || '').toLowerCase();
        return !r.includes('admin') && r !== 'super_admin';
      });
    }

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

    return sendSuccess(res, 'Pending users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

export const approveUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const userRole = String(user.role || '').toLowerCase();
    if (req.user?.role !== ROLES.SUPER_ADMIN) {
      if (userRole.includes('admin') || userRole === 'super_admin') {
        return sendError(res, 'Unauthorized: Only Super Admin can approve College Admin registrations.', 403);
      }
      const callerCollegeId = getCallerCollegeFilter(req);
      if (callerCollegeId && user.college_id && String(callerCollegeId) !== String(user.college_id)) {
        return sendError(res, 'Unauthorized: You can only approve pending users from your own college.', 403);
      }
    }

    const updatePayload = { is_active: 1, is_approved: 1, is_verified: 1 };
    const callerCollegeId = getCallerCollegeFilter(req);
    if (!user.college_id && callerCollegeId) {
      updatePayload.college_id = callerCollegeId;
    }

    await updateUserModel(id, updatePayload);

    if (user.email) {
      try {
        await query(`UPDATE secure_code_requests SET status = 'Approved' WHERE LOWER(email) = LOWER(?)`, [user.email]);
      } catch (_) {}
    }

    if (user.email && user.email.includes('@')) {
      sendAccountApprovedEmail({ to: user.email, name: user.name, role: user.role }).catch(() => {});
    }

    return sendSuccess(res, 'User registration approved successfully');
  } catch (error) {
    next(error);
  }
};

export const rejectUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const userRole = String(user.role || '').toLowerCase();
    if (req.user?.role !== ROLES.SUPER_ADMIN) {
      if (userRole.includes('admin') || userRole === 'super_admin') {
        return sendError(res, 'Unauthorized: Only Super Admin can reject College Admin registrations.', 403);
      }
      const callerCollegeId = getCallerCollegeFilter(req);
      if (callerCollegeId && user.college_id && String(callerCollegeId) !== String(user.college_id)) {
        return sendError(res, 'Unauthorized: You can only reject pending users from your own college.', 403);
      }
    }

    await deleteUserModel(id);
    return sendSuccess(res, 'User registration rejected and removed');
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
      password,
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
      secure_code,
      code,
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
    let validatedDeptId = department_id ? parseInt(department_id, 10) : null;
    if (department_id) {
      const deptRecord = await getDepartmentByIdModel(department_id);
      if (deptRecord) {
        if (deptRecord.college_id !== targetCollegeId && req.user.role !== ROLES.SUPER_ADMIN) {
          return sendError(res, 'Cannot assign user to a department from another college', 403);
        }
        validatedDeptName = deptRecord.name;
        validatedDeptId = deptRecord.id;
      }
    }

    if (batch_id) {
      const batchRecord = await getBatchByIdModel(batch_id);
      if (batchRecord && batchRecord.college_id !== targetCollegeId && req.user.role !== ROLES.SUPER_ADMIN) {
        return sendError(res, 'Cannot assign user to a batch from another college', 403);
      }
    }

    // Resolve target college name for notification emails & code generation
    let targetCollegeName = (req.body.college_name || '').trim();
    if (!targetCollegeName && targetCollegeId) {
      try {
        const colRows = await query('SELECT name FROM colleges WHERE id = ?', [targetCollegeId]);
        if (colRows && colRows.length > 0) {
          targetCollegeName = colRows[0].name;
        }
      } catch (_) {}
    }
    if (!targetCollegeName && req.user?.collegeName) {
      targetCollegeName = req.user.collegeName;
    }

    // Check if Super Admin is directly provisioning an Admin account
    const isSuperAdminAccount = canonicalRole === ROLES.SUPER_ADMIN;
    const isSuperAdminAddingAdmin = req.user?.role === ROLES.SUPER_ADMIN && (
      canonicalRole === ROLES.COLLEGE_ADMIN || 
      isSuperAdminAccount || 
      String(canonicalRole).includes('admin')
    );

    // For non-student staff roles (Coordinator, Mentor) or self-registering College Admins:
    // Ensure a Secure Access Code exists so user can complete registration with it if needed.
    let targetSecureCode = (secure_code || code || '').trim().toUpperCase();
    const isStaffRole = canonicalRole === ROLES.COORDINATOR || canonicalRole === ROLES.MENTOR || canonicalRole === ROLES.COLLEGE_ADMIN;
    if (isStaffRole && !isSuperAdminAddingAdmin) {
      if (!targetSecureCode) {
        const prefix = canonicalRole === ROLES.COORDINATOR ? 'CO' : (canonicalRole === ROLES.MENTOR ? 'FAC' : 'ADM');
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        targetSecureCode = `${prefix}-${randomHex}`;
      }

      // Check if code is already registered in DB, otherwise insert into secure_codes table
      try {
        const existingCodeRecord = await findSecureCode(targetSecureCode, canonicalRole);
        if (!existingCodeRecord) {
          await createSecureCode({
            code: targetSecureCode,
            role: canonicalRole,
            college_name: targetCollegeName || null,
            description: `Generated for ${canonicalRole} onboarding: ${name}`,
            max_uses: 1,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
        }
      } catch (err) {
        console.warn(`[Admin User Creation Secure Code Warning] ${err.message}`);
      }
    }

    // Determine account status and provisioned password:
    // 1. If Super Admin adds an Admin:
    //    The account is directly pre-approved, active, and verified.
    //    Their login email and password are sent directly in a login credentials email.
    // 2. Otherwise (coordinators, mentors, students):
    //    is_verified = 0, is_approved = 0, is_active = 0 (Requires completing registration and manual approval)
    const rawPassword = (password || '').trim();
    const finalPassword = rawPassword || (isSuperAdminAddingAdmin ? `Admin@${Math.random().toString(36).slice(-6)}!` : '');

    const newUser = await createUser({
      name,
      password: finalPassword,
      email: email || '',
      mobile_number: mobile_number || '',
      role: canonicalRole,
      college_id: targetCollegeId,
      department: validatedDeptName,
      department_id: validatedDeptId,
      is_active: isSuperAdminAddingAdmin ? 1 : 0,
      is_verified: isSuperAdminAddingAdmin ? 1 : 0,
      is_approved: isSuperAdminAddingAdmin ? 1 : 0,
    });

    let studentProfile = null;
    if (canonicalRole === ROLES.STUDENT) {
      studentProfile = await saveStudentDetails({
        user_id: newUser.id,
        college_id: targetCollegeId,
        department_id: validatedDeptId,
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
      if (isSuperAdminAddingAdmin) {
        // Super Admin added an Admin -> send login credentials email with email and password
        sendAdminCredentialsEmail({
          to: newUser.email,
          name: newUser.name,
          password: finalPassword,
          collegeName: targetCollegeName,
          role: canonicalRole === ROLES.SUPER_ADMIN ? 'Super Administrator' : 'College Administrator',
        }).catch((err) => {
          console.warn(`[Admin Credentials Email Dispatch Notice] ${err.message}`);
        });
      } else {
        // Staff/mentors/coordinators -> send registration invitation with secure code
        sendWelcomeEmail({
          to: newUser.email,
          name: newUser.name,
          role: canonicalRole,
          secure_code: targetSecureCode || '',
          mobile_number: mobile_number || newUser.mobile_number || '',
          roll_number: roll_number || (studentProfile && studentProfile.roll_number) || '',
          department: validatedDeptName || department || '',
          year: year || (studentProfile && studentProfile.year) || '',
          division: division || (studentProfile && studentProfile.division) || '',
        }).catch((err) => {
          console.warn(`[Admin User Creation Email Notice] ${err.message}`);
        });
      }
    }

    const successMessage = isSuperAdminAddingAdmin
      ? 'Administrator account created successfully. Login credentials email has been sent to the admin.'
      : 'User created successfully. Registration invitation with secure access code dispatched.';

    return sendSuccess(
      res,
      successMessage,
      {
        ...newUser,
        secure_code: isSuperAdminAddingAdmin ? null : (targetSecureCode || null),
        is_verified: isSuperAdminAddingAdmin ? 1 : 0,
        is_approved: isSuperAdminAddingAdmin ? 1 : 0,
        studentProfile,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Bulk Student Creation from Excel / CSV Sheet Upload
 */
export const bulkCreateUsersAdmin = async (req, res, next) => {
  try {
    const { students = [], college_id: requestedCollegeId } = req.body || {};

    if (!Array.isArray(students) || students.length === 0) {
      return sendError(res, 'No student data provided in request body', 400);
    }

    let targetCollegeId = req.user.collegeId;
    if (req.user.role === ROLES.SUPER_ADMIN) {
      targetCollegeId = requestedCollegeId ? parseInt(requestedCollegeId, 10) : 1;
    }

    const createdList = [];
    const skippedList = [];
    const errorList = [];

    for (let i = 0; i < students.length; i++) {
      const item = students[i] || {};
      const name = String(item.name || item.fullName || item['Full Name'] || item['Name'] || '').trim();
      const email = String(item.email || item.collegeEmail || item['College Email'] || item['Email'] || '').trim();
      const mobile_number = String(item.mobile_number || item.phone || item.mobile || item['Mobile Number'] || item['Mobile'] || '').trim();
      const roll_number = String(item.roll_number || item.rollNo || item.collegeId || item['College ID'] || item['Roll ID'] || item['Roll No'] || '').trim();
      const department = String(item.department || item.dept || item['Department'] || item['Dept'] || 'COMPS').trim();
      const year = String(item.year || item['Academic Year'] || item['Year'] || 'FE').trim();
      const division = String(item.division || item.div || item['Division'] || 'A').trim();

      if (!name || !email) {
        errorList.push(`Row #${i + 1}: Name and Email are required.`);
        continue;
      }

      // Check existing user by email or mobile
      const existingEmail = await findUserByEmailOrMobile(email);
      if (existingEmail) {
        skippedList.push({ name, email, reason: 'Email already registered' });
        continue;
      }

      if (mobile_number) {
        const existingMobile = await findUserByEmailOrMobile(mobile_number);
        if (existingMobile) {
          skippedList.push({ name, email, reason: 'Mobile number already registered' });
          continue;
        }
      }

      // Create User
      const newUser = await createUser({
        name,
        email,
        mobile_number,
        role: ROLES.STUDENT,
        college_id: targetCollegeId,
      });

      // Create Student Profile
      const studentProfile = await saveStudentDetails({
        user_id: newUser.id,
        college_id: targetCollegeId,
        roll_number: roll_number || `AUTO_${newUser.id}`,
        department,
        year,
        division,
        semester: 'Semester 1',
        cgpa: '8.0',
        skills: '',
      });

      // Send Welcome & Pre-Filled Registration Email
      if (newUser.email && newUser.email.includes('@')) {
        sendWelcomeEmail({
          to: newUser.email,
          name: newUser.name,
          role: ROLES.STUDENT,
          mobile_number,
          roll_number: roll_number || studentProfile.roll_number,
          department,
          year,
          division,
        }).catch((err) => {
          console.warn(`[Bulk Welcome Email Notice] ${err.message}`);
        });
      }

      createdList.push({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roll_number: studentProfile.roll_number,
        department,
        year,
        division,
      });
    }

    return sendSuccess(
      res,
      `Bulk processing complete. Created ${createdList.length} students, skipped ${skippedList.length}.`,
      {
        createdCount: createdList.length,
        skippedCount: skippedList.length,
        createdList,
        skippedList,
        errorList,
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
import { generateAIPracticeProblem } from '../ai/practice.ai.js';

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
      topic = '',
      tags = '',
      companies = '',
      description = '',
      dueDate = '',
      due_date = '',
      points = 100,
      xp = 50,
      sampleInput = '',
      sampleOutput = '',
      testCases = [],
      language = null,
      lang = null,
    } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, 'Problem title is required', 400);
    }

    const callerCollege = getCallerCollegeFilter(req);
    const collegeId = callerCollege || req.body.college_id || req.body.collegeId || null;

    const rawDueDate = dueDate || due_date;
    let normalizedDueDate = null;
    if (rawDueDate && String(rawDueDate).trim()) {
      try {
        const d = new Date(rawDueDate);
        if (!isNaN(d.getTime())) {
          normalizedDueDate = d.toISOString().slice(0, 10);
        }
      } catch {
        normalizedDueDate = null;
      }
    }

    const newProblem = await createPracticeProblemModel({
      college_id: collegeId,
      batch_id,
      batch_name: batch,
      title: title.trim(),
      description,
      difficulty,
      category: category || topic || 'General DSA',
      tags: tags || (Array.isArray(companies) ? companies.join(', ') : companies) || '',
      points: points || xp || 100,
      created_by: req.user ? req.user.id : 1,
      sampleInput,
      sampleOutput,
      testCases,
      due_date: normalizedDueDate,
      language: language || lang || null,
    });

    return sendSuccess(res, 'Coding problem created successfully', newProblem, 201);
  } catch (error) {
    next(error);
  }
};
export const updateAdminPracticeProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      batch = null,
      batch_id = null,
      batchName = null,
      difficulty = 'Medium',
      category = 'General DSA',
      topic = '',
      tags = '',
      companies = '',
      description = '',
      dueDate = '',
      due_date = '',
      points = 100,
      xp = 50,
      testCases = [],
      language = null,
      lang = null,
    } = req.body;

    const rawDueDate = dueDate || due_date;
    let normalizedDueDate = null;
    if (rawDueDate && String(rawDueDate).trim()) {
      try {
        const d = new Date(rawDueDate);
        if (!isNaN(d.getTime())) {
          normalizedDueDate = d.toISOString().slice(0, 10);
        }
      } catch {
        normalizedDueDate = null;
      }
    }

    const tagsStr = Array.isArray(tags) ? tags.join(', ') : (Array.isArray(companies) ? companies.join(', ') : (tags || companies || ''));
    const langVal = language || lang || null;
    const batchVal = batch || batchName || null;
    let validBatchId = batch_id ? parseInt(batch_id, 10) : null;
    if (isNaN(validBatchId)) validBatchId = null;

    try {
      await query(
        `UPDATE practice_problems
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             difficulty = COALESCE(?, difficulty),
             category = COALESCE(?, category),
             tags = COALESCE(?, tags),
             points = COALESCE(?, points),
             due_date = ?,
             language = COALESCE(?, language),
             batch_name = COALESCE(?, batch_name),
             batch_id = COALESCE(?, batch_id)
         WHERE id = ?`,
        [title?.trim() || null, description || null, difficulty || null, category || topic || null, tagsStr || null, points || xp || null, normalizedDueDate, langVal, batchVal, validBatchId, id]
      );
    } catch (err) {
      await query(
        `UPDATE practice_problems
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             difficulty = COALESCE(?, difficulty),
             category = COALESCE(?, category),
             tags = COALESCE(?, tags),
             points = COALESCE(?, points),
             batch_name = COALESCE(?, batch_name)
         WHERE id = ?`,
        [title?.trim() || null, description || null, difficulty || null, category || topic || null, tagsStr || null, points || xp || null, batchVal, id]
      );
    }

    if (Array.isArray(testCases)) {
      try {
        await query('DELETE FROM coding_test_cases WHERE problem_id = ?', [id]);
        for (const tc of testCases) {
          const inp = tc.input || '';
          const out = tc.expectedOutput || tc.expected_output || tc.output || '';
          if (inp || out) {
            await query(
              `INSERT INTO coding_test_cases (problem_id, input, expected_output, is_hidden) VALUES (?, ?, ?, ?)`,
              [id, inp, out, (tc.isHidden || tc.is_hidden) ? 1 : 0]
            );
          }
        }
      } catch (e) {
        console.warn('[updateAdminPracticeProblem testcases error]', e.message);
      }
    }

    return sendSuccess(res, 'Coding problem updated successfully');
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

export const generateAIPracticeProblemController = async (req, res, next) => {
  try {
    const { topic = 'Arrays & Hashing', difficulty = 'Medium', companies = '' } = req.body || {};
    const problem = await generateAIPracticeProblem({ topic, difficulty, companies });
    return sendSuccess(res, 'AI practice problem generated successfully', problem);
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
    const collegeId = getCallerCollegeFilter(req);

    // 1. Fetch all real students with their attendance, quiz, and task scores
    let studentSql = `
      SELECT u.id, u.name, u.email, s.roll_number, s.department, s.department_id, s.batch_id,
             d.name as dept_name, b.name as batch_name,
             COALESCE(
               (SELECT ROUND((SUM(CASE WHEN LOWER(att2.status) = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100)
                FROM attendance att2 WHERE att2.user_id = u.id),
               att.attendance_percentage,
               0
             ) as attendance_pct,
             COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_assessment,
             COALESCE((SELECT ROUND(AVG(ts.marks_obtained), 1) FROM task_submissions ts WHERE ts.user_id = u.id), 0) as avg_task,
             COALESCE((SELECT COUNT(*) FROM task_submissions ts WHERE ts.user_id = u.id AND ts.status IN ('Submitted', 'Passed')), 0) as completed_tasks,
             COALESCE((SELECT COUNT(*) FROM practice_problem_submissions pps WHERE pps.user_id = u.id AND pps.status = 'Solved'), 0) as coding_solved,
             sg.overall_status, sg.weak_areas
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN attendance_summary att ON u.id = att.user_id
      LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
      LEFT JOIN skill_gap_analysis sg ON u.id = sg.user_id
      WHERE u.role = 'student'
    `;
    const params = [];
    if (collegeId) {
      studentSql += ' AND (u.college_id = ? OR u.college_id IS NULL)';
      params.push(collegeId);
    }
    studentSql += ' GROUP BY u.id, s.id, d.id, b.id, att.id, sg.id ORDER BY u.name ASC';

    const rawStudents = await query(studentSql, params);

    let totalScoreSum = 0;
    let highPerforming = 0;
    let needsImprovement = 0;

    const formattedStudents = rawStudents.map((s, idx) => {
      const attendance = parseFloat(s.attendance_pct) || 0;
      const quiz = parseFloat(s.avg_assessment) || 0;
      const task = parseFloat(s.avg_task) || (quiz > 0 ? Math.round(quiz * 0.95) : 0);
      const coding = (s.coding_solved && s.coding_solved > 0)
        ? Math.min(100, s.coding_solved * 40)
        : (quiz > 0 ? Math.round(quiz * 0.9) : 0);
      const interview = Math.round((quiz * 0.6) + (task * 0.4));
      const completedTasks = Number(s.completed_tasks) || 0;
      const overallScore = Math.round((attendance * 0.2) + (quiz * 0.35) + (task * 0.25) + (coding * 0.2));
      const progress = overallScore;

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
        if (attendance < 75) parsedWeakAreas.push({ skill: "Attendance Regularity", score: Math.round(attendance), target: 75 });
        if (quiz < 65) parsedWeakAreas.push({ skill: "Quiz Assessment", score: Math.round(quiz), target: 75 });
        if (task < 65) parsedWeakAreas.push({ skill: "Hands-on Tasks", score: Math.round(task), target: 75 });
      }

      const strongAreas = [];
      if (quiz >= 75) strongAreas.push("Quiz Assessment");
      if (task >= 75) strongAreas.push("Practical Tasks");
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
        task: Math.round(task),
        completedTasks,
        coding: Math.round(coding),
        interview: Math.round(interview),
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
      deptSql += ` WHERE (college_id = ? OR college_id IS NULL)`;
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
      const avgT = count > 0 ? Math.round(deptStudents.reduce((sum, s) => sum + s.task, 0) / count) : 0;
      const avgC = count > 0 ? Math.round(deptStudents.reduce((sum, s) => sum + s.coding, 0) / count) : 0;
      const attention = deptStudents.filter((s) => s.overallScore < 65 || s.attendance < 75).length;

      return {
        id: `d-${d.id}`,
        name: d.name,
        students: count,
        avgPerformance: avgPerf,
        avgAttendance: avgAtt,
        avgQuiz: avgQ,
        avgTask: avgT,
        avgCoding: avgC,
        needsAttention: attention,
      };
    });

    // 3. Aggregate Batch performance
    let batchSql = `SELECT id, name FROM batches`;
    const batchParams = [];
    if (collegeId) {
      batchSql += ` WHERE (college_id = ? OR college_id IS NULL)`;
      batchParams.push(collegeId);
    }
    const rawBatches = await query(batchSql, batchParams);

    const batches = rawBatches.map((b) => {
      const batchStudents = formattedStudents.filter((s) => s.batch === b.name);
      const count = batchStudents.length;
      const avgPerf = count > 0 ? Math.round(batchStudents.reduce((sum, s) => sum + s.overallScore, 0) / count) : 0;
      const avgQuiz = count > 0 ? Math.round(batchStudents.reduce((sum, s) => sum + s.quiz, 0) / count) : 0;
      const avgTask = count > 0 ? Math.round(batchStudents.reduce((sum, s) => sum + s.task, 0) / count) : 0;
      const avgAtt = count > 0 ? Math.round(batchStudents.reduce((sum, s) => sum + s.attendance, 0) / count) : 0;
      const avgCoding = count > 0 ? Math.round(batchStudents.reduce((sum, s) => sum + s.coding, 0) / count) : 0;
      const avgProg = count > 0 ? Math.round(batchStudents.reduce((sum, s) => sum + s.progress, 0) / count) : 0;
      const attention = batchStudents.filter((s) => s.overallScore < 65 || s.attendance < 75).length;

      return {
        id: `b-${b.id}`,
        name: b.name,
        students: count,
        avgPerformance: avgPerf,
        avgQuiz,
        avgTask,
        avgAttendance: avgAtt,
        avgCoding,
        avgProgress: avgProg,
        needsAttention: attention,
      };
    });

    // 4. Score distribution for charts
    const scoreRanges = [
      { range: '90-100%', count: formattedStudents.filter(s => s.overallScore >= 90).length, label: 'Outstanding' },
      { range: '75-89%', count: formattedStudents.filter(s => s.overallScore >= 75 && s.overallScore < 90).length, label: 'Proficient' },
      { range: '60-74%', count: formattedStudents.filter(s => s.overallScore >= 60 && s.overallScore < 75).length, label: 'Average' },
      { range: '<60%', count: formattedStudents.filter(s => s.overallScore < 60).length, label: 'Needs Support' },
    ];

    const performanceData = {
      overview: {
        totalStudents,
        averagePerformance,
        highPerforming,
        needsImprovement,
        averageQuiz: totalStudents > 0 ? Math.round(formattedStudents.reduce((acc, s) => acc + s.quiz, 0) / totalStudents) : 0,
        averageTask: totalStudents > 0 ? Math.round(formattedStudents.reduce((acc, s) => acc + s.task, 0) / totalStudents) : 0,
        averageAttendance: totalStudents > 0 ? Math.round(formattedStudents.reduce((acc, s) => acc + s.attendance, 0) / totalStudents) : 0,
      },
      scoreRanges,
      departments,
      batches,
      students: formattedStudents,
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
    const { mentorId, mentorName, mentorEmail, studentIds } = req.body;
    if (!mentorName && !mentorId) {
      return sendError(res, 'Faculty Mentor Name or ID is required', 400);
    }
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return sendError(res, 'At least one student must be selected', 400);
    }

    const parseId = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const n = parseInt(String(val).replace(/^u-/i, '').replace(/^s-/i, ''), 10);
      return Number.isFinite(n) ? n : null;
    };

    // 1. Resolve Mentor Record
    let resolvedMentorId = parseId(mentorId);
    let resolvedMentorName = mentorName ? String(mentorName).trim() : '';
    let resolvedMentorEmail = mentorEmail ? String(mentorEmail).trim().toLowerCase() : '';

    const mentorSearchConditions = [];
    const mentorParams = [];
    if (resolvedMentorId) {
      mentorSearchConditions.push('u.id = ?');
      mentorParams.push(resolvedMentorId);
    }
    if (resolvedMentorEmail) {
      mentorSearchConditions.push('LOWER(u.email) = ?');
      mentorParams.push(resolvedMentorEmail);
    }
    if (resolvedMentorName) {
      mentorSearchConditions.push('LOWER(u.name) = ?');
      mentorParams.push(resolvedMentorName.toLowerCase());
    }

    if (mentorSearchConditions.length > 0) {
      const foundMentors = await query(
        `SELECT u.id, u.name, u.email, u.college_id
         FROM users u
         WHERE ${mentorSearchConditions.join(' OR ')}
         ORDER BY (CASE WHEN u.role = 'mentor' THEN 0 ELSE 1 END), u.id ASC
         LIMIT 1`,
        mentorParams
      );
      if (foundMentors && foundMentors.length > 0) {
        resolvedMentorId = parseId(foundMentors[0].id);
        resolvedMentorName = foundMentors[0].name || resolvedMentorName;
        resolvedMentorEmail = foundMentors[0].email || resolvedMentorEmail;
      }
    }

    // 2. Ensure Database Schema Compatibility
    await query(`
      CREATE TABLE IF NOT EXISTS mentor_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_id INT NULL,
        mentor_name VARCHAR(100) NOT NULL,
        mentor_email VARCHAR(150) NULL,
        student_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_mentor_student (mentor_name, student_id)
      )
    `);
    try { await query("ALTER TABLE mentor_assignments ADD COLUMN mentor_name VARCHAR(150) NULL"); } catch (e) {}
    try { await query("ALTER TABLE mentor_assignments ADD COLUMN mentor_email VARCHAR(150) NULL"); } catch (e) {}
    try { await query("ALTER TABLE mentor_assignments ADD COLUMN student_id VARCHAR(100) NULL"); } catch (e) {}
    try { await query("ALTER TABLE mentor_assignments ADD COLUMN mentor_id INT NULL"); } catch (e) {}
    try { await query("ALTER TABLE mentor_assignments MODIFY COLUMN batch_id INT NULL"); } catch (e) {}

    await query(`
      CREATE TABLE IF NOT EXISTS mentor_student_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_id INT NOT NULL,
        student_id INT NOT NULL,
        batch_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_mentor_student (student_id),
        INDEX idx_mentor_student_assignments_mentor (mentor_id),
        INDEX idx_mentor_student_assignments_batch (batch_id)
      )
    `);

    try { await query("ALTER TABLE students ADD COLUMN mentor_name VARCHAR(150) NULL"); } catch (e) {}
    try { await query("ALTER TABLE students ADD COLUMN mentor_id INT NULL"); } catch (e) {}
    try { await query("ALTER TABLE users ADD COLUMN mentor_name VARCHAR(150) NULL"); } catch (e) {}
    try { await query("ALTER TABLE users ADD COLUMN mentor_id INT NULL"); } catch (e) {}

    // 3. Process Each Assigned Student
    let savedCount = 0;
    for (const sid of studentIds) {
      if (sid === null || sid === undefined || sid === '') continue;

      const parsedSid = parseId(sid);

      // Resolve student user_id and batch_id
      const sRows = await query(
        `SELECT u.id AS user_id, s.id AS student_table_id, s.batch_id
         FROM users u
         LEFT JOIN students s ON s.user_id = u.id
         WHERE u.id = ? OR s.id = ? OR s.user_id = ?
         LIMIT 1`,
        [sid, sid, sid]
      );

      const targetStudentUserId = (sRows && sRows.length > 0 && sRows[0].user_id) ? parseId(sRows[0].user_id) : parsedSid;
      const studentBatchId = (sRows && sRows.length > 0 && sRows[0].batch_id) ? parseId(sRows[0].batch_id) : null;

      if (!targetStudentUserId) continue;

      // 3a. Save to mentor_assignments
      try {
        await query(
          `INSERT INTO mentor_assignments (mentor_id, mentor_name, mentor_email, student_id)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             mentor_id = VALUES(mentor_id),
             mentor_name = VALUES(mentor_name),
             mentor_email = VALUES(mentor_email)`,
          [resolvedMentorId || null, resolvedMentorName, resolvedMentorEmail || null, String(targetStudentUserId)]
        );
      } catch (maErr) {
        console.warn('[DB mentor_assignments insert notice]', maErr.message);
      }

      // 3b. Save to mentor_student_assignments (PRIMARY TABLE for Mentor workspace)
      if (resolvedMentorId) {
        await query(
          `INSERT INTO mentor_student_assignments (mentor_id, student_id, batch_id)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             mentor_id = VALUES(mentor_id),
             batch_id = COALESCE(VALUES(batch_id), batch_id)`,
          [resolvedMentorId, targetStudentUserId, studentBatchId || null]
        );
      }

      // 3c. Update students and users tables
      try {
        await query(
          `UPDATE students
           SET mentor_name = ?, mentor_id = ?
           WHERE user_id = ? OR id = ?`,
          [resolvedMentorName, resolvedMentorId || null, targetStudentUserId, sid]
        );
      } catch (e) {}

      try {
        await query(
          `UPDATE users
           SET mentor_name = ?, mentor_id = ?
           WHERE id = ?`,
          [resolvedMentorName, resolvedMentorId || null, targetStudentUserId]
        );
      } catch (e) {}

      savedCount++;
    }

    return sendSuccess(res, `Successfully mapped ${savedCount} mentees to mentor ${resolvedMentorName} in database`, {
      mentorId: resolvedMentorId,
      mentorName: resolvedMentorName,
      mentorEmail: resolvedMentorEmail,
      assignedCount: savedCount
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
};

/**
 * Super Admin controller to re-trigger / enforce Two-Step Verification (2FA) for an Admin
 */
export const triggerUser2FAAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Generate fresh 2FA setup secret and set two_factor_enabled = 0 and two_factor_reset = 1 (flagged for setup pairing)
    const totpSetup = await generateTotpSetup(user.email || user.name || `User_${user.id}`);
    await triggerUserTwoFactorReset(user.id, totpSetup.secret);

    return sendSuccess(
      res,
      `Two-step verification setup has been re-triggered for ${user.name || 'Admin'}. The Admin will be prompted to scan the QR code and complete pairing on their next login.`,
      {
        userId: user.id,
        two_factor_enabled: 0,
        two_factor_reset: 1,
        secret: totpSetup.secret,
        qrCode: totpSetup.qrCode,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all support tickets for College Admin / Super Admin
 */
export const getAdminSupportTickets = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);
    let tickets = [];
    try {
      let sql = `
        SELECT st.*, 
               COALESCE(u.name, 'Student/User') AS requesterName, 
               u.email AS requesterEmail, 
               u.role AS requesterRole, 
               COALESCE(s.department, 'General') AS requesterBatch, 
               s.roll_number AS requesterRollNo,
               eb.name AS escalatedByName
        FROM support_tickets st
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN users eb ON st.escalated_by = eb.id
      `;
      const params = [];
      if (collegeId) {
        sql += ` WHERE u.college_id = ? OR u.college_id IS NULL OR st.user_id IS NULL OR st.is_escalated = 1`;
        params.push(collegeId);
      }
      sql += ` ORDER BY st.id DESC`;

      tickets = await query(sql, params);
    } catch (e) {
      console.warn('[DB getAdminSupportTickets full query failed, attempting simple query]', e.message);
      try {
        tickets = await query(`
          SELECT st.*, 
                 COALESCE(u.name, 'Student/User') AS requesterName, 
                 u.email AS requesterEmail, 
                 u.role AS requesterRole
          FROM support_tickets st
          LEFT JOIN users u ON st.user_id = u.id
          ORDER BY st.id DESC
        `);
      } catch (e2) {
        console.warn('[DB getAdminSupportTickets simple query failed, selecting raw]', e2.message);
        try {
          tickets = await query(`SELECT * FROM support_tickets ORDER BY id DESC`);
        } catch (e3) {
          console.warn('[DB getAdminSupportTickets raw query failed]', e3.message);
        }
      }
    }

    const formatted = (tickets || []).map(t => ({
      id: `TICK-${t.id}`,
      dbId: t.id,
      title: t.subject || 'Support Issue',
      category: t.category || 'Technical',
      priority: t.priority || 'Medium',
      status: t.status || 'Open',
      description: t.description || '',
      requesterName: t.requesterName || 'Student/User',
      requesterEmail: t.requesterEmail || '',
      role: t.requesterRole || 'STUDENT',
      batch: t.requesterBatch || 'General',
      time: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Just now',
      resolutionNote: t.resolution_note || '',
      isEscalated: Boolean(t.is_escalated),
      escalationReason: t.escalation_reason || '',
      escalatedByName: t.escalatedByName || '',
      escalatedAt: t.escalated_at || null,
    }));

    return sendSuccess(res, 'Support tickets retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * Update support ticket status and resolution note
 */
export const updateAdminSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body;
    const cleanId = String(id).replace('TICK-', '');

    try {
      await query(
        `UPDATE support_tickets 
         SET status = ?, resolution_note = ? 
         WHERE id = ?`,
        [status || 'Resolved', resolutionNote || '', cleanId]
      );
    } catch (e) {
      console.warn('[DB updateAdminSupportTicket fallback]', e.message);
    }

    return sendSuccess(res, 'Support ticket updated successfully', {
      id: `TICK-${cleanId}`,
      status,
      resolutionNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Escalate support ticket to Super Admin
 */
export const escalateSupportTicketToSuperAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { escalationReason } = req.body;
    const adminId = req.user?.userId || req.user?.id || 1;
    const cleanId = String(id).replace('TICK-', '');

    try {
      await query(
        `UPDATE support_tickets 
         SET is_escalated = 1, status = 'Escalated', escalation_reason = ?, escalated_by = ?, escalated_at = NOW() 
         WHERE id = ?`,
        [escalationReason || 'College Admin escalated issue to Super Admin for assistance.', adminId, cleanId]
      );
    } catch (e) {
      console.warn('[DB escalateSupportTicketToSuperAdmin fallback]', e.message);
    }

    return sendSuccess(res, 'Support ticket escalated to Super Admin successfully', {
      id: `TICK-${cleanId}`,
      status: 'Escalated',
      isEscalated: true,
      escalationReason
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin creates a new support ticket (routed to Super Admin)
 */
export const createAdminSupportTicket = async (req, res, next) => {
  try {
    const { subject, category = 'Software Bug', priority = 'High', description } = req.body;
    if (!subject) {
      return sendError(res, 'Ticket subject is required', 400);
    }
    const adminId = req.user?.userId || req.user?.id || 1;

    let insertId = Date.now();
    try {
      const result = await query(
        `INSERT INTO support_tickets (user_id, subject, category, priority, status, description, is_escalated, escalated_to, escalation_reason, created_at)
         VALUES (?, ?, ?, ?, 'Open', ?, 1, 'super_admin', 'Raised directly by College Admin to Super Admin', NOW())`,
        [adminId, subject.trim(), category, priority, description ? description.trim() : '']
      );
      if (result && result.insertId) insertId = result.insertId;
    } catch (e) {
      console.warn('[DB createAdminSupportTicket fallback]', e.message);
    }

    return sendSuccess(res, 'Support ticket created and routed to Super Admin successfully', {
      id: `TICK-${insertId}`,
      dbId: insertId,
      subject,
      category,
      priority,
      status: 'Open'
    }, 201);
  } catch (error) {
    next(error);
  }
};

