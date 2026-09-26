import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getCodes, generateCode, removeCode, verifyCode } from '../controllers/secureCode.controller.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', getCodes);
router.post('/generate', generateCode);
router.post('/', generateCode);
router.delete('/:id', removeCode);
router.post('/verify', verifyCode);

export default router;
