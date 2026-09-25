import { registerUser, sendUserOtp, verifyUserOtpAndLogin, loginWithPassword, verifyTotpAndLogin, verifyTotpPairing, changeUserPassword, resetUserPasswordWithOtp } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { findUserById, getStudentByUserId, toSafeUser, updateUserModel } from '../models/user.model.js';

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
    const body = req.body || {};
    const { code, otp, totp } = body;
    const inputCode = code || otp || totp;
    const authorization = req.headers.authorization || req.headers.Authorization || '';
    const headerToken = typeof authorization === 'string'
      ? authorization.replace(/^Bearer\s+/i, '').trim()
      : '';
    const preAuthToken = body.preAuthToken || body.temporaryToken || body.preauthToken || body.token || headerToken;

    if (!inputCode) {
      return sendError(res, 'Authenticator code is required', 400);
    }

    const formattedCode = Array.isArray(inputCode) ? inputCode.join('') : inputCode;

    if (preAuthToken) {
      const result = await verifyTotpAndLogin(preAuthToken, formattedCode);
      return sendSuccess(res, 'Authenticator verification successful', result);
    }

    const identifier = body.email || body.mobile || body.identifier || body.mobile_number;
    if (!identifier) {
      return sendError(res, 'Temporary authentication token and Authenticator code are required', 400);
    }

    const result = await verifyTotpPairing(identifier, formattedCode);
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
    const safeUser = toSafeUser(user);
    return sendSuccess(res, 'Authenticated user data retrieved', {
      ...safeUser,
      ...studentProfile,
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

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }
    const result = await changeUserPassword(userId, currentPassword, newPassword);
    return sendSuccess(res, 'Password changed successfully', result);
  } catch (error) {
    return sendError(res, error.message || 'Failed to change password', 400);
  }
};

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    if (!identifier || !otp || !newPassword) {
      return sendError(res, 'Email/mobile, OTP, and new password are required', 400);
    }
    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }
    const result = await resetUserPasswordWithOtp(identifier, otp, newPassword);
    return sendSuccess(res, 'Password reset successfully', result);
  } catch (error) {
    return sendError(res, error.message || 'Failed to reset password', 400);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const updated = await updateUserModel(userId, req.body);
    return sendSuccess(res, 'Profile updated successfully in database', updated);
  } catch (error) {
    next(error);
  }
};
