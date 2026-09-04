import { Router } from 'express';
import { register, sendOtp, verifyOtpAndLogin } from '../controllers/auth.controller.js';
import { validateRequestBody } from '../middleware/validation.middleware.js';

const router = Router();

// Registration endpoint
router.post('/register', validateRequestBody(['name']), register);

// OTP-based Login flow (supports email or mobile)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndLogin);
router.post('/login', verifyOtpAndLogin);

export default router;
