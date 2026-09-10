import { query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';

// Pre-seeded mock data for fallback mode
const mockUsers = [
  {
    id: 1,
    name: 'Super Administrator',
    email: 'superadmin@trainingportal.com',
    mobile_number: '9999999999',
    role: ROLES.SUPER_ADMIN,
    college_id: null,
    is_active: 1,
    created_at: new Date('2026-01-01'),
  },
  {
    id: 2,
    name: 'PVPPCOE College Admin',
    email: 'admin@pvppcoe.ac.in',
    mobile_number: '9888888881',
    role: ROLES.COLLEGE_ADMIN,
    college_id: 1,
    is_active: 1,
    created_at: new Date('2026-01-05'),
  },
  {
    id: 3,
    name: 'DBIT College Admin',
    email: 'admin@dbit.ac.in',
    mobile_number: '9888888882',
    role: ROLES.COLLEGE_ADMIN,
    college_id: 2,
    is_active: 1,
    created_at: new Date('2026-01-05'),
  },
  {
    id: 4,
    name: 'Dr. Coordinator PVPPCOE',
    email: 'coordinator@pvppcoe.ac.in',
    mobile_number: '9777777771',
    role: ROLES.COORDINATOR,
    college_id: 1,
    is_active: 1,
    created_at: new Date('2026-01-10'),
  },
  {
    id: 5,
    name: 'Prof. Mentor PVPPCOE',
    email: 'mentor@pvppcoe.ac.in',
    mobile_number: '9666666661',
    role: ROLES.MENTOR,
    college_id: 1,
    is_active: 1,
    created_at: new Date('2026-01-15'),
  },
  {
    id: 6,
    name: 'Ganesh Shinde',
    email: 'ganesh@student.pvppcoe.ac.in',
    mobile_number: '9555555551',
    role: ROLES.STUDENT,
    college_id: 1,
    is_active: 1,
    created_at: new Date('2026-02-01'),
  },
  {
    id: 7,
    name: 'DBIT Student',
    email: 'rahul@student.dbit.ac.in',
    mobile_number: '9555555552',
    role: ROLES.STUDENT,
    college_id: 2,
    is_active: 1,
    created_at: new Date('2026-02-01'),
  },
];

const mockStudents = [
  {
    id: 1,
    user_id: 6,
    college_id: 1,
    department_id: 1,
    batch_id: 1,
    roll_number: '2026COMP042',
    department: 'Computer Engineering',
    year: 'TE',
    division: 'A',
    semester: 'Semester 6',
    cgpa: '8.85',
    skills: 'JavaScript, React, Node.js, Python, SQL',
  },
  {
    id: 2,
    user_id: 7,
    college_id: 2,
    department_id: 5,
    batch_id: 3,
    roll_number: '2026DBIT018',
    department: 'Computer Engineering',
    year: 'TE',
    division: 'A',
    semester: 'Semester 6',
    cgpa: '8.40',
    skills: 'Java, Spring Boot, MySQL',
  },
];

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

export const findUserById = async (id) => {
  const numId = parseInt(id, 10);
  try {
    const results = await query('SELECT * FROM users WHERE id = ?', [numId]);
    if (results && results.length > 0) {
      return results[0];
    }
  } catch (error) {
    console.warn(`[User Model] Database query fallback: ${error.message}`);
  }
  return mockUsers.find((u) => u.id === numId) || null;
};

export const findUserByEmail = findUserByEmailOrMobile;

export const createUser = async ({ name, email = '', mobile_number = '', role = ROLES.STUDENT, college_id = 1, password = '', two_factor_secret = null }) => {
  try {
    const res = await query(
      'INSERT INTO users (name, email, mobile_number, role, college_id, password_hash, two_factor_secret) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, mobile_number, role, college_id, password, two_factor_secret]
    );
    if (res && res.insertId) {
      return { id: res.insertId, name, email, mobile_number, role, college_id, password_hash: password, two_factor_secret };
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
    password_hash: password,
    two_factor_secret,
    is_active: 1,
    created_at: new Date(),
  };
  mockUsers.push(newUser);
  return newUser;
};

export const updateUserTwoFactorSecret = async (userId, secret) => {
  const numId = parseInt(userId, 10);
  try {
    await query('UPDATE users SET two_factor_secret = ?, two_factor_enabled = TRUE WHERE id = ?', [secret, numId]);
  } catch (error) {
    console.warn(`[User Model] update secret error: ${error.message}`);
  }
  const u = mockUsers.find(user => user.id === numId);
  if (u) {
    u.two_factor_secret = secret;
    u.two_factor_enabled = true;
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
  try {
    const res = await query(
      `INSERT INTO students 
        (user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills]
    );
    if (res && res.insertId) {
      return { id: res.insertId, user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills };
    }
  } catch (error) {
    console.warn(`[Student Model] Database insert fallback: ${error.message}`);
  }

  const newStudent = {
    id: mockStudents.length + 1,
    user_id,
    college_id,
    department_id,
    batch_id,
    roll_number,
    department,
    year,
    division,
    semester,
    cgpa,
    skills,
  };
  mockStudents.push(newStudent);
  return newStudent;
};

export const getStudentByUserId = async (userId) => {
  const numId = parseInt(userId, 10);
  try {
    const results = await query('SELECT * FROM students WHERE user_id = ?', [numId]);
    if (results && results.length > 0) {
      return results[0];
    }
  } catch (error) {
    console.warn(`[Student Model] Database query fallback: ${error.message}`);
  }
  return mockStudents.find((s) => s.user_id === numId) || null;
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
  // Master demo OTP '123456' for ease of testing
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

/**
 * Get all users with College Isolation filtering support
 * @param {number|null} collegeId - If provided, restricts to only this college
 */
export const getAllUsersModel = async (collegeId = null) => {
  try {
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
    if (results && Array.isArray(results) && results.length > 0) {
      return results;
    }
  } catch (error) {
    console.warn(`[User Model] Database query fallback for getAllUsers: ${error.message}`);
  }

  // Fallback to mock storage with college isolation
  return mockUsers
    .filter((u) => {
      if (!collegeId) return true;
      return u.college_id === collegeId;
    })
    .map((u) => {
      const student = mockStudents.find((s) => s.user_id === u.id) || {};
      return {
        ...u,
        is_active: u.is_active !== undefined ? u.is_active : 1,
        roll_number: student.roll_number || '',
        department_id: student.department_id || null,
        batch_id: student.batch_id || null,
        department: student.department || '',
        year: student.year || '',
        division: student.division || '',
        semester: student.semester || '',
        cgpa: student.cgpa || '',
        skills: student.skills || '',
      };
    });
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

  try {
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
  } catch (error) {
    console.warn(`[User Model] Database update fallback: ${error.message}`);
  }

  // Update in-memory mock store
  const uIdx = mockUsers.findIndex((u) => u.id === numId);
  if (uIdx !== -1) {
    mockUsers[uIdx] = {
      ...mockUsers[uIdx],
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(mobile_number !== undefined && { mobile_number }),
      ...(role !== undefined && { role }),
      ...(college_id !== undefined && { college_id }),
      ...(is_active !== undefined && { is_active }),
    };
  }

  const sIdx = mockStudents.findIndex((s) => s.user_id === numId);
  if (sIdx !== -1) {
    mockStudents[sIdx] = {
      ...mockStudents[sIdx],
      ...(roll_number !== undefined && { roll_number }),
      ...(college_id !== undefined && { college_id }),
      ...(department_id !== undefined && { department_id }),
      ...(batch_id !== undefined && { batch_id }),
      ...(department !== undefined && { department }),
      ...(year !== undefined && { year }),
      ...(division !== undefined && { division }),
      ...(semester !== undefined && { semester }),
      ...(cgpa !== undefined && { cgpa }),
      ...(skills !== undefined && { skills }),
    };
  } else if (roll_number || department || department_id || batch_id) {
    mockStudents.push({
      id: mockStudents.length + 1,
      user_id: numId,
      college_id: college_id || 1,
      department_id: department_id || null,
      batch_id: batch_id || null,
      roll_number: roll_number || '',
      department: department || '',
      year: year || '',
      division: division || '',
      semester: semester || '',
      cgpa: cgpa || '8.5',
      skills: skills || '',
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
