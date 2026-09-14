import express from 'express';
import { getCodes, generateCode, removeCode, verifyCode } from '../controllers/secureCode.controller.js';

const router = express.Router();

router.get('/', getCodes);
router.post('/generate', generateCode);
router.post('/', generateCode);
router.delete('/:id', removeCode);
router.post('/verify', verifyCode);

export default router;
