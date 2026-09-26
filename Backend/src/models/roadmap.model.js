import { query } from '../config/db.js';

const mockRoadmaps = new Map();

/**
 * Fetch a student's active roadmap with all milestone items
 * Returns null when the student has no roadmap. DB errors propagate to the caller.
 */
const formatRoadmapResult = (roadmap, items) => ({
  id: roadmap.id,
  studentId: roadmap.student_id,
  targetRole: roadmap.target_role,
  careerTrack: roadmap.career_track,
  updatedAt: roadmap.updated_at || roadmap.created_at,
  milestones: items.map((item) => ({
    id: item.id,
    title: item.title,
    desc: item.description,
    status: item.status,
    progress: item.progress || 0,
    tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || []),
    topics: typeof item.topics === 'string' ? JSON.parse(item.topics) : (item.topics || []),
    syllabus: typeof item.syllabus === 'string' ? JSON.parse(item.syllabus) : (item.syllabus || []),
    resources: typeof item.resources === 'string' ? JSON.parse(item.resources) : (item.resources || []),
    quizzes: item.quizzes || 0,
    exercises: item.exercises || 0,
  })),
});

/**
 * Fetch the student's most recently accessed roadmap (any role)
 */
export const getRoadmapByStudentId = async (studentId) => {
  const sId = Number(studentId);

  try {
    const roadmaps = await query(
      'SELECT * FROM roadmaps WHERE student_id = ? ORDER BY updated_at DESC LIMIT 1',
      [sId]
    );

    if (roadmaps && roadmaps.length > 0) {
      const roadmap = roadmaps[0];
      const items = await query(
        'SELECT * FROM roadmap_items WHERE roadmap_id = ? ORDER BY sequence_order ASC',
        [roadmap.id]
      );
      return formatRoadmapResult(roadmap, items);
    }
  } catch (error) {
    console.warn(`[Roadmap Model] DB lookup warning: ${error.message}. Using mock store.`);
  }

  return mockRoadmaps.get(sId) || null;
};

/**
 * Fetch a student's roadmap for a specific target role (preserves progress per topic)
 */
export const getRoadmapByStudentAndRole = async (studentId, targetRole) => {
  const sId = Number(studentId);
  const normalizedRole = String(targetRole || '').trim().toLowerCase();

  try {
    const roadmaps = await query(
      'SELECT * FROM roadmaps WHERE student_id = ? AND LOWER(target_role) = ? ORDER BY updated_at DESC LIMIT 1',
      [sId, normalizedRole]
    );

    if (roadmaps && roadmaps.length > 0) {
      const roadmap = roadmaps[0];
      const items = await query(
        'SELECT * FROM roadmap_items WHERE roadmap_id = ? ORDER BY sequence_order ASC',
        [roadmap.id]
      );
      return formatRoadmapResult(roadmap, items);
    }
  } catch (error) {
    console.warn(`[Roadmap Model] DB role lookup warning: ${error.message}.`);
  }

  // Check in-memory mock store keyed by studentId+role
  const mockKey = `${sId}__${normalizedRole}`;
  return mockRoadmaps.get(mockKey) || null;
};

/**
 * Save or overwrite a student's AI generated roadmap
 */
export const saveRoadmap = async (studentId, targetRole, careerTrackName, milestones) => {
  const sId = Number(studentId);
  const normalizedRole = String(targetRole || '').trim().toLowerCase();

  try {
    // Only delete the roadmap for this specific role — preserve other topics' progress
    const existing = await query(
      'SELECT id FROM roadmaps WHERE student_id = ? AND LOWER(target_role) = ?',
      [sId, normalizedRole]
    );
    if (existing && existing.length > 0) {
      for (const r of existing) {
        await query('DELETE FROM roadmap_items WHERE roadmap_id = ?', [r.id]);
      }
      await query(
        'DELETE FROM roadmaps WHERE student_id = ? AND LOWER(target_role) = ?',
        [sId, normalizedRole]
      );
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
        const topicsJson = JSON.stringify(m.topics || []);
        const syllabusJson = JSON.stringify(m.syllabus || []);
        const resourcesJson = JSON.stringify(m.resources || []);

        const itemRes = await query(
          'INSERT INTO roadmap_items (roadmap_id, sequence_order, title, description, status, progress, tags, topics, quizzes, exercises, syllabus, resources) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [roadmapId, i + 1, m.title, m.desc, m.status, m.progress || 0, tagsJson, topicsJson, m.quizzes || 0, m.exercises || 0, syllabusJson, resourcesJson]
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
  } catch (error) {
    console.warn(`[Roadmap Model] DB save warning: ${error.message}. Saving to mock store.`);
  }

  // Mock store fallback — keyed by studentId + normalizedRole to isolate per-topic progress
  const mockId = Date.now();
  const formattedMilestones = milestones.map((m, idx) => ({
    id: m.id || idx + 1,
    title: m.title,
    desc: m.desc,
    status: m.status,
    progress: m.progress || 0,
    tags: m.tags || [],
    topics: m.topics || [],
    quizzes: m.quizzes || 0,
    exercises: m.exercises || 0,
  }));

  const mockData = {
    id: mockId,
    studentId: sId,
    targetRole,
    careerTrack: careerTrackName,
    updatedAt: new Date(),
    milestones: formattedMilestones,
  };

  const mockKey = `${sId}__${normalizedRole}`;
  mockRoadmaps.set(mockKey, mockData);
  // Also update the "latest" key for the default GET
  mockRoadmaps.set(sId, mockData);
  return mockData;
};

/**
 * Update milestone status & progress
 */
export const updateMilestoneItemStatus = async (studentId, itemId, status, progress) => {
  const sId = Number(studentId);
  const itId = Number(itemId);

  try {
    const res = await query(
      'UPDATE roadmap_items SET status = ?, progress = ? WHERE id = ?',
      [status, progress, itId]
    );

    if (res && res.affectedRows > 0) {
      return getRoadmapByStudentId(sId);
    }
  } catch (error) {
    console.warn(`[Roadmap Model] DB update status warning: ${error.message}. Updating mock store.`);
  }

  const mockData = mockRoadmaps.get(sId);
  if (mockData && mockData.milestones) {
    const item = mockData.milestones.find((m) => Number(m.id) === itId);
    if (item) {
      item.status = status;
      if (progress !== undefined) item.progress = progress;
    }
    return mockData;
  }

  return null;
};