import { Router } from 'express';
import { sendRegisterOtp, verifyRegisterOtp, sendOtp, verifyOtpAndLogin, passwordLogin, verifyTotp, getMe, updateProfile, changePassword, resetPasswordWithOtp, setup2FA, verify2FA } from '../controllers/auth.controller.js';
import { validateRequestBody } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Registration endpoint
// Two-phase: the email OTP must be verified before any account is created.
// The legacy unauthenticated POST /register is intentionally gone so the
// email verification cannot be bypassed.
router.post('/register/send-otp', validateRequestBody(['email']), sendRegisterOtp);
router.post('/register/verify-otp', validateRequestBody(['email']), verifyRegisterOtp);

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
router.post('/setup-2fa', authenticateToken, setup2FA);
router.post('/verify-2fa', authenticateToken, verify2FA);

export default router;
