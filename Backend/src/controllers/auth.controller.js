import { registerUser, sendUserOtp, verifyUserOtpAndLogin, loginWithPassword, verifyTotpAndLogin } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { findUserById, getStudentByUserId } from '../models/user.model.js';

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    return sendSuccess(res, 'User registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    if (!identifier) {
      return sendError(res, 'Email or Mobile number is required', 400);
    }
    const result = await sendUserOtp(identifier);
    return sendSuccess(res, 'OTP sent successfully', result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtpAndLogin = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    const { otp } = req.body;
    if (!identifier || !otp) {
      return sendError(res, 'Email or Mobile number and OTP are required', 400);
    }
    const formattedOtp = Array.isArray(otp) ? otp.join('') : otp;
    const result = await verifyUserOtpAndLogin(identifier, formattedOtp);
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const verifyTotp = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    const { code, otp, totp } = req.body;
    const inputCode = code || otp || totp;
    if (!identifier || !inputCode) {
      return sendError(res, 'Email and Authenticator code are required', 400);
    }
    const formattedCode = Array.isArray(inputCode) ? inputCode.join('') : inputCode;
    const result = await verifyTotpAndLogin(identifier, formattedCode);
    return sendSuccess(res, 'Authenticator verification successful', result);
  } catch (error) {
    next(error);
  }
};

export const passwordLogin = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    const { password } = req.body;
    if (!identifier || !password) {
      return sendError(res, 'Email/Mobile and Password are required', 400);
    }
    const result = await loginWithPassword(identifier, password);
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await findUserById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    const studentProfile = await getStudentByUserId(userId) || {};
    return sendSuccess(res, 'Authenticated user data retrieved', {
      ...user,
      studentProfile,
      department: user.department || studentProfile.department || '',
      semester: user.semester || studentProfile.semester || '',
      cgpa: user.cgpa || studentProfile.cgpa || '',
      skills: user.skills || studentProfile.skills || '',
    });
  } catch (error) {
    next(error);
  }
};
