import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';

let tablesInitialized = false;
async function ensureCollegeTable() {
  if (tablesInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        location VARCHAR(255) DEFAULT 'Main Campus',
        city VARCHAR(100) DEFAULT 'Metropolis',
        type VARCHAR(100) DEFAULT 'Autonomous',
        status VARCHAR(50) DEFAULT 'Active',
        contact_email VARCHAR(255) NULL,
        contact_phone VARCHAR(50) NULL,
        admin_name VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const cols = [
      "location VARCHAR(255) DEFAULT 'Main Campus'",
      "city VARCHAR(100) DEFAULT 'Metropolis'",
      "type VARCHAR(100) DEFAULT 'Autonomous'",
      "status VARCHAR(50) DEFAULT 'Active'",
      "contact_email VARCHAR(255) NULL",
      "contact_phone VARCHAR(50) NULL",
      "admin_name VARCHAR(255) NULL",
    ];
    for (const c of cols) {
      try { await query(`ALTER TABLE colleges ADD COLUMN ${c}`); } catch (err) {}
    }
    tablesInitialized = true;
  } catch (e) {
    console.warn('[DB ensureCollegeTable error]', e.message);
  }
}

export const getColleges = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const dbColleges = await query(`
      SELECT 
        c.*,
        c.contact_email AS adminEmail,
        c.admin_name AS adminName,
        (SELECT COUNT(*) FROM departments d WHERE d.college_id = c.id) AS department_count,
        (SELECT COUNT(*) FROM users u WHERE u.college_id = c.id AND u.role = 'student') AS student_count
      FROM colleges c 
      ORDER BY c.id DESC
    `);
    const formatted = (dbColleges || []).map((c) => ({
      ...c,
      adminEmail: c.adminEmail || c.contact_email || '',
      adminName: c.adminName || c.admin_name || '',
    }));
    return sendSuccess(res, 'Colleges retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

export const createCollege = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const { name, code, location, city, type, contactEmail, contactPhone, adminName, adminEmail } = req.body;
    if (!name || !code) {
      return sendError(res, 'College Name and Code are required', 400);
    }
    const finalEmail = (contactEmail || adminEmail || `admin@${code.toLowerCase()}.edu.in`).trim();
    const finalAdminName = (adminName || '').trim();

    const result = await query(
      `INSERT INTO colleges (name, code, location, city, type, contact_email, contact_phone, admin_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        name.trim(),
        code.trim(),
        location || 'Main Campus',
        city || 'Metropolis',
        type || 'Autonomous',
        finalEmail,
        contactPhone || '+91 90000 00000',
        finalAdminName,
      ]
    );

    const [newCollege] = await query('SELECT * FROM colleges WHERE id = ?', [result.insertId]);

    const formattedCollege = {
      ...newCollege,
      adminEmail: newCollege?.contact_email || finalEmail,
      adminName: newCollege?.admin_name || finalAdminName,
    };

    return sendSuccess(res, 'College created successfully', formattedCollege, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCollege = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const { id } = req.params;
    const { name, code, location, city, type, status, contactEmail, contactPhone } = req.body;

    await query(
      `UPDATE colleges 
       SET name = COALESCE(?, name),
           code = COALESCE(?, code),
           location = COALESCE(?, location),
           city = COALESCE(?, city),
           type = COALESCE(?, type),
           status = COALESCE(?, status),
           contact_email = COALESCE(?, contact_email),
           contact_phone = COALESCE(?, contact_phone)
       WHERE id = ?`,
      [name, code, location, city, type, status, contactEmail, contactPhone, id]
    );

    const [updated] = await query('SELECT * FROM colleges WHERE id = ?', [id]);
    if (!updated) {
      return sendError(res, 'College not found', 404);
    }

    return sendSuccess(res, 'College updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCollege = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const { id } = req.params;
    await query('DELETE FROM colleges WHERE id = ?', [id]);
    return sendSuccess(res, 'College deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getCollegeData = getColleges;
