import { registerUser, sendUserOtp, verifyUserOtpAndLogin, loginWithPassword, verifyTotpAndLogin, changeUserPassword, resetUserPasswordWithOtp, setupUser2FA, verifyAndEnableUser2FA } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { findUserById, getStudentByUserId, updateUserModel } from '../models/user.model.js';

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
    const { otp, rememberMe, remember_me } = req.body;
    if (!identifier || !otp) {
      return sendError(res, 'Email or Mobile number and OTP are required', 400);
    }
    const formattedOtp = Array.isArray(otp) ? otp.join('') : otp;
    const isRemember = rememberMe !== undefined ? rememberMe : remember_me;
    const result = await verifyUserOtpAndLogin(identifier, formattedOtp, isRemember);
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const verifyTotp = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    const { code, otp, totp, rememberMe, remember_me } = req.body;
    const inputCode = code || otp || totp;
    if (!identifier || !inputCode) {
      return sendError(res, 'Email and Authenticator code are required', 400);
    }
    const formattedCode = Array.isArray(inputCode) ? inputCode.join('') : inputCode;
    const isRemember = rememberMe !== undefined ? rememberMe : remember_me;
    const result = await verifyTotpAndLogin(identifier, formattedCode, isRemember);
    return sendSuccess(res, 'Authenticator verification successful', result);
  } catch (error) {
    next(error);
  }
};

export const passwordLogin = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    const { password, rememberMe, remember_me } = req.body;
    if (!identifier || !password) {
      return sendError(res, 'Email/Mobile and Password are required', 400);
    }
    const isRemember = rememberMe !== undefined ? rememberMe : remember_me;
    const result = await loginWithPassword(identifier, password, isRemember);
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
    const isProfileUpdated = Boolean(
      user.is_profile_updated ||
      studentProfile.is_profile_updated ||
      (studentProfile.department && studentProfile.semester && studentProfile.roll_number && studentProfile.skills) ||
      (user.department && user.semester && user.roll_number && user.skills)
    );
    return sendSuccess(res, 'Authenticated user data retrieved', {
      ...user,
      ...studentProfile,
      remember_me: Boolean(user.remember_me),
      is_profile_updated: isProfileUpdated,
      studentProfile: {
        ...studentProfile,
        is_profile_updated: isProfileUpdated,
      },
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
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return sendError(res, 'Email, OTP, and new password are required', 400);
    }
    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }
    const result = await resetUserPasswordWithOtp(email, otp, newPassword);
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

export const setup2FA = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const result = await setupUser2FA(userId);
    return sendSuccess(res, '2FA setup QR Code generated successfully', result);
  } catch (error) {
    return sendError(res, error.message || 'Failed to generate 2FA setup QR Code', 400);
  }
};

export const verify2FA = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { secret, code } = req.body;
    const result = await verifyAndEnableUser2FA(userId, secret, code);
    return sendSuccess(res, 'Google Authenticator 2FA paired successfully', result);
  } catch (error) {
    return sendError(res, error.message || 'Failed to verify 2FA code', 400);
  }
};
