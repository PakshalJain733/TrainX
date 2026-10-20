import { getAllSecureCodes, createSecureCode, deleteSecureCode, findSecureCode } from '../models/secureCode.model.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import { sendAdminRegistrationCodeEmail } from '../services/email.service.js';

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

    // Check if an email should be dispatched to the college administrator
    const isTargetAdmin = !role || role === 'all' || role === 'college_admin' || role === 'admin' || role === 'admins' || String(role).includes('admin');
    if (isTargetAdmin && college_name) {
      try {
        let adminEmail = (req.body.admin_email || '').trim();
        let adminName = (req.body.admin_name || '').trim();
        let collegeFullName = college_name;

        // 1. Look up college in database
        const colRows = await query(
          `SELECT id, name, code, contact_email, admin_name FROM colleges 
           WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(code)) = LOWER(TRIM(?))
           ORDER BY id ASC LIMIT 1`,
          [college_name, college_name]
        );
        if (colRows && colRows.length > 0) {
          const col = colRows[0];
          collegeFullName = col.name;
          if (!adminEmail && col.contact_email) adminEmail = col.contact_email.trim();
          if (!adminName && col.admin_name) adminName = col.admin_name.trim();
        }

        // 2. Check pending secure code requests if email still not found
        if (!adminEmail) {
          try {
            const reqRows = await query(
              `SELECT name, email FROM secure_code_requests 
               WHERE LOWER(TRIM(college_name)) = LOWER(TRIM(?)) 
               ORDER BY id DESC LIMIT 1`,
              [college_name]
            );
            if (reqRows && reqRows.length > 0) {
              if (!adminEmail && reqRows[0].email) adminEmail = reqRows[0].email.trim();
              if (!adminName && reqRows[0].name) adminName = reqRows[0].name.trim();
            }
          } catch (_) {}
        }

        // 3. Check existing college_admin users if email still not found
        if (!adminEmail && colRows && colRows.length > 0) {
          try {
            const uRows = await query(
              `SELECT name, email FROM users WHERE college_id = ? AND (role = 'college_admin' OR role LIKE '%admin%') ORDER BY id ASC LIMIT 1`,
              [colRows[0].id]
            );
            if (uRows && uRows.length > 0) {
              adminEmail = uRows[0].email.trim();
              if (!adminName) adminName = uRows[0].name.trim();
            }
          } catch (_) {}
        }

        // If admin email is found, send the registration invitation email with secure code!
        if (adminEmail && adminEmail.includes('@')) {
          sendAdminRegistrationCodeEmail({
            to: adminEmail,
            name: adminName || 'College Administrator',
            secure_code: finalCode,
            college_name: collegeFullName,
          }).catch((emailErr) => {
            console.warn(`[Secure Code Email Dispatch Warning] ${emailErr.message}`);
          });
        }
      } catch (lookupErr) {
        console.warn(`[Secure Code College Lookup Error] ${lookupErr.message}`);
      }
    }

    return sendSuccess(res, 'Secure access code created successfully and dispatched to college administrator if email configured', newCode, 201);
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
