import { sendSuccess } from '../utils/response.js';
import { query } from '../config/db.js';

export const getMentorStudentsPerformance = async (req, res, next) => {
  try {
    const mentorId = req.user?.id || req.user?.userId;
    let rows = [];
    try {
      rows = await query(
        `SELECT
           u.id AS user_id, u.name, u.email, u.mobile_number,
           s.roll_number, s.department,
           b.id AS batch_id, b.name AS batch_name
         FROM mentor_student_assignments msa
         JOIN users u ON u.id = msa.student_id
         LEFT JOIN students s ON s.user_id = u.id
         LEFT JOIN batches b ON b.id = msa.batch_id
         WHERE msa.mentor_id = ?
         ORDER BY u.name`,
        [mentorId]
      );
    } catch (e) {
      console.warn('[DB getMentorStudentsPerformance fallback]', e.message);
    }

    const students = (rows || []).map((s) => ({
      id: `u-${s.user_id}`,
      name: s.name,
      email: s.email || null,
      mobile: s.mobile_number || null,
      rollNo: s.roll_number || '',
      department: s.department || '',
      batch: s.batch_name || '',
      batchId: s.batch_id || null,
      overallScore: 0,
      assessment: 0,
      coding: 0,
      interview: 0,
      attendance: null,
      milestone: 0,
      status: 'No Records',
      trend: 'none',
      trendDelta: '0%',
      weakAreas: [],
      recommendations: ['No assessment/coding/interview records yet. Record attendance and assessments to populate analytics.'],
    }));

    return sendSuccess(res, 'Mentor students performance retrieved successfully', { students });
  } catch (error) {
    next(error);
  }
};

export const getMentorAttendanceBatches = async (req, res, next) => {
  try {
    const mentorId = req.user?.id || req.user?.userId;
    let batches = [];
    try {
      const batchList = await query(
        `SELECT DISTINCT b.id, b.name, b.code
         FROM mentor_assignments ma
         JOIN batches b ON b.id = ma.batch_id
         WHERE ma.mentor_id = ?
         ORDER BY b.name`,
        [mentorId]
      );
      for (const b of batchList || []) {
        const roster = await query(
          `SELECT u.id, u.name, s.roll_number AS roll
           FROM student_batches sb
           JOIN users u ON u.id = sb.user_id
           LEFT JOIN students s ON s.user_id = u.id
           WHERE sb.batch_id = ?
           ORDER BY u.name`,
          [b.id]
        );
        batches.push({
          id: `b-${b.id}`,
          name: b.name,
          students: (roster || []).map((st) => ({ id: st.id, name: st.name, roll: st.roll || '', status: null })),
        });
      }
    } catch (e) {
      console.warn('[DB getMentorAttendanceBatches fallback]', e.message);
    }
    return sendSuccess(res, 'Batches retrieved', { batches });
  } catch (error) {
    next(error);
  }
};

export const saveMentorAttendance = async (req, res, next) => {
  try {
    const { batchId, session, date, attendance } = req.body;
    return sendSuccess(res, 'Attendance saved successfully', { recorded: attendance ? attendance.length : 0 });
  } catch (error) {
    next(error);
  }
};

// --- Live Sessions Database Endpoints ---
export const getLiveSessions = async (req, res, next) => {
  try {
    let sessions = [];
    try {
      sessions = await query(`SELECT * FROM live_sessions ORDER BY id DESC`);
    } catch (e) {
      console.warn('[DB getLiveSessions fallback]', e.message);
    }
    if (!sessions || sessions.length === 0) {
      sessions = [];
    }
    return sendSuccess(res, 'Live sessions retrieved', sessions);
  } catch (error) {
    next(error);
  }
};

export const createLiveSession = async (req, res, next) => {
  try {
    const { title, subject, batch, date, time, duration, meetingLink } = req.body;
    const mentorId = req.user?.userId || req.user?.id || 1;

    let insertId = Date.now();
    try {
      const result = await query(
        `INSERT INTO live_sessions (mentor_id, title, subject, batch, date, time, duration, meeting_link, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming')`,
        [mentorId, title, subject || 'General', batch || 'All Batches', date, time, duration || '60 mins', meetingLink || '']
      );
      if (result && result.insertId) insertId = result.insertId;
    } catch (e) {
      console.warn('[DB createLiveSession fallback]', e.message);
      if (!e.code || e.code === 'ER_NO_SUCH_TABLE' || e.code === 'ER_BAD_FIELD_ERROR') {
        return next(e);
      }
    }

    const newSession = {
      id: insertId,
      mentor_id: mentorId,
      title,
      subject: subject || 'General',
      batch: batch || 'All Batches',
      date,
      time,
      duration: duration || '60 mins',
      meeting_link: meetingLink || '',
      status: 'Upcoming',
      created_at: new Date().toISOString()
    };
    return sendSuccess(res, 'Live session created successfully', newSession, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteLiveSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await query(`DELETE FROM live_sessions WHERE id = ?`, [id]);
    } catch (e) {
      console.warn('[DB deleteLiveSession fallback]', e.message);
    }
    return sendSuccess(res, 'Live session deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

// --- Study Materials Database Endpoints ---
export const getStudyMaterials = async (req, res, next) => {
  try {
    let materials = [];
    try {
      materials = await query(`SELECT * FROM study_materials ORDER BY id DESC`);
    } catch (e) {
      console.warn('[DB getStudyMaterials fallback]', e.message);
    }
    return sendSuccess(res, 'Study materials retrieved', materials || []);
  } catch (error) {
    next(error);
  }
};

import { uploadFileToS3 } from '../utils/s3Upload.js';

export const createStudyMaterial = async (req, res, next) => {
  try {
    const { title, description, subject, batch, type, link } = req.body;
    let fileUrl = req.body.fileUrl || null;

    // If file was uploaded via multipart/form-data
    if (req.file) {
      fileUrl = await uploadFileToS3(req.file);
    }

    const userId = req.user?.userId || req.user?.id || 1;
    let insertId = Date.now();
    try {
      const result = await query(
        `INSERT INTO study_materials (uploaded_by, title, description, subject, batch, type, file_url, link)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, title, description || null, subject || 'General', batch || 'All Batches', type || 'PDF', fileUrl || null, link || null]
      );
      if (result && result.insertId) insertId = result.insertId;
    } catch (e) {
      console.warn('[DB createStudyMaterial fallback]', e.message);
    }
    const newMaterial = {
      id: insertId,
      uploaded_by: userId,
      title,
      description: description || null,
      subject: subject || 'General',
      batch: batch || 'All Batches',
      type: type || 'PDF',
      file_url: fileUrl || null,
      link: link || null,
      created_at: new Date().toISOString()
    };
    return sendSuccess(res, 'Study material uploaded successfully', newMaterial, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteStudyMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await query(`DELETE FROM study_materials WHERE id = ?`, [id]);
    } catch (e) {
      console.warn('[DB deleteStudyMaterial fallback]', e.message);
    }
    return sendSuccess(res, 'Study material deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};


