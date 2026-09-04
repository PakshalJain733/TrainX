import { registerUser, sendUserOtp, verifyUserOtpAndLogin } from '../services/auth.service.js';
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
