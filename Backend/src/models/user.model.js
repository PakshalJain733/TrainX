import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const hashPasswordValue = async (value) => {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (BCRYPT_HASH_PATTERN.test(value)) return value;
  return bcrypt.hash(value, 12);
};

export const findUserByEmailOrMobile = async (identifier) => {
  if (identifier === undefined || identifier === null) return null;
  const cleanIdentifier = String(identifier).trim();
  if (!cleanIdentifier) return null;

  const emailIdentifier = cleanIdentifier.toLowerCase();
  const looksLikeEmail = cleanIdentifier.includes('@');
  const mobileIdentifiers = looksLikeEmail
    ? []
    : [...new Set([
      cleanIdentifier,
      cleanIdentifier.replace(/[^0-9]/g, ''),
    ].filter(Boolean))];

  const conditions = ['(email IS NOT NULL AND LOWER(email) = ?)'];
  const params = [emailIdentifier];

  if (mobileIdentifiers.length > 0) {
    conditions.push(`mobile_number IN (${mobileIdentifiers.map(() => '?').join(', ')})`);
    params.push(...mobileIdentifiers);
  }

  try {
    const results = await query(
      `SELECT * FROM users
       WHERE ${conditions.join(' OR ')}
       LIMIT 1`,
      params
    );
    if (results && results.length > 0) {
      return results[0];
    }
  } catch (error) {
    console.error(`[User Model Error] findUserByEmailOrMobile failed: ${error.message}`);
    throw error;
  }

  return null;
};

export const findUserById = async (id) => {
  const numId = parseInt(id, 10);
  try {
    const results = await query('SELECT * FROM users WHERE id = ?', [numId]);
    if (results && results.length > 0) {
      return results[0];
    }
  } catch (error) {
    console.error(`[User Model Error] findUserById failed: ${error.message}`);
    throw error;
  }
  return null;
};

// `findUserById` runs `SELECT *`, so every response that forwards a user row
// must go through this whitelist instead of spreading the raw record.
const SAFE_USER_FIELDS = [
  'id',
  'name',
  'email',
  'mobile_number',
  'role',
  'college_id',
  'gender',
  'city',
  'emergency_contact',
  'linkedin_url',
  'target_track',
  'two_factor_enabled',
  'two_factor_reset',
  'is_active',
  'is_profile_updated',
  'created_at',
  'updated_at',
];

export const toSafeUser = (user) => {
  if (!user) return {};
  const safe = {};
  for (const field of SAFE_USER_FIELDS) {
    if (user[field] !== undefined) safe[field] = user[field];
  }
  return safe;
};

export const findUserByEmail = findUserByEmailOrMobile;

const getValidCollegeId = async (collegeId) => {
  try {
    if (collegeId) {
      const numId = parseInt(collegeId, 10);
      if (!isNaN(numId)) {
        const rows = await query('SELECT id FROM colleges WHERE id = ?', [numId]);
        if (rows && rows.length > 0) return rows[0].id;
      }

      const strVal = String(collegeId).trim();
      if (strVal) {
        const rows = await query(
          'SELECT id FROM colleges WHERE LOWER(code) = LOWER(?) OR LOWER(name) = LOWER(?) OR LOWER(name) LIKE ? ORDER BY id ASC LIMIT 1',
          [strVal, strVal, `%${strVal}%`]
        );
        if (rows && rows.length > 0) return rows[0].id;
      }
    }

    const firstRow = await query('SELECT id FROM colleges ORDER BY id ASC LIMIT 1');
    if (firstRow && firstRow.length > 0) return firstRow[0].id;
  } catch (e) {
    // ignore
  }
  return 1;
};

export const findCollegeByAdminEmail = async (email) => {
  if (!email) return null;
  const cleanEmail = String(email).trim().toLowerCase();
  try {
    const rows = await query(
      'SELECT id, name, code, admin_name, contact_email FROM colleges WHERE LOWER(contact_email) = ? LIMIT 1',
      [cleanEmail]
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }
  } catch (err) {
    console.warn(`[User Model] findCollegeByAdminEmail error: ${err.message}`);
  }
  return null;
};

export const findCollegeByEmailDomain = async (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return null;
  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split('@');
  if (parts.length < 2) return null;
  const domain = parts[1].trim();
  if (!domain) return null;

  try {
    const rows = await query(
      `SELECT id, name, code, contact_email, admin_name, domain FROM colleges 
       WHERE (LOWER(status) = 'active' OR status IS NULL) AND (
         LOWER(domain) = ? OR 
         LOWER(contact_email) LIKE ? OR 
         LOWER(code) = ?
       )
       ORDER BY id ASC LIMIT 1`,
      [domain, `%@${domain}`, domain.split('.')[0]]
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }

    const allColleges = await query(`SELECT id, name, code, contact_email, admin_name, domain FROM colleges ORDER BY id ASC LIMIT 2`);
    if (allColleges && allColleges.length === 1) {
      return allColleges[0];
    }
  } catch (err) {
    console.warn(`[User Model Warning] findCollegeByEmailDomain error: ${err.message}`);
  }

  return null;
};

export const getDepartmentsByEmailDomain = async (email) => {
  try {
    let college = null;
    if (email && typeof email === 'string' && email.includes('@')) {
      college = await findCollegeByEmailDomain(email);
    }

    let depts = [];
    if (college && college.id) {
      depts = await query(
        `SELECT id, name, code FROM departments WHERE college_id = ? AND (status IS NULL OR LOWER(status) = 'active') ORDER BY name ASC`,
        [college.id]
      );
    }

    if (!depts || depts.length === 0) {
      depts = await query(
        `SELECT DISTINCT name, code FROM departments WHERE (status IS NULL OR LOWER(status) = 'active') ORDER BY name ASC`
      );
    }

    if (depts && depts.length > 0) {
      return depts.map((d) => ({
        value: d.name,
        label: d.code && d.code.toLowerCase() !== d.name.toLowerCase() ? `${d.name} (${d.code})` : d.name,
        code: d.code || d.name,
      }));
    }

    return [
      { value: "COMPS", label: "COMPS", code: "COMPS" },
      { value: "IT", label: "IT", code: "IT" },
      { value: "AIML", label: "AIML", code: "AIML" },
      { value: "ECS", label: "ECS", code: "ECS" },
      { value: "MTRX", label: "MTRX", code: "MTRX" },
      { value: "EXTC", label: "EXTC", code: "EXTC" },
    ];
  } catch (err) {
    console.warn(`[User Model Warning] getDepartmentsByEmailDomain error: ${err.message}`);
    return [
      { value: "COMPS", label: "COMPS", code: "COMPS" },
      { value: "IT", label: "IT", code: "IT" },
      { value: "AIML", label: "AIML", code: "AIML" },
      { value: "ECS", label: "ECS", code: "ECS" },
      { value: "MTRX", label: "MTRX", code: "MTRX" },
      { value: "EXTC", label: "EXTC", code: "EXTC" },
    ];
  }
};


export const createUser = async ({
  name,
  email = null,
  mobile_number = null,
  role = ROLES.STUDENT,
  college_id = 1,
  password = '',
  password_hash = '',
  two_factor_secret = null,
  is_active = true,
}) => {
  const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim() : null;
  const normalizedMobile = typeof mobile_number === 'string' && mobile_number.trim() ? mobile_number.trim() : null;
  const normalizedSecret = typeof two_factor_secret === 'string' && two_factor_secret.trim() ? two_factor_secret.trim() : null;
  const passwordValue = password || password_hash || '';
  const hashedPassword = passwordValue ? await hashPasswordValue(passwordValue) : '';
  const validCollegeId = await getValidCollegeId(college_id);
  const activeValue = is_active === false || is_active === 0 || String(is_active).toLowerCase() === 'false' ? 0 : 1;
  const res = await query(
    'INSERT INTO users (name, email, mobile_number, role, college_id, password, password_hash, two_factor_secret, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, normalizedEmail, normalizedMobile, role, validCollegeId, hashedPassword, hashedPassword, normalizedSecret, activeValue]
  );
  if (res && res.insertId) {
    return {
      id: res.insertId,
      name,
      email: normalizedEmail,
      mobile_number: normalizedMobile,
      role,
      college_id: validCollegeId,
      is_active: activeValue,
      two_factor_secret: normalizedSecret,
    };
  }
  throw new Error('Failed to create user in MySQL database');
};

export const updateUser = async (userId, updateData) => {
  const numId = parseInt(userId, 10);
  const fields = [];
  const values = [];
  if (updateData.name !== undefined) { fields.push('name = ?'); values.push(updateData.name); }
  if (updateData.email !== undefined) { fields.push('email = ?'); values.push(updateData.email || null); }
  if (updateData.mobile_number !== undefined) { fields.push('mobile_number = ?'); values.push(updateData.mobile_number || null); }
  if (updateData.phone !== undefined) { fields.push('mobile_number = ?'); values.push(updateData.phone || null); }
  if (updateData.password !== undefined || updateData.password_hash !== undefined) {
    const passwordValue = updateData.password !== undefined ? updateData.password : updateData.password_hash;
    const hashedPassword = await hashPasswordValue(passwordValue);
    fields.push('password = ?');
    values.push(hashedPassword);
    fields.push('password_hash = ?');
    values.push(hashedPassword);
  }

  if (fields.length > 0) {
    values.push(numId);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }
};

export const updateUserTwoFactorSecret = async (userId, secret) => {
  const numId = parseInt(userId, 10);
  await query('UPDATE users SET two_factor_secret = ?, two_factor_enabled = 1 WHERE id = ?', [secret, numId]);
};

export const resetUserTwoFactorSecret = async (userId, secret) => {
  const numId = parseInt(userId, 10);
  try {
    await query('UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0, two_factor_reset = 0 WHERE id = ?', [secret, numId]);
  } catch (_) {
    await query('UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0 WHERE id = ?', [secret, numId]);
  }
};

export const triggerUserTwoFactorReset = async (userId, secret) => {
  const numId = parseInt(userId, 10);
  try {
    await query('UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0, two_factor_reset = 1 WHERE id = ?', [secret, numId]);
  } catch (err) {
    if (err.message && err.message.includes("Unknown column 'two_factor_reset'")) {
      try {
        await query('ALTER TABLE users ADD COLUMN two_factor_reset BOOLEAN DEFAULT FALSE');
        await query('UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0, two_factor_reset = 1 WHERE id = ?', [secret, numId]);
      } catch (alterErr) {
        console.warn(`[User Model] Failed to add two_factor_reset column: ${alterErr.message}`);
        await query('UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0 WHERE id = ?', [secret, numId]);
      }
    }
  }
};

export const enableTwoFactorForUser = async (userId) => {
  const numId = parseInt(userId, 10);
  try {
    await query('UPDATE users SET two_factor_enabled = 1, two_factor_reset = 0 WHERE id = ?', [numId]);
  } catch (_) {
    await query('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [numId]);
  }
};

export const updateUserRememberMe = async (userId, rememberMe) => {
  const numId = parseInt(userId, 10);
  if (isNaN(numId)) return;
  const isRemember = rememberMe ? 1 : 0;
  try {
    await query('UPDATE users SET remember_me = ? WHERE id = ?', [isRemember, numId]);
  } catch (err) {
    if (err.message && err.message.includes("Unknown column 'remember_me'")) {
      try {
        await query('ALTER TABLE users ADD COLUMN remember_me TINYINT(1) DEFAULT 0');
        await query('UPDATE users SET remember_me = ? WHERE id = ?', [isRemember, numId]);
      } catch (alterErr) {
        console.warn(`[User Model] Failed to add remember_me column to users table: ${alterErr.message}`);
      }
    }
  }
};

export const saveStudentDetails = async ({
  user_id,
  college_id = 1,
  department_id = null,
  batch_id = null,
  roll_number = '',
  department = '',
  year = '',
  division = '',
  semester = '',
  cgpa = '8.5',
  skills = '',
}) => {
  const validCollegeId = await getValidCollegeId(college_id);
  const res = await query(
    `INSERT INTO students 
      (user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, validCollegeId, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills]
  );
  if (res && res.insertId) {
    return { id: res.insertId, user_id, college_id: validCollegeId, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills };
  }
  return { user_id, college_id: validCollegeId, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills };
};

export const getStudentByUserId = async (userId) => {
  const numId = parseInt(userId, 10);
  const results = await query('SELECT * FROM students WHERE user_id = ?', [numId]);
  if (results && results.length > 0) {
    return results[0];
  }
  return null;
};

export const saveOtpRecord = async (identifier, otp, purpose = 'login') => {
  const cleanId = String(identifier).trim().toLowerCase();
  const cleanPurpose = String(purpose || 'login').trim().toLowerCase();
  try {
    await query('INSERT INTO otps (email, otp, purpose, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))', [cleanId, otp, cleanPurpose]);
  } catch (err) {
    if (err.message && err.message.includes("otps' doesn't exist")) {
      await query(`
        CREATE TABLE IF NOT EXISTS otps (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp VARCHAR(20) NOT NULL,
          expires_at DATETIME NOT NULL,
          purpose VARCHAR(50) NOT NULL DEFAULT 'login',
          attempts INT NOT NULL DEFAULT 0,
          consumed_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await query('INSERT INTO otps (email, otp, purpose, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))', [cleanId, otp, cleanPurpose]);
    } else {
      throw err;
    }
  }
};

export const verifyOtpRecord = async (identifier, inputOtp) => {
  if (identifier === undefined || identifier === null || inputOtp === undefined || inputOtp === null) return false;
  
  const cleanId = String(identifier).trim();
  const cleanOtp = String(inputOtp).trim();
  if (!cleanId || !cleanOtp) return false;

  const identifierCandidates = [...new Set([
    cleanId,
    cleanId.toLowerCase(),
    cleanId.replace(/[^0-9]/g, ''),
  ].filter(Boolean))];
  const placeholders = identifierCandidates.map(() => '?').join(', ');
  try {
    const results = await query(
      `SELECT id FROM otps
       WHERE email IN (${placeholders}) AND otp = ? AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [...identifierCandidates, cleanOtp]
    );
    if (results && results.length > 0) {
      const matchedId = results[0].id;
      await query('DELETE FROM otps WHERE id = ?', [matchedId]).catch(() => {});
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
};

const REGISTRATION_OTP_PURPOSE = 'registration';
const REGISTRATION_OTP_COOLDOWN_SECONDS = 60;
const REGISTRATION_OTP_MAX_ATTEMPTS = 5;

const normalizeOtpEmail = (identifier) => String(identifier).trim().toLowerCase();

/**
 * Seconds the caller must wait before another registration OTP may be sent.
 * Returns 0 when a resend is allowed right now.
 */
export const getRegistrationOtpCooldown = async (identifier) => {
  const cleanEmail = normalizeOtpEmail(identifier);
  if (!cleanEmail) return REGISTRATION_OTP_COOLDOWN_SECONDS;

  try {
    const rows = await query(
      `SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) AS seconds_since
       FROM otps
       WHERE email = ? AND purpose = ?
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, REGISTRATION_OTP_PURPOSE]
    );
    if (!rows || rows.length === 0) return 0;
    const elapsed = Number(rows[0].seconds_since);
    if (!Number.isFinite(elapsed)) return 0;
    return Math.max(0, REGISTRATION_OTP_COOLDOWN_SECONDS - elapsed);
  } catch (_) {
    return 0;
  }
};

export const saveRegistrationOtp = async (identifier, otp) => {
  const cleanEmail = normalizeOtpEmail(identifier);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await query(
    `INSERT INTO otps (email, otp, expires_at, purpose, attempts, consumed_at)
     VALUES (?, ?, ?, ?, 0, NULL)`,
    [cleanEmail, otp, expiresAt, REGISTRATION_OTP_PURPOSE]
  );
  return { email: cleanEmail, expiresAt };
};

/**
 * Atomically consume the newest unconsumed, unexpired registration OTP.
 * Returns { ok: true } on success, or { ok: false, reason } where reason is
 * one of: 'not_found' | 'expired' | 'too_many_attempts'.
 */
export const consumeRegistrationOtp = async (identifier, inputOtp) => {
  const cleanEmail = normalizeOtpEmail(identifier);
  const cleanOtp = String(inputOtp ?? '').trim();
  if (!cleanEmail || !cleanOtp) return { ok: false, reason: 'not_found' };

  try {
    const rows = await query(
      `SELECT id, otp, expires_at, attempts, (expires_at > NOW()) AS is_valid
       FROM otps
       WHERE email = ? AND purpose = ? AND consumed_at IS NULL
       ORDER BY id DESC LIMIT 5`,
      [cleanEmail, REGISTRATION_OTP_PURPOSE]
    );

    const live = (rows || []).filter((row) => Number(row.is_valid) === 1);
    if (live.length === 0) {
      const expired = (rows || []).some((row) => Number(row.is_valid) !== 1);
      return { ok: false, reason: expired ? 'expired' : 'not_found' };
    }

    const target = live.find((row) => String(row.otp ?? '').trim() === cleanOtp);
    if (!target) {
      const newest = live[0];
      if (Number(newest.attempts) >= REGISTRATION_OTP_MAX_ATTEMPTS) {
        return { ok: false, reason: 'too_many_attempts' };
      }
      await query(
        'UPDATE otps SET attempts = attempts + 1 WHERE id = ?',
        [newest.id]
      );
      return { ok: false, reason: 'not_found' };
    }

    if (Number(target.attempts) >= REGISTRATION_OTP_MAX_ATTEMPTS) {
      return { ok: false, reason: 'too_many_attempts' };
    }

    const result = await query(
      'UPDATE otps SET consumed_at = NOW() WHERE id = ? AND consumed_at IS NULL',
      [target.id]
    );
    if (!result || result.affectedRows !== 1) {
      return { ok: false, reason: 'not_found' };
    }

    return { ok: true, otpId: target.id };
  } catch (err) {
    console.warn(`[AUTH] Registration OTP verification error: ${err.message}`);
    return { ok: false, reason: 'not_found' };
  }
};

export const invalidateRegistrationOtps = async (identifier) => {
  const cleanEmail = normalizeOtpEmail(identifier);
  if (!cleanEmail) return;
  try {
    await query(
      'UPDATE otps SET consumed_at = NOW() WHERE email = ? AND purpose = ? AND consumed_at IS NULL',
      [cleanEmail, REGISTRATION_OTP_PURPOSE]
    );
  } catch (_) {}
};


/**
 * Get all users from MySQL DB with College Isolation filtering support
 * @param {number|null} collegeId - If provided, restricts to only this college
 */
export const getAllUsersModel = async (collegeId = null, department = null) => {
  let sql = `
    SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.college_id, u.is_active, u.created_at,
           u.two_factor_enabled, u.two_factor_secret, u.two_factor_reset,
           c.name as college_name,
           s.roll_number, s.department_id, s.batch_id, s.department, s.year, s.division, s.semester, s.cgpa, s.skills,
           COALESCE(s.gender, u.gender) as gender,
           COALESCE(s.city, u.city) as city,
           COALESCE(s.emergency_contact, u.emergency_contact) as emergency_contact,
           COALESCE(s.linkedin_url, u.linkedin_url) as linkedin_url,
           COALESCE(s.target_track, u.target_track) as target_track,
           COALESCE(s.is_profile_updated, u.is_profile_updated, 0) as is_profile_updated
    FROM users u
    LEFT JOIN colleges c ON u.college_id = c.id
    LEFT JOIN students s ON u.id = s.user_id
    WHERE 1=1
  `;
  const params = [];
  if (collegeId) {
    sql += ' AND u.college_id = ?';
    params.push(collegeId);
  }
  if (department && department !== 'all' && department !== 'All') {
    const cleanDept = String(department).trim().toLowerCase();
    sql += ' AND (LOWER(s.department) LIKE ? OR LOWER(s.department) = ? OR CAST(s.department_id AS CHAR) = ?)';
    params.push(`%${cleanDept}%`, cleanDept, cleanDept);
  }
  sql += ' ORDER BY u.id DESC';

  const results = await query(sql, params);
  return results && Array.isArray(results) ? results : [];
};

/**
 * Get all pending user registrations (is_active = 0)
 */
export const getPendingUsersModel = async (collegeId = null) => {
  let sql = `
    SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.college_id, u.is_active, u.created_at,
           c.name as college_name,
           s.roll_number, s.department_id, s.batch_id, s.department, s.year, s.division, s.semester, s.cgpa, s.skills,
           COALESCE(s.gender, u.gender) as gender,
           COALESCE(s.city, u.city) as city,
           COALESCE(s.emergency_contact, u.emergency_contact) as emergency_contact,
           COALESCE(s.linkedin_url, u.linkedin_url) as linkedin_url,
           COALESCE(s.target_track, u.target_track) as target_track
    FROM users u
    LEFT JOIN colleges c ON u.college_id = c.id
    LEFT JOIN students s ON u.id = s.user_id
    WHERE (u.is_active = 0 OR u.is_active IS NULL OR u.is_active = false) AND u.role != 'super_admin'
  `;
  const params = [];
  if (collegeId) {
    sql += ' AND u.college_id = ?';
    params.push(collegeId);
  }
  sql += ' ORDER BY u.id DESC';

  const results = await query(sql, params);
  return results && Array.isArray(results) ? results : [];
};

/**
 * Update user and assigned hierarchy strictly in MySQL DB
 */
export const updateUserModel = async (id, data) => {
  const numId = parseInt(id, 10);
  const {
    name,
    email,
    mobile_number,
    phone,
    role,
    college_id,
    department_id,
    batch_id,
    is_active,
    roll_number,
    rollNo,
    roll_no,
    department,
    year,
    division,
    semester,
    cgpa,
    skills,
    gender,
    city,
    emergency_contact,
    guardianContact,
    linkedin_url,
    linkedinUrl,
    target_track,
    track,
    password,
    password_hash,
    is_profile_updated,
  } = data;

  const rollVal = roll_number || rollNo || roll_no || null;
  const phoneVal = mobile_number || phone || null;
  const hasPasswordUpdate = password !== undefined || password_hash !== undefined;
  const passVal = hasPasswordUpdate
    ? await hashPasswordValue(password !== undefined ? password : password_hash)
    : null;
  const genderVal = gender !== undefined ? gender : null;
  const cityVal = city !== undefined ? city : null;
  const emergencyVal = emergency_contact !== undefined ? emergency_contact : (guardianContact !== undefined ? guardianContact : null);
  const linkedinVal = linkedin_url !== undefined ? linkedin_url : (linkedinUrl !== undefined ? linkedinUrl : null);
  const trackVal = target_track !== undefined ? target_track : (track !== undefined ? track : null);
  const nameVal = name || null;
  const emailVal = email || null;
  const roleVal = role || null;
  const targetCollege = college_id || data.college || data.college_name || data.collegeName;
  const validCollegeId = targetCollege ? await getValidCollegeId(targetCollege) : null;
  const isActiveVal = is_active !== undefined ? is_active : null;
  const isProfileUpdatedVal = is_profile_updated !== undefined ? (is_profile_updated ? 1 : 0) : 1;

  await query(
    'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), mobile_number = COALESCE(?, mobile_number), password = COALESCE(?, password), password_hash = COALESCE(?, password_hash), role = COALESCE(?, role), college_id = COALESCE(?, college_id), is_active = COALESCE(?, is_active), gender = COALESCE(?, gender), city = COALESCE(?, city), emergency_contact = COALESCE(?, emergency_contact), linkedin_url = COALESCE(?, linkedin_url), target_track = COALESCE(?, target_track), is_profile_updated = COALESCE(?, is_profile_updated) WHERE id = ?',
    [nameVal, emailVal, phoneVal, passVal, passVal, roleVal, validCollegeId, isActiveVal, genderVal, cityVal, emergencyVal, linkedinVal, trackVal, isProfileUpdatedVal, numId]
  );

  if (
    rollVal !== undefined ||
    department !== undefined ||
    department_id !== undefined ||
    batch_id !== undefined ||
    year !== undefined ||
    division !== undefined ||
    semester !== undefined ||
    cgpa !== undefined ||
    skills !== undefined ||
    genderVal !== null ||
    cityVal !== null ||
    emergencyVal !== null ||
    linkedinVal !== null ||
    trackVal !== null ||
    is_profile_updated !== undefined
  ) {
    const existing = await query('SELECT * FROM students WHERE user_id = ?', [numId]);
    if (existing && existing.length > 0) {
      await query(
        `UPDATE students SET 
          roll_number = COALESCE(?, roll_number), 
          college_id = COALESCE(?, college_id),
          department_id = COALESCE(?, department_id),
          batch_id = COALESCE(?, batch_id),
          department = COALESCE(?, department), 
          year = COALESCE(?, year), 
          division = COALESCE(?, division), 
          semester = COALESCE(?, semester),
          cgpa = COALESCE(?, cgpa),
          skills = COALESCE(?, skills),
          gender = COALESCE(?, gender),
          city = COALESCE(?, city),
          emergency_contact = COALESCE(?, emergency_contact),
          linkedin_url = COALESCE(?, linkedin_url),
          target_track = COALESCE(?, target_track),
          is_profile_updated = COALESCE(?, is_profile_updated)
         WHERE user_id = ?`,
        [
          rollVal,
          validCollegeId,
          department_id || null,
          batch_id || null,
          department || null,
          year || null,
          division || null,
          semester || null,
          cgpa || null,
          skills || null,
          genderVal,
          cityVal,
          emergencyVal,
          linkedinVal,
          trackVal,
          isProfileUpdatedVal,
          numId,
        ]
      );
    } else {
      await query(
        `INSERT INTO students 
          (user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills, gender, city, emergency_contact, linkedin_url, target_track) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [numId, validCollegeId, department_id || null, batch_id || null, rollVal || '', department || '', year || '', division || '', semester || '', cgpa || '8.5', skills || '', genderVal || '', cityVal || '', emergencyVal || '', linkedinVal || '', trackVal || '']
      );
    }
  }

  return {
    id: numId,
    ...data,
    gender: genderVal,
    city: cityVal,
    emergency_contact: emergencyVal,
    linkedin_url: linkedinVal,
    target_track: trackVal,
  };
};

export const deleteUserModel = async (id) => {
  const numId = parseInt(id, 10);
  await query('DELETE FROM students WHERE user_id = ?', [numId]);
  await query('DELETE FROM users WHERE id = ?', [numId]);
  return true;
};

export const getUserStatsModel = async (collegeId = null) => {
  const users = await getAllUsersModel(collegeId);
  const totalUsers = users.length;
  const students = users.filter((u) => u.role === ROLES.STUDENT).length;
  const mentors = users.filter((u) => u.role === ROLES.MENTOR).length;
  const coordinators = users.filter((u) => u.role === ROLES.COORDINATOR).length;
  const admins = users.filter((u) => u.role === ROLES.COLLEGE_ADMIN || u.role === ROLES.SUPER_ADMIN).length;

  return {
    totalUsers,
    students,
    mentors,
    coordinators,
    admins,
    collegeId: collegeId || 'all',
  };
};
