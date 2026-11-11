import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt.js';
import {
  findUserByEmailOrMobile,
  findUserById,
  createUser,
  updateUser,
  updateUserModel,
  saveStudentDetails,
  getStudentByUserId,
  saveOtpRecord,
  verifyOtpRecord,
  getRegistrationOtpCooldown,
  saveRegistrationOtp,
  consumeRegistrationOtp,
  verifyRegistrationOtpOnly,
  invalidateRegistrationOtps,
  updateUserRememberMe,
  findCollegeByAdminEmail,
  findCollegeByEmailDomain,
  getCollegeForUser,
  toSafeUser,
} from '../models/user.model.js';
import { generateToken } from '../utils/generateToken.js';
import { generateOtp } from '../utils/generateOtp.js';
import { ROLES } from '../utils/constants.js';
import { sendOtpEmail, sendWelcomeEmail, sendRegistrationPendingEmail, sendAdminNewPendingUserEmail } from './email.service.js';
import { findSecureCode, findSecureCodeByCodeOnly, markCodeAsUsed } from '../models/secureCode.model.js';
import { findCollegeById } from '../models/college.model.js';
import { pool } from '../config/db.js';
import { isApprovalFeatureActive } from '../middleware/featureSwitch.middleware.js';
import { createNotification } from './notification.service.js';

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const createAuthError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const isInactiveUser = (user) => {
  if (!user || user.is_active === undefined) return false;
  if (user.is_active === null || user.is_active === false || user.is_active === 0) return true;
  return ['0', 'false', 'inactive', 'pending'].includes(String(user.is_active).toLowerCase());
};

const assertUserCanAuthenticate = async (user) => {
  if (!user) {
    throw createAuthError('Invalid credentials.', 401);
  }
  const roleNormalized = String(user.role || '').toLowerCase().replace(/_/g, '');
  if (roleNormalized === 'superadmin' || roleNormalized.includes('super')) return;

  const isInactive = isInactiveUser(user);
  const isVerified = user.is_verified === 1 || user.is_verified === true || user.is_verified === '1';
  const hasPassword = Boolean(user.password_hash && String(user.password_hash).trim().length > 0);

  if (isInactive || !isVerified || !hasPassword) {
    throw createAuthError('Your account is pending activation. Please check your email to activate your account and set your password.', 403);
  }

  // Check if user approval workflow is enabled in system feature switches
  const approvalRequired = await isApprovalFeatureActive();
  if (approvalRequired) {
    const isApproved = (user.is_approved === 1 || user.is_approved === true || user.is_approved === '1');
    if (!isApproved) {
      throw createAuthError('Your account has been verified, but is pending manual approval by your Administrator. Please wait for an administrator to approve your account before logging in.', 403);
    }
  }

  // Verify that the college institution associated with this account still exists
  let targetCollegeId = user.college_id;
  if (!targetCollegeId && roleNormalized.includes('student')) {
    try {
      const sRows = await query('SELECT college_id FROM students WHERE user_id = ? LIMIT 1', [user.id]);
      if (sRows && sRows.length > 0 && sRows[0].college_id) {
        targetCollegeId = sRows[0].college_id;
      }
    } catch (_) {}
  }
  if (targetCollegeId) {
    const colRows = await query('SELECT id FROM colleges WHERE id = ? LIMIT 1', [targetCollegeId]);
    if (!colRows || colRows.length === 0) {
      throw createAuthError('The college institution associated with this account has been deleted. Access is disabled.', 403);
    }
  }
};

const verifyStoredPassword = async (user, password) => {
  if (!user || typeof password !== 'string' || password.length === 0) return false;

  const candidate = user.password_hash;
  if (!candidate || isBlank(candidate)) return false;

  if (BCRYPT_HASH_PATTERN.test(candidate)) {
    try {
      if (await bcrypt.compare(password, candidate)) return true;
    } catch {
      return false;
    }
  } else if (candidate === password) {
    try {
      const passHash = await bcrypt.hash(password, 12);
      await updateUser(user.id, { password_hash: passHash });
    } catch {
      console.warn('[AUTH] Legacy password migration could not be persisted.');
    }
    return true;
  }

  return false;
};

const buildUserResponse = async (user) => {
  const studentProfile = await getStudentByUserId(user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    mobile_number: user.mobile_number || null,
    role: user.role,
    department: user.department || studentProfile?.department || '',
    department_id: user.department_id || studentProfile?.department_id || null,
    is_verified: Boolean(user.is_verified),
    is_approved: Boolean(user.is_approved === 1 || user.is_approved === true || String(user.is_approved) === '1'),
    is_active: user.is_active,
    force_password_change: Boolean(user.force_password_change),
    activation_status: user.activation_status || (user.is_active ? 'completed' : 'pending'),
    approval_status: user.approval_status || (user.is_approved ? 'approved' : 'pending'),
    year: studentProfile?.year || '',
    division: studentProfile?.division || '',
    semester: studentProfile?.semester || '',
    roll_number: studentProfile?.roll_number || '',
    studentProfile,
  };
};

const generateFinalToken = (user) => generateToken({
  userId: user.id,
  name: user.name || null,
  email: user.email || null,
  mobile: user.mobile_number || null,
  role: user.role,
  collegeId: user.college_id ?? null,
  department: user.department ?? null,
  departmentId: user.department_id ?? null,
  forcePasswordChange: Boolean(user.force_password_change),
  tokenType: 'access',
});

const finalizePrimaryAuthentication = async (user) => {
  await assertUserCanAuthenticate(user);

  return {
    token: generateFinalToken(user),
    user: await buildUserResponse(user),
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 1 of college registration: prove ownership of the college email before
 * any account row is created. Stores the OTP in `otps` with purpose
 * 'registration' and applies a resend cooldown.
 */
export const sendRegistrationOtp = async (data = {}) => {
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';

  if (!email) {
    throw createAuthError('A college email address is required.', 400);
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw createAuthError('Please enter a valid college email address.', 400);
  }

  const matchingCollege = await findCollegeByEmailDomain(email);
  if (!matchingCollege) {
    const domain = email.includes('@') ? email.split('@')[1] : email;
    throw createAuthError(`Registration denied: College does not exist or your email domain (@${domain}) is not authorized. You cannot register.`, 400);
  }

  const existingUser = await findUserByEmailOrMobile(email);
  if (existingUser && existingUser.password_hash && existingUser.password_hash.trim().length > 0) {
    const isCompleted = Boolean(existingUser.is_profile_updated);
    const isApproved = existingUser.is_approved === 1 || existingUser.is_approved === true || String(existingUser.is_approved) === '1';
    const approvalRequired = await isApprovalFeatureActive();
    if (isCompleted && (isApproved || !approvalRequired)) {
      throw createAuthError('An account already exists for this email. Please log in instead.', 409);
    }
  }

  const cooldown = await getRegistrationOtpCooldown(email);
  if (cooldown > 0) {
    throw createAuthError(`Please wait ${cooldown} second${cooldown === 1 ? '' : 's'} before requesting a new code.`, 429);
  }

  const otp = generateOtp(6);
  await saveRegistrationOtp(email, otp);

  try {
    const emailResult = await sendOtpEmail({ to: email, otp, name: data.name || '' });
    console.log(`[AUTH] Registration OTP dispatched to ${email} (Message ID: ${emailResult?.messageId || 'sent'})`);
  } catch (error) {
    console.error(`[AUTH Error] Registration OTP dispatch failed for ${email}:`, error.message);
  }

  return { email, requiresEmailOtp: true };
};

export const checkRegistrationEmailOtp = async ({ email, otp }) => {
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanOtp = typeof otp === 'string' ? otp.trim() : '';
  if (!cleanEmail || !cleanOtp) {
    throw createAuthError('Email and the 6-digit verification code are required.', 400);
  }
  if (!/^\d{6}$/.test(cleanOtp)) {
    throw createAuthError('Please enter a valid 6-digit verification code.', 400);
  }
  const result = await verifyRegistrationOtpOnly(cleanEmail, cleanOtp);
  if (!result.ok) {
    if (result.reason === 'expired') {
      throw createAuthError('This verification code has expired. Please request a new code.', 400);
    }
    throw createAuthError('Incorrect verification code. Please check your email inbox.', 400);
  }
  return { verified: true, email: cleanEmail };
};

/**
 * Step 2 of college registration: consume the email OTP (single use) and only
 * then create the account. A wrong, expired, replayed or over-attempted code
 * never reaches registerUser, so no account is created.
 */
export const verifyRegistrationOtpAndRegister = async (data = {}) => {
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const potentialCode = (data.secure_code || data.code || data.roll_number || '').trim().toUpperCase();

  // 1. Auto-detect role directly from code or pre-provisioned user record
  let codeRecord = null;
  if (potentialCode) {
    codeRecord = await findSecureCodeByCodeOnly(potentialCode);
  }

  let existingUser = null;
  if (email) {
    existingUser = await findUserByEmailOrMobile(email);
  }

  let detectedRole = ROLES.STUDENT;
  if (codeRecord && codeRecord.role && codeRecord.role !== 'all') {
    const r = codeRecord.role.toLowerCase();
    if (r.includes('admin') || r.includes('hod')) detectedRole = ROLES.COLLEGE_ADMIN;
    else if (r.includes('coord')) detectedRole = ROLES.COORDINATOR;
    else if (r.includes('mentor') || r.includes('faculty')) detectedRole = ROLES.MENTOR;
    else if (r.includes('trainer')) detectedRole = ROLES.TRAINER;
    else if (r.includes('student')) detectedRole = ROLES.STUDENT;
    else detectedRole = r;
  } else if (existingUser && existingUser.role && existingUser.role !== ROLES.STUDENT) {
    detectedRole = existingUser.role;
  } else if (data.role) {
    const r = data.role.toLowerCase();
    if (r.includes('admin') || r.includes('hod')) detectedRole = ROLES.COLLEGE_ADMIN;
    else if (r.includes('coord')) detectedRole = ROLES.COORDINATOR;
    else if (r.includes('mentor') || r.includes('faculty')) detectedRole = ROLES.MENTOR;
    else if (r.includes('trainer')) detectedRole = ROLES.TRAINER;
  }

  const isStaff = detectedRole !== ROLES.STUDENT;
  const isStudent = !isStaff;

  // Only student registrations require mandatory email OTP (Staff authentication is authorized by Super Admin code)
  if (isStudent) {
    const otp = typeof data.otp === 'string' ? data.otp.trim() : '';
    if (!email || !otp) {
      throw createAuthError('Email and the verification code are required.', 400);
    }
    if (!/^\d{6}$/.test(otp)) {
      throw createAuthError('Please enter the 6-digit verification code.', 400);
    }

    const result = await consumeRegistrationOtp(email, otp);
    if (!result.ok) {
      if (result.reason === 'too_many_attempts') {
        throw createAuthError('Too many incorrect attempts. Please request a new verification code.', 429);
      }
      if (result.reason === 'expired') {
        throw createAuthError('This verification code has expired. Please request a new one.', 400);
      }
      throw createAuthError('Incorrect verification code.', 400);
    }
  }

  const cleanMobile = (typeof data.mobile_number === 'string' && data.mobile_number.trim())
    ? data.mobile_number.trim()
    : ((typeof data.mobile === 'string' && data.mobile.trim())
      ? data.mobile.trim()
      : ((typeof data.phone === 'string' && data.phone.trim()) ? data.phone.trim() : null));

  try {
    return await registerUser({
      ...data,
      email,
      mobile_number: cleanMobile,
      role: detectedRole,
      secure_code: codeRecord ? codeRecord.code : (data.secure_code || potentialCode || null),
    });
  } catch (err) {
    if (isStudent) {
      await invalidateRegistrationOtps(email);
    }
    throw err;
  }
};

export const registerUser = async (data) => {
  const { name, email, mobile_number, password, role, secure_code, college_id, collegeId, roll_number, department, year, division, semester } = data;

  let existingUser = null;
  if (email) {
    existingUser = await findUserByEmailOrMobile(email);
  } else if (mobile_number) {
    existingUser = await findUserByEmailOrMobile(mobile_number);
  }

  // 1. Auto-resolve role from code or pre-provisioned user record
  const potentialCode = (secure_code || data.code || roll_number || '').trim().toUpperCase();
  let codeRecord = null;
  if (potentialCode) {
    codeRecord = await findSecureCodeByCodeOnly(potentialCode);
  }

  let canonicalRole = ROLES.STUDENT;
  if (codeRecord && codeRecord.role && codeRecord.role !== 'all') {
    const r = codeRecord.role.toLowerCase();
    if (r.includes('admin') || r.includes('hod')) canonicalRole = ROLES.COLLEGE_ADMIN;
    else if (r.includes('coord')) canonicalRole = ROLES.COORDINATOR;
    else if (r.includes('mentor') || r.includes('faculty')) canonicalRole = ROLES.MENTOR;
    else if (r.includes('trainer')) canonicalRole = ROLES.TRAINER;
    else if (r.includes('student')) canonicalRole = ROLES.STUDENT;
    else canonicalRole = r;
  } else if (existingUser && existingUser.role && existingUser.role !== ROLES.STUDENT) {
    canonicalRole = existingUser.role;
  } else if (role) {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('faculty') || lowerRole.includes('mentor')) canonicalRole = ROLES.MENTOR;
    else if (lowerRole.includes('admin') || lowerRole.includes('hod')) canonicalRole = ROLES.COLLEGE_ADMIN;
    else if (lowerRole.includes('coordinator')) canonicalRole = ROLES.COORDINATOR;
    else if (lowerRole.includes('trainer') || lowerRole.includes('instructor')) canonicalRole = ROLES.TRAINER;
  }

  if (isBlank(email) && isBlank(mobile_number)) {
    throw createAuthError('An email address or mobile number is required.', 400);
  }
  if (typeof password !== 'string' || password.length < 6) {
    throw createAuthError('Password must be at least 6 characters long.', 400);
  }

  if (existingUser) {
    // If the user already completed registration or was provisioned with a password:
    const isCompleted = Boolean(existingUser.is_profile_updated);
    const hasPassword = Boolean(existingUser.password_hash && existingUser.password_hash.trim().length > 0);
    const isAdmin = existingUser.role === ROLES.SUPER_ADMIN || existingUser.role === ROLES.COLLEGE_ADMIN || String(existingUser.role || '').toLowerCase().includes('admin');

    const isApproved = existingUser.is_approved === 1 || existingUser.is_approved === true || String(existingUser.is_approved) === '1';
    const approvalRequired = await isApprovalFeatureActive();
    if (isAdmin || (isCompleted && hasPassword && (isApproved || !approvalRequired))) {
      throw createAuthError('You are already registered! Please log in with your email and password.', 409);
    }

    const isNonStudentRole = canonicalRole !== ROLES.STUDENT;
    if (isNonStudentRole || (secure_code && String(secure_code).trim().length > 0)) {
      if (!codeRecord && (secure_code || potentialCode)) {
        codeRecord = await findSecureCodeByCodeOnly(secure_code || potentialCode);
      }
      if (isNonStudentRole && !codeRecord) {
        throw createAuthError(`Invalid or expired Secure Access Code for ${canonicalRole}. Please verify code with Super Admin.`, 400);
      }
      if (codeRecord && codeRecord.college_name) {
        const codeColName = codeRecord.college_name.trim();
        let codeCollege = null;
        try {
          const [cRows] = await pool.query(
            'SELECT id, name, code, domain FROM colleges WHERE LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?) LIMIT 1',
            [codeColName, codeColName]
          );
          if (cRows && cRows.length > 0) codeCollege = cRows[0];
        } catch (_) {}

        if (existingUser.college_id && codeCollege && existingUser.college_id !== codeCollege.id) {
          throw createAuthError(`This Secure Access Code was generated for "${codeRecord.college_name}". You cannot use it for this account.`, 403);
        }
      }
    }

    let derivedSemester = semester || '';
    if (!derivedSemester && year) {
      if (year === 'FE') derivedSemester = 'Semester 1';
      else if (year === 'SE') derivedSemester = 'Semester 3';
      else if (year === 'TE') derivedSemester = 'Semester 5';
      else if (year === 'BE') derivedSemester = 'Semester 7';
    }

    let existingDeptId = null;
    let existingDeptName = department ? String(department).trim() : null;
    if (existingDeptName) {
      try {
        const [deptMatch] = await pool.query(
          `SELECT id, name, code FROM departments 
           WHERE (LOWER(code) = LOWER(?) OR LOWER(name) = LOWER(?) OR name LIKE ? OR ? LIKE CONCAT('%', code, '%')) 
           AND (college_id = ? OR college_id IS NULL) LIMIT 1`,
          [existingDeptName, existingDeptName, `%${existingDeptName}%`, existingDeptName, existingUser.college_id || 1]
        );
        if (deptMatch && deptMatch.length > 0) {
          existingDeptId = deptMatch[0].id;
          existingDeptName = deptMatch[0].name;
        }
      } catch (_) {}
    }

    await updateUserModel(existingUser.id, {
      name: (name && String(name).trim().length > 0) ? String(name).trim() : existingUser.name,
      email: existingUser.email || email,
      mobile_number: mobile_number || existingUser.mobile_number,
      password: password || '',
      password_hash: existingUser.password_hash || '',
      role: canonicalRole,
      department: existingDeptName || department || existingUser.department,
      department_id: existingDeptId || existingUser.department_id,
      year,
      division,
      semester: derivedSemester,
      roll_number,
      is_profile_updated: 1,
      is_active: (canonicalRole === ROLES.SUPER_ADMIN || autoApproved) ? 1 : 0,
      is_verified: 1,
      is_approved: (canonicalRole === ROLES.SUPER_ADMIN || autoApproved) ? 1 : 0,
    });

    if (canonicalRole === ROLES.COORDINATOR && existingDeptId) {
      try {
        await pool.query(
          'INSERT INTO coordinator_departments (coordinator_id, department_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE department_id = VALUES(department_id)',
          [existingUser.id, existingDeptId]
        );
      } catch (_) {}
    }

    if (codeRecord && codeRecord.id) {
      await markCodeAsUsed(codeRecord.id, existingUser.id);
    }

    const updatedUser = await findUserById(existingUser.id);
    let studentProfile = await getStudentByUserId(updatedUser.id);

    if (updatedUser.email && updatedUser.email.includes('@')) {
      sendWelcomeEmail({ to: updatedUser.email, name: updatedUser.name, role: updatedUser.role }).catch((err) => {
        console.warn(`[AUTH] Welcome email notification skipped: ${err.message}`);
      });
    }

    const token = (canonicalRole === ROLES.SUPER_ADMIN || autoApproved) ? generateFinalToken(updatedUser) : null;

    return {
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile_number: updatedUser.mobile_number,
        role: updatedUser.role,
        department: studentProfile?.department || department || '',
        year: studentProfile?.year || year || '',
        division: studentProfile?.division || division || '',
        semester: studentProfile?.semester || derivedSemester || '',
        roll_number: studentProfile?.roll_number || roll_number || '',
        is_approved: autoApproved ? true : Boolean(updatedUser.is_approved),
        is_active: autoApproved ? true : Boolean(updatedUser.is_active),
        studentProfile,
      },
      requiresApproval: !autoApproved,
      message: autoApproved
        ? 'Registration complete! Your account is active and you can now log in.'
        : 'Registration completed successfully! Your account is awaiting administrator approval.',
    };
  }

  const isNonStudentRole = canonicalRole !== ROLES.STUDENT;
  if (isNonStudentRole || (secure_code && String(secure_code).trim().length > 0)) {
    if (!codeRecord && (secure_code || potentialCode)) {
      codeRecord = await findSecureCodeByCodeOnly(secure_code || potentialCode);
    }
    if (isNonStudentRole && !codeRecord) {
      throw createAuthError(`Invalid or expired Secure Access Code for ${canonicalRole}. Please verify code with Super Admin.`, 400);
    }
  }

  // College assignment: strictly determined by email domain and verified against secure code
  let matchingCollege = null;
  const userEmail = email ? String(email).trim().toLowerCase() : '';
  const emailDomain = userEmail.includes('@') ? userEmail.split('@')[1].trim().toLowerCase() : '';

  if (userEmail) {
    matchingCollege = await findCollegeByEmailDomain(userEmail);
  }

  // If a secure access code was used, strictly validate its designated college
  if (codeRecord && codeRecord.college_name) {
    const codeColName = codeRecord.college_name.trim();
    let codeCollege = null;
    try {
      const [colRows] = await pool.query(
        'SELECT id, name, code, domain FROM colleges WHERE LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?) LIMIT 1',
        [codeColName, codeColName]
      );
      if (colRows && colRows.length > 0) {
        codeCollege = colRows[0];
      }
    } catch (_) {}

    // Validation 1: User's email domain belongs to another known college -> reject!
    if (matchingCollege && codeCollege && matchingCollege.id !== codeCollege.id) {
      throw createAuthError(
        `This Secure Access Code is reserved for "${codeRecord.college_name}". Your email address (@${emailDomain}) belongs to "${matchingCollege.name}". You cannot use this code for a different institution.`,
        403
      );
    }

    // Validation 2: Code's college has an authorized domain registered -> verify email matches!
    if (codeCollege && codeCollege.domain && emailDomain) {
      const expectedDomain = codeCollege.domain.trim().toLowerCase().replace(/^@/, '');
      if (expectedDomain && !emailDomain.endsWith(expectedDomain) && !emailDomain.includes(expectedDomain)) {
        throw createAuthError(
          `This Secure Access Code was issued for "${codeRecord.college_name}". You must register with an official ${codeRecord.college_name} email address (@${expectedDomain}).`,
          403
        );
      }
    }

    if (codeCollege) {
      matchingCollege = codeCollege;
    }
  }

  if (!matchingCollege) {
    throw createAuthError(
      `Registration denied: No registered institution matches your email domain (@${emailDomain || 'unknown'}). Please register with your authorized college email address.`,
      400
    );
  }

  const assignedCollegeId = matchingCollege.id;

  // Resolve department ID and Name
  let assignedDeptId = null;
  let resolvedDeptName = department ? String(department).trim() : null;
  if (resolvedDeptName) {
    try {
      const [deptMatch] = await pool.query(
        `SELECT id, name, code FROM departments 
         WHERE (LOWER(code) = LOWER(?) OR LOWER(name) = LOWER(?) OR name LIKE ? OR ? LIKE CONCAT('%', code, '%')) 
         AND (college_id = ? OR college_id IS NULL) LIMIT 1`,
        [resolvedDeptName, resolvedDeptName, `%${resolvedDeptName}%`, resolvedDeptName, assignedCollegeId]
      );
      if (deptMatch && deptMatch.length > 0) {
        assignedDeptId = deptMatch[0].id;
        resolvedDeptName = deptMatch[0].name;
      }
    } catch (_) {}
  }

  const approvalRequired = await isApprovalFeatureActive();
  const autoApproved = !approvalRequired;

  // Create base User with is_active = 1 for Super Admin or when approval requirement is disabled
  const user = await createUser({
    name,
    email: email || null,
    mobile_number: mobile_number || null,
    password,
    role: canonicalRole,
    college_id: assignedCollegeId,
    department: resolvedDeptName || department || null,
    department_id: assignedDeptId || null,
    is_active: canonicalRole === ROLES.SUPER_ADMIN || autoApproved ? 1 : 0,
    is_verified: 1,
    is_approved: canonicalRole === ROLES.SUPER_ADMIN || autoApproved ? 1 : 0,
  });

  if (codeRecord && codeRecord.id) {
    await markCodeAsUsed(codeRecord.id, user.id);
  }

  let studentProfile = null;
  if (canonicalRole === ROLES.STUDENT) {
    let derivedSemester = semester || '';
    if (!derivedSemester && year) {
      if (year === 'FE') derivedSemester = 'Semester 1';
      else if (year === 'SE') derivedSemester = 'Semester 3';
      else if (year === 'TE') derivedSemester = 'Semester 5';
      else if (year === 'BE') derivedSemester = 'Semester 7';
    }

    studentProfile = await saveStudentDetails({
      user_id: user.id,
      roll_number: roll_number || '',
      department: department || '',
      year: year || '',
      division: division || '',
      semester: derivedSemester,
      mobile_number: mobile_number || user.mobile_number || null,
    });
  }

  if (user.email && user.email.includes('@')) {
    if (canonicalRole === ROLES.SUPER_ADMIN || autoApproved) {
      sendWelcomeEmail({ to: user.email, name: user.name, role: user.role }).catch((error) => {
        console.warn(`[AUTH] Welcome email notification skipped: ${error.message}`);
      });
    } else {
      // 1. Send confirmation email to applicant that registration is under admin review
      sendRegistrationPendingEmail({ to: user.email, name: user.name, role: user.role }).catch((error) => {
        console.warn(`[AUTH] Pending registration email notification skipped: ${error.message}`);
      });

      // 2. Insert In-App Notification in broadcast_notifications for College Admin
      try {
        pool.query(
          `INSERT INTO broadcast_notifications (college_id, title, desc_text, type, unread)
           VALUES (?, ?, ?, 'alert', 1)`,
          [
            user.college_id || 1,
            `👤 New ${String(user.role).toUpperCase()} Registration: ${user.name}`,
            `${user.name} (${user.email || user.mobile_number || 'N/A'}) has registered as ${String(user.role).toUpperCase()} and is awaiting administrator approval in Approve Users.`,
          ]
        ).catch(() => {});
      } catch (_) {}

      // 3. Notify College Administrator via email
      try {
        pool.query(
          `SELECT email, name FROM users WHERE college_id = ? AND role = 'college_admin' AND is_approved = 1 LIMIT 1`,
          [user.college_id || 1]
        ).then(([adminRows]) => {
          const adminEmail = (adminRows && adminRows[0] && adminRows[0].email) || process.env.SUPER_ADMIN_EMAIL;
          if (adminEmail && adminEmail.includes('@')) {
            sendAdminNewPendingUserEmail({
              adminEmail,
              adminName: adminRows?.[0]?.name || 'Administrator',
              userName: user.name,
              userEmail: user.email,
              userRole: user.role,
            }).catch(() => {});
          }
        }).catch(() => {});
      } catch (_) {}
    }
  }

  const token = (canonicalRole === ROLES.SUPER_ADMIN || autoApproved) ? generateFinalToken(user) : null;

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile_number: user.mobile_number,
      role: user.role,
      department: studentProfile?.department || department || '',
      year: studentProfile?.year || year || '',
      division: studentProfile?.division || division || '',
      semester: studentProfile?.semester || semester || '',
      roll_number: studentProfile?.roll_number || roll_number || '',
      is_approved: autoApproved ? true : Boolean(user.is_approved),
      is_active: autoApproved ? true : Boolean(user.is_active),
      studentProfile,
    },
    requiresApproval: !autoApproved,
    isApproved: autoApproved,
    message: autoApproved
      ? 'Registration complete! Your account is active and you can now log in.'
      : 'Your registration is complete! Your account is pending manual approval by your Administrator. You will be able to log in once an admin approves your profile.',
  };
};



export const sendUserOtp = async (identifier) => {
  if (isBlank(identifier)) {
    throw createAuthError('Email or mobile number is required.', 400);
  }

  const cleanIdentifier = String(identifier).trim();
  let user = await findUserByEmailOrMobile(cleanIdentifier);

  const envSuperEmail = process.env.SUPER_ADMIN_EMAIL ? process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase() : null;
  const isSuperAdminEmail = Boolean(envSuperEmail && cleanIdentifier.toLowerCase() === envSuperEmail);

  if (!user && isSuperAdminEmail) {
    try {
      const superPass = process.env.SUPER_ADMIN_PASSWORD;
      if (superPass) {
        const passHash = await bcrypt.hash(superPass, 12);
        const superName = process.env.SUPER_ADMIN_NAME || 'Super Admin';
        const superMobile = process.env.SUPER_ADMIN_MOBILE || '9876543210';
        const newId = await createUser({
          name: superName,
          email: envSuperEmail,
          mobile_number: superMobile,
          password_hash: passHash,
          role: 'super_admin',
          college_id: null,
          is_active: 1,
          is_verified: 1,
          is_approved: 1,
        });
        user = await findUserById(newId);
      }
    } catch (e) {
      console.error('[AUTH] Auto-create Super Admin in sendUserOtp failed:', e.message);
    }
  }

  if (!user) {
    throw createAuthError('No account found for this identifier.', 404);
  }

  if (user.role === 'super_admin' || isSuperAdminEmail) {
    user.is_active = 1;
    user.role = 'super_admin';
  } else {
    await assertUserCanAuthenticate(user);
  }

  const otp = generateOtp(6);
  const recipientEmail = typeof user.email === 'string' && user.email.includes('@') ? user.email : null;
  if (!recipientEmail) {
    throw createAuthError('OTP delivery is not available for this account. Please use password login or contact your administrator.', 400);
  }

  await saveOtpRecord(cleanIdentifier, otp);

  try {
    const emailResult = await sendOtpEmail({ to: recipientEmail, otp, name: user.name || 'User' });
    console.log(`[AUTH] OTP email successfully dispatched to ${recipientEmail} (Message ID: ${emailResult?.messageId || 'sent'})`);
  } catch (error) {
    console.error(`[AUTH Error] OTP email dispatch failed for ${recipientEmail}:`, error.message);
  }

  return { identifier: cleanIdentifier };
};

export const verifyUserOtpAndLogin = async (identifier, otp, rememberMe = false) => {
  if (isBlank(identifier) || isBlank(otp)) {
    throw createAuthError('Identifier and OTP are required.', 400);
  }

  const cleanIdentifier = String(identifier).trim();
  const user = await findUserByEmailOrMobile(cleanIdentifier);

  if (!user) {
    throw createAuthError('Invalid credentials.', 401);
  }

  await assertUserCanAuthenticate(user);

  const isValid = await verifyOtpRecord(cleanIdentifier, otp);
  if (!isValid) {
    throw createAuthError('Invalid or expired OTP', 400);
  }

  await updateUserRememberMe(user.id, rememberMe);

  const studentProfile = await getStudentByUserId(user.id);
  const collegeInfo = await getCollegeForUser(user.id, user, studentProfile);
  const collegeName = collegeInfo?.name || '';
  const collegeId = collegeInfo?.id || user.college_id || null;

  const token = generateFinalToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile_number: user.mobile_number,
      role: user.role,
      college: collegeName,
      college_name: collegeName,
      college_id: collegeId,
      remember_me: Boolean(rememberMe),
      department: studentProfile?.department || '',
      year: studentProfile?.year || '',
      division: studentProfile?.division || '',
      semester: studentProfile?.semester || '',
      roll_number: studentProfile?.roll_number || '',
      is_profile_updated: Boolean(
        (user.is_profile_updated || studentProfile?.is_profile_updated) &&
        ((studentProfile?.gender && studentProfile?.city) || (user.gender && user.city) || (studentProfile?.skills && String(studentProfile.skills).trim().length > 0) || (studentProfile?.emergency_contact && String(studentProfile.emergency_contact).trim().length > 0) || (studentProfile?.target_track && String(studentProfile.target_track).trim().length > 0))
      ),
      force_password_change: Boolean(user.force_password_change),
    activation_status: user.activation_status || (user.is_active ? 'completed' : 'pending'),
    approval_status: user.approval_status || (user.is_approved ? 'approved' : 'pending'),
    studentProfile: {
        ...studentProfile,
        college: collegeName,
        college_name: collegeName,
        college_id: collegeId,
      },
    },
  };
};

export const loginWithPassword = async (identifier, password, rememberMe = false) => {
  if (isBlank(identifier) || isBlank(password)) {
    throw createAuthError('Email/mobile and password are required.', 400);
  }

  const cleanIdentifier = String(identifier).trim();
  const cleanPassword = String(password).trim();

  const user = await findUserByEmailOrMobile(cleanIdentifier);

  if (!user) {
    throw createAuthError('Invalid credentials.', 401);
  }

  await assertUserCanAuthenticate(user);

  const isValid = await verifyStoredPassword(user, cleanPassword);

  if (!isValid) {
    throw createAuthError('Invalid password. Please check your credentials.', 401);
  }

  await updateUserRememberMe(user.id, rememberMe);

  const studentProfile = await getStudentByUserId(user.id);
  const collegeInfo = await getCollegeForUser(user.id, user, studentProfile);
  const collegeName = collegeInfo?.name || '';
  const collegeId = collegeInfo?.id || user.college_id || null;

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    role: user.role,
    college: collegeName,
    college_name: collegeName,
    college_id: collegeId,
    remember_me: Boolean(rememberMe),
    department: studentProfile?.department || '',
    year: studentProfile?.year || '',
    division: studentProfile?.division || '',
    semester: studentProfile?.semester || '',
    roll_number: studentProfile?.roll_number || '',
    is_profile_updated: Boolean(
      user.is_profile_updated ||
      studentProfile?.is_profile_updated ||
      (studentProfile?.department && studentProfile?.semester && studentProfile?.roll_number && studentProfile?.skills)
    ),
    force_password_change: Boolean(user.force_password_change),
    activation_status: user.activation_status || (user.is_active ? 'completed' : 'pending'),
    approval_status: user.approval_status || (user.is_approved ? 'approved' : 'pending'),
    studentProfile: {
      ...studentProfile,
      college: collegeName,
      college_name: collegeName,
      college_id: collegeId,
    },
  };

  const primaryAuth = await finalizePrimaryAuthentication(user);

  return {
    token: primaryAuth.token,
    user: safeUser,
  };
};

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await findUserById(userId);
  if (!user) {
    throw createAuthError('User not found', 404);
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    throw createAuthError('New password must be at least 6 characters long', 400);
  }

  const isValid = await verifyStoredPassword(user, currentPassword);
  if (!isValid) {
    throw createAuthError('Current password is incorrect', 400);
  }

  await updateUser(userId, { password: newPassword });
  return { message: 'Password updated successfully' };
};

export const resetUserPasswordWithOtp = async (identifier, otp, newPassword) => {
  if (isBlank(identifier) || isBlank(otp) || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw createAuthError('Identifier, OTP, and a valid new password are required.', 400);
  }

  const user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    throw createAuthError('No user account found with this identifier', 404);
  }
  await assertUserCanAuthenticate(user);

  const isValidOtp = await verifyOtpRecord(identifier, otp);
  if (!isValidOtp) {
    throw createAuthError('Invalid or expired 6-digit security code', 400);
  }

  await updateUser(user.id, { password: newPassword });
  return { message: 'Password reset successfully' };
};

export const verifyInstitutionToken = async (token) => {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw createAuthError('Institution setup token is required.', 400);
  }
  const cleanToken = token.trim().toUpperCase();
  const codeRecord = await findSecureCodeByCodeOnly(cleanToken);

  if (!codeRecord) {
    throw createAuthError('Invalid, expired, or already-used institution invitation token.', 404);
  }

  // Look up college details
  let college = null;
  if (codeRecord.college_name) {
    const colName = codeRecord.college_name.trim();
    const [cRows] = await pool.query(
      `SELECT id, name, code, domain, location FROM colleges 
       WHERE LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?) 
       LIMIT 1`,
      [colName, colName]
    );
    if (cRows && cRows.length > 0) college = cRows[0];
  }

  return {
    token: codeRecord.code,
    role: codeRecord.role || 'college_admin',
    collegeName: codeRecord.college_name || college?.name || 'Authorized Institution',
    college,
    description: codeRecord.description,
    expiresAt: codeRecord.expires_at,
  };
};

export const completeInstitutionSetup = async (data) => {
  const { token, name, email, mobile_number, password } = data;

  if (!token || !String(token).trim()) {
    throw createAuthError('Institution token is required.', 400);
  }
  if (!name || !String(name).trim()) {
    throw createAuthError('Full name is required.', 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createAuthError('A valid official email address is required.', 400);
  }
  if (!password || String(password).length < 6) {
    throw createAuthError('Password must be at least 6 characters long.', 400);
  }

  const cleanToken = String(token).trim().toUpperCase();
  const codeRecord = await findSecureCodeByCodeOnly(cleanToken);
  if (!codeRecord) {
    throw createAuthError('Invalid, expired, or already-used institution setup token. Please contact support.', 400);
  }

  // Resolve College
  let matchingCollege = null;
  if (codeRecord.college_name) {
    const colName = codeRecord.college_name.trim();
    const [colRows] = await pool.query(
      'SELECT id, name, code, domain FROM colleges WHERE LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?) LIMIT 1',
      [colName, colName]
    );
    if (colRows && colRows.length > 0) matchingCollege = colRows[0];
  }

  if (!matchingCollege && email) {
    matchingCollege = await findCollegeByEmailDomain(email);
  }

  if (!matchingCollege) {
    throw createAuthError('Unable to resolve institution for this invitation. Please contact Super Admin.', 400);
  }

  // Domain verification if college has domain
  const userEmail = String(email).trim().toLowerCase();
  const emailDomain = userEmail.includes('@') ? userEmail.split('@')[1].trim().toLowerCase() : '';
  if (matchingCollege.domain && emailDomain) {
    const expectedDomain = matchingCollege.domain.trim().toLowerCase().replace(/^@/, '');
    if (expectedDomain && !emailDomain.endsWith(expectedDomain) && !emailDomain.includes(expectedDomain)) {
      throw createAuthError(
        `This invitation was issued for "${matchingCollege.name}". You must register with an official email (@${expectedDomain}).`,
        403
      );
    }
  }

  // Check if user already exists
  let existingUser = await findUserByEmailOrMobile(userEmail);
  const canonicalRole = codeRecord.role && codeRecord.role !== 'all' ? codeRecord.role : ROLES.COLLEGE_ADMIN;
  let finalUser = null;

  if (existingUser) {
    if (existingUser.password_hash && existingUser.is_active && existingUser.is_approved) {
      throw createAuthError('An account with this email is already registered and active. Please log in directly.', 409);
    }
    await updateUserModel(existingUser.id, {
      name: String(name).trim(),
      email: userEmail,
      mobile_number: mobile_number || existingUser.mobile_number,
      password,
      role: canonicalRole,
      college_id: matchingCollege.id,
      is_active: 1,
      is_verified: 1,
      is_approved: 1,
      is_profile_updated: 1,
    });
    finalUser = await findUserById(existingUser.id);
  } else {
    finalUser = await createUser({
      name: String(name).trim(),
      email: userEmail,
      mobile_number: mobile_number || null,
      password,
      role: canonicalRole,
      college_id: matchingCollege.id,
      is_active: 1,
      is_verified: 1,
      is_approved: 1,
      is_profile_updated: 1,
    });
  }

  // Mark token as used
  await markCodeAsUsed(codeRecord.id, finalUser.id);

  // Send welcome email
  sendWelcomeEmail({ to: finalUser.email, name: finalUser.name, role: finalUser.role }).catch((err) => {
    console.warn(`[AUTH] Welcome email skipped: ${err.message}`);
  });

  const authToken = generateFinalToken(finalUser);

  return {
    token: authToken,
    user: toSafeUser(finalUser),
    message: `Institutional setup completed successfully! Welcome, ${finalUser.name}.`,
  };
};

/**
 * Activate Account with Secure Code (Part 2 & Part 4)
 * For Admin, Mentor, Coordinator, Trainer.
 * Sets password, verifies email, updates status to pending approval, notifies creator.
 */
export const activateWithSecureCode = async ({ email, code, password, confirmPassword, role }) => {
  if (isBlank(email) || !String(email).includes('@')) {
    throw createAuthError('A valid email address is required.', 400);
  }
  if (isBlank(code)) {
    throw createAuthError('Secure activation code is required.', 400);
  }
  if (isBlank(password) || password.length < 8) {
    throw createAuthError('Password must be at least 8 characters long.', 400);
  }
  if (password !== confirmPassword) {
    throw createAuthError('Passwords do not match. Please re-enter.', 400);
  }

  // Password complexity check
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    throw createAuthError('Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.', 400);
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanCode = String(code).trim().toUpperCase();

  // Find code in secure_codes
  const [codeRows] = await pool.query(
    `SELECT * FROM secure_codes 
     WHERE UPPER(code) = ? 
       AND status = 'active'
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR max_uses = 0 OR uses_count < max_uses)
     ORDER BY id DESC LIMIT 1`,
    [cleanCode]
  );

  if (!codeRows || codeRows.length === 0) {
    throw createAuthError('Invalid, expired, or already used activation code. Please check your code or contact your administrator.', 400);
  }

  const codeRecord = codeRows[0];

  // If code was explicitly issued to an email, enforce email match
  if (codeRecord.email && codeRecord.email.trim().length > 0) {
    const issuedEmail = codeRecord.email.trim().toLowerCase();
    if (issuedEmail !== cleanEmail) {
      throw createAuthError(`This activation code was issued to ${issuedEmail}. Please activate using your assigned email address.`, 403);
    }
  }

  // Determine user role
  let targetRole = 'college_admin';
  if (role) {
    const rLower = String(role).toLowerCase();
    if (rLower.includes('admin')) targetRole = 'college_admin';
    else if (rLower.includes('coord')) targetRole = 'coordinator';
    else if (rLower.includes('mentor')) targetRole = 'mentor';
    else if (rLower.includes('trainer')) targetRole = 'trainer';
  } else if (codeRecord.role && codeRecord.role !== 'all') {
    targetRole = codeRecord.role;
  }

  // Determine college_id
  let targetCollegeId = null;
  let collegeName = codeRecord.college_name || '';
  if (collegeName) {
    const [cRows] = await pool.query(
      `SELECT id, name FROM colleges WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(code)) = LOWER(TRIM(?)) LIMIT 1`,
      [collegeName, collegeName]
    );
    if (cRows && cRows.length > 0) {
      targetCollegeId = cRows[0].id;
      collegeName = cRows[0].name;
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Check if user already exists
  let existingUser = await findUserByEmailOrMobile(cleanEmail);
  let finalUserId = null;
  let finalUserName = '';

  if (existingUser) {
    if (existingUser.is_active === 1 && existingUser.is_approved === 1 && existingUser.password_hash) {
      throw createAuthError('Your account is already activated and approved. Please sign in directly with your password.', 409);
    }

    finalUserName = existingUser.name || 'User';
    finalUserId = existingUser.id;

    await pool.query(
      `UPDATE users 
       SET password_hash = ?,
           is_verified = 1,
           activation_status = 'completed',
           is_approved = 0,
           is_active = 0,
           approval_status = 'pending',
           force_password_change = 0,
           role = COALESCE(?, role),
           college_id = COALESCE(?, college_id),
           updated_at = NOW()
       WHERE id = ?`,
      [passwordHash, targetRole, targetCollegeId, existingUser.id]
    );
  } else {
    // Generate default name from email if not available
    const derivedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    finalUserName = derivedName;

    const [insertResult] = await pool.query(
      `INSERT INTO users 
        (name, email, role, college_id, password_hash, is_verified, activation_status, is_approved, is_active, approval_status, force_password_change)
       VALUES (?, ?, ?, ?, ?, 1, 'completed', 0, 0, 'pending', 0)`,
      [derivedName, cleanEmail, targetRole, targetCollegeId, passwordHash]
    );
    finalUserId = insertResult.insertId;
  }

  // Invalidate activation code
  await markCodeAsUsed(codeRecord.id, finalUserId);

  // In-App Notification (Part 2 & Part 4)
  const roleDisplay = targetRole === 'college_admin' ? 'Admin' : targetRole.charAt(0).toUpperCase() + targetRole.slice(1).replace(/_/g, ' ');
  const formattedDateTime = new Date().toLocaleString();

  if (targetRole === 'college_admin') {
    // Notify Super Admins
    try {
      const [superAdmins] = await pool.query(
        `SELECT id FROM users WHERE role = 'super_admin' AND is_active = 1`
      );
      for (const sa of (superAdmins || [])) {
        await createNotification({
          user_id: sa.id,
          title: 'New Admin Account Approval Request',
          message: `A new Admin (${finalUserName}, ${cleanEmail}) has successfully activated their TrainX account on ${formattedDateTime} and is waiting for your approval.`,
          type: 'alert',
          priority: 'Urgent',
          category: 'Account Approval',
          action_url: '/superadmin/users',
          action_label: 'Review & Approve',
        });
      }
    } catch (saNotifErr) {
      console.warn('[Activation Notification Warning]', saNotifErr.message);
    }
  } else {
    // Notify College Admin who created the code or College Admin of that college
    try {
      const creatorId = codeRecord.created_by;
      if (creatorId) {
        await createNotification({
          user_id: creatorId,
          title: `New ${roleDisplay} Account Approval Request`,
          message: `A new ${roleDisplay} (${finalUserName}, ${cleanEmail}) has successfully activated their TrainX account on ${formattedDateTime} and is waiting for your approval.`,
          type: 'alert',
          priority: 'High',
          category: 'Staff Approval',
          action_url: '/admin/approve-users',
          action_label: 'Review & Approve',
        });
      } else if (targetCollegeId) {
        const [colAdmins] = await pool.query(
          `SELECT id FROM users WHERE college_id = ? AND role = 'college_admin' AND is_active = 1`,
          [targetCollegeId]
        );
        for (const ca of (colAdmins || [])) {
          await createNotification({
            user_id: ca.id,
            title: `New ${roleDisplay} Account Approval Request`,
            message: `A new ${roleDisplay} (${finalUserName}, ${cleanEmail}) has successfully activated their TrainX account on ${formattedDateTime} and is waiting for your approval.`,
            type: 'alert',
            priority: 'High',
            category: 'Staff Approval',
            action_url: '/admin/approve-users',
            action_label: 'Review & Approve',
          });
        }
      }
    } catch (staffNotifErr) {
      console.warn('[Staff Activation Notification Warning]', staffNotifErr.message);
    }
  }

  return {
    success: true,
    message: 'Account activation submitted successfully! Your account is now pending administrator approval. You will receive an email once approved.',
    user: {
      id: finalUserId,
      email: cleanEmail,
      role: targetRole,
      activation_status: 'completed',
      approval_status: 'pending',
    },
  };
};

/**
 * Force Password Change on First Login (Part 5)
 */
export const forceChangePassword = async ({ userId, currentPassword, newPassword, confirmPassword }) => {
  if (!userId) {
    throw createAuthError('Unauthorized request.', 401);
  }
  if (isBlank(currentPassword)) {
    throw createAuthError('Current temporary password is required.', 400);
  }
  if (isBlank(newPassword) || newPassword.length < 8) {
    throw createAuthError('New password must be at least 8 characters long.', 400);
  }
  if (newPassword !== confirmPassword) {
    throw createAuthError('New password and confirmation do not match.', 400);
  }
  if (currentPassword === newPassword) {
    throw createAuthError('New password must be different from your temporary password.', 400);
  }

  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    throw createAuthError('New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.', 400);
  }

  const user = await findUserById(userId);
  if (!user) {
    throw createAuthError('User account not found.', 404);
  }

  const isValidCurrent = await verifyStoredPassword(user, currentPassword);
  if (!isValidCurrent) {
    throw createAuthError('Invalid current temporary password. Please enter the temporary password received in your email.', 400);
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await pool.query(
    `UPDATE users SET password_hash = ?, force_password_change = 0, updated_at = NOW() WHERE id = ?`,
    [newHash, userId]
  );

  return {
    success: true,
    message: 'Your permanent password has been set successfully. You may now continue to your dashboard.',
  };
};

