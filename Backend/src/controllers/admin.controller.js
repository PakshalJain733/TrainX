import { executeDailyTrainingSync } from '../modules/integrations/careerGateway/services/dailyTrainingSync.worker.js';
import { getIntegrationStatus } from '../modules/integrations/careerGateway/controllers/careerGatewayMonitoring.controller.js';
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
  toSafeUser,
  isSameCollegeOrAlias,
} from '../models/user.model.js';
import { getDepartmentByIdModel } from '../models/department.model.js';
import { getBatchByIdModel } from '../models/batch.model.js';
import { ROLES } from '../utils/constants.js';
import {
  sendWelcomeEmail,
  sendAccountApprovedEmail,
  sendAdminCredentialsEmail,
  sendStudentCredentialsEmail,
  sendStaffActivationEmail,
  sendAdminDirectCreatedEmail,
  sendAccountRejectionEmail,
  sendAdminInvitationCodeEmail,
  sendStaffInvitationCodeEmail,
} from '../services/email.service.js';
import { createAccountActivation } from '../modules/integrations/careerGateway/services/accountActivation.service.js';
import { findSecureCode, createSecureCode } from '../models/secureCode.model.js';
import { createNotification } from '../services/notification.service.js';
import { isApprovalFeatureActive } from '../middleware/featureSwitch.middleware.js';

const isFlagEnabled = (val) => val === 1 || val === true || String(val) === '1';

const isUserActivated = (user) => Boolean(
  user &&
  isFlagEnabled(user.is_active) &&
  isFlagEnabled(user.is_verified) &&
  user.password_hash &&
  String(user.password_hash).trim().length > 0
);

/**
 * Helper to test if a role string represents Super Admin
 */
const isSuperAdminRole = (role) => {
  if (!role) return false;
  const r = String(role).toLowerCase().trim().replace(/_/g, '');
  return r === 'superadmin' || r.includes('super');
};

/**
 * Helper to determine college isolation filter based on caller role
 */
const getCallerCollegeFilter = (req) => {
  if (isSuperAdminRole(req.user?.role)) {
    return req.query.collegeId ? parseInt(req.query.collegeId, 10) : null;
  }
  return req.user?.collegeId || req.user?.college_id;
};

/**
 * Verifies if the target user belongs to the caller's college (including alias IDs, student records, and NULL college fallback)
 */
const canCallerManageUser = async (req, targetUser) => {
  if (!targetUser) return false;
  if (isSuperAdminRole(req.user?.role)) {
    return true;
  }
  const callerCollegeId = getCallerCollegeFilter(req);
  if (!callerCollegeId) {
    return true; // No restriction on caller
  }

  // Determine the effective college ID of the target user
  let targetCollegeId = targetUser.college_id;
  if (!targetCollegeId) {
    // Check if student table has college_id
    try {
      const studentRows = await query('SELECT college_id FROM students WHERE user_id = ? LIMIT 1', [targetUser.id]);
      if (studentRows && studentRows.length > 0 && studentRows[0].college_id) {
        targetCollegeId = studentRows[0].college_id;
      }
    } catch (_) {}
  }

  // If target user is a trainer, or still has no college_id in users or students table:
  // e.g. shared trainer, unassigned staff, or invited via this college admin
  if (String(targetUser.role).toLowerCase() === 'trainer' || !targetCollegeId) {
    return true;
  }

  // Check direct equality (string coercion handles string vs integer college IDs)
  if (String(callerCollegeId) === String(targetCollegeId)) {
    return true;
  }

  // Check alias college match (e.g. PVPPCOE & VPPCOE duplicate records)
  return await isSameCollegeOrAlias(callerCollegeId, targetCollegeId);
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
  if (r.includes('trainer') || r.includes('instructor')) return ROLES.TRAINER;
  if (r.includes('mentor') || r.includes('faculty')) return ROLES.MENTOR;
  return ROLES.STUDENT;
};

/**
 * Privilege guard: allows Super Admin to assign any role, and College Admins
 * to provision Admin, Coordinator, Mentor, Trainer, and Student accounts.
 */
const canAssignRole = (callerRole, targetRole) => {
  if (isSuperAdminRole(callerRole)) return true;
  return [ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR, ROLES.TRAINER, ROLES.STUDENT].includes(targetRole);
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

    const approvalRequired = await isApprovalFeatureActive();

    // Never expose unverified users as active; accounts stay inactive until email activation completes
    users = users.map((u) => ({
      ...u,
      is_active: isFlagEnabled(u.is_active) && isFlagEnabled(u.is_verified) ? 1 : 0,
      ...(approvalRequired ? {} : { is_approved: 1 }),
    }));

    if (approvalRequired) {
      if (req.query.approved === 'true' || req.query.is_approved === 'true' || req.query.approved_only === 'true') {
        users = users.filter((u) => isFlagEnabled(u.is_approved));
      } else if (req.query.approved === 'false' || req.query.is_approved === 'false' || req.query.pending === 'true') {
        users = users.filter((u) => !isFlagEnabled(u.is_approved));
      }
    }

    // College Admins can only view/manage Students, Mentors, and Coordinators (not other Admins)
    if (!isSuperAdminRole(req.user?.role)) {
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
    const approvalRequired = await isApprovalFeatureActive();
    if (!approvalRequired) {
      return sendSuccess(res, 'User approval workflow is currently disabled by system policy', []);
    }

    const { role, search } = req.query;
    const collegeId = getCallerCollegeFilter(req);

    let users = await getPendingUsersModel(collegeId);

    // Super Admin exclusively reviews and approves Admin accounts (College Admins, Department Admins, HODs)
    // College Admins review and approve non-Admin users (Students, Mentors, Coordinators) belonging to their college
    if (isSuperAdminRole(req.user?.role)) {
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
    if (!isSuperAdminRole(req.user?.role)) {
      if (userRole.includes('admin') || userRole === 'super_admin') {
        return sendError(res, 'Unauthorized: Only Super Admin can approve College Admin registrations.', 403);
      }
      if (!(await canCallerManageUser(req, user))) {
        return sendError(res, 'Unauthorized: You can only approve pending users from your own college.', 403);
      }
    }

    const updatePayload = {
      is_active: 1,
      is_approved: 1,
      is_verified: 1,
      approval_status: 'approved',
      activation_status: 'completed',
    };
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

    // Dispatch approval notification email to the user
    let emailSent = false;
    if (user.email && user.email.includes('@')) {
      sendAccountApprovedEmail({ to: user.email, name: user.name, role: user.role })
        .then(() => console.log(`[Approval Email] Successfully dispatched to ${user.email}`))
        .catch((mailErr) => console.error(`[Approval Email Error] Failed to send to ${user.email}:`, mailErr.message));
      emailSent = true;
    }

    // Insert in-app notification in broadcast_notifications
    try {
      await query(
        `INSERT INTO broadcast_notifications (college_id, title, desc_text, type, unread)
         VALUES (?, ?, ?, 'success', 1)`,
        [
          user.college_id || callerCollegeId || 1,
          `✅ Account Approved: ${user.name} (${String(user.role || 'user').toUpperCase()})`,
          `Account for ${user.name} (${user.email || user.mobile_number || ''}) has been successfully approved and activated.`,
        ]
      );
    } catch (notifErr) {
      console.warn('[Approval In-App Notification Error]', notifErr.message);
    }

    return sendSuccess(res, 'User registration approved successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_approved: 1,
        is_active: 1,
        approval_status: 'approved',
      },
      emailSent,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body || {};
    const user = await findUserById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const userRole = String(user.role || '').toLowerCase();
    if (!isSuperAdminRole(req.user?.role)) {
      if (userRole.includes('admin') || userRole === 'super_admin') {
        return sendError(res, 'Unauthorized: Only Super Admin can reject College Admin registrations.', 403);
      }
      if (!(await canCallerManageUser(req, user))) {
        return sendError(res, 'Unauthorized: You can only reject pending users from your own college.', 403);
      }
    }

    // Send rejection email if user has email
    if (user.email && user.email.includes('@')) {
      sendAccountRejectionEmail({
        to: user.email,
        name: user.name,
        role: user.role,
        reason,
      }).catch((mailErr) => {
        console.warn(`[Rejection Email Notice] ${mailErr.message}`);
      });
    }

    await updateUserModel(id, {
      approval_status: 'rejected',
      is_active: 0,
      is_approved: 0,
    });

    return sendSuccess(res, 'User registration has been rejected and status updated to Rejected');
  } catch (error) {
    next(error);
  }
};

const dispatchStaffCodeInvitationEmail = async ({ to, name, role, code, collegeName = '' }) => {
  const roleNormalized = String(role || '').toLowerCase();
  if (['college_admin', 'admin'].includes(roleNormalized)) {
    return await sendAdminInvitationCodeEmail({
      to,
      name,
      code,
      college_name: collegeName,
      collegeName,
    });
  }
  return await sendStaffInvitationCodeEmail({
    to,
    name,
    role,
    code,
    college_name: collegeName,
    collegeName,
  });
};

/**
 * Resend activation email to staff/admin user who is pending activation
 */
export const resendStaffActivationAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (isUserActivated(user)) {
      return sendError(res, 'This user account is already active and password has been configured.', 400);
    }

    if (!user.email || !user.email.includes('@')) {
      return sendError(res, 'User does not have a valid email address configured.', 400);
    }

    // College isolation check: permits users belonging to caller's college or alias institutions
    if (!(await canCallerManageUser(req, user))) {
      return sendError(res, 'Access forbidden: Cannot resend activation for user from another college', 403);
    }

    const userRole = (user.role || '').toLowerCase();
    let collegeName = req.user?.collegeName || user.college_name || '';
    if (!collegeName && (user.college_id || req.user?.collegeId)) {
      try {
        const colRows = await query('SELECT name FROM colleges WHERE id = ? LIMIT 1', [user.college_id || req.user?.collegeId]);
        if (colRows && colRows.length > 0) {
          collegeName = colRows[0].name;
        }
      } catch (_) {}
    }
    if (!collegeName) collegeName = 'TrainX Partner Institution';

    // If role is mentor, coordinator, trainer, or college_admin, use the Secure Code Activation flow
    if (['mentor', 'coordinator', 'trainer', 'college_admin', 'admin'].includes(userRole)) {
      // Find active unused secure code for this user's email, or create a fresh one
      const activeRows = await query(
        `SELECT code FROM secure_codes 
         WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) 
           AND status = 'active' 
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (max_uses IS NULL OR max_uses = 0 OR uses_count < max_uses)
         ORDER BY id DESC LIMIT 1`,
        [user.email]
      );

      let codeToUse = activeRows && activeRows.length > 0 ? activeRows[0].code : null;

      if (!codeToUse) {
        const prefix = userRole === 'coordinator' ? 'CO' : (['college_admin', 'admin'].includes(userRole) ? 'ADM' : (userRole === 'trainer' ? 'TRN' : 'FAC'));
        const year = new Date().getFullYear();
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        codeToUse = `${prefix}-${year}-${randomDigits}`;

        await createSecureCode({
          code: codeToUse,
          role: userRole,
          college_name: collegeName,
          description: `Resent activation for ${userRole}: ${user.name || user.email}`,
          email: user.email.trim().toLowerCase(),
          created_by: req.user?.id || null,
          email_delivery_status: 'sent',
          max_uses: 1,
          expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
        });
      }

      try {
        await dispatchStaffCodeInvitationEmail({
          to: user.email,
          name: user.name,
          role: user.role,
          code: codeToUse,
          collegeName,
        });
      } catch (mailErr) {
        console.error(`[Resend Staff Activation Mail Error] ${mailErr.message}`);
        return sendError(res, `Activation code generated (${codeToUse}), but failed to deliver email: ${mailErr.message}`, 500);
      }

      return sendSuccess(res, `Activation email with secure code successfully sent to ${user.email}`);
    }

    // Default flow (e.g. students)
    try {
      const { rawToken } = await createAccountActivation(user.id);
      await sendStaffActivationEmail({
        to: user.email,
        name: user.name,
        role: user.role,
        rawToken,
      });
    } catch (mailErr) {
      console.error(`[Resend Student Activation Mail Error] ${mailErr.message}`);
      return sendError(res, `Failed to dispatch activation email: ${mailErr.message}`, 500);
    }

    return sendSuccess(res, `Activation email successfully re-sent to ${user.email}`);
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

    // Existing check handled below with update support for mismatched names & multi-source registrations

    // Role mapping
    const canonicalRole = normalizeRole(role) || ROLES.STUDENT;

    // Privilege guard: college admins cannot mint admin-level accounts
    if (!canAssignRole(req.user.role, canonicalRole)) {
      return sendError(res, 'Access forbidden: You cannot assign this role', 403);
    }

    // College Isolation Enforcement:
    // College Admins can ONLY create users within their own college.
    let targetCollegeId = req.user.collegeId;
    if (isSuperAdminRole(req.user?.role)) {
      targetCollegeId = requestedCollegeId ? parseInt(requestedCollegeId, 10) : (targetCollegeId || 1);
    }

    // Hierarchy validation: verify department & batch belong to the target college if specified
    let validatedDeptName = department || '';
    let validatedDeptId = department_id ? parseInt(department_id, 10) : null;
    if (department_id) {
      const deptRecord = await getDepartmentByIdModel(department_id);
      if (deptRecord) {
        if (deptRecord.college_id !== targetCollegeId && !isSuperAdminRole(req.user?.role)) {
          return sendError(res, 'Cannot assign user to a department from another college', 403);
        }
        validatedDeptName = deptRecord.code || deptRecord.name;
        validatedDeptId = deptRecord.id;
      }
    } else if (validatedDeptName) {
      try {
        const dRows = await query(
          'SELECT id, name, code FROM departments WHERE college_id = ? AND (code = ? OR name = ?) LIMIT 1',
          [targetCollegeId, validatedDeptName, validatedDeptName]
        );
        if (dRows && dRows.length > 0) {
          validatedDeptId = dRows[0].id;
          validatedDeptName = dRows[0].code || dRows[0].name;
        }
      } catch (_) {}
    }

    if (batch_id) {
      const batchRecord = await getBatchByIdModel(batch_id);
      if (batchRecord && batchRecord.college_id !== targetCollegeId && !isSuperAdminRole(req.user?.role)) {
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
    const isSuperAdminAddingAdmin = isSuperAdminRole(req.user?.role) && (
      canonicalRole === ROLES.COLLEGE_ADMIN || 
      isSuperAdminAccount || 
      String(canonicalRole).includes('admin')
    );

    // For non-student staff roles (Admin, Coordinator, Mentor, Trainer):
    // Accounts are created with Pending Activation (is_active: 0, is_verified: 0, is_approved: 1).
    // An activation email with a single-use token is sent so the user can set their own password.
    // No default password is stored or sent.
    const isStaffRole = canonicalRole === ROLES.COORDINATOR || 
                        canonicalRole === ROLES.MENTOR || 
                        canonicalRole === ROLES.TRAINER || 
                        canonicalRole === ROLES.COLLEGE_ADMIN || 
                        canonicalRole === ROLES.SUPER_ADMIN || 
                        String(canonicalRole).includes('admin');

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanMobile = mobile_number ? String(mobile_number).trim() : null;

    let targetSecureCode = (secure_code || code || '').trim().toUpperCase();
    const suppliedCode = targetSecureCode;
    let codeAlreadyEmailed = false;

    if (isStaffRole && !isSuperAdminAddingAdmin) {
      if (!targetSecureCode) {
        const prefix = canonicalRole === ROLES.COORDINATOR ? 'CO' : (canonicalRole === ROLES.MENTOR ? 'FAC' : (canonicalRole === ROLES.TRAINER ? 'TRN' : 'ADM'));
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        targetSecureCode = `${prefix}-${randomHex}`;
      }

      // Check if code is already registered in DB (e.g. generated in-modal via /secure-codes/generate)
      try {
        const existingCodeRecord = await findSecureCode(targetSecureCode, canonicalRole);
        if (existingCodeRecord) {
          const codeEmail = existingCodeRecord.email ? String(existingCodeRecord.email).trim().toLowerCase() : null;
          if (
            suppliedCode &&
            cleanEmail &&
            codeEmail === cleanEmail &&
            existingCodeRecord.email_delivery_status === 'sent'
          ) {
            codeAlreadyEmailed = true;
          } else if (cleanEmail) {
            await query(
              'UPDATE secure_codes SET email = ?, email_delivery_status = ? WHERE id = ?',
              [cleanEmail, 'sent', existingCodeRecord.id]
            );
          }
        } else {
          await createSecureCode({
            code: targetSecureCode,
            role: canonicalRole,
            college_name: targetCollegeName || null,
            email: cleanEmail || null,
            email_delivery_status: cleanEmail ? 'sent' : 'pending',
            description: `Generated for ${canonicalRole} onboarding: ${name}`,
            created_by: req.user?.id || null,
            max_uses: 1,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
        }
      } catch (err) {
        console.warn(`[Admin User Creation Secure Code Warning] ${err.message}`);
      }
    }

    const rawPassword = (password || '').trim();
    let finalPassword = rawPassword;
    if (!finalPassword && isSuperAdminAddingAdmin) {
      finalPassword = 'Admin@' + Math.floor(1000 + Math.random() * 9000) + '!';
    }

    const approvalRequired = await isApprovalFeatureActive();
    const isApprovedVal = isSuperAdminAddingAdmin ? 1 : (isStaffRole ? 0 : (!approvalRequired ? 1 : 0));
    const initialActive = isSuperAdminAddingAdmin ? 1 : 0;
    const initialVerified = isSuperAdminAddingAdmin ? 1 : 0;
    const forcePasswordChangeVal = isSuperAdminAddingAdmin ? 1 : 0;
    const activationStatusVal = isSuperAdminAddingAdmin ? 'completed' : 'pending';
    const approvalStatusVal = isSuperAdminAddingAdmin ? 'approved' : (isStaffRole ? 'pending' : (!approvalRequired ? 'approved' : 'pending'));

    // Check if user already exists in DB (registered first on portal, or pre-added)
    let existing = null;
    if (cleanEmail) {
      existing = await findUserByEmailOrMobile(cleanEmail);
    }
    if (!existing && cleanMobile) {
      existing = await findUserByEmailOrMobile(cleanMobile);
    }

    if (existing) {
      // Only block duplicate creation if the user has already activated their account and configured a password
      if (isUserActivated(existing)) {
        return sendError(
          res,
          `An active user account already exists with this email address (${existing.email || cleanEmail}).`,
          409
        );
      }

      // Requirement: If user was pre-added or registers with updated name, sync details
      const trimmedName = (name || '').trim();
      const existingVerified = isFlagEnabled(existing.is_verified) ? 1 : 0;
      const existingApproved = (existingVerified && (isStaffRole || !approvalRequired)) ? 1 : (existing.is_approved || 0);
      const existingActive = isUserActivated(existing) ? 1 : 0;

      if (trimmedName) {
        const updateData = {
          name: trimmedName,
          role: canonicalRole,
          college_id: targetCollegeId,
          department: validatedDeptName,
          department_id: validatedDeptId,
          is_approved: existingApproved,
          is_active: existingActive,
          is_verified: existingVerified,
        };
        if (finalPassword) {
          updateData.password = finalPassword;
        }
        await updateUserModel(existing.id, updateData);
      }

      if (canonicalRole === ROLES.STUDENT) {
        const cleanYear = String(year || 'FE').toUpperCase().trim();
        let defaultSem = '1';
        if (cleanYear === 'FE') defaultSem = '1';
        else if (cleanYear === 'SE') defaultSem = '3';
        else if (cleanYear === 'TE') defaultSem = '5';
        else if (cleanYear === 'BE') defaultSem = '7';

        let finalSem = semester ? String(semester).replace(/^[^\d]*/, '').trim() : '';
        if (!finalSem) finalSem = defaultSem;

        const [stRows] = await query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [existing.id]);
        if (stRows && stRows.length > 0) {
          await query(
            'UPDATE students SET college_id = ?, department_id = ?, batch_id = COALESCE(?, batch_id), roll_number = COALESCE(?, roll_number), department = ?, year = ?, division = ?, semester = ? WHERE user_id = ?',
            [targetCollegeId, validatedDeptId, batch_id ? parseInt(batch_id, 10) : null, roll_number || null, validatedDeptName, year || 'FE', division || 'A', finalSem, existing.id]
          );
        } else {
          await saveStudentDetails({
            user_id: existing.id,
            college_id: targetCollegeId,
            department_id: validatedDeptId,
            batch_id: batch_id ? parseInt(batch_id, 10) : null,
            roll_number: roll_number || `AUTO_${existing.id}`,
            department: validatedDeptName,
            year: year || 'FE',
            division: division || 'A',
            semester: finalSem,
            cgpa: cgpa || '8.5',
            skills: skills || '',
          });
        }
      }

      // If user is not verified/activated yet, dispatch single activation email
      if (!existingVerified && existing.email && existing.email.includes('@')) {
        if (isStaffRole && !isSuperAdminAddingAdmin) {
          if (!codeAlreadyEmailed) {
            dispatchStaffCodeInvitationEmail({
              to: existing.email,
              name: trimmedName || existing.name,
              role: canonicalRole,
              code: targetSecureCode,
              collegeName: targetCollegeName || '',
            }).catch((err) => {
              console.warn(`[Staff Access Code Email Dispatch Notice] ${err.message}`);
            });
          }
        } else {
          try {
            const { rawToken } = await createAccountActivation(existing.id);
            sendStaffActivationEmail({
              to: existing.email,
              name: trimmedName || existing.name,
              role: canonicalRole,
              rawToken,
            }).catch((err) => {
              console.warn(`[Activation Email Dispatch Notice] ${err.message}`);
            });
          } catch (err) {
            console.warn(`[Activation Token Error] ${err.message}`);
          }
        }
      }

      const msg = !existingVerified
        ? 'User details updated. Activation email dispatched for account setup.'
        : 'User details updated in database.';

      return sendSuccess(res, {
        user: {
          id: existing.id,
          name: trimmedName || existing.name,
          email: existing.email,
          role: canonicalRole,
          college_id: targetCollegeId,
          is_approved: existingApproved,
          is_active: existingActive,
          is_verified: existingVerified,
        }
      }, msg);
    }

    let newUser;
    try {
      newUser = await createUser({
        name,
        password: finalPassword || '',
        email: cleanEmail || '',
        mobile_number: cleanMobile || '',
        role: canonicalRole,
        college_id: targetCollegeId,
        department: validatedDeptName,
        department_id: validatedDeptId,
        is_active: initialActive,
        is_verified: initialVerified,
        is_approved: isApprovedVal,
        force_password_change: forcePasswordChangeVal,
        activation_status: activationStatusVal,
        approval_status: approvalStatusVal,
      });
    } catch (createErr) {
      if (
        createErr.code === 'ER_DUP_ENTRY' ||
        createErr.errno === 1062 ||
        (createErr.message && createErr.message.includes('Duplicate entry'))
      ) {
        return sendError(
          res,
          `An account with this email (${cleanEmail || cleanMobile}) already exists in the system.`,
          409
        );
      }
      throw createErr;
    }

    let studentProfile = null;
    if (canonicalRole === ROLES.STUDENT) {
      const cleanYear = String(year || 'FE').toUpperCase().trim();
      let defaultSem = '1';
      if (cleanYear === 'FE') defaultSem = '1';
      else if (cleanYear === 'SE') defaultSem = '3';
      else if (cleanYear === 'TE') defaultSem = '5';
      else if (cleanYear === 'BE') defaultSem = '7';

      let finalSem = semester ? String(semester).replace(/^[^\d]*/, '').trim() : '';
      if (!finalSem) finalSem = defaultSem;

      studentProfile = await saveStudentDetails({
        user_id: newUser.id,
        college_id: targetCollegeId,
        department_id: validatedDeptId,
        batch_id: batch_id ? parseInt(batch_id, 10) : null,
        roll_number: roll_number || `AUTO_${newUser.id}`,
        department: validatedDeptName,
        year: year || 'FE',
        division: division || 'A',
        semester: finalSem,
        cgpa: cgpa || '8.5',
        skills: skills || '',
      });
    }

    if (newUser.email && newUser.email.includes('@')) {
      if (isSuperAdminAddingAdmin) {
        // Part 5: Super Admin directly creates Admin account
        try {
          await sendAdminDirectCreatedEmail({
            to: newUser.email,
            name: newUser.name,
            temporaryPassword: finalPassword,
            collegeName: targetCollegeName,
          });
        } catch (adminMailErr) {
          console.warn(`[Admin Direct Creation Email Error] ${adminMailErr.message}`);
          if (req.user?.id) {
            try {
              await createNotification({
                user_id: req.user.id,
                title: 'Email Delivery Failed: Admin Account Credentials',
                message: `Failed to deliver login credentials email to ${newUser.email}. Reason: ${adminMailErr.message}.`,
                type: 'alert',
                priority: 'Urgent',
                category: 'Email Delivery Alert',
              });
            } catch (_) {}
          }
        }
      } else if (isStaffRole) {
        // Send ONLY the access-code invitation email (with activation link) if /secure-codes/generate has not already emailed this user
        if (!codeAlreadyEmailed) {
          dispatchStaffCodeInvitationEmail({
            to: newUser.email,
            name: newUser.name,
            role: canonicalRole,
            code: targetSecureCode,
            collegeName: targetCollegeName || '',
          }).catch((err) => {
            console.warn(`[Staff Access Code Email Dispatch Notice] ${err.message}`);
          });
        }
      } else if (targetSecureCode) {
        // Student account welcome email with explicit secure code
        const isStudentAccount = canonicalRole === ROLES.STUDENT;
        sendWelcomeEmail({
          to: newUser.email,
          name: newUser.name,
          role: canonicalRole,
          secure_code: targetSecureCode,
          mobile_number: mobile_number || newUser.mobile_number || '',
          roll_number: isStudentAccount ? (roll_number || (studentProfile && studentProfile.roll_number) || '') : (roll_number || ''),
          department: validatedDeptName || department || '',
          year: isStudentAccount ? (year || (studentProfile && studentProfile.year) || '') : '',
          division: isStudentAccount ? (division || (studentProfile && studentProfile.division) || '') : '',
        }).catch((err) => {
          console.warn(`[Admin User Creation Email Notice] ${err.message}`);
        });
      } else {
        // Student created without a secure code or password receives a direct activation mail
        try {
          const { rawToken } = await createAccountActivation(newUser.id);
          sendStaffActivationEmail({
            to: newUser.email,
            name: newUser.name,
            role: canonicalRole,
            rawToken,
          }).catch((err) => {
            console.warn(`[Student Activation Email Dispatch Notice] ${err.message}`);
          });
        } catch (err) {
          console.warn(`[Student Activation Token Error] ${err.message}`);
        }
      }
    }

    const successMessage = isSuperAdminAddingAdmin
      ? 'Admin account created successfully. Welcome email with temporary password has been dispatched.'
      : (isStaffRole || !targetSecureCode)
      ? 'Account created successfully. An activation email has been dispatched to the user to set their password.'
      : 'User created successfully. Registration invitation with secure access code dispatched.';

    return sendSuccess(
      res,
      successMessage,
      {
        ...newUser,
        secure_code: isStaffRole ? null : (targetSecureCode || null),
        is_verified: initialVerified,
        is_approved: isApprovedVal,
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

    // 1. Identify target college ID with strict college isolation
    let targetCollegeId = req.user.collegeId || req.user.college_id;
    if (isSuperAdminRole(req.user?.role)) {
      targetCollegeId = requestedCollegeId ? parseInt(requestedCollegeId, 10) : (targetCollegeId || 1);
    }
    if (!targetCollegeId) {
      const [uRow] = await query('SELECT college_id FROM users WHERE id = ?', [req.user.id || req.user.userId]);
      targetCollegeId = uRow?.college_id || 1;
    }

    let collegeName = '';
    try {
      const [cRow] = await query('SELECT name FROM colleges WHERE id = ?', [targetCollegeId]);
      collegeName = cRow?.name || '';
    } catch (_) {}

    // 2. Fetch existing active departments strictly for this college from the database
    const collegeDepts = await query(
      `SELECT id, name, code, status, college_id 
       FROM departments 
       WHERE college_id = ? AND (status IS NULL OR LOWER(status) = 'active')`,
      [targetCollegeId]
    );

    // Build case-insensitive lookup map for fast O(1) department validation
    const deptMap = new Map();
    (collegeDepts || []).forEach((d) => {
      if (d.code && String(d.code).trim()) {
        deptMap.set(String(d.code).trim().toLowerCase(), d);
      }
      if (d.name && String(d.name).trim()) {
        deptMap.set(String(d.name).trim().toLowerCase(), d);
      }
    });

    const createdList = [];
    const rejectedList = [];
    const results = [];

    // In-memory sets to catch duplicate records within the uploaded spreadsheet
    const seenEmailsInBatch = new Set();
    const seenMobilesInBatch = new Set();
    const seenRollsInBatch = new Set();

    for (let i = 0; i < students.length; i++) {
      const item = students[i] || {};
      const name = String(item.name || item.fullName || item['Full Name'] || item['Name'] || '').trim();
      const email = String(item.email || item.collegeEmail || item['College Email'] || item['Email'] || '').trim();
      const mobile_number = String(item.mobile_number || item.phone || item.mobile || item['Mobile Number'] || item['Mobile'] || '').trim();
      const roll_number = String(item.roll_number || item.rollNo || item.collegeId || item['College ID'] || item['Roll ID'] || item['Roll No'] || '').trim();
      const rawDept = String(item.department || item.dept || item['Department'] || item['Dept'] || '').trim();
      const year = String(item.year || item['Academic Year'] || item['Year'] || 'FE').trim();
      const division = String(item.division || item.div || item['Division'] || 'A').trim();

      // Validation 1: Required Name & Email
      if (!name || !email) {
        const reason = 'Rejected – Name and Email are required';
        rejectedList.push({ name: name || '—', email: email || '—', roll_number: roll_number || '—', department: rawDept || '—', status: 'Rejected', reason });
        results.push({ student: name || '—', email: email || '—', roll_number: roll_number || '—', department: rawDept || '—', status: 'Rejected', reason });
        continue;
      }

      if (!email.includes('@')) {
        const reason = 'Rejected – Invalid email address format';
        rejectedList.push({ name, email, roll_number: roll_number || '—', department: rawDept || '—', status: 'Rejected', reason });
        results.push({ student: name, email, roll_number: roll_number || '—', department: rawDept || '—', status: 'Rejected', reason });
        continue;
      }

      // Validation 2: STRICT DEPARTMENT VALIDATION
      // Must exist in this college's departments table; case-insensitive & trimmed
      if (!rawDept) {
        const reason = 'Rejected – Department is required';
        rejectedList.push({ name, email, roll_number: roll_number || '—', department: '—', status: 'Rejected', reason });
        results.push({ student: name, email, roll_number: roll_number || '—', department: '—', status: 'Rejected', reason });
        continue;
      }

      const matchedDept = deptMap.get(rawDept.toLowerCase());
      if (!matchedDept) {
        const reason = `Rejected – Department not created`;
        rejectedList.push({ name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
        results.push({ student: name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
        continue;
      }

      // Validation 3: Duplicate Email Check (both within batch and across database)
      const emailLower = email.toLowerCase();
      if (seenEmailsInBatch.has(emailLower)) {
        const reason = 'Rejected – Duplicate email in upload file';
        rejectedList.push({ name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
        results.push({ student: name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
        continue;
      }
      seenEmailsInBatch.add(emailLower);

      const existingEmail = await findUserByEmailOrMobile(email);
      if (existingEmail) {
        // Requirement: "if admin add one user name ganesh and that users registers first but with different then that name should be updated in db"
        // "no one should be directly approved"
        const trimmedName = (name || '').trim();
        if (trimmedName) {
          await query(
            'UPDATE users SET name = ?, department = ?, department_id = ?, is_approved = 0 WHERE id = ?',
            [trimmedName, resolvedDeptName, resolvedDeptId, existingEmail.id]
          );
        }
        await query(
          'UPDATE students SET college_id = ?, department_id = ?, roll_number = COALESCE(?, roll_number), department = ? WHERE user_id = ?',
          [targetCollegeId, resolvedDeptId, roll_number || null, resolvedDeptName, existingEmail.id]
        );
        createdList.push({
          id: existingEmail.id,
          name: trimmedName || existingEmail.name,
          email: existingEmail.email,
          roll_number: roll_number || '—',
          department: resolvedDeptName,
          status: 'Updated',
        });
        results.push({
          student: trimmedName || existingEmail.name,
          email: existingEmail.email,
          roll_number: roll_number || '—',
          department: resolvedDeptName,
          status: 'Updated',
        });
        continue;
      }

      // Validation 4: Duplicate Mobile Number Check
      if (mobile_number) {
        if (seenMobilesInBatch.has(mobile_number)) {
          const reason = 'Rejected – Duplicate mobile number in upload file';
          rejectedList.push({ name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
          results.push({ student: name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
          continue;
        }
        seenMobilesInBatch.add(mobile_number);

        const existingMobile = await findUserByEmailOrMobile(mobile_number);
        if (existingMobile) {
          const reason = 'Rejected – Mobile number already registered in system';
          rejectedList.push({ name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
          results.push({ student: name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
          continue;
        }
      }

      // Validation 5: Duplicate Roll ID Check
      if (roll_number) {
        const rollLower = roll_number.toLowerCase();
        if (seenRollsInBatch.has(rollLower)) {
          const reason = 'Rejected – Duplicate roll ID in upload file';
          rejectedList.push({ name, email, roll_number, department: rawDept, status: 'Rejected', reason });
          results.push({ student: name, email, roll_number, department: rawDept, status: 'Rejected', reason });
          continue;
        }
        seenRollsInBatch.add(rollLower);

        const [existingRoll] = await query(
          'SELECT id FROM students WHERE college_id = ? AND LOWER(roll_number) = ? LIMIT 1',
          [targetCollegeId, rollLower]
        );
        if (existingRoll) {
          const reason = `Rejected – Roll ID '${roll_number}' already exists in this college`;
          rejectedList.push({ name, email, roll_number, department: rawDept, status: 'Rejected', reason });
          results.push({ student: name, email, roll_number, department: rawDept, status: 'Rejected', reason });
          continue;
        }
      }

      // All validations passed: Safely insert User (Pending Activation until verified via activation mail)
      const explicitPassword = item.password ? String(item.password).trim() : '';
      const resolvedDeptName = matchedDept.name || rawDept;
      const resolvedDeptId = matchedDept.id;

      try {
        const newUser = await createUser({
          name,
          email,
          mobile_number: mobile_number || null,
          role: ROLES.STUDENT,
          college_id: targetCollegeId,
          department: resolvedDeptName,
          department_id: resolvedDeptId,
          password: explicitPassword,
          is_active: 0,
          is_verified: 0,
          is_approved: 0,
        });

        const studentProfile = await saveStudentDetails({
          user_id: newUser.id,
          college_id: targetCollegeId,
          department_id: resolvedDeptId,
          roll_number: roll_number || `AUTO_${newUser.id}`,
          department: resolvedDeptName,
          year: year || 'FE',
          division: division || 'A',
          semester: 'Semester 1',
          cgpa: '8.0',
          skills: '',
          mobile_number: mobile_number || null,
        });

        // Send account activation email so user activates and configures their own password
        if (newUser.email && newUser.email.includes('@')) {
          try {
            const { rawToken } = await createAccountActivation(newUser.id);
            sendStaffActivationEmail({
              to: newUser.email,
              name: newUser.name,
              role: ROLES.STUDENT,
              rawToken,
            }).catch((err) => {
              console.warn(`[Bulk Activation Email Notice] ${err.message}`);
            });
          } catch (tokenErr) {
            console.warn(`[Bulk Activation Token Error] ${tokenErr.message}`);
          }
        }

        createdList.push({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          roll_number: studentProfile.roll_number,
          department: resolvedDeptName,
          department_id: resolvedDeptId,
          year,
          division,
          status: 'Added',
        });

        results.push({
          student: newUser.name,
          email: newUser.email,
          roll_number: studentProfile.roll_number,
          department: resolvedDeptName,
          status: 'Added',
          reason: 'Successfully added',
        });
      } catch (insertErr) {
        console.error('[Bulk Upload Insert Error]', insertErr);
        const reason = `Rejected – Database error: ${insertErr.message}`;
        rejectedList.push({ name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
        results.push({ student: name, email, roll_number: roll_number || '—', department: rawDept, status: 'Rejected', reason });
      }
    }

    return sendSuccess(
      res,
      `Bulk processing complete. Total: ${students.length}, Added: ${createdList.length}, Rejected: ${rejectedList.length}.`,
      {
        totalUploaded: students.length,
        createdCount: createdList.length,
        skippedCount: rejectedList.length,
        rejectedCount: rejectedList.length,
        createdList,
        rejectedList,
        skippedList: rejectedList,
        results,
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

    // College Isolation check: permits users belonging to caller's college or alias institutions
    if (!(await canCallerManageUser(req, existingUser))) {
      return sendError(res, 'Access forbidden: Cannot modify users from another college', 403);
    }

    // Whitelist editable fields — never trust raw req.body
    const updates = pickUserUpdateFields(req.body);

    if (updates.department && !updates.department_id) {
      try {
        const dRows = await query(
          'SELECT id, name, code FROM departments WHERE college_id = ? AND (code = ? OR name = ?) LIMIT 1',
          [existingUser.college_id, updates.department, updates.department]
        );
        if (dRows && dRows.length > 0) {
          updates.department_id = dRows[0].id;
          updates.department = dRows[0].code || dRows[0].name;
        }
      } catch (_) {}
    } else if (updates.department_id && !updates.department) {
      try {
        const dRows = await query(
          'SELECT id, name, code FROM departments WHERE id = ? LIMIT 1',
          [updates.department_id]
        );
        if (dRows && dRows.length > 0) {
          updates.department = dRows[0].code || dRows[0].name;
        }
      } catch (_) {}
    }

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
      if (!isSuperAdminRole(req.user?.role)) {
        return sendError(res, 'Access forbidden: Only super admins can change college assignment', 403);
      }
      updates.college_id = parseInt(req.body.college_id, 10);
    }

    // Do not allow an unverified account to be marked active before email activation completes
    const targetVerified = updates.is_verified !== undefined
      ? isFlagEnabled(updates.is_verified)
      : isFlagEnabled(existingUser.is_verified);
    if (!targetVerified && updates.is_active !== undefined && isFlagEnabled(updates.is_active)) {
      updates.is_active = 0;
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

    // College Isolation check: permits users belonging to caller's college or alias institutions
    if (!(await canCallerManageUser(req, existingUser))) {
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
    const hasLangInBody = (language !== undefined || lang !== undefined);
    let resolvedLang = null;
    if (hasLangInBody) {
      const rawLang = language !== undefined ? language : lang;
      if (rawLang && rawLang !== 'All' && rawLang !== 'Any' && String(rawLang).trim() !== '') {
        resolvedLang = String(rawLang).trim();
      } else {
        resolvedLang = null;
      }
    }
    const batchVal = batch || batchName || null;
    let validBatchId = batch_id ? parseInt(batch_id, 10) : null;
    if (isNaN(validBatchId)) validBatchId = null;

    try {
      if (hasLangInBody) {
        await query(
          `UPDATE practice_problems
           SET title = COALESCE(?, title),
               description = COALESCE(?, description),
               difficulty = COALESCE(?, difficulty),
               category = COALESCE(?, category),
               tags = COALESCE(?, tags),
               points = COALESCE(?, points),
               due_date = ?,
               language = ?,
               batch_name = COALESCE(?, batch_name),
               batch_id = COALESCE(?, batch_id)
           WHERE id = ?`,
          [title?.trim() || null, description || null, difficulty || null, category || topic || null, tagsStr || null, points || xp || null, normalizedDueDate, resolvedLang, batchVal, validBatchId, id]
        );
      } else {
        await query(
          `UPDATE practice_problems
           SET title = COALESCE(?, title),
               description = COALESCE(?, description),
               difficulty = COALESCE(?, difficulty),
               category = COALESCE(?, category),
               tags = COALESCE(?, tags),
               points = COALESCE(?, points),
               due_date = ?,
               batch_name = COALESCE(?, batch_name),
               batch_id = COALESCE(?, batch_id)
           WHERE id = ?`,
          [title?.trim() || null, description || null, difficulty || null, category || topic || null, tagsStr || null, points || xp || null, normalizedDueDate, batchVal, validBatchId, id]
        );
      }
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
            const isHidden = (tc.isHidden === true || tc.is_hidden === true || tc.isHidden === 1 || tc.is_hidden === 1 || String(tc.isHidden).toLowerCase() === 'true' || String(tc.is_hidden).toLowerCase() === 'true') ? 1 : 0;
            await query(
              `INSERT INTO coding_test_cases (problem_id, input, expected_output, is_hidden) VALUES (?, ?, ?, ?)`,
              [id, inp, out, isHidden]
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
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      return sendError(res, 'User identity not found in authenticated session', 401);
    }
    const user = await findUserById(userId);
    return sendSuccess(res, 'Admin profile retrieved successfully', user ? toSafeUser(user) : req.user);
  } catch (error) {
    next(error);
  }
};

export const updateAdminProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      return sendError(res, 'User identity not found in authenticated session', 401);
    }
    // Self-service profile edits may never change role, college or activation state
    const updates = pickUserUpdateFields(req.body);
    delete updates.is_active;
    delete updates.batch_id;
    delete updates.roll_number;
    const updated = await updateUserModel(userId, updates);
    return sendSuccess(res, 'Admin profile updated successfully', updated ? toSafeUser(updated) : updated);
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

    const created = await createNotification({
      college_id: collegeId,
      title: title.trim(),
      message: message.trim(),
      target: target || 'All Batches',
      priority: priority || 'General Announcement',
      created_by: req.user ? req.user.id : 1,
      created_by_name: senderName,
      sender_role: senderRole,
    });
    return sendSuccess(res, 'Broadcast sent and saved in database successfully', created, 201);
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
    const { mentorId, mentorName, mentorEmail, studentIds, isReassignment } = req.body;
    if (!mentorName && !mentorId) {
      return sendError(res, 'Mentor Name or ID is required', 400);
    }
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return sendError(res, 'At least one student must be selected', 400);
    }

    const parseId = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const n = parseInt(String(val).replace(/^u-/i, '').replace(/^s-/i, ''), 10);
      return Number.isFinite(n) ? n : null;
    };

    // Multi-college isolation: identify caller's college
    let targetCollegeId = req.user?.collegeId || req.user?.college_id;
    if (isSuperAdminRole(req.user?.role) && req.body.collegeId) {
      targetCollegeId = parseInt(req.body.collegeId, 10);
    }

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
      let mentorSql = `
        SELECT u.id, u.name, u.email, u.college_id
        FROM users u
        WHERE (${mentorSearchConditions.join(' OR ')})
      `;
      const sqlParams = [...mentorParams];
      if (targetCollegeId && !isSuperAdminRole(req.user?.role)) {
        mentorSql += ' AND (u.college_id = ? OR u.college_id IS NULL)';
        sqlParams.push(targetCollegeId);
      }
      mentorSql += ` ORDER BY (CASE WHEN u.role = 'mentor' THEN 0 ELSE 1 END), u.id ASC LIMIT 1`;

      const foundMentors = await query(mentorSql, sqlParams);
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

    // 3. Pre-fetch and Validate All Target Students Before Modifying Any State
    const resolvedStudents = [];
    for (const sid of studentIds) {
      if (sid === null || sid === undefined || sid === '') continue;

      const parsedSid = parseId(sid);
      const sRows = await query(
        `SELECT u.id AS user_id, u.name AS student_name, u.email AS student_email, u.college_id,
                s.id AS student_table_id, s.batch_id,
                COALESCE(m_u.name, s.mentor_name, u.mentor_name, ma.mentor_name) AS current_mentor_name,
                COALESCE(m_u.id, msa.mentor_id, s.mentor_id, u.mentor_id, ma.mentor_id) AS current_mentor_id
         FROM users u
         LEFT JOIN students s ON s.user_id = u.id
         LEFT JOIN mentor_student_assignments msa ON msa.student_id = u.id
         LEFT JOIN users m_u ON msa.mentor_id = m_u.id
         LEFT JOIN (
           SELECT student_id, MAX(mentor_id) AS mentor_id, MAX(mentor_name) AS mentor_name
           FROM mentor_assignments
           GROUP BY student_id
         ) ma ON (ma.student_id = CAST(u.id AS CHAR) OR ma.student_id = CAST(s.id AS CHAR))
         WHERE u.id = ? OR s.id = ? OR s.user_id = ?
         LIMIT 1`,
        [sid, sid, sid]
      );

      if (!sRows || sRows.length === 0) continue;

      const row = sRows[0];
      const targetStudentUserId = parseId(row.user_id) || parsedSid;
      const studentBatchId = parseId(row.batch_id);

      // Enforce college-level isolation
      if (targetCollegeId && row.college_id && row.college_id !== targetCollegeId && !isSuperAdminRole(req.user?.role)) {
        return sendError(res, `Access denied: Student "${row.student_name}" belongs to another college`, 403);
      }

      // Check current assignment status
      const existingMentorName = (row.current_mentor_name || '').trim();
      const existingMentorId = row.current_mentor_id;
      const hasExistingAssignment = Boolean(existingMentorName);

      const isSameMentor = hasExistingAssignment && (
        (resolvedMentorId && existingMentorId === resolvedMentorId) ||
        (resolvedMentorName && existingMentorName.toLowerCase() === resolvedMentorName.toLowerCase())
      );

      // Prevent Duplicate Assignments:
      // If student is already assigned to a different mentor and this is NOT an explicit reassignment:
      if (hasExistingAssignment && !isSameMentor && !isReassignment) {
        return sendError(
          res,
          `This student is already assigned to ${existingMentorName}.`,
          409,
          {
            alreadyAssigned: true,
            studentId: targetStudentUserId,
            studentName: row.student_name,
            assignedMentorName: existingMentorName,
            assignedMentorId: existingMentorId,
          }
        );
      }

      resolvedStudents.push({
        sid,
        targetStudentUserId,
        studentBatchId,
        studentName: row.student_name,
        existingMentorName,
        existingMentorId,
        wasReassigned: hasExistingAssignment && !isSameMentor && Boolean(isReassignment),
      });
    }

    if (resolvedStudents.length === 0) {
      return sendError(res, 'No valid student accounts found for assignment', 400);
    }

    // 4. Safely Apply Assignment / Reassignment without Duplicates
    let savedCount = 0;
    const reassignedStudents = [];

    for (const student of resolvedStudents) {
      const { sid, targetStudentUserId, studentBatchId, studentName, existingMentorName, wasReassigned } = student;

      // In case of reassignment, clean previous records from mentor_assignments
      if (wasReassigned || isReassignment) {
        try {
          await query(
            `DELETE FROM mentor_assignments WHERE student_id = ? OR student_id = ?`,
            [String(targetStudentUserId), String(sid)]
          );
        } catch (delErr) {
          console.warn('[DB Cleanup Mentor Assignment]', delErr.message);
        }
      }

      // 4a. Save to mentor_assignments
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

      // 4b. Save to mentor_student_assignments (PRIMARY TABLE, enforced unique student_id)
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

      // 4c. Synchronize students & users tables
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
      if (wasReassigned) {
        reassignedStudents.push({
          studentName,
          previousMentor: existingMentorName,
          newMentor: resolvedMentorName,
        });
      }
    }

    const message = isReassignment && reassignedStudents.length > 0
      ? `Successfully reassigned ${reassignedStudents.map(r => `${r.studentName} from ${r.previousMentor} to ${r.newMentor}`).join(', ')}`
      : `Successfully mapped ${savedCount} mentees to mentor ${resolvedMentorName} in database`;

    return sendSuccess(res, message, {
      mentorId: resolvedMentorId,
      mentorName: resolvedMentorName,
      mentorEmail: resolvedMentorEmail,
      assignedCount: savedCount,
      isReassignment: Boolean(isReassignment),
      reassignedStudents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unassign/Remove Faculty Mentor from Student(s)
 */
export const unassignMentorFromStudents = async (req, res, next) => {
  try {
    const { studentId, studentIds } = req.body;
    const targetIds = Array.isArray(studentIds) ? studentIds : (studentId ? [studentId] : []);
    const validIds = targetIds.filter((id) => id !== null && id !== undefined && id !== '');

    if (validIds.length === 0) {
      return sendError(res, 'At least one student ID is required to remove mentor assignment', 400);
    }

    const parseId = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const n = parseInt(String(val).replace(/^u-/i, '').replace(/^s-/i, ''), 10);
      return Number.isFinite(n) ? n : null;
    };

    let removedCount = 0;
    for (const sid of validIds) {
      const parsedSid = parseId(sid);
      const strSid = String(parsedSid || sid);

      // Clean from mentor_student_assignments
      try {
        await query(
          'DELETE FROM mentor_student_assignments WHERE student_id = ? OR student_id = ?',
          [parsedSid || sid, strSid]
        );
      } catch (e) {
        console.warn('[unassignMentorFromStudents msa]', e.message);
      }

      // Clean from mentor_assignments
      try {
        await query(
          'DELETE FROM mentor_assignments WHERE student_id = ? OR student_id = ?',
          [strSid, String(sid)]
        );
      } catch (e) {
        console.warn('[unassignMentorFromStudents ma]', e.message);
      }

      // Clear from students table
      try {
        await query(
          'UPDATE students SET mentor_name = NULL, mentor_id = NULL WHERE user_id = ? OR id = ?',
          [parsedSid || sid, sid]
        );
      } catch (e) {}

      // Clear from users table
      try {
        await query(
          'UPDATE users SET mentor_name = NULL, mentor_id = NULL WHERE id = ?',
          [parsedSid || sid]
        );
      } catch (e) {}

      removedCount++;
    }

    return sendSuccess(res, `Successfully removed ${removedCount} student(s) from mentor group`, {
      removedCount,
      studentIds: validIds,
    });
  } catch (error) {
    next(error);
  }
};

export const getMentorAssignments = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);
    let assignments = [];
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS mentor_student_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          mentor_id INT NOT NULL,
          student_id INT NOT NULL,
          batch_id INT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_mentor_student (student_id)
        )
      `);
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

      let sql = `
        SELECT 
          msa.id,
          msa.mentor_id,
          COALESCE(m.name, ma.mentor_name) AS mentor_name,
          COALESCE(m.email, ma.mentor_email) AS mentor_email,
          msa.student_id,
          u.name AS student_name,
          u.email AS student_email,
          s.roll_number,
          COALESCE(s.department, u.department) AS department,
          s.year,
          s.division,
          msa.created_at,
          'Already Assigned' AS status
        FROM mentor_student_assignments msa
        JOIN users u ON msa.student_id = u.id
        JOIN users m ON msa.mentor_id = m.id
        LEFT JOIN students s ON s.user_id = u.id
        LEFT JOIN (
          SELECT student_id, MAX(mentor_name) AS mentor_name, MAX(mentor_email) AS mentor_email
          FROM mentor_assignments
          GROUP BY student_id
        ) ma ON (ma.student_id = CAST(u.id AS CHAR) OR ma.student_id = CAST(s.id AS CHAR))
        WHERE 1=1
      `;
      const params = [];
      if (collegeId) {
        sql += ' AND u.college_id = ?';
        params.push(collegeId);
      }
      sql += ' ORDER BY msa.id DESC';

      assignments = await query(sql, params);

      if (!assignments || assignments.length === 0) {
        assignments = await query(
          `SELECT ma.id, ma.mentor_id, ma.mentor_name, ma.mentor_email, ma.student_id,
                  u.name AS student_name, u.email AS student_email, s.roll_number,
                  COALESCE(s.department, u.department) AS department,
                  'Already Assigned' AS status, ma.created_at
           FROM mentor_assignments ma
           LEFT JOIN users u ON ma.student_id = CAST(u.id AS CHAR)
           LEFT JOIN students s ON s.user_id = u.id
           ${collegeId ? 'WHERE u.college_id = ?' : ''}
           ORDER BY ma.id DESC`,
          collegeId ? [collegeId] : []
        );
      }
    } catch (e) {
      console.warn('[DB getMentorAssignments fallback]', e.message);
      try {
        assignments = await query(`SELECT * FROM mentor_assignments ORDER BY id DESC`);
      } catch (_) {}
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


// ---------------------------------------------------------------------------
// Career Gateway Data Bridge Controllers
// ---------------------------------------------------------------------------
export const handleCareerGatewayInboundSync = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Student synchronization is actively governed by real-time Career Gateway Webhooks (POST /api/integrations/career-gateway/students). Direct cross-database polling has been retired.', {
      sync_mode: 'webhook_event_driven',
      inbound_endpoint: '/api/integrations/career-gateway/students',
      status: 'active'
    });
  } catch (error) {
    next(error);
  }
};

export const handleCareerGatewayOutboundSync = async (req, res, next) => {
  try {
    const result = await executeDailyTrainingSync({
      triggeredBy: req.user?.email || 'admin_manual'
    });
    return sendSuccess(res, 'Career Gateway outbound training sync triggered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const handleCareerGatewaySyncStatus = async (req, res, next) => {
  try {
    return getIntegrationStatus(req, res, next);
  } catch (error) {
    next(error);
  }
};
