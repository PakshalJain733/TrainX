import { Router } from 'express';
import {
  getC2cConfig,
  updateC2cConfig,
  getC2cDashboard,
  getC2cRegistrations,
  createC2cRegistrationHandler,
  getC2cRegistrationByIdHandler,
  updateC2cRegistrationPayment,
  releaseC2cRegistrationLink,
  cancelC2cRegistrationHandler,
  getC2cRegistrationQr,
  validateC2cRegistrationToken,
  getC2cEnrollments,
  updateC2cEnrollmentPaymentHandler,
  updateC2cEnrollmentAccessHandler,
  reEnrollC2cStudent,
} from '../controllers/c2c.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// The registration link a student receives after paying. Public by necessity:
// the student is not an authenticated TrainX user yet at that point. It only
// confirms that a token exists and returns the details needed to prefill the
// registration form.
router.get('/register/validate', validateC2cRegistrationToken);

// C2C Enrollment and the whole intake workflow are admin-only.
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN));

// Program configuration (UPI coordinates, fee) backing the payment QR
router.get('/config', getC2cConfig);
router.put('/config', updateC2cConfig);

// Dashboard cards
router.get('/dashboard', getC2cDashboard);

// Intake: payment QR + initial payment information before software registration
router.get('/registrations', getC2cRegistrations);
router.post('/registrations', createC2cRegistrationHandler);
router.get('/registrations/:id', getC2cRegistrationByIdHandler);
router.patch('/registrations/:id/payment', updateC2cRegistrationPayment);
router.post('/registrations/:id/registration-link', releaseC2cRegistrationLink);
router.post('/registrations/:id/cancel', cancelC2cRegistrationHandler);
router.get('/registrations/:id/qr', getC2cRegistrationQr);

// C2C Enrollment (admin-only)
router.get('/enrollments', getC2cEnrollments);
router.patch('/enrollments/:id/payment', updateC2cEnrollmentPaymentHandler);
router.patch('/enrollments/:id/access', updateC2cEnrollmentAccessHandler);

// Safety net for records that predate the automatic creation on approval
router.post('/enroll/rebuild/:userId', reEnrollC2cStudent);

export default router;
