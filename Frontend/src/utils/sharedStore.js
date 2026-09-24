/**
 * CENTRAL SHARED STORE — DATABASE BACKED
 * All cross-dashboard content (Quizzes, Coding, Drives, Learning, Broadcasts)
 * is persisted in the MySQL `shared_content` table via the backend API.
 * localStorage is NOT used anywhere in this file.
 */

const BASE = '/api/v1/shared-content';

/** Resolve an auth token from session — honours existing JWT pattern */
const getToken = () => {
  const s = sessionStorage.getItem('token') || sessionStorage.getItem('authToken') || '';
  return s;
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// ─── Event names (still dispatched after successful DB write for instant UI refresh) ─────
export const EVENTS = {
  BATCH_UPDATED:      'portal_batch_updated',
  QUIZ_UPDATED:      'portal_quiz_updated',
  CODING_UPDATED:    'portal_coding_updated',
  DRIVE_UPDATED:     'portal_drive_updated',
  LEARNING_UPDATED:  'portal_learning_updated',
  BROADCAST_UPDATED: 'portal_broadcast_updated',
  COLLEGE_UPDATED:   'portal_college_updated',
  DEPARTMENT_UPDATED:'portal_department_updated',
};

const TYPE_EVENT_MAP = {
  quiz:      EVENTS.QUIZ_UPDATED,
  coding:    EVENTS.CODING_UPDATED,
  drive:     EVENTS.DRIVE_UPDATED,
  learning:  EVENTS.LEARNING_UPDATED,
  broadcast: EVENTS.BROADCAST_UPDATED,
};

// ─── Generic DB fetch ─────────────────────────────────────────────────────────
const fetchFromDB = async (type) => {
  try {
    const res = await fetch(`${BASE}?type=${type}`, { headers: authHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn(`[SharedStore] fetch(${type}) failed:`, err.message);
    return [];
  }
};

// ─── Generic DB create ────────────────────────────────────────────────────────
const postToDB = async (type, payload) => {
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ type, ...payload }),
    });
    const json = await res.json();
    if (json.success && json.data) {
      // Dispatch window event for instant same-tab UI refresh
      window.dispatchEvent(new CustomEvent(TYPE_EVENT_MAP[type], { detail: json.data }));
      return json.data;
    }
  } catch (err) {
    console.warn(`[SharedStore] post(${type}) failed:`, err.message);
  }
  return null;
};

// ─── Generic DB delete ────────────────────────────────────────────────────────
export const deleteSharedItem = async (id) => {
  try {
    await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() });
  } catch (err) {
    console.warn('[SharedStore] delete failed:', err.message);
  }
};

// ══════════════════════════════════════════════════════════════
//  QUIZZES / ASSESSMENTS
// ══════════════════════════════════════════════════════════════
export const getSharedQuizzes = async (defaultList = []) => {
  const rows = await fetchFromDB('quiz');
  if (rows.length > 0) return rows;
  return defaultList;
};

export const addSharedQuiz = async (newQuiz) => {
  const payload = {
    title:       newQuiz.title || 'New Technical Quiz',
    description: newQuiz.description || '',
    batch_name:  newQuiz.batch || 'All Batches',
    status:      'Active',
    data: {
      subject:        newQuiz.subject || newQuiz.category || 'Computer Engineering',
      questionsCount: newQuiz.questionsCount || newQuiz.questions?.length || 10,
      questions:      newQuiz.questions || [],
      duration:       newQuiz.duration || '30 mins',
      totalMarks:     newQuiz.totalMarks || 100,
      passPercentage: newQuiz.passPercentage || 60,
      batch:          newQuiz.batch || 'All Batches',
    },
  };
  return await postToDB('quiz', payload);
};

// ══════════════════════════════════════════════════════════════
//  CODING PRACTICE & TASKS
// ══════════════════════════════════════════════════════════════
export const getSharedCodingTasks = async (defaultList = []) => {
  const rows = await fetchFromDB('coding');
  if (rows.length > 0) return rows;
  return defaultList;
};

export const addSharedCodingTask = async (newTask) => {
  const payload = {
    title:       newTask.title || 'New Algorithmic Problem',
    description: newTask.description || 'Solve the problem using optimal time complexity.',
    batch_name:  newTask.batch || 'All Batches',
    status:      'Active',
    data: {
      difficulty:   newTask.difficulty || 'Medium',
      category:     newTask.category || 'Data Structures',
      points:       newTask.points || 100,
      sampleInput:  newTask.sampleInput || '',
      sampleOutput: newTask.sampleOutput || '',
      batch:        newTask.batch || 'All Batches',
    },
  };
  return await postToDB('coding', payload);
};

// ══════════════════════════════════════════════════════════════
//  MOCK PLACEMENT DRIVES
// ══════════════════════════════════════════════════════════════
export const getSharedDrives = async (defaultList = []) => {
  const rows = await fetchFromDB('drive');
  if (rows.length > 0) return rows;
  return defaultList;
};

export const addSharedDrive = async (newDrive) => {
  const payload = {
    title:      newDrive.name || newDrive.title || 'New Placement Mock Drive',
    description: newDrive.description || '',
    batch_name:  newDrive.batch || 'All Batches',
    status:      'Upcoming',
    data: {
      company:          newDrive.company || 'Industry Partner',
      date:             newDrive.date || newDrive.driveDate || '',
      eligible_batches: newDrive.eligible_batches || [newDrive.batch || 'All Batches'],
      cutoffScore:      newDrive.cutoffScore || '75%',
    },
  };
  return await postToDB('drive', payload);
};

// ══════════════════════════════════════════════════════════════
//  LEARNING CONTENT & STUDY MATERIAL
// ══════════════════════════════════════════════════════════════
export const getSharedLearningContent = async (defaultList = []) => {
  const rows = await fetchFromDB('learning');
  if (rows.length > 0) return rows;
  return defaultList;
};

export const addSharedLearningContent = async (newContent) => {
  const payload = {
    title:       newContent.title || 'New Study Material',
    description: newContent.description || '',
    batch_name:  newContent.batch || 'All Batches',
    status:      'Active',
    data: {
      type:    newContent.type || 'PDF',
      subject: newContent.subject || 'Computer Science',
      url:     newContent.url || '#',
      batch:   newContent.batch || 'All Batches',
    },
  };
  return await postToDB('learning', payload);
};

// ══════════════════════════════════════════════════════════════
//  BROADCAST NOTICES
// ══════════════════════════════════════════════════════════════
export const getSharedBroadcasts = async (defaultList = []) => {
  const rows = await fetchFromDB('broadcast');
  if (rows.length > 0) return rows;
  return defaultList;
};

export const addSharedBroadcast = async (newNotice) => {
  const payload = {
    title:    newNotice.title || 'Portal Announcement',
    description: newNotice.message || newNotice.content || '',
    target:   newNotice.target_batch || 'All',
    batch_name: newNotice.target_batch || 'All Batches',
    status:   'Active',
    data: {
      message:      newNotice.message || newNotice.content || '',
      author:       newNotice.author || 'Admin',
      priority:     newNotice.priority || 'General Announcement',
      target_batch: newNotice.target_batch || 'All Batches',
    },
  };
  return await postToDB('broadcast', payload);
};
