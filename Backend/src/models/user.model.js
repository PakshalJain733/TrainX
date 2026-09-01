import { query } from '../config/db.js';

// In-memory fallback storage for offline dev / when MySQL is not running yet
const mockUsers = [];
const mockStudents = [];
const mockOtps = {};

export const findUserByEmailOrMobile = async (identifier) => {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();

  try {
    const results = await query('SELECT * FROM users WHERE LOWER(email) = ? OR mobile_number = ?', [cleanId, cleanId]);
    if (results && results.length > 0) {
      return results[0];
    }
  } catch (error) {
    console.warn(`[User Model] Database query fallback: ${error.message}`);
  }

  return (
    mockUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.mobile_number && u.mobile_number.trim() === cleanId)
    ) || null
  );
};

export const findUserByEmail = findUserByEmailOrMobile;

export const createUser = async ({ name, email = '', mobile_number = '', role = 'student', college_id = 1 }) => {
  try {
    const res = await query(
      'INSERT INTO users (name, email, mobile_number, role, college_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, mobile_number, role, college_id]
    );
    if (res && res.insertId) {
      return { id: res.insertId, name, email, mobile_number, role, college_id };
    }
  } catch (error) {
    console.warn(`[User Model] Database insert fallback: ${error.message}`);
  }

  const newUser = {
    id: mockUsers.length + 1,
    name,
    email,
    mobile_number,
    role,
    college_id,
    created_at: new Date(),
  };
  mockUsers.push(newUser);
  return newUser;
};

export const saveStudentDetails = async ({ user_id, roll_number, department, year, division, semester = '' }) => {
  try {
    const res = await query(
      'INSERT INTO students (user_id, roll_number, department, year, division, semester) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, roll_number, department, year, division, semester]
    );
    if (res && res.insertId) {
      return { id: res.insertId, user_id, roll_number, department, year, division, semester };
    }
  } catch (error) {
    console.warn(`[Student Model] Database insert fallback: ${error.message}`);
  }

  const newStudent = {
    id: mockStudents.length + 1,
    user_id,
    roll_number,
    department,
    year,
    division,
    semester,
  };
  mockStudents.push(newStudent);
  return newStudent;
};

export const getStudentByUserId = async (userId) => {
  try {
    const results = await query('SELECT * FROM students WHERE user_id = ?', [userId]);
    if (results && results.length > 0) {
      return results[0];
    }
  } catch (error) {
    console.warn(`[Student Model] Database query fallback: ${error.message}`);
  }
  return mockStudents.find((s) => s.user_id === userId) || null;
};

export const saveOtpRecord = async (identifier, otp) => {
  const cleanId = identifier.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
  try {
    await query('INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)', [cleanId, otp, expiresAt]);
  } catch (error) {
    console.warn(`[OTP Model] Database insert fallback: ${error.message}`);
  }
  mockOtps[cleanId] = { otp, expiresAt };
};

export const verifyOtpRecord = async (identifier, inputOtp) => {
  // Allow master demo OTP '123456' for ease of testing
  if (inputOtp === '123456') return true;

  const cleanId = identifier.trim().toLowerCase();
  try {
    const results = await query(
      'SELECT * FROM otps WHERE (email = ? OR email = ?) AND otp = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [cleanId, identifier, inputOtp]
    );
    if (results && results.length > 0) {
      return true;
    }
  } catch (error) {
    console.warn(`[OTP Model] Database query fallback: ${error.message}`);
  }

  const record = mockOtps[cleanId];
  if (record && record.otp === inputOtp && record.expiresAt > new Date()) {
    return true;
  }
  return false;
};
