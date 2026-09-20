import { query } from '../config/db.js';

/**
 * Fetch a student's active roadmap with all milestone items
 * Returns null when the student has no roadmap. DB errors propagate to the caller.
 */
export const getRoadmapByStudentId = async (studentId) => {
  const sId = Number(studentId);

  const roadmaps = await query(
    'SELECT * FROM roadmaps WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
    [sId]
  );

  if (roadmaps && roadmaps.length > 0) {
    const roadmap = roadmaps[0];
    const items = await query(
      'SELECT * FROM roadmap_items WHERE roadmap_id = ? ORDER BY sequence_order ASC',
      [roadmap.id]
    );

    return {
      id: roadmap.id,
      studentId: roadmap.student_id,
      targetRole: roadmap.target_role,
      careerTrack: roadmap.career_track,
      updatedAt: roadmap.updated_at || roadmap.created_at,
      milestones: items.map((item) => ({
        id: item.id,
        title: item.title,
        desc: item.description,
        status: item.status, // 'completed' | 'in-progress' | 'locked'
        progress: item.progress || 0,
        tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || []),
        quizzes: item.quizzes || 0,
        exercises: item.exercises || 0,
      })),
    };
  }

  return null;
};

/**
 * Save or overwrite a student's AI generated roadmap
 * DB errors propagate to the caller (no in-memory fallback).
 */
export const saveRoadmap = async (studentId, targetRole, careerTrackName, milestones) => {
  const sId = Number(studentId);

  // Delete existing roadmap items and roadmap for student to maintain fresh active roadmap
  const existing = await query('SELECT id FROM roadmaps WHERE student_id = ?', [sId]);
  if (existing && existing.length > 0) {
    for (const r of existing) {
      await query('DELETE FROM roadmap_items WHERE roadmap_id = ?', [r.id]);
    }
    await query('DELETE FROM roadmaps WHERE student_id = ?', [sId]);
  }

  const res = await query(
    'INSERT INTO roadmaps (student_id, target_role, career_track, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [sId, targetRole, careerTrackName]
  );

  if (res && res.insertId) {
    const roadmapId = res.insertId;
    const insertedItems = [];

    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      const tagsJson = JSON.stringify(m.tags || []);

      const itemRes = await query(
        'INSERT INTO roadmap_items (roadmap_id, sequence_order, title, description, status, progress, tags, quizzes, exercises) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [roadmapId, i + 1, m.title, m.desc, m.status, m.progress || 0, tagsJson, m.quizzes || 0, m.exercises || 0]
      );

      insertedItems.push({
        id: itemRes.insertId || i + 1,
        ...m,
      });
    }

    return {
      id: roadmapId,
      studentId: sId,
      targetRole,
      careerTrack: careerTrackName,
      updatedAt: new Date(),
      milestones: insertedItems,
    };
  }

  throw new Error('Failed to persist roadmap record');
};

/**
 * Update milestone status & progress
 * Returns null when no matching item exists. DB errors propagate to the caller.
 */
export const updateMilestoneItemStatus = async (studentId, itemId, status, progress) => {
  const itId = Number(itemId);

  const res = await query(
    'UPDATE roadmap_items SET status = ?, progress = ? WHERE id = ?',
    [status, progress, itId]
  );

  if (res && res.affectedRows > 0) {
    return getRoadmapByStudentId(studentId);
  }

  return null;
};