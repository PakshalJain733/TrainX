import { query } from '../config/db.js';

/**
 * Returns a Set of all user IDs where role = 'mentor'
 */
export const getMentorUserIds = async () => {
  try {
    const rows = await query(`SELECT id FROM users WHERE role = 'mentor'`);
    return new Set((rows || []).map(r => Number(r.id)));
  } catch (err) {
    console.warn('[getMentorUserIds] Query failed:', err.message);
    return new Set();
  }
};

/**
 * Given a student user ID, returns an array of mentor user IDs assigned to this student.
 */
export const getStudentMentorIds = async (studentUserId) => {
  if (!studentUserId) return [];
  const sId = Number(studentUserId);
  const mentorIds = new Set();

  try {
    // 1. Direct mentor_student_assignments
    const msaRows = await query(
      `SELECT mentor_id FROM mentor_student_assignments WHERE student_id = ?`,
      [sId]
    ).catch(() => []);
    msaRows.forEach(r => {
      if (r.mentor_id) mentorIds.add(Number(r.mentor_id));
    });

    // 2. Training enrollments join mentor_student_assignments
    const teRows = await query(
      `SELECT msa.mentor_id 
       FROM training_enrollments te
       JOIN mentor_student_assignments msa ON msa.student_id = te.student_user_id
       WHERE te.student_user_id = ?`,
      [sId]
    ).catch(() => []);
    teRows.forEach(r => {
      if (r.mentor_id) mentorIds.add(Number(r.mentor_id));
    });

    // 3. Batch assignments: student's batch has mentor or trainer matching mentor name/email
    const batchRows = await query(
      `SELECT b.mentor, b.trainer
       FROM students s
       JOIN batches b ON s.batch_id = b.id
       WHERE s.user_id = ?`,
      [sId]
    ).catch(() => []);

    const userBatchRows = await query(
      `SELECT b.mentor, b.trainer
       FROM student_batches sb
       JOIN batches b ON sb.batch_id = b.id
       WHERE sb.user_id = ?`,
      [sId]
    ).catch(() => []);

    const mentorIdentifiers = new Set();
    [...batchRows, ...userBatchRows].forEach(b => {
      if (b.mentor) mentorIdentifiers.add(b.mentor.trim().toLowerCase());
      if (b.trainer) mentorIdentifiers.add(b.trainer.trim().toLowerCase());
    });

    if (mentorIdentifiers.size > 0) {
      const allMentors = await query(
        `SELECT id, name, email FROM users WHERE role = 'mentor'`
      ).catch(() => []);
      allMentors.forEach(m => {
        const nameMatch = m.name && mentorIdentifiers.has(m.name.trim().toLowerCase());
        const emailMatch = m.email && mentorIdentifiers.has(m.email.trim().toLowerCase());
        if (nameMatch || emailMatch) {
          mentorIds.add(Number(m.id));
        }
      });
    }

    // 4. mentor_assignments table (admin-assigned)
    const maRows = await query(
      `SELECT mentor_id, mentor_name, mentor_email FROM mentor_assignments WHERE student_id = ? OR student_id = ?`,
      [sId, String(sId)]
    ).catch(() => []);
    for (const ma of maRows) {
      if (ma.mentor_id) {
        mentorIds.add(Number(ma.mentor_id));
      } else if (ma.mentor_name || ma.mentor_email) {
        const nameOrEmail = (ma.mentor_name || ma.mentor_email).trim().toLowerCase();
        const matched = await query(
          `SELECT id FROM users WHERE role = 'mentor' AND (LOWER(name) = ? OR LOWER(email) = ?)`,
          [nameOrEmail, nameOrEmail]
        ).catch(() => []);
        if (matched && matched[0]) mentorIds.add(Number(matched[0].id));
      }
    }

    // 5. students or users table direct mentor_id or mentor_name
    const studentRow = await query(
      `SELECT mentor_id, mentor_name FROM students WHERE user_id = ?`,
      [sId]
    ).catch(() => []);
    if (studentRow && studentRow[0]) {
      if (studentRow[0].mentor_id) mentorIds.add(Number(studentRow[0].mentor_id));
      if (studentRow[0].mentor_name) {
        const mRow = await query(
          `SELECT id FROM users WHERE role = 'mentor' AND LOWER(name) = ?`,
          [studentRow[0].mentor_name.trim().toLowerCase()]
        ).catch(() => []);
        if (mRow && mRow[0]) mentorIds.add(Number(mRow[0].id));
      }
    }

    const userRow = await query(
      `SELECT mentor_id, mentor_name FROM users WHERE id = ?`,
      [sId]
    ).catch(() => []);
    if (userRow && userRow[0]) {
      if (userRow[0].mentor_id) mentorIds.add(Number(userRow[0].mentor_id));
      if (userRow[0].mentor_name) {
        const mRow = await query(
          `SELECT id FROM users WHERE role = 'mentor' AND LOWER(name) = ?`,
          [userRow[0].mentor_name.trim().toLowerCase()]
        ).catch(() => []);
        if (mRow && mRow[0]) mentorIds.add(Number(mRow[0].id));
      }
    }
  } catch (err) {
    console.warn('[getStudentMentorIds] Error resolving student mentors:', err.message);
  }

  return Array.from(mentorIds);
};

/**
 * Filter an array of items (quizzes, study materials, shared content, notifications) for a given requester:
 * - If user is a student:
 *     Only allow items created/uploaded by a mentor if that mentor is assigned to the student.
 *     Admin / system items remain visible.
 * - If user is a mentor:
 *     Only allow items created/uploaded by THIS mentor or by Admin.
 *     Hide items created by other mentors.
 * - If admin / super admin / coordinator:
 *     All items visible.
 */
export const filterContentByMentorAssignment = async (items = [], user, creatorKey = 'created_by') => {
  if (!Array.isArray(items) || items.length === 0) return items;
  if (!user) return items;

  const role = (user.role || '').toLowerCase();
  const userId = Number(user.userId || user.id);

  // Admins, Super Admins, Coordinators see everything
  if (role === 'admin' || role === 'super_admin' || role === 'college_admin' || role === 'coordinator') {
    return items;
  }

  const mentorUserIds = await getMentorUserIds();

  if (role === 'student') {
    const assignedMentorIds = new Set(await getStudentMentorIds(userId));
    return items.filter(item => {
      const creatorId = item[creatorKey] !== null && item[creatorKey] !== undefined ? Number(item[creatorKey]) : null;
      // If the item wasn't created by a mentor (e.g., admin, college, system seed), it's general curriculum content
      if (!creatorId || !mentorUserIds.has(creatorId)) {
        return true;
      }
      // If it was created by a mentor, it MUST only be visible if that mentor is assigned to this student
      return assignedMentorIds.has(creatorId);
    });
  }

  if (role === 'mentor') {
    return items.filter(item => {
      const creatorId = item[creatorKey] !== null && item[creatorKey] !== undefined ? Number(item[creatorKey]) : null;
      // If creator is not a mentor (e.g. admin content), allow
      if (!creatorId || !mentorUserIds.has(creatorId)) {
        return true;
      }
      // If creator is a mentor, only allow if it's the requesting mentor
      return creatorId === userId;
    });
  }

  return items;
};

/**
 * Checks whether a student has access to an item created by a mentor
 */
export const canStudentAccessMentorItem = async (studentUserId, creatorUserId) => {
  if (!creatorUserId) return true;
  const mentorUserIds = await getMentorUserIds();
  if (!mentorUserIds.has(Number(creatorUserId))) {
    // Created by admin or system, allow
    return true;
  }
  const assignedMentorIds = await getStudentMentorIds(studentUserId);
  return assignedMentorIds.includes(Number(creatorUserId));
};
