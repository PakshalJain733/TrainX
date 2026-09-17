import { query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';

export const findUserByEmailOrMobile = async (identifier) => {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();

  const results = await query(
    'SELECT * FROM users WHERE LOWER(email) = ? OR mobile_number = ?',
    [cleanId, cleanId]
  );
  return results && results.length > 0 ? results[0] : null;
};

export const findUserById = async (id) => {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return null;

  const results = await query('SELECT * FROM users WHERE id = ?', [numId]);
  return results && results.length > 0 ? results[0] : null;
};

export const findUserByEmail = findUserByEmailOrMobile;

export const createUser = async ({
  name,
  email = '',
  mobile_number = '',
  role = ROLES.STUDENT,
  college_id = 1,
  password_hash = null,
}) => {
  const res = await query(
    'INSERT INTO users (name, email, mobile_number, role, college_id, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, mobile_number, role, college_id, password_hash]
  );
  if (res && res.insertId) {
    return { id: res.insertId, name, email, mobile_number, role, college_id };
  }
  throw new Error('Failed to create user');
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
  const res = await query(
    `INSERT INTO students 
      (user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      college_id = VALUES(college_id),
      department_id = VALUES(department_id),
      batch_id = VALUES(batch_id),
      roll_number = VALUES(roll_number),
      department = VALUES(department),
      year = VALUES(year),
      division = VALUES(division),
      semester = VALUES(semester),
      cgpa = VALUES(cgpa),
      skills = VALUES(skills)`,
    [user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills]
  );
  return { id: res.insertId || user_id, user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills };
};

export const getStudentByUserId = async (userId) => {
  const numId = parseInt(userId, 10);
  if (isNaN(numId)) return null;

  const results = await query('SELECT * FROM students WHERE user_id = ?', [numId]);
  return results && results.length > 0 ? results[0] : null;
};

export const saveOtpRecord = async (identifier, otp) => {
  const cleanId = identifier.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

  await query(
    'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)',
    [cleanId, otp, expiresAt]
  );
};

export const verifyOtpRecord = async (identifier, inputOtp) => {
  const cleanId = identifier.trim().toLowerCase();
  const results = await query(
    'SELECT * FROM otps WHERE (LOWER(email) = ? OR email = ?) AND otp = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [cleanId, identifier, inputOtp]
  );
  if (results && results.length > 0) {
    // Delete used OTP
    await query('DELETE FROM otps WHERE id = ?', [results[0].id]).catch(() => {});
    return true;
  }
  return false;
};

/**
 * Get all users with College Isolation filtering support
 * @param {number|null} collegeId - If provided, restricts to only this college
 */
export const getAllUsersModel = async (collegeId = null) => {
  let sql = `
    SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.college_id, u.is_active, u.created_at,
           s.roll_number, s.department_id, s.batch_id, s.department, s.year, s.division, s.semester, s.cgpa, s.skills
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
  `;
  const params = [];
  if (collegeId) {
    sql += ' WHERE u.college_id = ?';
    params.push(collegeId);
  }
  sql += ' ORDER BY u.id DESC';

  const results = await query(sql, params);
  return results || [];
};

/**
 * Update user and assigned hierarchy (College, Department, Batch, Role)
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
  } = data;

  const phoneVal = mobile_number || phone;
  const genderVal = gender;
  const cityVal = city;
  const emergencyVal = emergency_contact || guardianContact;
  const linkedinVal = linkedin_url || linkedinUrl;
  const trackVal = target_track || track;

  await query(
    'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), mobile_number = COALESCE(?, mobile_number), role = COALESCE(?, role), college_id = COALESCE(?, college_id), is_active = COALESCE(?, is_active), gender = COALESCE(?, gender), city = COALESCE(?, city), emergency_contact = COALESCE(?, emergency_contact), linkedin_url = COALESCE(?, linkedin_url), target_track = COALESCE(?, target_track) WHERE id = ?',
    [name, email, phoneVal, role, college_id, is_active, genderVal, cityVal, emergencyVal, linkedinVal, trackVal, numId]
  );

  if (
    roll_number !== undefined ||
    department !== undefined ||
    department_id !== undefined ||
    batch_id !== undefined ||
    year !== undefined ||
    division !== undefined ||
    semester !== undefined ||
    cgpa !== undefined ||
    skills !== undefined ||
    genderVal !== undefined ||
    cityVal !== undefined ||
    emergencyVal !== undefined ||
    linkedinVal !== undefined ||
    trackVal !== undefined
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
        [roll_number, college_id, department_id, batch_id, department, year, division, semester, cgpa, skills, genderVal, cityVal, emergencyVal, linkedinVal, trackVal, numId]
      );
    } else {
      await query(
        `INSERT INTO students 
          (user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills, gender, city, emergency_contact, linkedin_url, target_track) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [numId, college_id || 1, department_id || null, batch_id || null, roll_number || '', department || '', year || '', division || '', semester || '', cgpa || '8.5', skills || '', genderVal || '', cityVal || '', emergencyVal || '', linkedinVal || '', trackVal || '']
      );
    }
  }

  return { id: numId, ...data };
};

export const deleteUserModel = async (id) => {
  const numId = parseInt(id, 10);
  await query('DELETE FROM students WHERE user_id = ?', [numId]);
  await query('DELETE FROM users WHERE id = ?', [numId]);
  return true;
};

export const getUserStatsModel = async (collegeId = null) => {
  let userSql = 'SELECT role, COUNT(*) as count FROM users';
  const params = [];
  if (collegeId) {
    userSql += ' WHERE college_id = ?';
    params.push(collegeId);
  }
  userSql += ' GROUP BY role';

  const rows = await query(userSql, params);
  let totalUsers = 0;
  let students = 0;
  let mentors = 0;
  let coordinators = 0;
  let admins = 0;

  if (Array.isArray(rows)) {
    rows.forEach(r => {
      const count = parseInt(r.count, 10) || 0;
      totalUsers += count;
      if (r.role === ROLES.STUDENT) students += count;
      else if (r.role === ROLES.MENTOR) mentors += count;
      else if (r.role === ROLES.COORDINATOR) coordinators += count;
      else if (r.role === ROLES.COLLEGE_ADMIN || r.role === ROLES.SUPER_ADMIN) admins += count;
    });
  }

  return {
    totalUsers,
    students,
    mentors,
    coordinators,
    admins,
    collegeId: collegeId || 'all',
  };
};
