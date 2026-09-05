import { query } from '../config/db.js';

// Pre-seeded fallback mock broadcasts
const mockBroadcasts = [
  {
    id: 1,
    title: 'IA-2 Quiz Rescheduled to Friday 10:00 AM',
    message: 'The Internal Assessment 2 test for TE Computer batches has been shifted to Friday 10:00 AM. Please revise your modules.',
    target: 'All CSE & IT Batches',
    priority: 'Urgent Notice',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    title: 'Goldman Sachs Placement Drive Registration Live',
    message: 'Eligible students with CGPA > 8.0 can apply for Goldman Sachs campus drive through the placement tab.',
    target: 'Students Only',
    priority: 'Placement Drive Alert',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export const getBroadcastsModel = async (collegeId = null) => {
  try {
    const results = await query(
      `SELECT * FROM broadcasts WHERE college_id = ? OR college_id IS NULL ORDER BY id DESC`,
      [collegeId || 1]
    );
    if (results && Array.isArray(results) && results.length > 0) {
      return results;
    }
  } catch (error) {
    console.warn(`[Broadcast Model] Table query fallback: ${error.message}`);
  }
  return mockBroadcasts;
};

export const createBroadcastModel = async ({
  college_id = 1,
  title,
  message,
  target = 'All Batches',
  priority = 'General Announcement',
  created_by = null,
}) => {
  try {
    const res = await query(
      `INSERT INTO broadcasts (college_id, title, message, target, priority, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [college_id || 1, title.trim(), message.trim(), target, priority, created_by]
    );
    if (res && res.insertId) {
      const rows = await query(`SELECT * FROM broadcasts WHERE id = ?`, [res.insertId]);
      if (rows && rows.length > 0) return rows[0];
    }
  } catch (error) {
    console.warn(`[Broadcast Model] Insert fallback: ${error.message}`);
  }

  const newBroadcast = {
    id: Date.now(),
    college_id,
    title,
    message,
    target,
    priority,
    created_at: new Date().toISOString(),
  };
  mockBroadcasts.unshift(newBroadcast);
  return newBroadcast;
};

export const deleteBroadcastModel = async (id) => {
  try {
    await query(`DELETE FROM broadcasts WHERE id = ?`, [parseInt(id, 10)]);
  } catch (error) {
    const idx = mockBroadcasts.findIndex((b) => b.id === Number(id));
    if (idx !== -1) mockBroadcasts.splice(idx, 1);
  }
  return true;
};
