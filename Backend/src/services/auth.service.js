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
  updateUserRememberMe,
  findCollegeByAdminEmail,
} from '../models/user.model.js';
import { generateToken } from '../utils/generateToken.js';
import { generateOtp } from '../utils/generateOtp.js';
import { ROLES } from '../utils/constants.js';
import { sendOtpEmail, sendWelcomeEmail } from './email.service.js';
import { findSecureCode, markCodeAsUsed } from '../models/secureCode.model.js';

export const generateTotpSetup = async (email) => {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `TrainingPortal (${email})`,
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
  if (!token) return false;
  const cleanToken = String(token).trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  // Master key / default authentication code 123456 for Super Admin / testing
  if (cleanToken === '123456') return true;

  if (!secret) return false;

  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
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

export const registerUser = async (data) => {
  const { name, email, mobile_number, password, role, secure_code, roll_number, department, year, division, semester } = data;

  // Check if user exists by email or mobile number
  if (email) {
    const existingUser = await findUserByEmailOrMobile(email);
    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  if (mobile_number) {
    const existingMobileUser = await findUserByEmailOrMobile(mobile_number);
    if (existingMobileUser) {
      const error = new Error('User with this mobile number already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  // Map role
  let canonicalRole = ROLES.STUDENT;
  if (role) {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('faculty') || lowerRole.includes('mentor')) canonicalRole = ROLES.MENTOR;
    else if (lowerRole.includes('admin') || lowerRole.includes('hod')) canonicalRole = ROLES.COLLEGE_ADMIN;
    else if (lowerRole.includes('coordinator')) canonicalRole = ROLES.COORDINATOR;
  }

  // Verification of Secure Code in DB for non-student roles or if secure_code provided
  let codeRecord = null;
  const isNonStudentRole = canonicalRole !== ROLES.STUDENT;
  if (isNonStudentRole || (secure_code && String(secure_code).trim().length > 0)) {
    if (!secure_code || String(secure_code).trim().length === 0) {
      const error = new Error(`Secure access code is required to register for role: ${role || canonicalRole}`);
      error.statusCode = 400;
      throw error;
    }

    codeRecord = await findSecureCode(secure_code, canonicalRole);
    if (!codeRecord) {
      const error = new Error(`Invalid or expired Secure Access Code for the selected role (${role || canonicalRole}). Please verify code with Super Admin.`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Strict College Admin verification: email and name MUST match the college created by Super Admin
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
  }

  // Create base User
  const user = await createUser({
    name,
    email: email || '',
    mobile_number: mobile_number || '',
    password: password || '',
    role: canonicalRole,
    college_id: assignedCollegeId,
  });

  // Mark secure code as used in DB if applicable
  if (codeRecord && codeRecord.id) {
    await markCodeAsUsed(codeRecord.id, user.id);
  }

  // If student role, save student details
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

  // Send welcome email asynchronously
  if (user.email && user.email.includes('@')) {
    sendWelcomeEmail({ to: user.email, name: user.name, role: user.role }).catch((err) => {
      console.warn(`[AUTH] Welcome email notification skipped: ${err.message}`);
    });
  }

  // Generate Microsoft / Google Authenticator TOTP Setup
  const totpSetup = await generateTotpSetup(user.email || name);
  await updateUserTwoFactorSecret(user.id, totpSetup.secret);

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    mobile: user.mobile_number,
    role: user.role,
    collegeId: user.college_id || 1,
  });

  return {
    token,
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
  const user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isValid = verifyTotpToken(user.two_factor_secret, totpCode);
  if (!isValid) {
    const error = new Error('Invalid Authenticator Code from Microsoft/Google Authenticator app.');
    error.statusCode = 400;
    throw error;
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

export const sendUserOtp = async (identifier) => {
  let user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    // Auto-onboard user if not registered yet
    const isMobile = /^\d+$/.test(identifier.trim());
    const namePart = isMobile ? `User_${identifier}` : identifier.split('@')[0];
    const formattedName = namePart.split(/[._]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    user = await createUser({
      name: formattedName || 'Student',
      email: isMobile ? `${identifier}@student.pvppcoe.ac.in` : identifier,
      mobile_number: isMobile ? identifier : '',
      role: ROLES.STUDENT,
    });
  }

  const otp = generateOtp(6);
  await saveOtpRecord(identifier, otp);
  console.log(`[AUTH SERVICE] Generated OTP for ${identifier}: ${otp}`);

  // Dispatch OTP email via Nodemailer
  const recipientEmail = user.email || (identifier.includes('@') ? identifier : null);
  if (recipientEmail && recipientEmail.includes('@')) {
    sendOtpEmail({ to: recipientEmail, otp, name: user.name }).catch((err) => {
      console.warn(`[AUTH] Nodemailer email dispatch notice: ${err.message}`);
    });
  }

  return {
    identifier,
    otp, // Included in response for testing/demo mode
  };
};

export const verifyUserOtpAndLogin = async (identifier, otp, rememberMe = false) => {
  let user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    const isMobile = /^\d+$/.test(identifier.trim());
    const namePart = isMobile ? `User_${identifier}` : identifier.split('@')[0];
    const formattedName = namePart.split(/[._]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    user = await createUser({
      name: formattedName || 'Student',
      email: isMobile ? `${identifier}@student.pvppcoe.ac.in` : identifier,
      mobile_number: isMobile ? identifier : '',
      role: ROLES.STUDENT,
    });
  }

  const isValid = await verifyOtpRecord(identifier, otp);
  if (!isValid) {
    const error = new Error('Invalid or expired OTP');
    error.statusCode = 400;
    throw error;
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
  let user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    const isMobile = /^\d+$/.test(identifier.trim());
    const namePart = isMobile ? `User_${identifier}` : identifier.split('@')[0];
    const formattedName = namePart.split(/[._]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    user = await createUser({
      name: formattedName || 'Student',
      email: isMobile ? `${identifier}@student.pvppcoe.ac.in` : identifier,
      mobile_number: isMobile ? identifier : '',
      role: ROLES.STUDENT,
    });
  }

  // Password Verification Logic
  const storedPassword = user.password || user.password_hash;
  const envSuperEmail = process.env.SUPER_ADMIN_EMAIL || 'super.admin0987@gmail.com';
  const envSuperPass = process.env.SUPER_ADMIN_PASSWORD;

  const isSuperAdminMatch = (user.email.toLowerCase() === envSuperEmail.toLowerCase()) && (password === envSuperPass);

  if (storedPassword && storedPassword !== password && !isSuperAdminMatch) {
    throw new Error('Invalid password. Please check your credentials.');
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

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.password_hash && currentPassword) {
    if (user.password_hash !== currentPassword) {
      throw new Error('Current password is incorrect');
    }
  }

  await updateUser(userId, { password: newPassword });
  return { message: 'Password updated successfully' };
};

export const resetUserPasswordWithOtp = async (email, otp, newPassword) => {
  const user = await findUserByEmailOrMobile(email);
  if (!user) {
    throw new Error('No user account found with this email address');
  }

  const isValidOtp = await verifyOtpRecord(user.email, otp);
  if (!isValidOtp) {
    throw new Error('Invalid or expired 6-digit security code');
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

