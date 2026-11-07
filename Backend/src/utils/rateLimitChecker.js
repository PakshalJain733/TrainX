import { query } from '../config/db.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Check if the user is exempt from rate limiting (admins, superadmins, mentors).
 */
export const isUserExempt = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  return ['admin', 'superadmin', 'mentor', 'coordinator'].includes(normalized);
};

/**
 * Check if a student is locked from attending a new AI Interview (7-day lock).
 * @param {number|string} userId
 * @param {string} userRole
 * @returns {Promise<{ isLocked: boolean, lockedUntil: string|null, remainingDays: number, remainingHours: number, lastAttendedAt: string|null, message: string }>}
 */
export const checkInterviewLock = async (userId, userRole = 'student') => {
  if (isUserExempt(userRole)) {
    return {
      isLocked: false,
      lockedUntil: null,
      remainingDays: 0,
      remainingHours: 0,
      lastAttendedAt: null,
      message: 'Rate limit exempt.',
    };
  }

  const sId = Number(userId);
  if (!sId) {
    return { isLocked: false, lockedUntil: null, remainingDays: 0, remainingHours: 0, lastAttendedAt: null, message: '' };
  }

  try {
    const rows = await query(
      `SELECT id, created_at, conducted_date, interview_type, overall_score, status
       FROM interview_sessions
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [sId]
    );

    if (!rows || rows.length === 0) {
      return {
        isLocked: false,
        lockedUntil: null,
        remainingDays: 0,
        remainingHours: 0,
        lastAttendedAt: null,
        message: 'No previous interviews attended.',
      };
    }

    const lastSession = rows[0];
    const lastDate = new Date(lastSession.created_at || lastSession.conducted_date || Date.now());
    const now = new Date();
    const unlockTime = new Date(lastDate.getTime() + SEVEN_DAYS_MS);

    if (now.getTime() < unlockTime.getTime()) {
      const diffMs = unlockTime.getTime() - now.getTime();
      const remainingDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      const remainingHours = Math.ceil(diffMs / (60 * 60 * 1000));
      const formattedDate = unlockTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        isLocked: true,
        lastAttendedAt: lastDate.toISOString(),
        lockedUntil: unlockTime.toISOString(),
        remainingDays,
        remainingHours,
        interviewType: lastSession.interview_type,
        message: `AI Interview Locked: You attended an interview on ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Mock interviews are locked for 7 days to give you time to revise and prepare. Next interview available on ${formattedDate} (${remainingDays} day${remainingDays > 1 ? 's' : ''} remaining).`,
      };
    }

    return {
      isLocked: false,
      lockedUntil: null,
      remainingDays: 0,
      remainingHours: 0,
      lastAttendedAt: lastDate.toISOString(),
      message: 'Interview unlocked.',
    };
  } catch (error) {
    console.warn(`[RateLimitChecker] Interview lock check warning: ${error.message}`);
    return { isLocked: false, lockedUntil: null, remainingDays: 0, remainingHours: 0, lastAttendedAt: null, message: '' };
  }
};

/**
 * Record the start of an interview in interview_sessions so the 7-day cooldown begins immediately.
 * @param {number|string} userId
 * @param {string} role
 * @param {string} topic
 * @returns {Promise<number|null>}
 */
export const recordInterviewStart = async (userId, role = '', topic = '') => {
  const sId = Number(userId);
  if (!sId) return null;

  try {
    const interviewType = topic || role || 'Technical Mock';
    const date = new Date().toISOString().slice(0, 10);
    const details = JSON.stringify({
      role,
      topic,
      startedAt: Date.now(),
      status: 'in_progress',
    });

    const res = await query(
      `INSERT INTO interview_sessions
         (user_id, student_id, interview_type, overall_score, grade, feedback, conducted_date, status, details)
       VALUES (?, ?, ?, 0, 'In Progress', 'Interview in progress', ?, 'In Progress', ?)`,
      [sId, sId, interviewType, date, details]
    );

    return res?.insertId || null;
  } catch (error) {
    console.warn(`[RateLimitChecker] Failed to record interview start: ${error.message}`);
    return null;
  }
};

/**
 * Check if a student is locked from generating a new AI Roadmap (7-day lock).
 * @param {number|string} studentId
 * @param {string} userRole
 * @returns {Promise<{ isLocked: boolean, lockedUntil: string|null, remainingDays: number, remainingHours: number, lastGeneratedAt: string|null, currentRole: string|null, message: string }>}
 */
export const checkRoadmapLock = async (studentId, userRole = 'student') => {
  if (isUserExempt(userRole)) {
    return {
      isLocked: false,
      lockedUntil: null,
      remainingDays: 0,
      remainingHours: 0,
      lastGeneratedAt: null,
      currentRole: null,
      message: 'Rate limit exempt.',
    };
  }

  const sId = Number(studentId);
  if (!sId) {
    return { isLocked: false, lockedUntil: null, remainingDays: 0, remainingHours: 0, lastGeneratedAt: null, currentRole: null, message: '' };
  }

  try {
    const rows = await query(
      `SELECT id, target_role, created_at
       FROM roadmaps
       WHERE student_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [sId]
    );

    if (!rows || rows.length === 0) {
      return {
        isLocked: false,
        lockedUntil: null,
        remainingDays: 0,
        remainingHours: 0,
        lastGeneratedAt: null,
        currentRole: null,
        message: 'No roadmap generated yet.',
      };
    }

    const lastRoadmap = rows[0];
    const lastDate = new Date(lastRoadmap.created_at || Date.now());
    const now = new Date();
    const unlockTime = new Date(lastDate.getTime() + SEVEN_DAYS_MS);

    if (now.getTime() < unlockTime.getTime()) {
      const diffMs = unlockTime.getTime() - now.getTime();
      const remainingDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      const remainingHours = Math.ceil(diffMs / (60 * 60 * 1000));
      const formattedDate = unlockTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        isLocked: true,
        lastGeneratedAt: lastDate.toISOString(),
        lockedUntil: unlockTime.toISOString(),
        remainingDays,
        remainingHours,
        currentRole: lastRoadmap.target_role,
        message: `AI Roadmap Locked: You generated an AI roadmap for "${lastRoadmap.target_role || 'General'}" on ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. AI Roadmap generation is locked for 7 days so you can focus on mastering your current milestones. Next generation unlocks on ${formattedDate} (${remainingDays} day${remainingDays > 1 ? 's' : ''} remaining).`,
      };
    }

    return {
      isLocked: false,
      lockedUntil: null,
      remainingDays: 0,
      remainingHours: 0,
      lastGeneratedAt: lastDate.toISOString(),
      currentRole: lastRoadmap.target_role,
      message: 'Roadmap generation unlocked.',
    };
  } catch (error) {
    console.warn(`[RateLimitChecker] Roadmap lock check warning: ${error.message}`);
    return { isLocked: false, lockedUntil: null, remainingDays: 0, remainingHours: 0, lastGeneratedAt: null, currentRole: null, message: '' };
  }
};

