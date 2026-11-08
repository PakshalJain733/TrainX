import {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/notification.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/v1/notifications
 * Retrieves all saved database notifications for the logged in user.
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const user = req.user || {};
    const notifications = await getUserNotifications(user);
    return sendSuccess(res, 'Notifications retrieved successfully from database', notifications);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/notifications
 * Creates and saves a new notification directly to the database.
 */
export const postNotification = async (req, res, next) => {
  try {
    const { title, message, type, category, priority, target, user_id, action_url, action_label, action_color } = req.body;
    if (!title || !message) {
      return sendError(res, 'Notification title and message are required', 400);
    }

    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const senderName = req.user?.name || req.user?.username || 'Admin';
    const senderRole = req.user?.role || 'Admin';

    const created = await createNotification({
      user_id: user_id || null,
      college_id: collegeId,
      title,
      message,
      type: type || 'alert',
      category: category || 'Broadcast',
      priority: priority || 'General Announcement',
      target: target || 'All Batches',
      created_by: req.user?.id || req.user?.userId || null,
      created_by_name: senderName,
      sender_role: senderRole,
      action_url,
      action_label,
      action_color,
    });

    return sendSuccess(res, 'Notification saved to database successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notifications/:id/read
 * Marks a single notification as read in the database.
 */
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    if (!userId || !id) {
      return sendError(res, 'User ID and notification ID are required', 400);
    }

    await markNotificationRead(userId, id);
    return sendSuccess(res, 'Notification marked as read in database');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notifications/read-all
 * Marks all notifications as read in the database.
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { ids } = req.body || {};

    await markAllNotificationsRead(userId, ids);
    return sendSuccess(res, 'All notifications marked as read in database');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/notifications/:id
 * Dismisses / deletes a notification for this user in the database.
 */
export const deleteMyNotification = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    await deleteNotification(userId, id);
    return sendSuccess(res, 'Notification removed from database for user');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/notifications/clear-all
 * Clears all notifications for this user in the database.
 */
export const clearAllMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { ids } = req.body || {};

    await clearAllNotifications(userId, ids);
    return sendSuccess(res, 'All notifications cleared in database for user');
  } catch (error) {
    next(error);
  }
};

