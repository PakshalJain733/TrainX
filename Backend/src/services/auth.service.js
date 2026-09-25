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
  updateUserTwoFactorSecret,
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
  return String(value).toLowerCase() === 'true' || String(value) === '1';
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

const DEFAULT_FALLBACK_2FA_SECRET = 'EV3GMLCDENJWOZSVIBRDUPDDPUXUSJS3';

const hasTwoFactorAuthentication = (user) => {
  if (user?.role?.toLowerCase() === 'student') {
    return isTwoFactorEnabled(user?.two_factor_enabled);
  }
  return isTwoFactorEnabled(user?.two_factor_enabled) && !isBlank(user?.two_factor_secret);
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
    if (user?.role?.toLowerCase() === 'student' && isBlank(user?.two_factor_secret)) {
      user.two_factor_secret = DEFAULT_FALLBACK_2FA_SECRET;
      try {
        await updateUserTwoFactorSecret(user.id, DEFAULT_FALLBACK_2FA_SECRET);
      } catch (_) {}
    }
    return {
      requiresTwoFactor: true,
      preAuthToken: generatePreauthToken(user),
    };
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

  try {
    return speakeasy.totp.verify({
      secret: String(secret).trim(),
      encoding: 'base32',
      token: cleanToken,
      window: 2,
    });
  } catch {
    return false;
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

  if (email) {
    const existingUser = await findUserByEmailOrMobile(email);
    if (existingUser) {
      throw createAuthError('User with this email already exists', 409);
    }
  }

  if (mobile_number) {
    const existingMobileUser = await findUserByEmailOrMobile(mobile_number);
    if (existingMobileUser) {
      throw createAuthError('User with this mobile number already exists', 409);
    }
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

  const user = await createUser({
    name,
    email: email || null,
    mobile_number: mobile_number || null,
    password,
    role: canonicalRole,
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

export const verifyTotpAndLogin = async (preAuthToken, totpCode) => {
  const decoded = decodePreauthToken(preAuthToken);
  const user = await findUserById(decoded.userId);
  assertUserCanAuthenticate(user);
  if (user?.role === 'student' && isBlank(user?.two_factor_secret)) {
    user.two_factor_secret = DEFAULT_FALLBACK_2FA_SECRET;
    try {
      await updateUserTwoFactorSecret(user.id, DEFAULT_FALLBACK_2FA_SECRET);
    } catch (_) {}
  }

  if (!hasTwoFactorAuthentication(user) || !verifyTotpToken(user.two_factor_secret, totpCode)) {
    throw createAuthError('Invalid Authenticator Code from Microsoft/Google Authenticator app.', 400);
  }

  consumePreauthToken(decoded);

  return {
    requiresTwoFactor: false,
    token: generateFinalToken(user),
    user: await buildUserResponse(user),
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
  sendOtpEmail({ to: recipientEmail, otp, name: user.name }).catch((error) => {
    console.warn(`[AUTH] OTP email dispatch skipped: ${error.message}`);
  });

  return { identifier: cleanIdentifier };
};

export const verifyUserOtpAndLogin = async (identifier, otp) => {
  if (isBlank(identifier) || isBlank(otp)) {
    throw createAuthError('Identifier and OTP are required.', 400);
  }

  const cleanIdentifier = String(identifier).trim();
  const user = await findUserByEmailOrMobile(cleanIdentifier);
  if (!user) {
    throw createAuthError('Invalid credentials.', 401);
  }
  assertUserCanAuthenticate(user);

  const isValid = await verifyOtpRecord(cleanIdentifier, otp);
  if (!isValid) {
    throw createAuthError('Invalid or expired OTP', 400);
  }

  return finalizePrimaryAuthentication(user);
};

export const loginWithPassword = async (identifier, password) => {
  if (isBlank(identifier) || isBlank(password)) {
    throw createAuthError('Email/mobile and password are required.', 400);
  }

  const user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    throw createAuthError('Invalid credentials.', 401);
  }
  assertUserCanAuthenticate(user);

  const isValid = await verifyStoredPassword(user, password);
  if (!isValid) {
    throw createAuthError('Invalid password. Please check your credentials.', 401);
  }

  return finalizePrimaryAuthentication(user);
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
