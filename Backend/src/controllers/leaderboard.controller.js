import { sendSuccess } from '../utils/response.js';
import { query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';

export const getLeaderboardData = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const role = req.user.role;
    const collegeId = req.user.collegeId || req.user.college_id || 1;

    // Filters from query
    const filterDepartment = req.query.department;
    const filterBatch = req.query.batch;

    // Base query to fetch students and their scores
    let sql = `
      SELECT 
        u.id as user_id, 
        u.name, 
        s.department, 
        s.batch_id,
        b.name as batch_name,
        b.mentor as batch_mentor,
        COALESCE(SUM(aa.marks_obtained), 0) + (CAST(COALESCE(s.cgpa, '8.0') AS DECIMAL(10,2)) * 100) as total_score,
        COUNT(aa.id) as assessments_completed
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN assessment_attempts aa ON u.id = aa.user_id AND aa.status = 'completed'
      WHERE u.role = ? AND u.college_id = ?
    `;
    const params = [ROLES.STUDENT, collegeId];

    // Role-based restrictions
    if (role === ROLES.MENTOR) {
      // Mentor only sees their assigned batches (or students in their batches)
      sql += ` AND b.mentor = ?`;
      params.push(req.user.name); // simplistic mapping for mock mentor
    }

    if (filterDepartment) {
      sql += ` AND s.department = ?`;
      params.push(filterDepartment);
    }
    if (filterBatch) {
      sql += ` AND s.batch_id = ?`;
      params.push(parseInt(filterBatch, 10));
    }

    sql += ` GROUP BY u.id, u.name, s.department, s.batch_id, b.name, b.mentor, s.cgpa`;
    sql += ` ORDER BY total_score DESC`;

    const rows = await query(sql, params) || [];

    // If query failed (e.g. SQLite mock missing columns), rows might be empty.
    // Build real arrays from the fetched rows
    const overall = [];
    const department = [];
    const topBatchesMap = new Map();

    rows.forEach((r, idx) => {
      const studentObj = {
        rank: idx + 1,
        name: r.name,
        sub: r.department || 'General',
        batch: r.batch_name || 'Unassigned',
        score: Math.round(r.total_score),
        progress: r.assessments_completed * 10, // Mock progress based on attempts
        initials: r.name ? r.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST',
        isCurrentUser: r.user_id === userId,
      };
      overall.push(studentObj);

      // Aggregate for batch
      if (r.batch_name) {
        if (!topBatchesMap.has(r.batch_name)) {
          topBatchesMap.set(r.batch_name, { name: r.batch_name, students: 0, total_score: 0 });
        }
        const bInfo = topBatchesMap.get(r.batch_name);
        bInfo.students += 1;
        bInfo.total_score += studentObj.score;
      }
    });

    // Generate department specific list if current user is student
    let deptName = 'General';
    if (role === ROLES.STUDENT) {
      const me = rows.find(r => r.user_id === userId);
      if (me) deptName = me.department;
    }
    const deptRows = rows.filter(r => r.department === deptName);
    deptRows.forEach((r, idx) => {
      department.push({
        rank: idx + 1,
        name: r.name,
        sub: r.department || 'General',
        batch: r.batch_name || 'Unassigned',
        score: Math.round(r.total_score),
        progress: r.assessments_completed * 10,
        initials: r.name ? r.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST',
        isCurrentUser: r.user_id === userId,
      });
    });

    // Process top batches
    const topBatches = Array.from(topBatchesMap.values()).map(b => ({
      name: b.name,
      students: b.students,
      score: Math.round(b.total_score / b.students),
      initials: b.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    })).sort((a, b) => b.score - a.score).map((b, idx) => ({ ...b, rank: idx + 1 }));

    // Milestone is just mocked for now since we don't have a milestone table
    const milestone = [...overall].sort(() => 0.5 - Math.random()).map((m, idx) => ({ ...m, rank: idx + 1 }));

    const data = {
      overall,
      department,
      milestone,
      topBatches
    };

    return sendSuccess(res, 'Leaderboard data retrieved successfully', data);
  } catch (error) {
    console.error("[Leaderboard Controller] Error:", error.message);
    next(error);
  }
};
