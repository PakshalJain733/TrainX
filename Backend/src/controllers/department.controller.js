import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';

let tablesInitialized = false;
async function ensureDeptTable() {
  if (tablesInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        hod_name VARCHAR(100) NULL,
        hod_email VARCHAR(255) NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    tablesInitialized = true;
  } catch (e) {
    console.warn('[DB ensureDeptTable error]', e.message);
  }
}

export const getDepartments = async (req, res, next) => {
  try {
    await ensureDeptTable();
    const { collegeId, college_id } = req.query;
    const userCollegeId = req.user?.college_id || req.user?.collegeId;
    let cid = collegeId || college_id;
    if (!cid && userCollegeId && req.user?.role !== 'super_admin') {
      cid = userCollegeId;
    }

    let sql = `
      SELECT d.*, c.name AS college_name, c.code AS college_code
      FROM departments d
      LEFT JOIN colleges c ON d.college_id = c.id
      WHERE (d.status IS NULL OR LOWER(d.status) = 'active')
    `;
    const params = [];

    if (cid && cid !== 'all') {
      sql += ' AND d.college_id = ?';
      params.push(cid);
    }

    sql += ' ORDER BY d.id ASC';

    const dbDepts = await query(sql, params);
    const formatted = await Promise.all((dbDepts || []).map(async (d) => {
      const shortCode = (d.code && d.code.trim()) || (d.name && d.name.trim()) || '';

      let studentsCount = 0;
      let batchesCount = 0;

      try {
        const sc = await query(`
          SELECT COUNT(DISTINCT u.id) AS count
          FROM users u
          JOIN students s ON u.id = s.user_id
          WHERE u.role = 'student'
            AND (u.college_id = ? OR u.college_id IS NULL OR ? IS NULL)
            AND (
              s.department_id = ?
              OR LOWER(TRIM(s.department)) = LOWER(TRIM(?))
              OR LOWER(TRIM(s.department)) = LOWER(TRIM(?))
              OR LOWER(TRIM(?)) LIKE CONCAT('%', LOWER(TRIM(s.department)), '%')
              OR LOWER(TRIM(s.department)) LIKE CONCAT('%', LOWER(TRIM(?)), '%')
            )
        `, [d.college_id, d.college_id, d.id, d.code, d.name, d.name, d.code]);
        studentsCount = sc[0]?.count || 0;
      } catch (err) {
        console.warn('Error counting students for dept:', d.id, err.message);
      }

      try {
        const bc = await query(`
          SELECT COUNT(DISTINCT b_id) AS count
          FROM (
            SELECT b.id AS b_id
            FROM batches b
            WHERE b.department_id = ?

            UNION

            SELECT sb.batch_id AS b_id
            FROM student_batches sb
            JOIN students s ON sb.user_id = s.user_id
            JOIN users u ON u.id = s.user_id
            WHERE u.role = 'student'
              AND (u.college_id = ? OR u.college_id IS NULL OR ? IS NULL)
              AND (
                s.department_id = ?
                OR LOWER(TRIM(s.department)) = LOWER(TRIM(?))
                OR LOWER(TRIM(s.department)) = LOWER(TRIM(?))
                OR LOWER(TRIM(?)) LIKE CONCAT('%', LOWER(TRIM(s.department)), '%')
                OR LOWER(TRIM(s.department)) LIKE CONCAT('%', LOWER(TRIM(?)), '%')
              )

            UNION

            SELECT s.batch_id AS b_id
            FROM students s
            JOIN users u ON u.id = s.user_id
            WHERE u.role = 'student'
              AND s.batch_id IS NOT NULL
              AND (u.college_id = ? OR u.college_id IS NULL OR ? IS NULL)
              AND (
                s.department_id = ?
                OR LOWER(TRIM(s.department)) = LOWER(TRIM(?))
                OR LOWER(TRIM(s.department)) = LOWER(TRIM(?))
                OR LOWER(TRIM(?)) LIKE CONCAT('%', LOWER(TRIM(s.department)), '%')
                OR LOWER(TRIM(s.department)) LIKE CONCAT('%', LOWER(TRIM(?)), '%')
              )
          ) AS dept_batches
        `, [
          d.id,
          d.college_id, d.college_id, d.id, d.code, d.name, d.name, d.code,
          d.college_id, d.college_id, d.id, d.code, d.name, d.name, d.code
        ]);
        batchesCount = bc[0]?.count || 0;
      } catch (err) {
        console.warn('Error counting batches for dept:', d.id, err.message);
      }

      return {
        ...d,
        id: d.id,
        code: shortCode,
        shortCode,
        value: shortCode,
        label: shortCode,
        name: d.name,
        fullName: d.name,
        collegeId: d.college_id,
        college_id: d.college_id,
        collegeName: d.college_name || '',
        college_name: d.college_name || '',
        hodName: d.hod_name || '',
        hodEmail: d.hod_email || '',
        status: d.status || 'Active',
        studentsCount,
        activeStudents: studentsCount,
        batchesCount,
        activeBatches: batchesCount,
      };
    }));
    return sendSuccess(res, 'Departments retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    await ensureDeptTable();
    const { name, code, collegeId, college_id, hodName, hod_name, hodEmail, hod_email } = req.body;
    if (!name || !code) {
      return sendError(res, 'Department Name and Code are required', 400);
    }
    const cId = collegeId || college_id || req.user?.college_id || req.user?.collegeId || 1;
    const hName = hodName || hod_name || 'Dr. Department HOD';
    const hEmail = hodEmail || hod_email || `hod.${code.toLowerCase()}@college.edu.in`;

    const result = await query(
      `INSERT INTO departments (college_id, name, code, hod_name, hod_email, status)
       VALUES (?, ?, ?, ?, ?, 'Active')`,
      [
        cId,
        name.trim(),
        code.trim(),
        hName,
        hEmail
      ]
    );

    const [newDept] = await query('SELECT * FROM departments WHERE id = ?', [result.insertId]);

    const formatted = {
      ...newDept,
      collegeId: newDept?.college_id || cId,
      college_id: newDept?.college_id || cId,
      hodName: newDept?.hod_name || hName,
      hodEmail: newDept?.hod_email || hEmail,
    };

    return sendSuccess(res, 'Department created successfully', formatted, 201);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    await ensureDeptTable();
    const { id } = req.params;
    const { name, code, hodName, hodEmail, status } = req.body;

    await query(
      `UPDATE departments
       SET name = COALESCE(?, name),
           code = COALESCE(?, code),
           hod_name = COALESCE(?, hod_name),
           hod_email = COALESCE(?, hod_email),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, code, hodName, hodEmail, status, id]
    );

    const [updated] = await query('SELECT * FROM departments WHERE id = ?', [id]);
    if (!updated) {
      return sendError(res, 'Department not found', 404);
    }

    return sendSuccess(res, 'Department updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    await ensureDeptTable();
    const { id } = req.params;
    await query('DELETE FROM departments WHERE id = ?', [id]);
    return sendSuccess(res, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};
