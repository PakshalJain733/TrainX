import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';
import { getCodes, generateCode, removeCode, verifyCode } from '../controllers/secureCode.controller.js';

const router = express.Router();

// Verification endpoint can be accessed during registration or validation
router.post('/verify', verifyCode);

// Administrative routes are strictly protected: Super Admin & College Admin only
const adminOnly = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN);

router.use(authenticateToken);

router.get('/', adminOnly, getCodes);
router.post('/generate', adminOnly, generateCode);
router.post('/', adminOnly, generateCode);
router.delete('/:id', adminOnly, removeCode);

export default router;
