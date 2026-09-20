import bcrypt from 'bcryptjs';
import {
  findUserByEmailOrMobile,
  findUserById,
  createUser,
  saveStudentDetails,
  getStudentByUserId,
  saveOtpRecord,
  verifyOtpRecord,
} from '../models/user.model.js';
import { generateToken } from '../utils/generateToken.js';
import { generateOtp } from '../utils/generateOtp.js';
import { ROLES } from '../utils/constants.js';
import { sendOtpEmail, sendWelcomeEmail } from './email.service.js';

export const registerUser = async (data) => {
  const { name, email, mobile_number, password, roll_number, department, year, division, semester } = data;

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

  // SECURITY: Public self-registration can only ever create a student account.
  // Privileged roles (mentor/coordinator/college_admin/super_admin) must be
  // assigned by an authenticated admin via the admin user-management endpoint.
  const canonicalRole = ROLES.STUDENT;

  const password_hash = password ? await bcrypt.hash(password, 10) : null;

  // Create base User
  const user = await createUser({
    name,
    email: email || '',
    mobile_number: mobile_number || '',
    role: canonicalRole,
    college_id: 1,
    password_hash,
  });

  // If student role, save student details
  let studentProfile = null;
  if (canonicalRole === ROLES.STUDENT && roll_number) {
    studentProfile = await saveStudentDetails({
      user_id: user.id,
      college_id: user.college_id || 1,
      roll_number,
      department: department || '',
      year: year || '',
      division: division || '',
      semester: semester || '',
    });
  }

  // Send welcome email asynchronously
  if (user.email && user.email.includes('@')) {
    sendWelcomeEmail({ to: user.email, name: user.name, role: user.role }).catch((err) => {
      console.warn(`[AUTH] Welcome email notification skipped: ${err.message}`);
    });
  }

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
      studentProfile,
    },
  };
};

export const sendUserOtp = async (identifier) => {
  const user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    const error = new Error('No account found with this email or mobile number. Please register first.');
    error.statusCode = 404;
    throw error;
  }

  const otp = generateOtp(6);
  await saveOtpRecord(identifier, otp);

  // Dispatch OTP email via Nodemailer
  const recipientEmail = user.email || (identifier.includes('@') ? identifier : null);
  if (recipientEmail && recipientEmail.includes('@')) {
    sendOtpEmail({ to: recipientEmail, otp, name: user.name }).catch((err) => {
      console.warn(`[AUTH] Nodemailer email dispatch notice: ${err.message}`);
    });
  }

  return {
    identifier,
  };
};

export const verifyUserOtpAndLogin = async (identifier, otp) => {
  const user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    const error = new Error('User account not found. Please contact administration.');
    error.statusCode = 404;
    throw error;
  }

  const isValid = await verifyOtpRecord(identifier, otp);
  if (!isValid) {
    const error = new Error('Invalid or expired OTP');
    error.statusCode = 400;
    throw error;
  }

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
      department: studentProfile?.department || '',
      year: studentProfile?.year || '',
      division: studentProfile?.division || '',
      semester: studentProfile?.semester || '',
      roll_number: studentProfile?.roll_number || '',
      studentProfile,
    },
  };
};

export const loginWithPassword = async (identifier, password) => {
  const user = await findUserByEmailOrMobile(identifier);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  if (!user.password_hash) {
    const error = new Error('Password login is not set up for this user. Please log in using OTP.');
    error.statusCode = 400;
    throw error;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

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
      department: studentProfile?.department || '',
      year: studentProfile?.year || '',
      division: studentProfile?.division || '',
      semester: studentProfile?.semester || '',
      roll_number: studentProfile?.roll_number || '',
      studentProfile,
    },
  };
};

export const getCurrentUser = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  const studentProfile = await getStudentByUserId(user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    role: user.role,
    college_id: user.college_id,
    department: studentProfile?.department || '',
    year: studentProfile?.year || '',
    division: studentProfile?.division || '',
    semester: studentProfile?.semester || '',
    roll_number: studentProfile?.roll_number || '',
    cgpa: studentProfile?.cgpa || '',
    skills: studentProfile?.skills || '',
    studentProfile,
  };
};
