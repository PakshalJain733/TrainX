import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';

/**
 * GET /api/v1/reports/weekly
 * Returns weekly reports for the logged in student or mentor's batch
 */
export const getWeeklyReports = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;

    // Fetch student's real performance metrics (null when no data — no fabricated scores)
    const [att] = await query(
      `SELECT attendance_percentage FROM attendance_summary WHERE user_id = ?`,
      [userId]
    );
    const attendance = att && att.attendance_percentage != null
      ? Math.round(parseFloat(att.attendance_percentage))
      : null;

    const attempts = await query(
      `SELECT percentage FROM assessment_attempts WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );
    const validPcts = (attempts || [])
      .map((a) => parseFloat(a.percentage))
      .filter((v) => Number.isFinite(v));
    const avgQuiz = validPcts.length > 0
      ? Math.round(validPcts.reduce((acc, v) => acc + v, 0) / validPcts.length)
      : null;

    // Check saved weekly reports from DB
    const dbReports = await query(
      `SELECT wr.*, b.name as batch_name
       FROM weekly_reports wr
       LEFT JOIN batches b ON wr.batch_id = b.id
       WHERE wr.college_id = ?
       ORDER BY wr.id DESC`,
      [collegeId]
    );

    let reports = [];
    if (dbReports && dbReports.length > 0) {
      reports = dbReports.map((r) => {
        const quizScore = r.avg_quiz_score != null ? Math.round(r.avg_quiz_score) : avgQuiz;
        const attendanceRate = r.attendance_rate != null ? Math.round(r.attendance_rate) : attendance;
        return {
          id: `week-${r.week_number}`,
          title: r.title || `Week ${r.week_number} · Report`,
          score: quizScore != null ? `${quizScore}%` : 'N/A',
          attendance: attendanceRate,
          quiz: quizScore,
          coding: null,
          interview: null,
          skillGaps: r.topics_covered
            ? r.topics_covered.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          nextSteps: r.recommendations
            ? r.recommendations.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        };
      });
    }

    return sendSuccess(res, 'Weekly reports retrieved successfully', reports);
  } catch (error) {
    next(error);
  }
};

export const getReportData = getWeeklyReports;

export const getAllReports = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const rows = await query(`SELECT * FROM reports WHERE college_id = ? ORDER BY id DESC`, [collegeId]);
    return sendSuccess(res, 'Reports retrieved successfully', rows);
  } catch (error) {
    next(error);
  }
};
