import { registerUser, sendUserOtp, verifyUserOtpAndLogin, loginWithPassword, getCurrentUser } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

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

export const loginPassword = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    const { password } = req.body;
    if (!identifier || !password) {
      return sendError(res, 'Identifier and password are required', 400);
    }
    const result = await loginWithPassword(identifier, password);
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.userId);
    return sendSuccess(res, 'Current user profile fetched successfully', user);
  } catch (error) {
    next(error);
  }
};
