import { sendRegistrationOtp, checkRegistrationEmailOtp, verifyRegistrationOtpAndRegister, sendUserOtp, verifyUserOtpAndLogin, loginWithPassword, verifyTotpAndLogin, verifyTotpPairing, changeUserPassword, resetUserPasswordWithOtp, setupUser2FA, verifyAndEnableUser2FA } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { findUserById, findUserByEmailOrMobile, getStudentByUserId, toSafeUser, updateUserModel, getDepartmentsByEmailDomain } from '../models/user.model.js';
import { pool, query } from '../config/db.js';

export const getDepartmentsByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    const depts = await getDepartmentsByEmailDomain(email);
    return sendSuccess(res, 'Departments retrieved successfully', depts);
  } catch (error) {
    next(error);
  }
};

export const sendRegisterOtp = async (req, res, next) => {
  try {
    const result = await sendRegistrationOtp(req.body);
    return sendSuccess(res, 'Verification code sent to your college email.', result);
  } catch (error) {
    next(error);
  }
};

export const verifyRegisterEmailOtp = async (req, res, next) => {
  try {
    const result = await checkRegistrationEmailOtp(req.body);
    return sendSuccess(res, 'College email verified successfully!', result);
  } catch (error) {
    next(error);
  }
};

export const verifyRegisterOtp = async (req, res, next) => {
  try {
    const result = await verifyRegistrationOtpAndRegister(req.body);
    return sendSuccess(res, 'User registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    if (!identifier) {
      return sendError(res, 'Email or Mobile number is required', 400);
    }
    const result = await sendUserOtp(identifier);
    return sendSuccess(res, 'OTP sent successfully', result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtpAndLogin = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    const { otp, rememberMe, remember_me } = req.body;
    if (!identifier || !otp) {
      return sendError(res, 'Email or Mobile number and OTP are required', 400);
    }
    const formattedOtp = Array.isArray(otp) ? otp.join('') : otp;
    const isRemember = rememberMe !== undefined ? rememberMe : remember_me;
    const result = await verifyUserOtpAndLogin(identifier, formattedOtp, isRemember);
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const verifyTotp = async (req, res, next) => {
  try {
    const body = req.body || {};
    const identifier = body.email || body.mobile || body.identifier || body.mobile_number;
    const { code, otp, totp, rememberMe, remember_me } = body;
    const inputCode = code || otp || totp;
    const authorization = req.headers.authorization || req.headers.Authorization || '';
    const headerToken = typeof authorization === 'string'
      ? authorization.replace(/^Bearer\s+/i, '').trim()
      : '';
    const preAuthToken = body.preAuthToken || body.temporaryToken || body.preauthToken || body.token || headerToken;

    if (!inputCode) {
      return sendError(res, 'Authenticator code is required', 400);
    }

    const formattedCode = Array.isArray(inputCode) ? inputCode.join('') : inputCode;
    const isRemember = rememberMe !== undefined ? rememberMe : remember_me;

    if (preAuthToken) {
      try {
        const result = await verifyTotpAndLogin(preAuthToken, formattedCode, isRemember);
        return sendSuccess(res, 'Authenticator verification successful', result);
      } catch (err) {
        if (!identifier) throw err;
        console.warn(`[TOTP] preAuthToken verification failed (${err.message}). Falling back to identifier verification.`);
      }
    }

    if (!identifier) {
      return sendError(res, 'Email, mobile, or token, and Authenticator code are required', 400);
    }

    const result = (typeof verifyTotpPairing === 'function')
      ? await verifyTotpPairing(identifier, formattedCode)
      : await verifyTotpAndLogin(identifier, formattedCode, isRemember);

    return sendSuccess(res, 'Authenticator verification successful', result);
  } catch (error) {
    next(error);
  }
};

export const passwordLogin = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    const { password, rememberMe, remember_me } = req.body;
    if (!identifier || !password) {
      return sendError(res, 'Email/Mobile and Password are required', 400);
    }
    const isRemember = rememberMe !== undefined ? rememberMe : remember_me;
    const result = await loginWithPassword(identifier, password, isRemember);
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await findUserById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    const studentProfile = await getStudentByUserId(userId) || {};
    const safeUser = toSafeUser(user);
    const isProfileUpdated = Boolean(
      user.is_profile_updated ||
      studentProfile.is_profile_updated ||
      (studentProfile.department && studentProfile.semester && studentProfile.roll_number && studentProfile.skills) ||
      (user.department && user.semester && user.roll_number && user.skills)
    );
    let resolvedDept = user.department || studentProfile.department || '';
    if (studentProfile.department_id || resolvedDept) {
      try {
        const dRows = await query(
          'SELECT code FROM departments WHERE id = ? OR LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?) LIMIT 1',
          [studentProfile.department_id || 0, resolvedDept, resolvedDept]
        );
        if (dRows && dRows.length > 0 && dRows[0].code) {
          resolvedDept = dRows[0].code.trim();
        }
      } catch (_) {}
    }

    return sendSuccess(res, 'Authenticated user data retrieved', {
      ...safeUser,
      ...studentProfile,
      remember_me: Boolean(user.remember_me),
      is_profile_updated: isProfileUpdated,
      studentProfile: {
        ...studentProfile,
        department: resolvedDept,
        is_profile_updated: isProfileUpdated,
      },
      department: resolvedDept,
      semester: user.semester || studentProfile.semester || '',
      cgpa: user.cgpa || studentProfile.cgpa || '',
      skills: user.skills || studentProfile.skills || '',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }
    const result = await changeUserPassword(userId, currentPassword, newPassword);
    return sendSuccess(res, 'Password changed successfully', result);
  } catch (error) {
    return sendError(res, error.message || 'Failed to change password', 400);
  }
};

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    if (!identifier || !otp || !newPassword) {
      return sendError(res, 'Email/mobile, OTP, and new password are required', 400);
    }
    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }
    const result = await resetUserPasswordWithOtp(identifier, otp, newPassword);
    return sendSuccess(res, 'Password reset successfully', result);
  } catch (error) {
    return sendError(res, error.message || 'Failed to reset password', 400);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const updated = await updateUserModel(userId, req.body);
    return sendSuccess(res, 'Profile updated successfully in database', updated);
  } catch (error) {
    next(error);
  }
};

export const setup2FA = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const result = await setupUser2FA(userId);
    return sendSuccess(res, '2FA setup QR Code generated successfully', result);
  } catch (error) {
    return sendError(res, error.message || 'Failed to generate 2FA setup QR Code', 400);
  }
};

export const verify2FA = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { secret, code } = req.body;
    const result = await verifyAndEnableUser2FA(userId, secret, code);
    return sendSuccess(res, 'Google Authenticator 2FA paired successfully', result);
  } catch (error) {
    return sendError(res, error.message || 'Failed to verify 2FA code', 400);
  }
};

export const registerInstitution = async (req, res) => {
  try {
    const { collegeName, contactPerson, designation, email, phone, studentCount } = req.body;
    if (!collegeName || !email) {
      return sendError(res, 'College Name and Email are required', 400);
    }
    const code = collegeName.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    await pool.query('INSERT INTO colleges (name, code, contact_email, contact_phone, status) VALUES (?, ?, ?, ?, ?)', [collegeName, code, email, phone || null, 'Pending']);
    return sendSuccess(res, 'Institution request submitted successfully');
  } catch (error) {
    console.error('Register Institution error:', error);
    return sendError(res, 'Failed to submit request', 500);
  }
};

export const checkRegistrationStatus = async (req, res, next) => {
  try {
    const email = req.query.email || req.body.email;
    if (!email) {
      return sendError(res, 'Email is required to check registration status', 400);
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmailOrMobile(cleanEmail);
    if (!user) {
      return sendError(res, 'No registered account found for this email', 404);
    }
    const isApproved = user.is_active === 1 || user.is_active === true || user.is_active === '\x01';
    return sendSuccess(res, 'Registration status retrieved successfully', {
      email: user.email,
      isApproved,
      status: isApproved ? 'approved' : 'pending',
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    next(error);
  }
};

export const requestSecureCode = async (req, res, next) => {
  try {
    const { name, email, role, collegeName, college_name } = req.body;
    const finalCollege = (collegeName || college_name || req.body.college || '').trim();
    if (!name || !email) {
      return sendError(res, 'Full Name and Email are required to request a secure code', 400);
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const targetRole = role || 'Admin';

    // 1. Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS secure_code_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Admin',
        college_name VARCHAR(255) NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        generated_code VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 2. Insert request record
    await pool.query(
      `INSERT INTO secure_code_requests (name, email, role, college_name, status) VALUES (?, ?, ?, ?, 'Pending')`,
      [cleanName, cleanEmail, targetRole, finalCollege || null]
    );

    // 3. Create a support ticket for Super Admin review
    try {
      const [superAdminRows] = await pool.query(
        `SELECT id FROM users WHERE role = 'super_admin' ORDER BY id ASC LIMIT 1`
      );
      const superAdminId = superAdminRows && superAdminRows.length > 0 ? superAdminRows[0].id : 1;

      await pool.query(
        `INSERT INTO support_tickets (user_id, subject, category, priority, status, description)
         VALUES (?, ?, 'Access Request', 'Urgent', 'Open', ?)`,
        [
          superAdminId,
          `Secure Code Request: ${cleanName} (${cleanEmail})`,
          `College Administrator registration request: ${cleanName} (${cleanEmail}) has requested a Secure Authorization Code for self-registration. Please generate an Admin secure code and provide it to them.`
        ]
      );
    } catch (ticketErr) {
      console.warn('[RequestSecureCode] Ticket creation warning:', ticketErr.message);
    }

    return sendSuccess(
      res,
      'Secure code request submitted successfully to Super Admin! Super Admin will generate your secure code and share it with you.'
    );
  } catch (error) {
    next(error);
  }
};

export const getSecureCodeRequests = async (req, res, next) => {
  try {
    try {
      // Auto-mark any requests as Approved if the user already exists and is active / college admin
      await pool.query(`
        UPDATE secure_code_requests scr
        JOIN users u ON LOWER(scr.email) = LOWER(u.email)
        SET scr.status = 'Approved'
        WHERE scr.status = 'Pending' AND (u.is_active = 1 OR u.role = 'college_admin' OR u.two_factor_enabled = 1)
      `);

      const [rows] = await pool.query(
        `SELECT * FROM secure_code_requests WHERE status = 'Pending' ORDER BY id DESC LIMIT 50`
      );
      return sendSuccess(res, 'Secure code requests retrieved', rows);
    } catch (_) {
      return sendSuccess(res, 'Secure code requests retrieved', []);
    }
  } catch (error) {
    next(error);
  }
};

export const resolveSecureCodeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await pool.query(`UPDATE secure_code_requests SET status = 'Approved' WHERE status = 'Pending'`);
      return sendSuccess(res, 'All pending requests marked as approved and cleared');
    }
    await pool.query(`UPDATE secure_code_requests SET status = 'Approved' WHERE id = ?`, [id]);
    return sendSuccess(res, 'Secure code request resolved');
  } catch (error) {
    next(error);
  }
};

export const deleteSecureCodeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await pool.query(`DELETE FROM secure_code_requests`);
      return sendSuccess(res, 'All secure code requests cleared');
    }
    await pool.query(`DELETE FROM secure_code_requests WHERE id = ?`, [id]);
    return sendSuccess(res, 'Secure code request removed');
  } catch (error) {
    next(error);
  }
};

export const deleteSecureCodeRequestByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    await pool.query(`DELETE FROM secure_code_requests WHERE LOWER(email) = LOWER(?)`, [email]);
    return sendSuccess(res, 'Secure code request removed');
  } catch (error) {
    next(error);
  }
};


