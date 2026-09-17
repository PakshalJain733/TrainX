import { query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';

export const findUserByEmailOrMobile = async (identifier) => {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();

  try {
    const results = await query('SELECT * FROM users WHERE LOWER(email) = ? OR mobile_number = ?', [cleanId, cleanId]);
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

export const findUserByEmail = findUserByEmailOrMobile;

const getValidCollegeId = async (collegeId) => {
  if (!collegeId) return null;
  try {
    const rows = await query('SELECT id FROM colleges WHERE id = ?', [collegeId]);
    if (rows && rows.length > 0) return rows[0].id;
    const firstRow = await query('SELECT id FROM colleges LIMIT 1');
    if (firstRow && firstRow.length > 0) return firstRow[0].id;
  } catch (e) {
    // ignore
  }
  return null;
};

export const createUser = async ({ name, email = '', mobile_number = '', role = ROLES.STUDENT, college_id = 1, password = '', password_hash = '', two_factor_secret = null }) => {
  const pwd = password || password_hash || '';
  const validCollegeId = await getValidCollegeId(college_id);
  const res = await query(
    'INSERT INTO users (name, email, mobile_number, role, college_id, password, password_hash, two_factor_secret) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, email, mobile_number, role, validCollegeId, pwd, pwd, two_factor_secret]
  );
  if (res && res.insertId) {
    return { id: res.insertId, name, email, mobile_number, role, college_id: validCollegeId, password: pwd, two_factor_secret };
  }
  throw new Error('Failed to create user in MySQL database');
};

export const updateUser = async (userId, updateData) => {
  const numId = parseInt(userId, 10);
  const fields = [];
  const values = [];
  if (updateData.name !== undefined) { fields.push('name = ?'); values.push(updateData.name); }
  if (updateData.email !== undefined) { fields.push('email = ?'); values.push(updateData.email); }
  if (updateData.mobile_number !== undefined) { fields.push('mobile_number = ?'); values.push(updateData.mobile_number); }
  if (updateData.phone !== undefined) { fields.push('mobile_number = ?'); values.push(updateData.phone); }
  if (updateData.password !== undefined) { fields.push('password = ?'); values.push(updateData.password); fields.push('password_hash = ?'); values.push(updateData.password); }
  if (updateData.password_hash !== undefined) { fields.push('password_hash = ?'); values.push(updateData.password_hash); }

  if (fields.length > 0) {
    values.push(numId);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }
};

export const updateUserTwoFactorSecret = async (userId, secret) => {
  const numId = parseInt(userId, 10);
  await query('UPDATE users SET two_factor_secret = ?, two_factor_enabled = TRUE WHERE id = ?', [secret, numId]);
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
  const cleanId = identifier.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
  await query('INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)', [cleanId, otp, expiresAt]);
};

export const verifyOtpRecord = async (identifier, inputOtp) => {
  // Master demo OTP '123456' for ease of testing
  if (inputOtp === '123456') return true;

  const cleanId = identifier.trim().toLowerCase();
  const results = await query(
    'SELECT * FROM otps WHERE (email = ? OR email = ?) AND otp = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [cleanId, identifier, inputOtp]
  );
  if (results && results.length > 0) {
    return true;
  }
  return false;
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
           COALESCE(s.target_track, u.target_track) as target_track
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
  } = data;

  const rollVal = roll_number || rollNo || roll_no || null;
  const phoneVal = mobile_number || phone || null;
  const passVal = password || password_hash || null;
  const genderVal = gender !== undefined ? gender : null;
  const cityVal = city !== undefined ? city : null;
  const emergencyVal = emergency_contact !== undefined ? emergency_contact : (guardianContact !== undefined ? guardianContact : null);
  const linkedinVal = linkedin_url !== undefined ? linkedin_url : (linkedinUrl !== undefined ? linkedinUrl : null);
  const trackVal = target_track !== undefined ? target_track : (track !== undefined ? track : null);
  const nameVal = name || null;
  const emailVal = email || null;
  const roleVal = role || null;
  const validCollegeId = college_id ? await getValidCollegeId(college_id) : null;
  const isActiveVal = is_active !== undefined ? is_active : null;

  await query(
    'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), mobile_number = COALESCE(?, mobile_number), password_hash = COALESCE(?, password_hash), role = COALESCE(?, role), college_id = COALESCE(?, college_id), is_active = COALESCE(?, is_active), gender = COALESCE(?, gender), city = COALESCE(?, city), emergency_contact = COALESCE(?, emergency_contact), linkedin_url = COALESCE(?, linkedin_url), target_track = COALESCE(?, target_track) WHERE id = ?',
    [nameVal, emailVal, phoneVal, passVal, roleVal, validCollegeId, isActiveVal, genderVal, cityVal, emergencyVal, linkedinVal, trackVal, numId]
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
    trackVal !== null
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
          target_track = COALESCE(?, target_track)
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
