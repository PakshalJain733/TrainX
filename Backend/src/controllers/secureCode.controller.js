import { getAllSecureCodes, createSecureCode, deleteSecureCode, findSecureCode } from '../models/secureCode.model.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getCodes = async (req, res, next) => {
  try {
    const codes = await getAllSecureCodes();
    return sendSuccess(res, 'Secure access codes retrieved', codes);
  } catch (err) {
    next(err);
  }
};

export const generateCode = async (req, res, next) => {
  try {
    const { code, role, college_name, description, max_uses, expiry_option, expires_at } = req.body;
    
    // Auto-generate code if none provided
    let finalCode = code;
    if (!finalCode) {
      const prefix = (role || 'ROLE').toUpperCase().substring(0, 4);
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      finalCode = `${prefix}-${year}-${randomDigits}`;
    }

    let calculatedExpiry = expires_at || null;
    if (!calculatedExpiry && expiry_option && expiry_option !== 'never' && expiry_option !== 'Never / Unlimited') {
      const now = new Date();
      if (expiry_option === '24 Hours' || expiry_option === '24h' || expiry_option === '1 Day') {
        now.setHours(now.getHours() + 24);
      } else if (expiry_option === '3 Days' || expiry_option === '3d') {
        now.setDate(now.getDate() + 3);
      } else if (expiry_option === '7 Days' || expiry_option === '7d') {
        now.setDate(now.getDate() + 7);
      } else if (expiry_option === '30 Days' || expiry_option === '30d') {
        now.setDate(now.getDate() + 30);
      } else if (expiry_option === '90 Days' || expiry_option === '90d') {
        now.setDate(now.getDate() + 90);
      }
      calculatedExpiry = now;
    }

    const newCode = await createSecureCode({
      code: finalCode,
      role: role || 'all',
      college_name,
      description,
      max_uses: parseInt(max_uses, 10) || 1,
      expires_at: calculatedExpiry
    });

    return sendSuccess(res, 'Secure access code created successfully', newCode, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, 'This secure code already exists. Please use a unique code.', 409);
    }
    next(err);
  }
};

export const removeCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await deleteSecureCode(id);
    if (!deleted) {
      return sendError(res, 'Secure code not found', 404);
    }
    return sendSuccess(res, 'Secure code deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const verifyCode = async (req, res, next) => {
  try {
    const { code, role } = req.body;
    if (!code) {
      return sendError(res, 'Secure code is required', 400);
    }
    const found = await findSecureCode(code, role);
    if (!found) {
      return sendError(res, 'Invalid or expired secure code for the selected role', 400);
    }
    return sendSuccess(res, 'Secure code is valid', found);
  } catch (err) {
    next(err);
  }
};
