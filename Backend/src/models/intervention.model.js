import { query } from '../config/db.js';

// In-memory fallback store for defaulters and intervention records
const mockDefaulters = new Map();
const mockInterventionLogs = new Map();

/**
 * Save or update a student defaulter record (Avoids duplicates)
 */
export const saveOrUpdateDefaulterModel = async (defaulterData) => {
  const {
    student_id,
    user_id,
    attendance_score,
    overall_score,
    reasons,
    weak_areas,
    status = 'Needs Attention',
  } = defaulterData;

  const sId = Number(student_id || user_id);
  const reasonsJson = JSON.stringify(reasons || []);
  const weakAreasJson = JSON.stringify(weak_areas || []);

  try {
    // Check if active defaulter record exists in DB
    const existing = await query(
      `SELECT id FROM defaulters WHERE student_id = ? OR user_id = ? LIMIT 1`,
      [sId, sId]
    );

    if (existing && existing.length > 0) {
      const defId = existing[0].id;
      await query(
        `UPDATE defaulters 
         SET attendance_score = ?, overall_score = ?, reasons = ?, weak_areas = ?, status = ?, updated_at = NOW() 
         WHERE id = ?`,
        [attendance_score, overall_score, reasonsJson, weakAreasJson, status, defId]
      );
      return { id: defId, ...defaulterData, status };
    } else {
      const res = await query(
        `INSERT INTO defaulters 
          (student_id, user_id, attendance_score, overall_score, reasons, weak_areas, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [sId, sId, attendance_score, overall_score, reasonsJson, weakAreasJson, status]
      );
      if (res && res.insertId) {
        return { id: res.insertId, ...defaulterData, status };
      }
    }
  } catch (error) {
    console.warn(`[Intervention Model] DB query fallback: ${error.message}`);
  }

  // In-memory store fallback
  const existingMock = mockDefaulters.get(sId);
  if (existingMock) {
    existingMock.attendance_score = attendance_score;
    existingMock.overall_score = overall_score;
    existingMock.reasons = reasons;
    existingMock.weak_areas = weak_areas;
    existingMock.updated_at = new Date().toISOString();
    mockDefaulters.set(sId, existingMock);
    return existingMock;
  }

  const newMock = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    student_id: sId,
    user_id: sId,
    attendance_score,
    overall_score,
    reasons,
    weak_areas,
    status: status || 'Needs Attention',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockDefaulters.set(sId, newMock);
  return newMock;
};

/**
 * Add a new intervention history log entry for a student
 */
export const addInterventionLogModel = async (logData) => {
  const {
    student_id,
    user_id,
    mentor_id,
    mentor_name = 'Assigned Mentor',
    interaction_date = new Date().toISOString().split('T')[0],
    notes = '',
    action_taken = '',
    recommendations = '',
    status = 'Action Taken',
    next_followup = null,
  } = logData;

  const sId = Number(student_id || user_id);

  try {
    const res = await query(
      `INSERT INTO interventions 
        (student_id, user_id, mentor_id, mentor_name, interaction_date, notes, action_taken, recommendations, status, next_followup, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        sId,
        sId,
        mentor_id || 5,
        mentor_name,
        interaction_date,
        notes,
        action_taken,
        recommendations,
        status,
        next_followup,
      ]
    );

    // Update main defaulter status to match intervention status
    await query(
      `UPDATE defaulters SET status = ?, updated_at = NOW() WHERE student_id = ? OR user_id = ?`,
      [status, sId, sId]
    );

    if (res && res.insertId) {
      return { id: res.insertId, ...logData };
    }
  } catch (error) {
    console.warn(`[Intervention Model] DB insert log fallback: ${error.message}`);
  }

  // Update in-memory defaulter status
  const existingDefaulter = mockDefaulters.get(sId);
  if (existingDefaulter) {
    existingDefaulter.status = status;
    existingDefaulter.updated_at = new Date().toISOString();
    mockDefaulters.set(sId, existingDefaulter);
  }

  // Add to intervention history
  if (!mockInterventionLogs.has(sId)) {
    mockInterventionLogs.set(sId, []);
  }

  const logs = mockInterventionLogs.get(sId);
  const newLog = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    student_id: sId,
    user_id: sId,
    mentor_id: mentor_id || 5,
    mentor_name,
    interaction_date,
    notes,
    action_taken,
    recommendations,
    status,
    next_followup,
    created_at: new Date().toISOString(),
  };

  logs.unshift(newLog);
  mockInterventionLogs.set(sId, logs);
  return newLog;
};

/**
 * Get all intervention history entries for a student
 */
export const getInterventionHistoryModel = async (studentId) => {
  const sId = Number(studentId);

  try {
    const rows = await query(
      `SELECT * FROM interventions WHERE student_id = ? OR user_id = ? ORDER BY id DESC`,
      [sId, sId]
    );
    if (rows && Array.isArray(rows) && rows.length > 0) return rows;
  } catch (error) {
    console.warn(`[Intervention Model] DB query history fallback: ${error.message}`);
  }

  return mockInterventionLogs.get(sId) || [];
};

/**
 * Get all defaulters in database or memory
 */
export const getAllDefaultersModel = async (filters = {}) => {
  const { college_id, department_id, batch_id, status } = filters;

  try {
    let sql = `
      SELECT d.*, u.name as student_name, u.email, s.roll_number, s.college_id, c.name as college_name, s.department_id, s.department, s.batch_id, b.name as batch_name
      FROM defaulters d
      JOIN users u ON d.user_id = u.id
      JOIN students s ON s.user_id = u.id
      LEFT JOIN colleges c ON s.college_id = c.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE 1=1
    `;
    const params = [];
    if (college_id) {
      sql += ' AND (s.college_id = ? OR u.college_id = ?)';
      params.push(parseInt(college_id, 10), parseInt(college_id, 10));
    }
    if (department_id) {
      sql += ' AND (s.department_id = ? OR s.department = ?)';
      params.push(parseInt(department_id, 10), String(department_id));
    }
    if (batch_id) {
      sql += ' AND s.batch_id = ?';
      params.push(parseInt(batch_id, 10));
    }
    if (status && status !== 'all') {
      sql += ' AND d.status = ?';
      params.push(String(status));
    }

    sql += ' ORDER BY d.updated_at DESC';

    const rows = await query(sql, params);
    if (rows && Array.isArray(rows) && rows.length > 0) {
      return rows.map((r) => ({
        ...r,
        reasons: typeof r.reasons === 'string' ? JSON.parse(r.reasons) : (r.reasons || []),
        weak_areas: typeof r.weak_areas === 'string' ? JSON.parse(r.weak_areas) : (r.weak_areas || []),
      }));
    }
  } catch (error) {
    console.warn(`[Intervention Model] DB query all defaulters fallback: ${error.message}`);
  }

  return Array.from(mockDefaulters.values());
};
