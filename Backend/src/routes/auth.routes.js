import { Router } from 'express';
import { sendRegisterOtp, verifyRegisterEmailOtp, verifyRegisterOtp, checkRegistrationStatus, sendOtp, verifyOtpAndLogin, passwordLogin, getMe, updateProfile, changePassword, resetPasswordWithOtp, getDepartmentsByEmail, getCollegeByEmail, registerInstitution, requestSecureCode, getSecureCodeRequests, resolveSecureCodeRequest, deleteSecureCodeRequest, deleteSecureCodeRequestByEmail, verifyInstitutionTokenHandler, completeInstitutionSetupHandler } from '../controllers/auth.controller.js';
import { validateRequestBody } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Registration endpoint
// Two-phase: the email OTP must be verified before any account is created.
// The legacy unauthenticated POST /register is intentionally gone so the
// email verification cannot be bypassed.
router.get('/departments-by-email', getDepartmentsByEmail);
router.get('/college-by-email', getCollegeByEmail);
router.get('/registration-status', checkRegistrationStatus);
router.post('/register/send-otp', validateRequestBody(['email']), sendRegisterOtp);
router.post('/register/verify-email-otp', validateRequestBody(['email', 'otp']), verifyRegisterEmailOtp);
router.post('/register/verify-otp', validateRequestBody(['email']), verifyRegisterOtp);
router.post('/request-secure-code', requestSecureCode);
// Admin & Super Admin protected management of secure code requests
router.get('/secure-code-requests', authenticateToken, getSecureCodeRequests);
router.patch('/secure-code-requests/:id', authenticateToken, resolveSecureCodeRequest);
router.delete('/secure-code-requests/:id', authenticateToken, deleteSecureCodeRequest);
router.delete('/secure-code-requests/by-email/:email', authenticateToken, deleteSecureCodeRequestByEmail);

// Private Institution Setup (Option 1: Private Email Invitation Link)
router.get('/verify-institution-token', verifyInstitutionTokenHandler);
router.post('/complete-institution-setup', validateRequestBody(['token', 'name', 'email', 'password']), completeInstitutionSetupHandler);

// OTP & Password Login flows
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndLogin);
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

router.post('/register-institution', registerInstitution);

