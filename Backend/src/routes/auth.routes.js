import { Router } from 'express';
import { register, sendOtp, verifyOtpAndLogin, passwordLogin, verifyTotp, getMe, updateProfile, changePassword, resetPasswordWithOtp } from '../controllers/auth.controller.js';
import { validateRequestBody } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Registration endpoint
router.post('/register', validateRequestBody(['name']), register);

// OTP, TOTP & Password Login flows
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndLogin);
router.post('/verify-totp', verifyTotp);
router.post('/login-password', passwordLogin);
router.post('/login', (req, res, next) => {
  if (req.body.password) {
    return passwordLogin(req, res, next);
  }
  return verifyOtpAndLogin(req, res, next);
});

router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.patch('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);
router.post('/reset-password-otp', resetPasswordWithOtp);

export default router;
