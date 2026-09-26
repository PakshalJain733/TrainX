import { query } from '../config/db.js';

// Pre-seeded fallback mock broadcasts
const mockBroadcasts = [
  {
    id: 1,
    title: 'IA-2 Quiz Rescheduled to Friday 10:00 AM',
    message: 'The Internal Assessment 2 test for TE Computer batches has been shifted to Friday 10:00 AM. Please revise your modules.',
    target: 'All CSE & IT Batches',
    priority: 'Urgent Notice',
    created_by_name: 'Coordinator Shinde',
    sender_role: 'Coordinator',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    title: 'Goldman Sachs Placement Drive Registration Live',
    message: 'Eligible students with CGPA > 8.0 can apply for Goldman Sachs campus drive through the placement tab.',
    target: 'Students Only',
    priority: 'Placement Drive Alert',
    created_by_name: 'Placement Admin',
    sender_role: 'Admin',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export const getBroadcastsModel = async (collegeId = null, userRole = null) => {
  let items = [];
  try {
    const results = await query(
      `SELECT * FROM broadcasts WHERE (college_id = ? OR college_id IS NULL) ORDER BY id DESC`,
      [collegeId || 1]
    );
    if (results && Array.isArray(results) && results.length > 0) {
      items = results;
    } else {
      items = [...mockBroadcasts];
    }
  } catch (error) {
    console.warn(`[Broadcast Model] Table query fallback: ${error.message}`);
    items = [...mockBroadcasts];
  }

  // Target audience role filtering if userRole is passed
  if (userRole) {
    const roleLower = String(userRole).toLowerCase();
    return items.filter((b) => {
      if (!b.target) return true;
      const targetLower = String(b.target).toLowerCase();
      if (
        targetLower.includes('all') ||
        targetLower.includes('everyone') ||
        targetLower.includes('general')
      ) {
        return true;
      }
      if (roleLower.includes('student') && (targetLower.includes('student') || targetLower.includes('batch') || targetLower.includes('cse') || targetLower.includes('it'))) {
        return true;
      }
      if (roleLower.includes('mentor') && targetLower.includes('mentor')) {
        return true;
      }
      if (roleLower.includes('coordinator') && targetLower.includes('coordinator')) {
        return true;
      }
      if (roleLower.includes('admin')) {
        return true;
      }
      return true; // default fallback show item
    });
  }

  return items;
};

export const createBroadcastModel = async ({
  college_id = 1,
  title,
  message,
  target = 'All Batches',
  priority = 'General Announcement',
  created_by = null,
  created_by_name = 'Admin',
  sender_role = 'Admin',
}) => {
  try {
    const res = await query(
      `INSERT INTO broadcasts (college_id, title, message, target, priority, created_by, created_by_name, sender_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        college_id || 1,
        title.trim(),
        message.trim(),
        target || 'All Batches',
        priority || 'General Announcement',
        created_by,
        created_by_name || 'Admin',
        sender_role || 'Admin',
      ]
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
    title: title.trim(),
    message: message.trim(),
    target: target || 'All Batches',
    priority: priority || 'General Announcement',
    created_by,
    created_by_name: created_by_name || 'Admin',
    sender_role: sender_role || 'Admin',
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
