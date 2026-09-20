import { query } from '../config/db.js';

export const getBroadcastsModel = async (collegeId = null) => {
  try {
    const results = await query(
      `SELECT * FROM broadcasts WHERE college_id = ? OR college_id IS NULL ORDER BY id DESC`,
      [collegeId || 1]
    );
    return (results && Array.isArray(results)) ? results : [];
  } catch (error) {
    console.warn(`[Broadcast Model] Query failed: ${error.message}`);
    return [];
  }
};

export const createBroadcastModel = async ({
  college_id = 1,
  title,
  message,
  target = 'All Batches',
  priority = 'General Announcement',
  created_by = null,
}) => {
  const res = await query(
    `INSERT INTO broadcasts (college_id, title, message, target, priority, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
    [college_id || 1, title.trim(), message.trim(), target, priority, created_by]
  );
  if (!res || !res.insertId) {
    throw new Error('Failed to persist broadcast');
  }
  const rows = await query(`SELECT * FROM broadcasts WHERE id = ?`, [res.insertId]);
  if (rows && rows.length > 0) return rows[0];
  throw new Error('Failed to read created broadcast');
};

export const deleteBroadcastModel = async (id) => {
  await query(`DELETE FROM broadcasts WHERE id = ?`, [parseInt(id, 10)]);
  return true;
};