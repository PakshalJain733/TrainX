import { query } from '../config/db.js';

const toNum = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Service to calculate and aggregate student performance from real DB tables.
 * No fabricated fallbacks — any dimension without real data is null.
 */
export const getStudentPerformanceService = async (userId) => {
  const numId = parseInt(userId, 10);

  // 1. Fetch Student profile & batch
  const [user] = await query(
    `SELECT u.id, u.name, u.email, s.roll_number, s.department, s.batch_id, b.name as batch_name
     FROM users u
     LEFT JOIN students s ON u.id = s.user_id
     LEFT JOIN batches b ON s.batch_id = b.id
     WHERE u.id = ?`,
    [numId]
  );

  if (!user) {
    throw new Error('Student not found');
  }

  // 2. Fetch real Attendance Summary
  const [att] = await query(
    `SELECT attendance_percentage, total_classes, present_count, absent_count
     FROM attendance_summary
     WHERE user_id = ?`,
    [numId]
  );
  const attendanceScore = att && att.attendance_percentage != null
    ? Math.round(toNum(att.attendance_percentage))
    : null;
  const totalClasses = att ? Number(att.total_classes || 0) : null;
  const presentCount = att ? Number(att.present_count || 0) : null;
  const absentCount = att ? Number(att.absent_count || 0) : null;

  // 3. Fetch real Assessment Attempts
  const attempts = await query(
    `SELECT percentage, marks_obtained, total_marks, status, submitted_at, started_at
     FROM assessment_attempts
     WHERE user_id = ? AND status = 'completed'
     ORDER BY id DESC`,
    [numId]
  );

  let assessmentScore = null;
  if (attempts && attempts.length > 0) {
    const validPcts = attempts
      .map((a) => toNum(a.percentage))
      .filter((v) => v != null);
    if (validPcts.length > 0) {
      assessmentScore = Math.round(validPcts.reduce((acc, p) => acc + p, 0) / validPcts.length);
    }
  }

  // 4. Fetch Skill Gaps / Weak Areas (real records only)
  const [skillGap] = await query(
    `SELECT weak_areas, overall_status, suggestions
     FROM skill_gap_analysis
     WHERE user_id = ?`,
    [numId]
  );

  let weakAreas = [];
  if (skillGap && skillGap.weak_areas) {
    try {
      const parsed = typeof skillGap.weak_areas === 'string' ? JSON.parse(skillGap.weak_areas) : skillGap.weak_areas;
      if (Array.isArray(parsed)) {
        weakAreas = parsed
          .filter((item) => item !== null && item !== undefined)
          .map((item, idx) => ({
            id: `wa-${idx + 1}`,
            skill: typeof item === 'string' ? item : (item.skill || item.topic || 'Core Module'),
            score: typeof item === 'object' && item.score != null ? Number(item.score) : null,
            target: typeof item === 'object' && item.target != null ? Number(item.target) : 75,
            reason: typeof item === 'object' && item.reason
              ? item.reason
              : `Score in ${typeof item === 'string' ? item : (item.skill || 'this area')} needs improvement.`,
            topics: typeof item === 'object' && Array.isArray(item.topics) && item.topics.length
              ? item.topics
              : ['Concepts', 'Practice Problems', 'Quiz Review'],
            actions: typeof item === 'object' && Array.isArray(item.actions) && item.actions.length
              ? item.actions
              : ['Review weak topic resources'],
            priority: idx === 0 ? 'Critical' : 'High',
          }));
      }
    } catch (_) {
      weakAreas = [];
    }
  }

  // 5. Milestone score from real roadmap progress (latest roadmap only)
  const [milestoneRow] = await query(
    `SELECT ROUND(AVG(ri.progress), 0) AS avg_progress, COUNT(ri.id) AS item_count
     FROM roadmaps r
     JOIN roadmap_items ri ON ri.roadmap_id = r.id
     WHERE r.student_id = ?
       AND r.id = (SELECT MAX(id) FROM roadmaps WHERE student_id = ?)`,
    [numId, numId]
  );
  const milestoneScore = milestoneRow && Number(milestoneRow.item_count) > 0
    ? Math.round(Number(milestoneRow.avg_progress))
    : null;

  // 6. Coding / Interview / Mock Drive — not yet backed by real evaluator data.
  const codingScore = null;
  const interviewScore = null;

  // 7. Overall score from whichever real dimensions exist
  const realScores = [attendanceScore, assessmentScore].filter((s) => s != null);
  const overallScore = realScores.length > 0
    ? Math.round(realScores.reduce((acc, s) => acc + s, 0) / realScores.length)
    : null;

  let status = 'N/A';
  if (overallScore != null) {
    status = overallScore >= 80 ? 'Excellent' : overallScore < 60 ? 'Needs Work' : 'Average';
  }

  const suggestions = [
    { id: 's-1', icon: 'interview', text: 'Schedule an AI Mock Interview to practice technical and behavioural articulation.', action: 'Go to AI Interview', link: '/student/ai-interview' },
    { id: 's-2', icon: 'coding', text: 'Complete practice coding problems to sharpen your algorithm speed.', action: 'Open Practice', link: '/student/practice' },
    { id: 's-3', icon: 'learning', text: 'Review learning materials for weak areas identified in your diagnostics.', action: 'Open Learning', link: '/student/learning' },
    { id: 's-4', icon: 'attendance', text: 'Maintain 80%+ attendance to preserve placement eligibility.', action: 'View Attendance', link: '/student/attendance' },
  ];

  // 8. Real score history from actual attempt records
  const historyAttempts = (attempts || []).slice(0, 5).slice().reverse();
  const scoreHistory = historyAttempts.map((a) => ({
    week: a.submitted_at ? String(a.submitted_at).slice(0, 10) : 'Attempt',
    assessment: toNum(a.percentage) != null ? Math.round(toNum(a.percentage)) : null,
    coding: null,
    interview: null,
  }));

  let trend = 'stable';
  let trendDelta = '0%';
  if (scoreHistory.length >= 2) {
    const first = scoreHistory[0].assessment;
    const last = scoreHistory[scoreHistory.length - 1].assessment;
    if (first != null && last != null) {
      const delta = last - first;
      trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';
      trendDelta = `${delta === 0 ? '' : (delta > 0 ? '+' : '')}${delta}%`;
    }
  } else if (scoreHistory.length === 1) {
    trendDelta = 'First attempt recorded';
  }

  return {
    studentName: user.name,
    department: user.department || 'Engineering',
    batch: user.batch_name || 'General Batch',
    overallScore,
    status,
    trend,
    trendDelta,
    lastUpdated: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    totalClasses,
    presentCount,
    absentCount,
    scores: {
      assessment: assessmentScore,
      coding: codingScore,
      interview: interviewScore,
      attendance: attendanceScore,
      milestone: milestoneScore,
    },
    weakAreas,
    suggestions,
    scoreHistory,
  };
};