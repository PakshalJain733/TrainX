import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import {
  findUserByEmailOrMobile,
  findUserById,
  createUser,
  updateUser,
  saveStudentDetails,
  getStudentByUserId,
  saveOtpRecord,
  verifyOtpRecord,
  getRegistrationOtpCooldown,
  saveRegistrationOtp,
  consumeRegistrationOtp,
  invalidateRegistrationOtps,
  updateUserTwoFactorSecret,
  updateUserRememberMe,
  findCollegeByAdminEmail,
  findCollegeByEmailDomain,
  enableTwoFactorForUser,
} from '../models/user.model.js';
import { generateToken } from '../utils/generateToken.js';
import { generateOtp } from '../utils/generateOtp.js';
import { ROLES } from '../utils/constants.js';
import { sendOtpEmail, sendWelcomeEmail } from './email.service.js';
import { findSecureCode, markCodeAsUsed } from '../models/secureCode.model.js';
import { config } from '../config/env.js';

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const PREAUTH_TOKEN_TTL = '10m';
const PREAUTH_TOKEN_TYPE = 'preauth';
const PREAUTH_PURPOSE = 'totp';
const consumedPreauthTokens = new Map();

const createAuthError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const isTwoFactorEnabled = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value === 'number' && value > 0) return true;
  if (Buffer.isBuffer(value) && value.length > 0 && value[0] === 1) return true;
  if (value && typeof value === 'object' && value.data && Array.isArray(value.data) && value.data[0] === 1) return true;
  const str = String(value || '').toLowerCase().trim();
  return str === 'true' || str === '1' || str === '\x01';
};

const isInactiveUser = (user) => {
  if (!user || user.is_active === undefined) return false;
  if (user.is_active === null || user.is_active === false || user.is_active === 0) return true;
  return ['0', 'false', 'inactive', 'pending'].includes(String(user.is_active).toLowerCase());
};

const assertUserCanAuthenticate = (user) => {
  if (!user) {
    throw createAuthError('Invalid credentials.', 401);
  }
  if (isInactiveUser(user)) {
    throw createAuthError('This account is inactive or pending verification.', 403);
  }
};

const hasTwoFactorAuthentication = (user) => {
  if (!user || isBlank(user?.two_factor_secret)) return false;
  if (isTwoFactorEnabled(user?.two_factor_enabled)) return true;
  const rawFlag = String(user?.two_factor_enabled ?? '').toLowerCase().trim();
  return rawFlag !== '0' && rawFlag !== 'false';
};


const verifyStoredPassword = async (user, password) => {
  if (!user || typeof password !== 'string' || password.length === 0) return false;

  const candidates = [...new Set([user.password_hash, user.password]
    .filter((value) => !isBlank(value))
    .map((value) => String(value)))];
  let matchedLegacyPassword = false;

  for (const candidate of candidates) {
    if (BCRYPT_HASH_PATTERN.test(candidate)) {
      try {
        if (await bcrypt.compare(password, candidate)) return true;
      } catch {
        continue;
      }
    } else if (candidate === password) {
      matchedLegacyPassword = true;
    }
  }

  if (matchedLegacyPassword) {
    try {
      await updateUser(user.id, { password });
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
    department: studentProfile?.department || '',
    year: studentProfile?.year || '',
    division: studentProfile?.division || '',
    semester: studentProfile?.semester || '',
    roll_number: studentProfile?.roll_number || '',
    studentProfile,
  };
};

const generateFinalToken = (user) => generateToken({
  userId: user.id,
  email: user.email || null,
  mobile: user.mobile_number || null,
  role: user.role,
  collegeId: user.college_id ?? null,
  tokenType: 'access',
});

const generatePreauthToken = (user) => jwt.sign({
  userId: user.id,
  tokenType: PREAUTH_TOKEN_TYPE,
  purpose: PREAUTH_PURPOSE,
  jti: randomUUID(),
}, config.jwt.secret, {
  expiresIn: PREAUTH_TOKEN_TTL,
});

const finalizePrimaryAuthentication = async (user) => {
  assertUserCanAuthenticate(user);

  if (hasTwoFactorAuthentication(user)) {
    return {
      requiresTwoFactor: true,
      preAuthToken: generatePreauthToken(user),
    };
  }

  if (isTwoFactorEnabled(user?.two_factor_enabled) && isBlank(user?.two_factor_secret)) {
    console.warn(
      `[AUTH] User ${user?.id} <${user?.email}> is flagged for 2FA but has no two_factor_secret; 2FA skipped until the account is enrolled.`
    );
  }

  return {
    requiresTwoFactor: false,
    token: generateFinalToken(user),
    user: await buildUserResponse(user),
  };
};

const pruneConsumedPreauthTokens = () => {
  const now = Date.now();
  for (const [jti, expiresAt] of consumedPreauthTokens.entries()) {
    if (expiresAt <= now) consumedPreauthTokens.delete(jti);
  }
};

const decodePreauthToken = (token) => {
  if (isBlank(token)) {
    throw createAuthError('A temporary authentication token is required.', 401);
  }

  const normalizedToken = String(token)
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  let decoded;
  try {
    decoded = jwt.verify(normalizedToken, config.jwt.secret);
  } catch {
    throw createAuthError('Invalid or expired temporary authentication token.', 401);
  }

  if (
    decoded?.tokenType !== PREAUTH_TOKEN_TYPE
    || decoded?.purpose !== PREAUTH_PURPOSE
    || !decoded?.userId
    || !decoded?.jti
  ) {
    throw createAuthError('Invalid temporary authentication token.', 401);
  }

  pruneConsumedPreauthTokens();
  if (consumedPreauthTokens.has(decoded.jti)) {
    throw createAuthError('Temporary authentication token has already been used.', 401);
  }

  return decoded;
};

const consumePreauthToken = (decoded) => {
  const expiresAt = Number(decoded.exp) * 1000 || Date.now() + 10 * 60 * 1000;
  consumedPreauthTokens.set(decoded.jti, expiresAt);
  pruneConsumedPreauthTokens();
};

const PREAUTH_TOKEN_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const looksLikePreauthToken = (value) => !isBlank(value) && PREAUTH_TOKEN_SHAPE.test(String(value).trim());

export const generateTotpSetup = async (accountLabel) => {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `TrainingPortal (${accountLabel})`,
    issuer: 'TrainingPortal',
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    otpauth_url: secret.otpauth_url,
  };
};

export const verifyTotpToken = (secret, token) => {
  if (isBlank(secret) || isBlank(token)) return false;
  const cleanToken = String(token).trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  try {
    const verified = speakeasy.totp.verify({
      secret: String(secret).trim(),
      encoding: 'base32',
      token: cleanToken,
      window: 2,
    });
    return Boolean(verified);
  } catch (err) {
    console.warn(`[TOTP] Verification exception: ${err.message}`);
    return false;
  }
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
  if (existingUser && existingUser.password && existingUser.password.trim().length > 0) {
    throw createAuthError('An account already exists for this email. Please log in instead.', 409);
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

/**
 * Step 2 of college registration: consume the email OTP (single use) and only
 * then create the account. A wrong, expired, replayed or over-attempted code
 * never reaches registerUser, so no account is created.
 */
export const verifyRegistrationOtpAndRegister = async (data = {}) => {
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
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

  try {
    return await registerUser({ ...data, email, mobile_number: undefined });
  } catch (err) {
    await invalidateRegistrationOtps(email);
    throw err;
  }
};

export const registerUser = async (data) => {
  const { name, email, mobile_number, password, role, secure_code, roll_number, department, year, division, semester } = data;

  if (isBlank(email) && isBlank(mobile_number)) {
    throw createAuthError('An email address or mobile number is required.', 400);
  }
  if (typeof password !== 'string' || password.length < 6) {
    throw createAuthError('Password must be at least 6 characters long.', 400);
  }

  let existingUser = null;
  if (email) {
    existingUser = await findUserByEmailOrMobile(email);
  } else if (mobile_number) {
    existingUser = await findUserByEmailOrMobile(mobile_number);
  }

  if (existingUser) {
    if (existingUser.password && existingUser.password.trim().length > 0) {
      throw createAuthError('User with this email or mobile number already exists and has completed registration. Please log in.', 409);
    }

    // User was pre-added by Admin and is now completing registration!
    let canonicalRole = existingUser.role || ROLES.STUDENT;

    let derivedSemester = semester || '';
    if (!derivedSemester && year) {
      if (year === 'FE') derivedSemester = 'Semester 1';
      else if (year === 'SE') derivedSemester = 'Semester 3';
      else if (year === 'TE') derivedSemester = 'Semester 5';
      else if (year === 'BE') derivedSemester = 'Semester 7';
    }

    await updateUserModel(existingUser.id, {
      name: name || existingUser.name,
      email: existingUser.email || email,
      mobile_number: mobile_number || existingUser.mobile_number,
      password: password || '',
      password_hash: password || '',
      role: canonicalRole,
      department,
      year,
      division,
      semester: derivedSemester,
      roll_number,
      is_profile_updated: 1,
    });

    const updatedUser = await findUserById(existingUser.id);
    let studentProfile = await getStudentByUserId(updatedUser.id);

    if (updatedUser.email && updatedUser.email.includes('@')) {
      sendWelcomeEmail({ to: updatedUser.email, name: updatedUser.name, role: updatedUser.role }).catch((err) => {
        console.warn(`[AUTH] Welcome email notification skipped: ${err.message}`);
      });
    }

    const totpSetup = await generateTotpSetup(updatedUser.email || name);
    await updateUserTwoFactorSecret(updatedUser.id, totpSetup.secret);

    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      mobile: updatedUser.mobile_number,
      role: updatedUser.role,
      collegeId: updatedUser.college_id || 1,
    });

    return {
      token,
      qrCode: totpSetup.qrCode,
      secret: totpSetup.secret,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile_number: updatedUser.mobile_number,
        role: updatedUser.role,
        two_factor_secret: totpSetup.secret,
        department: studentProfile?.department || department || '',
        year: studentProfile?.year || year || '',
        division: studentProfile?.division || division || '',
        semester: studentProfile?.semester || derivedSemester || '',
        roll_number: studentProfile?.roll_number || roll_number || '',
        studentProfile,
      },
    };
  }

  let canonicalRole = ROLES.STUDENT;
  if (role) {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('faculty') || lowerRole.includes('mentor')) canonicalRole = ROLES.MENTOR;
    else if (lowerRole.includes('admin') || lowerRole.includes('hod')) canonicalRole = ROLES.COLLEGE_ADMIN;
    else if (lowerRole.includes('coordinator')) canonicalRole = ROLES.COORDINATOR;
  }

  let codeRecord = null;
  const isNonStudentRole = canonicalRole !== ROLES.STUDENT;
  if (isNonStudentRole || (secure_code && String(secure_code).trim().length > 0)) {
    if (!secure_code || String(secure_code).trim().length === 0) {
      throw createAuthError(`Secure access code is required to register for role: ${role || canonicalRole}`, 400);
    }

    codeRecord = await findSecureCode(secure_code, canonicalRole);
    if (!codeRecord) {
      throw createAuthError(`Invalid or expired Secure Access Code for the selected role (${role || canonicalRole}). Please verify code with Super Admin.`, 400);
    }
  }

  // College assignment and domain check
  let assignedCollegeId = 1;
  if (canonicalRole === ROLES.COLLEGE_ADMIN) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim().toLowerCase();

    const matchingCollege = await findCollegeByAdminEmail(cleanEmail);

    if (!matchingCollege) {
      const error = new Error(`Admin registration denied: Email '${email}' has not been registered as a College Admin by Super Admin.`);
      error.statusCode = 403;
      throw error;
    }

    if (matchingCollege.admin_name && matchingCollege.admin_name.trim().length > 0) {
      const dbAdminName = matchingCollege.admin_name.trim().toLowerCase();
      if (dbAdminName !== cleanName) {
        const error = new Error(`Admin registration denied: Name '${name}' does not match the pre-registered Admin Name '${matchingCollege.admin_name}' registered for email '${email}'.`);
        error.statusCode = 403;
        throw error;
      }
    }

    assignedCollegeId = matchingCollege.id;
  } else if (email) {
    const matchingCollege = await findCollegeByEmailDomain(email);
    if (!matchingCollege) {
      const domain = email.includes('@') ? email.split('@')[1] : email;
      throw createAuthError(`Registration denied: College does not exist or your email domain (@${domain}) is not authorized. You cannot register.`, 400);
    }
    assignedCollegeId = matchingCollege.id;
  }

  // Create base User
  const user = await createUser({
    name,
    email: email || null,
    mobile_number: mobile_number || null,
    password,
    role: canonicalRole,
    college_id: assignedCollegeId,
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
    });
  }

  if (user.email && user.email.includes('@')) {
    sendWelcomeEmail({ to: user.email, name: user.name, role: user.role }).catch((error) => {
      console.warn(`[AUTH] Welcome email notification skipped: ${error.message}`);
    });
  }

  const totpSetup = await generateTotpSetup(user.email || user.mobile_number || name);
  await updateUserTwoFactorSecret(user.id, totpSetup.secret);

  return {
    token: generateFinalToken(user),
    qrCode: totpSetup.qrCode,
    secret: totpSetup.secret,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile_number: user.mobile_number,
      role: user.role,
      two_factor_secret: totpSetup.secret,
      department: studentProfile?.department || department || '',
      year: studentProfile?.year || year || '',
      division: studentProfile?.division || division || '',
      semester: studentProfile?.semester || semester || '',
      roll_number: studentProfile?.roll_number || roll_number || '',
      studentProfile,
    },
  };
};

export const verifyTotpAndLogin = async (identifier, totpCode, rememberMe = false) => {
  const preauthPayload = looksLikePreauthToken(identifier) ? decodePreauthToken(identifier) : null;
  const user = preauthPayload
    ? await findUserById(preauthPayload.userId)
    : await findUserByEmailOrMobile(identifier);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!hasTwoFactorAuthentication(user) || !verifyTotpToken(user.two_factor_secret, totpCode)) {
    throw createAuthError('Invalid Authenticator Code from Microsoft/Google Authenticator app.', 400);
  }

  if (preauthPayload) {
    consumePreauthToken(preauthPayload);
  }

  await updateUserRememberMe(user.id, rememberMe);

  const studentProfile = await getStudentByUserId(user.id);
  const token = generateFinalToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile_number: user.mobile_number,
      role: user.role,
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
      studentProfile,
    },
  };
};

export const verifyTotpPairing = async (identifier, totpCode) => {
  if (isBlank(identifier) || isBlank(totpCode)) {
    throw createAuthError('Identifier and Authenticator code are required.', 400);
  }

  const user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    throw createAuthError('No account is pending Authenticator pairing for this identifier.', 400);
  }
  assertUserCanAuthenticate(user);

  if (isTwoFactorEnabled(user.two_factor_enabled) || isBlank(user.two_factor_secret)) {
    throw createAuthError('This account is not pending Authenticator pairing. Please sign in instead.', 400);
  }

  if (!verifyTotpToken(user.two_factor_secret, totpCode)) {
    throw createAuthError('Invalid Authenticator Code from Microsoft/Google Authenticator app.', 400);
  }

  await enableTwoFactorForUser(user.id);

  return {
    requiresTwoFactor: false,
    token: generateFinalToken(user),
    user: await buildUserResponse(user),
  };
};

export const sendUserOtp = async (identifier) => {
  if (isBlank(identifier)) {
    throw createAuthError('Email or mobile number is required.', 400);
  }

  const cleanIdentifier = String(identifier).trim();
  const user = await findUserByEmailOrMobile(cleanIdentifier);
  if (!user) {
    throw createAuthError('No account found for this identifier.', 404);
  }
  assertUserCanAuthenticate(user);

  const otp = generateOtp(6);
  const recipientEmail = typeof user.email === 'string' && user.email.includes('@') ? user.email : null;
  if (!recipientEmail) {
    throw createAuthError('OTP delivery is not available for this account. Please use password login or contact your administrator.', 400);
  }

  await saveOtpRecord(cleanIdentifier, otp);
  try {
    const emailResult = await sendOtpEmail({ to: recipientEmail, otp, name: user.name });
    console.log(`[AUTH] OTP email successfully dispatched to ${recipientEmail} (Message ID: ${emailResult?.messageId || 'sent'})`);
  } catch (error) {
    console.error(`[AUTH Error] OTP email dispatch failed for ${recipientEmail}:`, error.message);
    throw createAuthError(`Failed to send OTP email: ${error.message || 'Email service error'}`, 500);
  }

  return { identifier: cleanIdentifier };
};

export const verifyUserOtpAndLogin = async (identifier, otp, rememberMe = false) => {
  if (isBlank(identifier) || isBlank(otp)) {
    throw createAuthError('Identifier and OTP are required.', 400);
  }

  const cleanIdentifier = String(identifier).trim();
  let user = await findUserByEmailOrMobile(cleanIdentifier);
  if (!user) {
    throw createAuthError('Invalid credentials.', 401);
  }
  assertUserCanAuthenticate(user);

  const isValid = await verifyOtpRecord(cleanIdentifier, otp);
  if (!isValid) {
    throw createAuthError('Invalid or expired OTP', 400);
  }

  await updateUserRememberMe(user.id, rememberMe);

  const studentProfile = await getStudentByUserId(user.id);

  const token = generateToken({
    userId: user.id,
    email: user.email,
    mobile: user.mobile_number,
    role: user.role,
    collegeId: user.college_id || 1,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile_number: user.mobile_number,
      role: user.role,
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
      studentProfile,
    },
  };
};

export const loginWithPassword = async (identifier, password, rememberMe = false) => {
  if (isBlank(identifier) || isBlank(password)) {
    throw createAuthError('Email/mobile and password are required.', 400);
  }

  const user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    throw createAuthError('Invalid credentials.', 401);
  }
  assertUserCanAuthenticate(user);

  const isValid = await verifyStoredPassword(user, password);

  // The env-configured super admin may authenticate with the env password even
  // when the stored credential does not match. Nothing else may: the previous
  // raw comparison of the stored value against the submitted password locked
  // out every account whose credential is a real bcrypt hash, because a hash can
  // never equal the plaintext that verifyStoredPassword already validated.
  const envSuperEmail = process.env.SUPER_ADMIN_EMAIL || 'super.admin0987@gmail.com';
  const envSuperPass = process.env.SUPER_ADMIN_PASSWORD;
  const isSuperAdminMatch = Boolean(
    envSuperPass
    && user.email?.toLowerCase() === envSuperEmail.toLowerCase()
    && password === envSuperPass
  );

  if (!isValid && !isSuperAdminMatch) {
    throw createAuthError('Invalid password. Please check your credentials.', 401);
  }

  await updateUserRememberMe(user.id, rememberMe);

  const studentProfile = await getStudentByUserId(user.id);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    role: user.role,
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
    studentProfile,
  };

  const primaryAuth = await finalizePrimaryAuthentication(user);
  if (primaryAuth.requiresTwoFactor) {
    return primaryAuth;
  }

  return {
    requiresTwoFactor: false,
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
  assertUserCanAuthenticate(user);

  const isValidOtp = await verifyOtpRecord(identifier, otp);
  if (!isValidOtp) {
    throw createAuthError('Invalid or expired 6-digit security code', 400);
  }

  await updateUser(user.id, { password: newPassword });
  return { message: 'Password reset successfully' };
};

export const setupUser2FA = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const totpSetup = await generateTotpSetup(user.email || user.name || `User_${user.id}`);
  return {
    secret: totpSetup.secret,
    qrCode: totpSetup.qrCode,
    email: user.email,
  };
};

export const verifyAndEnableUser2FA = async (userId, secret, code) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (!secret || !code) {
    throw new Error('Secret and 6-digit verification code are required');
  }

  const isValid = verifyTotpToken(secret, code);
  if (!isValid) {
    throw new Error('Invalid 6-digit Authenticator code. Please check your Google Authenticator app.');
  }

  await updateUserTwoFactorSecret(userId, secret);
  return { message: 'Google Authenticator 2FA paired and enabled successfully!' };
};
