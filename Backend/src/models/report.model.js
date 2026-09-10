import { query } from '../config/db.js';

// In-memory fallback storage for weekly reports
const mockWeeklyReports = new Map();

/**
 * Save or insert a generated weekly report
 */
export const saveWeeklyReportModel = async (reportData) => {
  const {
    student_id,
    user_id,
    week_label,
    start_date,
    end_date,
    overall_score,
    attendance_score,
    quiz_score,
    coding_score,
    interview_score,
    milestones_summary,
    strong_areas,
    weak_areas,
    suggestions,
    trend_status,
    score_delta,
    full_payload,
  } = reportData;

  const sId = Number(student_id || user_id);

  try {
    const res = await query(
      `INSERT INTO weekly_reports 
        (student_id, user_id, week_label, start_date, end_date, overall_score, attendance_score, quiz_score, coding_score, interview_score, milestones_summary, strong_areas, weak_areas, suggestions, trend_status, score_delta, full_payload, generated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        sId,
        sId,
        week_label,
        start_date,
        end_date,
        overall_score,
        attendance_score,
        quiz_score,
        coding_score,
        interview_score,
        milestones_summary || '',
        JSON.stringify(strong_areas || []),
        JSON.stringify(weak_areas || []),
        JSON.stringify(suggestions || []),
        trend_status || 'No major change',
        score_delta || '0%',
        JSON.stringify(full_payload || reportData),
      ]
    );

    if (res && res.insertId) {
      return { id: res.insertId, ...reportData };
    }
  } catch (error) {
    console.warn(`[Report Model] DB insert fallback: ${error.message}`);
  }

  // Fallback in-memory store
  if (!mockWeeklyReports.has(sId)) {
    mockWeeklyReports.set(sId, []);
  }

  const userReports = mockWeeklyReports.get(sId);
  const newReport = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    student_id: sId,
    user_id: sId,
    week_label,
    start_date,
    end_date,
    overall_score,
    attendance_score,
    quiz_score,
    coding_score,
    interview_score,
    milestones_summary: milestones_summary || '',
    strong_areas: strong_areas || [],
    weak_areas: weak_areas || [],
    suggestions: suggestions || [],
    trend_status: trend_status || 'No major change',
    score_delta: score_delta || '0%',
    full_payload: full_payload || reportData,
    generated_at: new Date().toISOString(),
  };

  // Prepend to maintain newest first
  userReports.unshift(newReport);
  mockWeeklyReports.set(sId, userReports);
  return newReport;
};

/**
 * Get all weekly reports for a specific student sorted newest first
 */
export const getWeeklyReportsByStudentIdModel = async (studentId) => {
  const sId = Number(studentId);

  try {
    const rows = await query(
      `SELECT * FROM weekly_reports WHERE student_id = ? OR user_id = ? ORDER BY id DESC`,
      [sId, sId]
    );
    if (rows && Array.isArray(rows) && rows.length > 0) {
      return rows.map((r) => ({
        ...r,
        strong_areas: typeof r.strong_areas === 'string' ? JSON.parse(r.strong_areas) : (r.strong_areas || []),
        weak_areas: typeof r.weak_areas === 'string' ? JSON.parse(r.weak_areas) : (r.weak_areas || []),
        suggestions: typeof r.suggestions === 'string' ? JSON.parse(r.suggestions) : (r.suggestions || []),
        full_payload: typeof r.full_payload === 'string' ? JSON.parse(r.full_payload) : (r.full_payload || {}),
      }));
    }
  } catch (error) {
    console.warn(`[Report Model] DB query fallback: ${error.message}`);
  }

  return mockWeeklyReports.get(sId) || [];
};

/**
 * Get all weekly reports for a specific batch
 */
export const getWeeklyReportsByBatchModel = async (batchId) => {
  const bId = Number(batchId);
  try {
    const rows = await query(
      `SELECT wr.*, u.name as student_name, s.roll_number, s.department
       FROM weekly_reports wr
       JOIN users u ON wr.user_id = u.id
       JOIN students s ON s.user_id = u.id
       WHERE s.batch_id = ?
       ORDER BY wr.id DESC`,
      [bId]
    );
    if (rows && Array.isArray(rows)) return rows;
  } catch (error) {
    console.warn(`[Report Model] DB query batch fallback: ${error.message}`);
  }
  return [];
};

/**
 * Get all weekly reports for a college
 */
export const getWeeklyReportsByCollegeModel = async (collegeId) => {
  const cId = Number(collegeId);
  try {
    const rows = await query(
      `SELECT wr.*, u.name as student_name, s.roll_number, s.department, b.name as batch_name
       FROM weekly_reports wr
       JOIN users u ON wr.user_id = u.id
       JOIN students s ON s.user_id = u.id
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE s.college_id = ? OR u.college_id = ?
       ORDER BY wr.id DESC`,
      [cId, cId]
    );
    if (rows && Array.isArray(rows)) return rows;
  } catch (error) {
    console.warn(`[Report Model] DB query college fallback: ${error.message}`);
  }
  return [];
};
