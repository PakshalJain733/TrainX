import { Router } from 'express';
import {
  getFeatureSwitches,
  toggleFeatureSwitch,
  toggleEmergencyMode,
  restoreAllFeatureSwitches,
  updateFeatureNotice,
} from '../controllers/featureSwitch.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
const superAdminOnly = [authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN)];

// GET all feature switches directly from database (safe for clients to read)
router.get('/', getFeatureSwitches);

// PUT/POST toggle single feature switch (Super Admin Only)
router.put('/toggle', superAdminOnly, toggleFeatureSwitch);
router.post('/toggle', superAdminOnly, toggleFeatureSwitch);

// PUT/POST toggle global emergency mode (Super Admin Only)
router.put('/emergency', superAdminOnly, toggleEmergencyMode);
router.post('/emergency', superAdminOnly, toggleEmergencyMode);

// PUT/POST restore all features ON (Super Admin Only)
router.put('/restore-all', superAdminOnly, restoreAllFeatureSwitches);
router.post('/restore-all', superAdminOnly, restoreAllFeatureSwitches);

// PUT/POST update custom notice message (Super Admin Only)
router.put('/notice', superAdminOnly, updateFeatureNotice);
router.post('/notice', superAdminOnly, updateFeatureNotice);

export default router;
