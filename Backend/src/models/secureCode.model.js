import { pool } from '../config/db.js';

export async function findSecureCode(code, role) {
  if (!code) return null;
  const cleanCode = String(code).trim().toUpperCase();
  
  // Normalize role string matching
  let normalizedRole = 'student';
  if (role) {
    const r = String(role).toLowerCase();
    if (r.includes('admin') || r.includes('hod')) normalizedRole = 'college_admin';
    else if (r.includes('coord')) normalizedRole = 'coordinator';
    else if (r.includes('mentor') || r.includes('faculty')) normalizedRole = 'mentor';
    else if (r.includes('trainer')) normalizedRole = 'trainer';
    else if (r.includes('company')) normalizedRole = 'company';
    else if (r.includes('student')) normalizedRole = 'student';
    else normalizedRole = r;
  }

  const [rows] = await pool.query(
    `SELECT * FROM secure_codes 
     WHERE UPPER(code) = ? 
       AND status = 'active'
       AND (role = ? OR role = 'all' OR role = 'ANY')
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR max_uses = 0 OR uses_count < max_uses)
     LIMIT 1`,
    [cleanCode, normalizedRole]
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function markCodeAsUsed(codeId, userId = null) {
  if (!codeId) return;
  await pool.query(
    `UPDATE secure_codes 
     SET uses_count = uses_count + 1,
         used_by = COALESCE(used_by, ?), 
         used_at = NOW(),
         status = CASE 
           WHEN max_uses > 0 AND uses_count + 1 >= max_uses THEN 'used' 
           ELSE status 
         END
     WHERE id = ?`,
    [userId, codeId]
  );
}

export async function getAllSecureCodes() {
  const [rows] = await pool.query(
    `SELECT sc.*, u.name as used_by_name, u.email as used_by_email
     FROM secure_codes sc
     LEFT JOIN users u ON sc.used_by = u.id
     ORDER BY sc.id DESC`
  );
  return rows;
}

export async function createSecureCode({ code, role, college_name, description, max_uses = 1, expires_at }) {
  const cleanCode = String(code).trim().toUpperCase();
  const usesLimit = parseInt(max_uses, 10) || 1;

  const [result] = await pool.query(
    `INSERT INTO secure_codes (code, role, college_name, description, max_uses, uses_count, expires_at, status)
     VALUES (?, ?, ?, ?, ?, 0, ?, 'active')`,
    [cleanCode, role || 'all', college_name || null, description || null, usesLimit, expires_at || null]
  );
  return { id: result.insertId, code: cleanCode, role, college_name, description, max_uses: usesLimit, uses_count: 0, status: 'active', expires_at };
}

export async function deleteSecureCode(id) {
  const [result] = await pool.query(`DELETE FROM secure_codes WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}
