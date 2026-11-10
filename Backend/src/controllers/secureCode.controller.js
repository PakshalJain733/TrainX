import {
  getAllSecureCodes,
  createSecureCode,
  deleteSecureCode,
  findSecureCode,
  updateSecureCodeDeliveryStatus,
} from '../models/secureCode.model.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import {
  sendAdminRegistrationCodeEmail,
  sendAdminInvitationCodeEmail,
  sendStaffInvitationCodeEmail,
} from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';

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
    
    // Normalize role string
    let normalizedRole = role || 'all';
    const rLower = String(role || '').toLowerCase();
    if (rLower === 'admins' || rLower === 'admin' || rLower === 'college_admin') {
      normalizedRole = 'college_admin';
    } else if (rLower.includes('coord')) {
      normalizedRole = 'coordinator';
    } else if (rLower.includes('mentor')) {
      normalizedRole = 'mentor';
    } else if (rLower.includes('trainer')) {
      normalizedRole = 'trainer';
    }

    // Auto-generate code if none provided
    let finalCode = code;
    if (!finalCode) {
      const prefix = (normalizedRole || 'ROLE').toUpperCase().substring(0, 4);
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

    // Resolve target email and recipient name
    let targetEmail = (req.body.email || req.body.admin_email || '').trim().toLowerCase();
    let targetName = (req.body.name || req.body.admin_name || '').trim();
    let collegeFullName = college_name || '';

    // If target is college_admin or role requires college lookup, look up the college
    if (college_name) {
      try {
        const colRows = await query(
          `SELECT id, name, code, contact_email, admin_name FROM colleges 
           WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(code)) = LOWER(TRIM(?)) OR id = ?
           ORDER BY id ASC LIMIT 1`,
          [college_name, college_name, parseInt(college_name, 10) || 0]
        );
        if (colRows && colRows.length > 0) {
          const col = colRows[0];
          collegeFullName = col.name;
          // Automatically pick up email added when adding the college
          if (!targetEmail && col.contact_email) {
            targetEmail = col.contact_email.trim().toLowerCase();
          }
          if (!targetName && col.admin_name) {
            targetName = col.admin_name.trim();
          }
        }
      } catch (colErr) {
        console.warn(`[Secure Code College Lookup Error] ${colErr.message}`);
      }
    }

    // Fallback: Check pending secure code requests if email still not found
    if (!targetEmail && college_name) {
      try {
        const reqRows = await query(
          `SELECT name, email FROM secure_code_requests 
           WHERE LOWER(TRIM(college_name)) = LOWER(TRIM(?)) 
           ORDER BY id DESC LIMIT 1`,
          [college_name]
        );
        if (reqRows && reqRows.length > 0) {
          if (!targetEmail && reqRows[0].email) targetEmail = reqRows[0].email.trim().toLowerCase();
          if (!targetName && reqRows[0].name) targetName = reqRows[0].name.trim();
        }
      } catch (_) {}
    }

    const newCode = await createSecureCode({
      code: finalCode,
      role: normalizedRole,
      college_name: collegeFullName || college_name,
      description,
      max_uses: parseInt(max_uses, 10) || 1,
      expires_at: calculatedExpiry,
      email: targetEmail || null,
      email_delivery_status: targetEmail ? 'pending' : 'pending',
      created_by: req.user?.id || null,
    });

    let emailDeliveryStatus = 'pending';

    // Dispatch the activation email if target email is available
    if (targetEmail && targetEmail.includes('@')) {
      const creatorId = req.user?.id || null;
      const creatorRole = req.user?.role || 'Admin';

      try {
        if (normalizedRole === 'college_admin' || normalizedRole === 'admin' || normalizedRole === 'all') {
          // Part 1: Super Admin -> Admin Activation Email
          await sendAdminInvitationCodeEmail({
            to: targetEmail,
            name: targetName || 'Administrator',
            code: finalCode,
            college_name: collegeFullName,
          });
        } else {
          // Part 3: Admin -> Mentor / Coordinator / Trainer Activation Email
          await sendStaffInvitationCodeEmail({
            to: targetEmail,
            name: targetName || 'Staff Member',
            role: normalizedRole,
            code: finalCode,
            college_name: collegeFullName,
          });
        }

        emailDeliveryStatus = 'sent';
        await updateSecureCodeDeliveryStatus(newCode.id, 'sent');
        console.log(`[Secure Code Email] Invitation successfully dispatched to ${targetEmail}`);
      } catch (emailErr) {
        emailDeliveryStatus = 'failed';
        await updateSecureCodeDeliveryStatus(newCode.id, 'failed');
        console.error(`[Secure Code Email Error] Failed to send activation code to ${targetEmail}:`, emailErr.message);

        // Part 6: If email delivery fails, dispatch in-app notification to creator
        if (creatorId) {
          try {
            await createNotification({
              user_id: creatorId,
              title: `Email Delivery Failed: ${normalizedRole.toUpperCase()} Invitation`,
              message: `Failed to deliver activation invitation to ${targetEmail} for ${collegeFullName || 'institution'}. Reason: ${emailErr.message}. Please verify the address and resend.`,
              type: 'alert',
              priority: 'Urgent',
              category: 'Email Delivery Alert',
            });
          } catch (notifErr) {
            console.warn('[Delivery Alert Notification Error]', notifErr.message);
          }
        }
      }
    }

    return sendSuccess(
      res,
      emailDeliveryStatus === 'sent'
        ? `Secure code created and activation email successfully delivered to ${targetEmail}`
        : `Secure code created successfully`,
      {
        ...newCode,
        email: targetEmail,
        email_delivery_status: emailDeliveryStatus,
      },
      201
    );
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
