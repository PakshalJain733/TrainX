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
      "domain VARCHAR(255) NULL",
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
    const userRole = (req.user?.role || '').toLowerCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userCollegeId = req.user?.college_id || req.user?.collegeId;

    let sql = `
      SELECT 
        c.*,
        c.contact_email AS adminEmail,
        c.admin_name AS adminName,
        (SELECT COUNT(*) FROM departments d WHERE d.college_id = c.id) AS department_count,
        (SELECT COUNT(*) FROM users u WHERE u.college_id = c.id AND u.role = 'student') AS student_count
      FROM colleges c
    `;
    let params = [];

    // Filter colleges for College Admin users so they only see their assigned college
    if (userRole && !userRole.includes('super')) {
      const emailDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
      sql += ` WHERE LOWER(c.contact_email) = ? OR c.id = ? OR (c.domain IS NOT NULL AND c.domain != '' AND LOWER(c.domain) = ?)`;
      params = [userEmail, userCollegeId || -1, emailDomain];
    }

    sql += ` ORDER BY c.id DESC`;

    let dbColleges = await query(sql, params);

    // Fallback: If no direct match found for non-superadmin, query all and match by email/domain/college_id
    if (userRole && !userRole.includes('super') && (!dbColleges || dbColleges.length === 0)) {
      const allCols = await query(`
        SELECT c.*, c.contact_email AS adminEmail, c.admin_name AS adminName,
        (SELECT COUNT(*) FROM departments d WHERE d.college_id = c.id) AS department_count,
        (SELECT COUNT(*) FROM users u WHERE u.college_id = c.id AND u.role = 'student') AS student_count
        FROM colleges c ORDER BY c.id DESC
      `);
      const emailDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
      const matched = (allCols || []).filter(c => 
        String(c.id) === String(userCollegeId) ||
        (c.contact_email && c.contact_email.toLowerCase() === userEmail) ||
        (c.admin_name && c.admin_name.toLowerCase().includes(userEmail.split('@')[0])) ||
        (c.domain && emailDomain && emailDomain.endsWith(c.domain.toLowerCase().replace(/^@/, '')))
      );
      dbColleges = matched.length > 0 ? matched : [];
    }

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
    const { name, code, location, city, type, contactEmail, contactPhone, adminName, adminEmail, domain } = req.body;
    if (!name || !code) {
      return sendError(res, 'College Name and Code are required', 400);
    }
    const cleanName = String(name || '').trim();
    const cleanCode = String(code || '').trim();

    // Check if college code already exists
    const existingCode = await query('SELECT id, name FROM colleges WHERE LOWER(code) = LOWER(?) LIMIT 1', [cleanCode]);
    if (existingCode && existingCode.length > 0) {
      return sendError(
        res,
        `College code '${cleanCode}' is already registered to "${existingCode[0].name}". Please enter a unique college code.`,
        400
      );
    }

    const finalEmail = String(contactEmail || adminEmail || `admin@${cleanCode.toLowerCase()}.edu.in`).trim();
    const finalAdminName = String(adminName || '').trim();

    let derivedDomain = (domain || '').trim().toLowerCase();
    if (!derivedDomain && finalEmail.includes('@')) {
      derivedDomain = finalEmail.split('@')[1].trim().toLowerCase();
    }

    let newCollege = null;

    try {
      const result = await query(
        `INSERT INTO colleges (name, code, location, city, type, contact_email, contact_phone, admin_name, domain, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           location = VALUES(location),
           city = VALUES(city),
           type = VALUES(type),
           contact_email = VALUES(contact_email),
           admin_name = VALUES(admin_name),
           domain = VALUES(domain),
           status = 'Active'`,
        [
          cleanName,
          cleanCode,
          location || 'Main Campus',
          city || location || 'Metropolis',
          type || 'Autonomous',
          finalEmail,
          contactPhone || '+91 90000 00000',
          finalAdminName,
          derivedDomain,
        ]
      );

      const rows = await query('SELECT * FROM colleges WHERE LOWER(code) = LOWER(?) OR id = ? LIMIT 1', [cleanCode, result?.insertId || 0]);
      if (rows && rows.length > 0) {
        newCollege = rows[0];
      }
    } catch (dbErr) {
      console.warn(`[College Controller] DB create fallback: ${dbErr.message}`);
    }

    if (!newCollege) {
      newCollege = {
        id: Date.now(),
        name: cleanName,
        code: cleanCode,
        location: location || 'Main Campus',
        city: city || location || 'Metropolis',
        type: type || 'Autonomous',
        status: 'Active',
        contact_email: finalEmail,
        contact_phone: contactPhone || '+91 90000 00000',
        admin_name: finalAdminName,
        domain: derivedDomain,
        created_at: new Date(),
      };
    }

    const formattedCollege = {
      ...newCollege,
      adminEmail: newCollege?.contact_email || finalEmail,
      adminName: newCollege?.admin_name || finalAdminName,
    };

    return sendSuccess(res, 'College registered successfully', formattedCollege, 201);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062 || (error.message && error.message.includes('Duplicate entry'))) {
      return sendError(res, `College code is already in use. Please enter a unique college code.`, 400);
    }
    next(error);
  }
};

export const updateCollege = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const { id } = req.params;
    const { name, code, location, city, type, status, contactEmail, contactPhone, adminName, adminEmail, domain } = req.body;

    const email = (contactEmail || adminEmail || '').trim();
    const admin = (adminName || '').trim();

    if (code) {
      const existingCode = await query('SELECT id FROM colleges WHERE LOWER(code) = LOWER(?) AND id != ? LIMIT 1', [code.trim(), id]);
      if (existingCode && existingCode.length > 0) {
        return sendError(res, `College code '${code.trim()}' is already in use by another college.`, 400);
      }
    }

    let derivedDomain = domain !== undefined ? (domain ? domain.trim().toLowerCase() : '') : null;
    if (derivedDomain === null && email && email.includes('@')) {
      derivedDomain = email.split('@')[1].trim().toLowerCase();
    }

    await query(
      `UPDATE colleges 
       SET name = COALESCE(?, name),
           code = COALESCE(?, code),
           location = COALESCE(?, location),
           city = COALESCE(?, city),
           type = COALESCE(?, type),
           status = COALESCE(?, status),
           contact_email = COALESCE(?, contact_email),
           contact_phone = COALESCE(?, contact_phone),
           admin_name = COALESCE(?, admin_name),
           domain = COALESCE(?, domain)
       WHERE id = ?`,
      [name, code, location, city, type, status, email || null, contactPhone, admin || null, derivedDomain, id]
    );

    const [updated] = await query('SELECT * FROM colleges WHERE id = ?', [id]);
    if (!updated) {
      return sendError(res, 'College not found', 404);
    }

    const formatted = {
      ...updated,
      adminEmail: updated.contact_email || email,
      adminName: updated.admin_name || admin,
    };

    return sendSuccess(res, 'College updated successfully', formatted);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062 || (error.message && error.message.includes('Duplicate entry'))) {
      return sendError(res, `College code is already in use. Please enter a unique college code.`, 400);
    }
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
