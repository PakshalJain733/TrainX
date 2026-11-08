import { query } from '../config/db.js';
import { getCollegeForUser } from '../models/user.model.js';

/**
 * Persists a new notification into the MySQL database.
 * Supports both direct personal notifications and college-wide broadcast notices.
 */
export const createNotification = async ({
  user_id = null,
  college_id = 1,
  title,
  message,
  type = 'alert',
  category = 'Broadcast',
  priority = 'General Announcement',
  target = 'All Batches',
  created_by = null,
  created_by_name = 'Admin',
  sender_role = 'Admin',
  action_url = null,
  action_label = null,
  action_color = null,
}) => {
  if (!title || !message) {
    throw new Error('Title and message are required to create a notification');
  }

  const cleanTitle = String(title).trim();
  const cleanMessage = String(message).trim();
  const colId = college_id || 1;

  // 1. Insert into unified `notifications` table
  let notifId = null;
  try {
    const res = await query(
      `INSERT INTO notifications 
        (user_id, college_id, title, message, type, category, priority, target, created_by, created_by_name, sender_role, action_url, action_label, action_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        colId,
        cleanTitle,
        cleanMessage,
        type || 'alert',
        category || 'Broadcast',
        priority || 'General Announcement',
        target || 'All Batches',
        created_by || null,
        created_by_name || 'Admin',
        sender_role || 'Admin',
        action_url || null,
        action_label || null,
        action_color || null,
      ]
    );
    notifId = res?.insertId;
  } catch (err) {
    console.warn('[Notification Service] notifications table insert notice:', err.message);
  }

  // 2. Also insert into `broadcasts` table if broad/announcement for compatibility
  let broadcastId = null;
  if (!user_id) {
    try {
      const bRes = await query(
        `INSERT INTO broadcasts (college_id, title, message, target, priority, created_by, created_by_name, sender_role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          colId,
          cleanTitle,
          cleanMessage,
          target || 'All Batches',
          priority || 'General Announcement',
          created_by || null,
          created_by_name || 'Admin',
          sender_role || 'Admin',
        ]
      );
      broadcastId = bRes?.insertId;
    } catch (err) {
      console.warn('[Notification Service] broadcasts table insert notice:', err.message);
    }
  }

  return {
    id: notifId || broadcastId || Date.now(),
    user_id,
    college_id: colId,
    title: cleanTitle,
    message: cleanMessage,
    type,
    category,
    priority,
    target,
    created_by,
    created_by_name,
    sender_role,
    action_url,
    action_label,
    action_color,
    created_at: new Date().toISOString(),
  };
};

/**
 * Retrieves all relevant notifications for a user, enriched with persistent DB read/deleted state.
 */
export const getUserNotifications = async (user = {}) => {
  const userId = user.userId || user.id;
  if (!userId) return [];

  let collegeId = user.collegeId || user.college_id;
  if (!collegeId) {
    const col = await getCollegeForUser(userId).catch(() => null);
    collegeId = col?.id || 1;
  }

  const role = String(user.role || 'student').toLowerCase();

  // 1. Fetch user persistent state (read & deleted records)
  const userStates = new Map();
  try {
    const states = await query(
      `SELECT notification_id, is_read, is_deleted FROM notification_user_states WHERE user_id = ?`,
      [userId]
    );
    if (Array.isArray(states)) {
      states.forEach((st) => {
        userStates.set(String(st.notification_id), {
          is_read: Boolean(st.is_read),
          is_deleted: Boolean(st.is_deleted),
        });
      });
    }
  } catch (err) {
    console.warn('[Notification Service] user states query notice:', err.message);
  }

  const resultItems = [];

  // 2. Fetch direct personal notifications from `notifications` table
  try {
    const directNotifs = await query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC`,
      [userId]
    );
    if (Array.isArray(directNotifs)) {
      for (const d of directNotifs) {
        const idKey = `notif-${d.id}`;
        const state = userStates.get(idKey) || userStates.get(String(d.id));
        if (state?.is_deleted) continue;

        resultItems.push({
          id: idKey,
          db_id: d.id,
          title: d.title,
          desc: d.message,
          message: d.message,
          body: d.message,
          type: d.type || 'alert',
          category: d.category || 'System',
          priority: d.priority || 'Normal',
          target: d.target || 'Direct',
          created_by_name: d.created_by_name || 'System',
          sender_role: d.sender_role || 'System',
          actionUrl: d.action_url,
          actionLabel: d.action_label,
          actionColor: d.action_color,
          unread: state ? !state.is_read : true,
          time: d.created_at ? new Date(d.created_at).toLocaleString() : 'Recently',
          created_at: d.created_at,
        });
      }
    }
  } catch (_) {}

  // 3. Fetch college-wide broadcasts from `broadcasts`
  try {
    const rawBroadcasts = await query(
      `SELECT b.*, u.role AS creator_role, u.name AS creator_name
       FROM broadcasts b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE (b.college_id = ? OR b.college_id IS NULL OR b.college_id = 1)
       ORDER BY b.id DESC`,
      [collegeId]
    );

    if (Array.isArray(rawBroadcasts)) {
      for (const b of rawBroadcasts) {
        const idKey = `broadcast-${b.id}`;
        const state = userStates.get(idKey) || userStates.get(String(b.id));
        if (state?.is_deleted) continue;

        const senderRole = String(b.sender_role || b.creator_role || 'Admin').toLowerCase();
        const createdByName = b.created_by_name || b.creator_name || 'Admin';

        // Role-specific broadcast filtering
        if (role === 'admin' || role === 'college_admin') {
          // Do not show broadcasts the admin himself sent
          if (b.created_by === userId) continue;
        } else if (role === 'student') {
          // Enforce: Student only receives notifications from Admin, Mentor, Coordinator, Trainer
          const isValidSender =
            senderRole.includes('admin') ||
            senderRole.includes('mentor') ||
            senderRole.includes('coord') ||
            senderRole.includes('trainer') ||
            senderRole.includes('super');
          if (!isValidSender) continue;

          // Check if target is exclusively for staff
          const targetLower = String(b.target || '').toLowerCase();
          if (
            targetLower.includes('mentor only') ||
            targetLower.includes('coordinator only') ||
            targetLower.includes('trainers only')
          ) {
            continue;
          }
        }

        resultItems.push({
          id: idKey,
          db_id: b.id,
          title: `📢 [Notice] ${b.title}`,
          desc: b.message || b.desc_text || '',
          message: b.message || b.desc_text || '',
          body: b.message || b.desc_text || '',
          type: 'broadcast',
          category: 'Broadcast',
          priority: b.priority || 'General Announcement',
          target: b.target || 'All Batches',
          created_by_name: createdByName,
          sender_role: b.sender_role || 'Admin',
          unread: state ? !state.is_read : true,
          time: b.created_at ? new Date(b.created_at).toLocaleString() : 'Recently',
          created_at: b.created_at,
        });
      }
    }
  } catch (_) {}

  // 4. Role-specific real-time action alerts
  if (role === 'admin' || role === 'college_admin') {
    // Pending user approvals
    try {
      const pendingUsers = await query(
        `SELECT id, name, email, role, department, created_at FROM users 
         WHERE (college_id = ? OR college_id IS NULL) AND is_approved = 0 ORDER BY id DESC`,
        [collegeId]
      );
      if (Array.isArray(pendingUsers)) {
        for (const u of pendingUsers) {
          const idKey = `pending-user-${u.id}`;
          const state = userStates.get(idKey);
          if (state?.is_deleted) continue;

          resultItems.push({
            id: idKey,
            title: `👤 Approval Needed: ${u.name} (${String(u.role || 'student').toUpperCase()})`,
            desc: `${u.name} has completed registration and is awaiting account approval.`,
            message: `${u.name} (${u.email || 'N/A'}) registered as ${u.role}. Review and approve this account.`,
            type: 'alert',
            category: 'Approval',
            priority: 'High Priority',
            target: 'Campus Users',
            created_by_name: u.name,
            actionUrl: '/admin/approve-users',
            actionLabel: 'Review & Approve →',
            actionColor: '#2563eb',
            unread: state ? !state.is_read : true,
            time: u.created_at ? new Date(u.created_at).toLocaleString() : 'Action Required',
            created_at: u.created_at,
          });
        }
      }
    } catch (_) {}
  } else if (role === 'student') {
    // Student leave request updates
    try {
      const leaves = await query(
        `SELECT id, category, days, start_date, end_date, remarks, status, created_at 
         FROM leave_requests WHERE user_id = ? ORDER BY id DESC`,
        [userId]
      );
      if (Array.isArray(leaves)) {
        for (const l of leaves) {
          if (l.status === 'Approved' || l.status === 'Rejected') {
            const idKey = `student-leave-${l.id}`;
            const state = userStates.get(idKey);
            if (state?.is_deleted) continue;

            const isApproved = l.status === 'Approved';
            resultItems.push({
              id: idKey,
              title: `${isApproved ? '✅' : '❌'} Leave Request ${l.status}: ${l.category || 'Leave'}`,
              desc: `Your leave application for ${l.days || 1} day(s) was ${l.status.toLowerCase()}.${l.remarks ? ` Remarks: ${l.remarks}` : ''}`,
              message: `Your leave application was marked as ${l.status}.${l.remarks ? ` Remarks: ${l.remarks}` : ''}`,
              type: isApproved ? 'success' : 'alert',
              category: 'Academic',
              priority: 'Standard',
              target: 'My Attendance',
              created_by_name: 'Attendance Desk',
              actionUrl: '/student/attendance',
              actionLabel: 'View Attendance →',
              actionColor: isApproved ? '#10b981' : '#ef4444',
              unread: state ? !state.is_read : false,
              time: l.created_at ? new Date(l.created_at).toLocaleString() : 'Update',
              created_at: l.created_at,
            });
          }
        }
      }
    } catch (_) {}
  }

  // Sort by created_at descending
  resultItems.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return resultItems;
};

/**
 * Marks a single notification as read in the database for the user.
 */
export const markNotificationRead = async (userId, notificationId) => {
  if (!userId || !notificationId) return;
  const idStr = String(notificationId).trim();

  await query(
    `INSERT INTO notification_user_states (user_id, notification_id, is_read, is_deleted)
     VALUES (?, ?, 1, 0)
     ON DUPLICATE KEY UPDATE is_read = 1`,
    [userId, idStr]
  );
};

/**
 * Marks all notifications for a user as read in the database.
 */
export const markAllNotificationsRead = async (userId, notificationIds = []) => {
  if (!userId) return;

  if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    for (const id of notificationIds) {
      await markNotificationRead(userId, id).catch(() => {});
    }
  } else {
    try {
      const items = await getUserNotifications({ id: userId, userId });
      for (const item of items) {
        if (item.id) {
          await markNotificationRead(userId, item.id).catch(() => {});
        }
      }
    } catch (_) {}
  }
};

/**
 * Deletes / dismisses a notification for a user in the database.
 */
export const deleteNotification = async (userId, notificationId) => {
  if (!userId || !notificationId) return;
  const idStr = String(notificationId).trim();

  await query(
    `INSERT INTO notification_user_states (user_id, notification_id, is_read, is_deleted)
     VALUES (?, ?, 1, 1)
     ON DUPLICATE KEY UPDATE is_deleted = 1, is_read = 1`,
    [userId, idStr]
  );
};

/**
 * Clears all notifications for a user in the database.
 */
export const clearAllNotifications = async (userId, notificationIds = []) => {
  if (!userId) return;

  if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    for (const id of notificationIds) {
      await deleteNotification(userId, id).catch(() => {});
    }
  } else {
    try {
      const items = await getUserNotifications({ id: userId, userId });
      for (const item of items) {
        if (item.id) {
          await deleteNotification(userId, item.id).catch(() => {});
        }
      }
    } catch (_) {}
  }
};
