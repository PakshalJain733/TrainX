import { sendSuccess } from '../utils/response.js';
import { query } from '../config/db.js';

export const getLeaderboardData = async (req, res, next) => {
  try {
    const currentUserId = req.user?.userId || req.user?.id;
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;

    // Fetch current user details
    const [currentUser] = await query(
      `SELECT u.id, u.name, s.department, s.batch_id
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       WHERE u.id = ?`,
      [currentUserId]
    );

    const userDept = currentUser?.department || '';

    // Fetch all students in college with aggregated scores
    const studentRows = await query(
      `SELECT u.id, u.name, s.department, s.batch_id, b.name as batch_name,
              COALESCE(att.attendance_percentage, 0) as attendance_pct,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0.0) as avg_assessment
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       WHERE u.college_id = ? AND u.role = 'student'
       GROUP BY u.id, s.id, b.id, att.id`,
      [collegeId]
    );

    const scoredStudents = studentRows.map((s) => {
      const attendance = parseFloat(s.attendance_pct) || 0;
      const assessment = parseFloat(s.avg_assessment) || 0;
      const score = Math.round((attendance * 0.4) + (assessment * 0.6));
      const initials = s.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      return {
        id: s.id,
        name: s.name,
        sub: s.department || 'Engineering',
        score,
        initials,
        isCurrentUser: s.id === currentUserId,
      };
    });

    // Sort by score descending
    scoredStudents.sort((a, b) => b.score - a.score);

    // Assign overall rank
    const overall = scoredStudents.map((s, idx) => ({
      rank: idx + 1,
      ...s,
    }));

    // Department leaderboard
    const deptStudents = scoredStudents.filter((s) =>
      userDept ? s.sub.toLowerCase() === userDept.toLowerCase() : true
    );
    const department = deptStudents.map((s, idx) => ({
      rank: idx + 1,
      ...s,
    }));

    // Milestone leaderboard (ranked by real attendance performance, no fabricated multiplier)
    const milestone = scoredStudents
      .map((s) => ({
        ...s,
        score: s.score,
      }))
      .sort((a, b) => b.score - a.score)
      .map((s, idx) => ({
        rank: idx + 1,
        ...s,
      }));

    // Top Batches leaderboard
    const batchRows = await query(
      `SELECT b.id, b.name,
              COUNT(DISTINCT s.id) as student_count,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0.0) as avg_score
       FROM batches b
       LEFT JOIN students s ON b.id = s.batch_id
       LEFT JOIN assessment_attempts aa ON s.user_id = aa.user_id
       WHERE b.college_id = ?
       GROUP BY b.id
       ORDER BY avg_score DESC
       LIMIT 5`,
      [collegeId]
    );

    const topBatches = batchRows.map((b, idx) => {
      const initials = b.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      return {
        rank: idx + 1,
        name: b.name,
        students: b.student_count || 0,
        score: Math.round(parseFloat(b.avg_score) || 0),
        initials,
      };
    });

    return sendSuccess(res, 'Leaderboard data retrieved successfully', {
      overall: overall.slice(0, 20),
      department: department.slice(0, 20),
      milestone: milestone.slice(0, 20),
      topBatches,
    });
  } catch (error) {
    next(error);
  }
};
