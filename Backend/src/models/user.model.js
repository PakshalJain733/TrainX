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

export const getAllUsersModel = async () => {
  try {
    const results = await query(`
      SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.college_id, u.is_active, u.created_at,
             s.roll_number, s.department, s.year, s.division, s.semester
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      ORDER BY u.id DESC
    `);
    if (results && Array.isArray(results)) {
      if (results.length > 0) return results;
      if (mockUsers.length > 0) {
        return mockUsers.map((u) => {
          const student = mockStudents.find((s) => s.user_id === u.id) || {};
          return {
            ...u,
            is_active: u.is_active !== undefined ? u.is_active : 1,
            roll_number: student.roll_number || '',
            department: student.department || '',
            year: student.year || '',
            division: student.division || '',
            semester: student.semester || '',
          };
        });
      }
      return results;
    }
  } catch (error) {
    console.warn(`[User Model] Database query fallback for getAllUsers: ${error.message}`);
  }

  // Fallback to in-memory mock storage
  return mockUsers.map((u) => {
    const student = mockStudents.find((s) => s.user_id === u.id) || {};
    return {
      ...u,
      is_active: u.is_active !== undefined ? u.is_active : 1,
      roll_number: student.roll_number || '',
      department: student.department || '',
      year: student.year || '',
      division: student.division || '',
      semester: student.semester || '',
    };
  });
};

export const updateUserModel = async (id, data) => {
  const numId = parseInt(id, 10);
  const { name, email, mobile_number, role, is_active, roll_number, department, year, division, semester } = data;

  try {
    await query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), mobile_number = COALESCE(?, mobile_number), role = COALESCE(?, role), is_active = COALESCE(?, is_active) WHERE id = ?',
      [name, email, mobile_number, role, is_active, numId]
    );

    if (roll_number !== undefined || department !== undefined || year !== undefined || division !== undefined || semester !== undefined) {
      const existing = await query('SELECT * FROM students WHERE user_id = ?', [numId]);
      if (existing && existing.length > 0) {
        await query(
          'UPDATE students SET roll_number = COALESCE(?, roll_number), department = COALESCE(?, department), year = COALESCE(?, year), division = COALESCE(?, division), semester = COALESCE(?, semester) WHERE user_id = ?',
          [roll_number, department, year, division, semester, numId]
        );
      } else {
        await query(
          'INSERT INTO students (user_id, roll_number, department, year, division, semester) VALUES (?, ?, ?, ?, ?, ?)',
          [numId, roll_number || '', department || '', year || '', division || '', semester || '']
        );
      }
    }
  } catch (error) {
    console.warn(`[User Model] Database update fallback: ${error.message}`);
  }

  const uIdx = mockUsers.findIndex((u) => u.id === numId);
  if (uIdx !== -1) {
    mockUsers[uIdx] = {
      ...mockUsers[uIdx],
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(mobile_number !== undefined && { mobile_number }),
      ...(role !== undefined && { role }),
      ...(is_active !== undefined && { is_active }),
    };
  }

  const sIdx = mockStudents.findIndex((s) => s.user_id === numId);
  if (sIdx !== -1) {
    mockStudents[sIdx] = {
      ...mockStudents[sIdx],
      ...(roll_number !== undefined && { roll_number }),
      ...(department !== undefined && { department }),
      ...(year !== undefined && { year }),
      ...(division !== undefined && { division }),
      ...(semester !== undefined && { semester }),
    };
  } else if (roll_number || department) {
    mockStudents.push({
      id: mockStudents.length + 1,
      user_id: numId,
      roll_number: roll_number || '',
      department: department || '',
      year: year || '',
      division: division || '',
      semester: semester || '',
    });
  }

  return { id: numId, ...data };
};

export const deleteUserModel = async (id) => {
  const numId = parseInt(id, 10);
  try {
    await query('DELETE FROM students WHERE user_id = ?', [numId]);
    await query('DELETE FROM users WHERE id = ?', [numId]);
  } catch (error) {
    console.warn(`[User Model] Database delete fallback: ${error.message}`);
  }

  const uIdx = mockUsers.findIndex((u) => u.id === numId);
  if (uIdx !== -1) mockUsers.splice(uIdx, 1);
  const sIdx = mockStudents.findIndex((s) => s.user_id === numId);
  if (sIdx !== -1) mockStudents.splice(sIdx, 1);

  return true;
};

export const getUserStatsModel = async () => {
  const users = await getAllUsersModel();
  const totalUsers = users.length;
  const students = users.filter((u) => u.role === 'student').length;
  const mentors = users.filter((u) => u.role === 'mentor').length;
  const coordinators = users.filter((u) => u.role === 'coordinator').length;
  const admins = users.filter((u) => u.role === 'college_admin' || u.role === 'super_admin').length;

  return {
    totalUsers,
    students,
    mentors,
    coordinators,
    admins,
  };
};

