import {
  sendRegistrationOtp,
  checkRegistrationEmailOtp,
  verifyRegistrationOtpAndRegister,
  sendUserOtp,
  verifyUserOtpAndLogin,
  loginWithPassword,
  changeUserPassword,
  resetUserPasswordWithOtp,
  verifyInstitutionToken,
  completeInstitutionSetup,
  activateWithSecureCode,
  forceChangePassword,
} from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { findUserById, findUserByEmailOrMobile, getStudentByUserId, toSafeUser, updateUserModel, getDepartmentsByEmailDomain, findCollegeByEmailDomain } from '../models/user.model.js';
import { pool, query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';
import {
  isApprovalFeatureActive,
  isRegistrationFeatureActive,
  isPasswordLoginFeatureActive,
  isOtpLoginFeatureActive,
  isPasswordResetFeatureActive,
} from '../middleware/featureSwitch.middleware.js';

export const getDepartmentsByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    const depts = await getDepartmentsByEmailDomain(email);
    return sendSuccess(res, 'Departments retrieved successfully', depts);
  } catch (error) {
    next(error);
  }
};

export const getCollegeByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email || !String(email).includes('@')) {
      return sendSuccess(res, 'Email required for college lookup', { college: null });
    }
    const college = await findCollegeByEmailDomain(String(email).trim());
    return sendSuccess(res, 'College lookup completed', {
      college: college ? { id: college.id, name: college.name, code: college.code, domain: college.domain } : null,
    });
  } catch (error) {
    next(error);
  }
};

const checkRegistrationFeatureActive = async () => {
  try {
    const active = await isRegistrationFeatureActive();
    if (!active) {
      return {
        allowed: false,
        message: 'Self-registration and new account sign-up is currently disabled by system administration.',
      };
    }
  } catch (err) {
    // If error occurs, fail-open to allowed
  }
  return { allowed: true };
};

export const sendRegisterOtp = async (req, res, next) => {
  try {
    const status = await checkRegistrationFeatureActive();
    if (!status.allowed) {
      return sendError(res, status.message, 403);
    }
    const result = await sendRegistrationOtp(req.body);
    return sendSuccess(res, 'Verification code sent to your college email.', result);
  } catch (error) {
    next(error);
  }
};

export const verifyRegisterEmailOtp = async (req, res, next) => {
  try {
    const status = await checkRegistrationFeatureActive();
    if (!status.allowed) {
      return sendError(res, status.message, 403);
    }
    const result = await checkRegistrationEmailOtp(req.body);
    return sendSuccess(res, 'College email verified successfully!', result);
  } catch (error) {
    next(error);
  }
};

export const verifyRegisterOtp = async (req, res, next) => {
  try {
    const status = await checkRegistrationFeatureActive();
    if (!status.allowed) {
      return sendError(res, status.message, 403);
    }
    const result = await verifyRegistrationOtpAndRegister(req.body);
    return sendSuccess(res, 'User registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req, res, next) => {
  try {
    const otpActive = await isOtpLoginFeatureActive();
    if (!otpActive) {
      return sendError(res, 'OTP authentication gateway is temporarily offline for maintenance.', 403);
    }

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
    const otpActive = await isOtpLoginFeatureActive();
    if (!otpActive) {
      return sendError(res, 'OTP authentication gateway is temporarily offline for maintenance.', 403);
    }

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

export const passwordLogin = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.mobile || req.body.identifier || req.body.mobile_number;
    const { password, rememberMe, remember_me } = req.body;
    if (!identifier || !password) {
      return sendError(res, 'Email/Mobile and Password are required', 400);
    }

    const pwActive = await isPasswordLoginFeatureActive();
    if (!pwActive) {
      const user = await findUserByEmailOrMobile(identifier);
      const isSuperAdmin = user && (user.role === ROLES.SUPER_ADMIN || String(user.role).toLowerCase().includes('super'));
      if (!isSuperAdmin) {
        return sendError(res, 'Password authentication is undergoing routine maintenance.', 403);
      }
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
    let resolvedDeptName = resolvedDept;
    let resolvedDeptCode = resolvedDept;
    let resolvedDeptId = user.department_id || studentProfile.department_id || null;
    if (resolvedDeptId || resolvedDept) {
      try {
        const dRows = await query(
          'SELECT id, name, code FROM departments WHERE (college_id = ? OR college_id IS NULL) AND (id = ? OR LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?)) ORDER BY (college_id = ?) DESC LIMIT 1',
          [user.college_id || 0, resolvedDeptId || 0, resolvedDept, resolvedDept, user.college_id || 0]
        );
        if (dRows && dRows.length > 0) {
          resolvedDeptId = dRows[0].id;
          resolvedDeptName = dRows[0].name || resolvedDept;
          resolvedDeptCode = (dRows[0].code || resolvedDept).trim();
        }
      } catch (_) {}
    }

    return sendSuccess(res, 'Authenticated user data retrieved', {
      ...safeUser,
      ...studentProfile,
      phone: user.mobile_number || '',
      current_year: user.current_year || null,
      currentYear: user.current_year || null,
      area_of_expertise: user.area_of_expertise || user.specialization || null,
      areaOfExpertise: user.area_of_expertise || user.specialization || null,
      specialization: user.area_of_expertise || user.specialization || user.target_track || null,
      experience: user.experience || null,
      avatar_url: user.avatar_url || null,
      avatarUrl: user.avatar_url || null,
      remember_me: Boolean(user.remember_me),
      is_profile_updated: isProfileUpdated,
      studentProfile: {
        ...studentProfile,
        department: resolvedDeptCode || resolvedDeptName,
        is_profile_updated: isProfileUpdated,
      },
      department: resolvedDeptName || resolvedDeptCode || '',
      department_id: resolvedDeptId,
      departmentName: resolvedDeptName,
      departmentCode: resolvedDeptCode,
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
    const pwResetActive = await isPasswordResetFeatureActive();
    if (!pwResetActive) {
      return sendError(res, 'Password recovery and change service is currently updating.', 403);
    }

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
    const pwResetActive = await isPasswordResetFeatureActive();
    if (!pwResetActive) {
      return sendError(res, 'Password recovery and change service is currently updating.', 403);
    }

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
    // Security Allowlist: strip protected privilege fields
    const allowed = [
      'name', 'mobile_number', 'phone', 'gender', 'city', 'emergency_contact',
      'skills', 'target_track', 'track', 'avatar_url', 'bio', 'year', 'division', 'semester',
      'department', 'department_id', 'experience', 'specialization', 'area_of_expertise'
    ];
    const safeData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) safeData[key] = req.body[key];
    }
    const updated = await updateUserModel(userId, safeData);
    return sendSuccess(res, 'Profile updated successfully in database', updated);
  } catch (error) {
    next(error);
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
    const approvalRequired = await isApprovalFeatureActive();
    const isApproved = !approvalRequired ||
      ((user.is_active === 1 || user.is_active === true || user.is_active === '\x01') &&
       (user.is_approved === 1 || user.is_approved === true || user.is_approved === '\x01'));
    return sendSuccess(res, 'Registration status retrieved successfully', {
      email: user.email,
      isApproved: Boolean(isApproved),
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

    // 2. Insert request record into secure_code_requests for Super Admin notifications
    await pool.query(
      `INSERT INTO secure_code_requests (name, email, role, college_name, status) VALUES (?, ?, ?, ?, 'Pending')`,
      [cleanName, cleanEmail, targetRole, finalCollege || null]
    );

    return sendSuccess(
      res,
      'Secure code request submitted successfully to Super Admin! Super Admin will review your request and issue your code.'
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
        WHERE scr.status = 'Pending' AND (u.is_active = 1 OR u.role = 'college_admin')
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

export const verifyInstitutionTokenHandler = async (req, res, next) => {
  try {
    const { token } = req.query;
    const result = await verifyInstitutionToken(token);
    return sendSuccess(res, 'Institution invitation token verified successfully', result);
  } catch (error) {
    next(error);
  }
};

export const completeInstitutionSetupHandler = async (req, res, next) => {
  try {
    const result = await completeInstitutionSetup(req.body);
    return sendSuccess(res, result.message, {
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public endpoint: Set password and activate account using secure activation code
 * POST /api/v1/auth/activate-with-code
 */
export const activateWithCodeHandler = async (req, res, next) => {
  try {
    const { email, code, password, confirmPassword, role } = req.body;
    const result = await activateWithSecureCode({ email, code, password, confirmPassword, role });
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticated endpoint: Force password change on first login
 * POST /api/v1/auth/force-change-password
 */
export const forceChangePasswordHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const result = await forceChangePassword({ userId, currentPassword, newPassword, confirmPassword });
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};


