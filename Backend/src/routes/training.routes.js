import { Router } from 'express';
import {
  getTrainings,
  getOverviewStats,
  getTraining,
  getTrainingByCodePublic,
  createNewTraining,
  updateTrainingDetails,
  changeTrainingStatus,
  getTrainingEnrollments,
  registerForTraining,
  updatePaymentStatus,
  updateApprovalStatus,
  transferStudentTraining,
  handleMultiTrainingWebhook,
  getTrainingData,
} from '../controllers/training.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// ==========================================
// PUBLIC & WEBHOOK ENDPOINTS (No token required)
// ==========================================

// Multi-training webhook for Google Apps Script / Forms
router.post('/google-form/webhook', handleMultiTrainingWebhook);
router.post('/webhook', handleMultiTrainingWebhook);

// Public Training Details & Registration
router.get('/code/:code', getTrainingByCodePublic);
router.get('/public/:id', getTraining);
router.post('/register', registerForTraining);
router.post('/:id/register', registerForTraining);

// ==========================================
// AUTHENTICATED / ROLE-BASED ENDPOINTS
// ==========================================

// Training stats overview (Admin)
router.get(
  '/overview-stats',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  getOverviewStats
);

// Student legacy training data endpoint
router.get('/student-data', authenticateToken, getTrainingData);

// List trainings (Admin sees list of all programs; Student gets their active enrollment info)
router.get('/', authenticateToken, (req, res, next) => {
  if (req.user?.role === ROLES.STUDENT) {
    return getTrainingData(req, res, next);
  }
  return authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN)(req, res, () => {
    getTrainings(req, res, next);
  });
});

// Admin Program CRUD
router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  createNewTraining
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  getTraining
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  updateTrainingDetails
);

router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  changeTrainingStatus
);

// Specific Training Enrollments Drill-down (Admin)
router.get(
  '/:id/enrollments',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  getTrainingEnrollments
);

// Enrollment Actions: Payment & Approval updates (Admin)
router.patch(
  '/enrollments/:enrollmentId/payment',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  updatePaymentStatus
);

router.patch(
  '/enrollments/:enrollmentId/approval',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  updateApprovalStatus
);

router.patch(
  '/enrollments/:enrollmentId/transfer',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  transferStudentTraining
);

export default router;
