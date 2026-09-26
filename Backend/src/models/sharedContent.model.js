import { query } from '../config/db.js';

/**
 * SHARED CONTENT MODEL
 * Stores all cross-dashboard shared entities:
 *   - quiz       : MCQ Assessments created by Admin/Mentor/Coordinator
 *   - coding     : Coding practice problems
 *   - drive      : Placement mock drives
 *   - learning   : Learning content / study materials
 *   - broadcast  : Broadcast announcements / notices
 */

// ── Auto-create table if it doesn't exist ────────────────────────────────────
export const initSharedContentTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS shared_content (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        type        VARCHAR(100) NOT NULL,
        title       VARCHAR(500) NOT NULL,
        description TEXT,
        data_json   LONGTEXT,
        status      VARCHAR(50)  DEFAULT 'Active',
        college_id  INT          DEFAULT 1,
        created_by  INT          DEFAULT NULL,
        batch_id    INT          DEFAULT NULL,
        batch_name  VARCHAR(255) DEFAULT 'All Batches',
        target      VARCHAR(255) DEFAULT 'All',
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type   (type),
        INDEX idx_college (college_id),
        INDEX idx_batch  (batch_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    try {
      await query(`ALTER TABLE shared_content MODIFY COLUMN type VARCHAR(100) NOT NULL`);
      await query(`ALTER TABLE shared_content MODIFY COLUMN data_json LONGTEXT`);
    } catch (_) {}
    try { await query(`ALTER TABLE shared_content ADD COLUMN batch_id INT DEFAULT NULL`); } catch (_) {}
    try { await query(`ALTER TABLE shared_content ADD INDEX idx_batch (batch_id)`); } catch (_) {}
    console.log('[SharedContent] Table ready.');
  } catch (err) {
    console.warn('[SharedContent] Table init skipped:', err.message);
  }
};

// ── GET all items of a given type ─────────────────────────────────────────────
export const getSharedContentByType = async (type, collegeId = 1, { batchId = null } = {}) => {
  try {
    const params = [type, collegeId];
    let sql = `SELECT * FROM shared_content
       WHERE type = ? AND (college_id = ? OR college_id IS NULL)`;
    if (batchId) {
      sql += ` AND (batch_id = ? OR batch_id IS NULL)`;
      params.push(batchId);
    }
    sql += ` ORDER BY id DESC`;

    const rows = await query(sql, params);
    return (rows || []).map(r => ({
      ...r,
      data: (() => {
        try { return JSON.parse(r.data_json || '{}'); } catch { return {}; }
      })(),
    }));
  } catch (err) {
    console.warn(`[SharedContent] getByType(${type}) failed:`, err.message);
    return [];
  }
};

// ── GET all items (all types) ─────────────────────────────────────────────────
export const getAllSharedContent = async (collegeId = 1) => {
  try {
    const rows = await query(
      `SELECT * FROM shared_content
       WHERE college_id = ? OR college_id IS NULL
       ORDER BY id DESC`,
      [collegeId]
    );
    return (rows || []).map(r => ({
      ...r,
      data: (() => {
        try { return JSON.parse(r.data_json || '{}'); } catch { return {}; }
      })(),
    }));
  } catch (err) {
    console.warn('[SharedContent] getAll failed:', err.message);
    return [];
  }
};

// ── CREATE a new shared item ──────────────────────────────────────────────────
export const createSharedContent = async ({
  type,
  title,
  description = '',
  data = {},
  status = 'Active',
  college_id = 1,
  created_by = null,
  batch_id = null,
  batch_name = 'All Batches',
  target = 'All',
}) => {
  const dataJson = JSON.stringify(data);

  // Validate created_by foreign key
  let validCreatedBy = null;
  if (created_by) {
    try {
      const rows = await query('SELECT id FROM users WHERE id = ?', [created_by]);
      if (rows && rows.length > 0) validCreatedBy = created_by;
    } catch { /* skip */ }
  }

  try {
    const result = await query(
      `INSERT INTO shared_content
         (type, title, description, data_json, status, college_id, created_by, batch_id, batch_name, target)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, title.trim(), description || '', dataJson, status, college_id || 1, validCreatedBy, batch_id, batch_name, target]
    );

    if (result && result.insertId) {
      const rows = await query('SELECT * FROM shared_content WHERE id = ?', [result.insertId]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          data: (() => { try { return JSON.parse(r.data_json || '{}'); } catch { return {}; } })(),
        };
      }
    }
  } catch (err) {
    console.warn('[SharedContent] Insert failed:', err.message);
  }
  return null;
};

// ── DELETE by id ──────────────────────────────────────────────────────────────
export const deleteSharedContent = async (id) => {
  try {
    await query('DELETE FROM shared_content WHERE id = ?', [parseInt(id, 10)]);
    return true;
  } catch (err) {
    console.warn('[SharedContent] Delete failed:', err.message);
    return false;
  }
};
