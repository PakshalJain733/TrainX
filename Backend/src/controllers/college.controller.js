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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    tablesInitialized = true;
  } catch (e) {
    console.warn('[DB ensureCollegeTable error]', e.message);
  }
}

export const getColleges = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const dbColleges = await query('SELECT * FROM colleges ORDER BY id DESC');
    return sendSuccess(res, 'Colleges retrieved successfully', dbColleges || []);
  } catch (error) {
    next(error);
  }
};

export const createCollege = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const { name, code, location, city, type, contactEmail, contactPhone } = req.body;
    if (!name || !code) {
      return sendError(res, 'College Name and Code are required', 400);
    }

    const result = await query(
      `INSERT INTO colleges (name, code, location, city, type, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        name.trim(),
        code.trim(),
        location || 'Main Campus',
        city || 'Metropolis',
        type || 'Autonomous',
        contactEmail || `admin@${code.toLowerCase()}.edu.in`,
        contactPhone || '+91 90000 00000'
      ]
    );

    const [newCollege] = await query('SELECT * FROM colleges WHERE id = ?', [result.insertId]);

    return sendSuccess(res, 'College created successfully', newCollege || {
      id: result.insertId,
      name,
      code,
      location,
      city,
      type
    }, 201);
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
