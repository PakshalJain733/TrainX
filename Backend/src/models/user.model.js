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
  const hashedPassword = await hashPasswordValue(passwordValue);
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
  await query('UPDATE users SET two_factor_secret = ? WHERE id = ?', [secret, numId]);
};

export const enableTwoFactorForUser = async (userId) => {
  const numId = parseInt(userId, 10);
  await query('UPDATE users SET two_factor_enabled = TRUE WHERE id = ?', [numId]);
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

export const saveOtpRecord = async (identifier, otp) => {
  const cleanId = String(identifier).trim();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await query('INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)', [cleanId, otp, expiresAt]);
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
  const results = await query(
    `SELECT id FROM otps
     WHERE email IN (${placeholders}) AND otp = ? AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [...identifierCandidates, cleanOtp]
  );
  return Boolean(results && results.length > 0);
};

/**
 * Get all users from MySQL DB with College Isolation filtering support
 * @param {number|null} collegeId - If provided, restricts to only this college
 */
export const getAllUsersModel = async (collegeId = null) => {
  let sql = `
    SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.college_id, u.is_active, u.created_at,
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
  `;
  const params = [];
  if (collegeId) {
    sql += ' WHERE u.college_id = ?';
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
