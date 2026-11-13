import { query } from '../config/db.js';

/**
 * Service to calculate real multi-parameter student progress analytics
 * across 6 parameters with weighted normalization and weekly/monthly historical tracking.
 * 
 * Parameters & Default Weights:
 *  1. Attendance Rate (20% - 0.20)
 *  2. Coding Practice Problems Solved (20% - 0.20)
 *  3. Batch Tasks Submitted (15% - 0.15)
 *  4. Quizzes Appeared (15% - 0.15)
 *  5. AI Roadmap Progress (15% - 0.15)
 *  6. AI Interview Score (15% - 0.15)
 */
export const calculateStudentProgressAnalytics = async (userId) => {
  const numId = parseInt(userId, 10);
  if (!numId) return null;

  try {
    // 0. Get user start / registration date
    const [uRow] = await query(
      `SELECT u.created_at, u.name, s.batch_id, s.created_at as student_created_at
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       WHERE u.id = ?`,
      [numId]
    );

    const userJoinDate = uRow?.student_created_at || uRow?.created_at || new Date(Date.now() - 28 * 86400000);

    // 1. Fetch Batch Tasks and Submissions
    const studentBatches = await query(
      `SELECT DISTINCT batch_id FROM (
         SELECT batch_id FROM students WHERE user_id = ? AND batch_id IS NOT NULL
         UNION
         SELECT batch_id FROM student_batches WHERE user_id = ? AND batch_id IS NOT NULL
       ) as eb`,
      [numId, numId]
    );
    const enrolledBatchIds = (studentBatches || []).map(r => r.batch_id).filter(Boolean);

    let allBatchTasks = [];
    if (enrolledBatchIds.length > 0) {
      const placeholders = enrolledBatchIds.map(() => '?').join(',');
      allBatchTasks = await query(
        `SELECT id, batch_id, title, created_at, points
         FROM batch_tasks
         WHERE batch_id IN (${placeholders})
         ORDER BY created_at ASC`,
        enrolledBatchIds
      );
    }

    const taskSubmissions = await query(
      `SELECT id, task_id, status, marks_obtained, score,
              COALESCE(submitted_at, created_at) as submitted_at
       FROM task_submissions
       WHERE user_id = ?
       ORDER BY submitted_at ASC`,
      [numId]
    );

    // 2. Fetch Quizzes and Completed Attempts
    const publishedQuizzes = await query(
      `SELECT id, title, category, created_at
       FROM assessments
       WHERE status = 'published' OR is_published = 1
       ORDER BY created_at ASC`
    );

    const quizAttempts = await query(
      `SELECT aa.id, aa.assessment_id, aa.marks_obtained, aa.total_marks, aa.percentage, aa.score, aa.status,
              COALESCE(aa.completed_at, aa.submitted_at, aa.created_at) as attempt_date
       FROM assessment_attempts aa
       WHERE aa.user_id = ?
         AND (
           aa.status IN ('completed', 'finished', 'passed', 'failed', 'reviewed')
           OR aa.completed_at IS NOT NULL
           OR aa.submitted_at IS NOT NULL
         )
       ORDER BY attempt_date ASC`,
      [numId]
    );

    // 3. Fetch Practice Problems and Accepted Submissions
    const allPracticeProblems = await query(
      `SELECT id, title, difficulty, created_at
       FROM practice_problems
       ORDER BY created_at ASC`
    );

    const codingSubmissions = await query(
      `SELECT id, problem_id, status, passed_test_cases, total_test_cases,
              COALESCE(submitted_at, created_at) as submitted_at
       FROM coding_submissions
       WHERE student_id = ?
         AND (
           LOWER(status) IN ('passed', 'accepted')
           OR (passed_test_cases = total_test_cases AND total_test_cases > 0)
         )
       ORDER BY submitted_at ASC`,
      [numId]
    );

    // 4. Fetch Roadmap Items
    const roadmapItems = await query(
      `SELECT ri.id, ri.roadmap_id, ri.title, ri.status, ri.progress,
              COALESCE(ri.updated_at, ri.created_at) as updated_at, ri.created_at
       FROM roadmap_items ri
       JOIN roadmaps r ON ri.roadmap_id = r.id
       WHERE r.user_id = ? OR r.student_id = ?
       ORDER BY ri.created_at ASC`,
      [numId, numId]
    );

    // 5. Fetch AI Interview Submissions
    const interviewSubmissions = await query(
      `SELECT id, interview_type as role, overall_score, feedback, created_at
       FROM interview_submissions
       WHERE user_id = ?
       ORDER BY created_at ASC, id ASC`,
      [numId]
    );

    // 6. Fetch Student Attendance Records
    const attendanceRecords = await query(
      `SELECT id, session_date, status, remarks, created_at
       FROM attendance
       WHERE user_id = ?
       ORDER BY session_date ASC, created_at ASC`,
      [numId]
    );

    // Helper: Compute weighted score for any given snapshot cutoff time
    const computeSnapshot = (cutoffTime) => {
      const cutoff = new Date(cutoffTime).getTime();

      // A. Batch Tasks
      const assignedTasksCutoff = allBatchTasks.filter(t => new Date(t.created_at).getTime() <= cutoff);
      const submittedTaskIds = new Set(
        taskSubmissions
          .filter(s => new Date(s.submitted_at).getTime() <= cutoff)
          .map(s => s.task_id)
      );
      const batchAssigned = assignedTasksCutoff.length;
      const batchSubmitted = submittedTaskIds.size;
      const batchPct = batchAssigned > 0
        ? Math.min(100, Math.round((batchSubmitted / batchAssigned) * 100))
        : (batchSubmitted > 0 ? 100 : null);

      // B. Quizzes
      const assignedQuizzesCutoff = publishedQuizzes.filter(q => new Date(q.created_at).getTime() <= cutoff);
      const attemptsCutoff = quizAttempts.filter(a => new Date(a.attempt_date).getTime() <= cutoff);
      const uniqueAttemptedAssessments = new Set(attemptsCutoff.map(a => a.assessment_id));
      
      const quizzesAssigned = Math.max(uniqueAttemptedAssessments.size, assignedQuizzesCutoff.length);
      const quizzesAttempted = uniqueAttemptedAssessments.size;
      const quizPct = quizzesAssigned > 0
        ? Math.min(100, Math.round((quizzesAttempted / quizzesAssigned) * 100))
        : (quizzesAttempted > 0 ? 100 : null);

      const quizScores = attemptsCutoff.map(a => {
        return Number(a.percentage) || (a.total_marks ? Math.round((Number(a.marks_obtained) / Number(a.total_marks)) * 100) : Number(a.score) || 0);
      });
      const avgQuizScore = quizScores.length > 0 ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : 0;

      // C. Coding Practice
      const problemsCutoff = allPracticeProblems.filter(p => new Date(p.created_at).getTime() <= cutoff);
      const solvedProblemIds = new Set(
        codingSubmissions
          .filter(c => new Date(c.submitted_at).getTime() <= cutoff)
          .map(c => c.problem_id)
      );
      const codingAssigned = problemsCutoff.length;
      const codingSolved = solvedProblemIds.size;
      const codingPct = codingAssigned > 0
        ? Math.min(100, Math.round((codingSolved / codingAssigned) * 100))
        : (codingSolved > 0 ? 100 : null);

      // D. AI Roadmap
      const roadmapItemsCutoff = roadmapItems.filter(r => new Date(r.created_at).getTime() <= cutoff);
      const completedRoadmap = roadmapItemsCutoff.filter(r => {
        const isDone = String(r.status).toLowerCase() === 'completed' || Number(r.progress) >= 100;
        return isDone && new Date(r.updated_at).getTime() <= cutoff;
      });
      const roadmapTotal = roadmapItemsCutoff.length;
      const roadmapDone = completedRoadmap.length;
      const roadmapPct = roadmapTotal > 0
        ? Math.min(100, Math.round((roadmapDone / roadmapTotal) * 100))
        : (roadmapDone > 0 ? 100 : null);

      // E. AI Interview
      const interviewsCutoff = interviewSubmissions.filter(i => new Date(i.created_at).getTime() <= cutoff);
      let interviewScore = null;
      let interviewPrevious = null;
      let interviewDelta = 0;
      let hasInterview = false;

      if (interviewsCutoff.length > 0) {
        hasInterview = true;
        const latest = interviewsCutoff[interviewsCutoff.length - 1];
        interviewScore = Math.min(100, Math.max(0, Math.round(Number(latest.overall_score || 0))));
        if (interviewsCutoff.length > 1) {
          const prev = interviewsCutoff[interviewsCutoff.length - 2];
          interviewPrevious = Math.min(100, Math.max(0, Math.round(Number(prev.overall_score || 0))));
          interviewDelta = interviewScore - interviewPrevious;
        }
      }

      // F. Attendance
      const attendanceCutoff = attendanceRecords.filter(a => {
        const d = a.session_date ? new Date(a.session_date).getTime() : new Date(a.created_at).getTime();
        return !isNaN(d) && d <= cutoff;
      });
      const attTotal = attendanceCutoff.length;
      const attPresent = attendanceCutoff.filter(a => String(a.status || '').toLowerCase() === 'present').length;
      const attPct = attTotal > 0
        ? Math.min(100, Math.round((attPresent / attTotal) * 100))
        : null;

      // Weighted calculation across 6 parameters:
      // Attendance: 20% (0.20)
      // Coding Practice: 20% (0.20)
      // Batch Tasks: 15% (0.15)
      // Quizzes: 15% (0.15)
      // AI Roadmap: 15% (0.15)
      // AI Interview: 15% (0.15)
      const weightsConfig = [
        { key: 'attendance', pct: attPct, weight: 0.20 },
        { key: 'coding', pct: codingPct, weight: 0.20 },
        { key: 'batch', pct: batchPct, weight: 0.15 },
        { key: 'quiz', pct: quizPct, weight: 0.15 },
        { key: 'roadmap', pct: roadmapPct, weight: 0.15 },
        { key: 'interview', pct: interviewScore, weight: 0.15 },
      ];

      let weightedSum = 0;
      let activeWeight = 0;

      for (const w of weightsConfig) {
        if (w.pct !== null && w.pct !== undefined) {
          weightedSum += w.pct * w.weight;
          activeWeight += w.weight;
        }
      }

      const overallProgress = activeWeight > 0 ? Math.min(100, Math.round(weightedSum / activeWeight)) : 0;

      return {
        overallProgress,
        breakdown: {
          batchTasks: {
            submitted: batchSubmitted,
            total: batchAssigned,
            percentage: batchPct ?? 0,
            hasData: batchPct !== null,
          },
          quizzes: {
            attempted: quizzesAttempted,
            total: quizzesAssigned,
            percentage: quizPct ?? 0,
            avgScore: avgQuizScore,
            targetBenchmark: 75,
            cohortAverage: 72,
            hasData: quizPct !== null,
          },
          coding: {
            solved: codingSolved,
            total: codingAssigned,
            percentage: codingPct ?? 0,
            hasData: codingPct !== null,
          },
          roadmap: {
            completed: roadmapDone,
            total: roadmapTotal,
            percentage: roadmapPct ?? 0,
            hasData: roadmapPct !== null,
          },
          interview: {
            score: interviewScore,
            previousScore: interviewPrevious,
            delta: interviewDelta,
            attemptedCount: interviewsCutoff.length,
            hasData: hasInterview,
          },
          attendance: {
            present: attPresent,
            total: attTotal,
            percentage: attPct ?? 0,
            hasData: attPct !== null,
          },
        },
      };
    };

    // Calculate Weekly Progress History (Week 1, Week 2, Week 3, Week 4 ...)
    const now = new Date();
    const nowMs = now.getTime();
    const startDate = new Date(userJoinDate);
    const startMs = isNaN(startDate.getTime()) ? (nowMs - 28 * 86400000) : startDate.getTime();
    const daysSinceJoin = Math.max(1, Math.ceil((nowMs - startMs) / 86400000));
    
    const weeklyProgress = [];
    const oneWeekMs = 7 * 86400000;

    if (daysSinceJoin > 28) {
      // User has been here more than 4 weeks: show true chronological progression from join date
      const totalWeeks = Math.min(12, Math.max(4, Math.ceil(daysSinceJoin / 7)));
      for (let w = 1; w <= totalWeeks; w++) {
        const weekCutoffMs = (w === totalWeeks) ? nowMs : Math.min(nowMs, startMs + w * oneWeekMs);
        const snap = computeSnapshot(weekCutoffMs);
        const weekDateObj = new Date(weekCutoffMs);
        const dateLabel = weekDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        const bTasks = snap.breakdown.batchTasks;
        const tasksSolved = bTasks?.submitted ?? 0;
        const tasksTotal = bTasks?.total ?? 0;
        const tasksRemaining = Math.max(0, tasksTotal - tasksSolved);

        weeklyProgress.push({
          week: `Week ${w}`,
          label: `Week ${w}`,
          dateLabel,
          cutoffDate: weekDateObj.toISOString(),
          value: snap.overallProgress,
          tasksSolved,
          tasksRemaining,
          tasksTotal,
          breakdown: snap.breakdown,
        });
      }
    } else {
      // User joined recently: construct 4-week window leading up to current week
      for (let w = 1; w <= 4; w++) {
        const weekCutoffMs = nowMs - (4 - w) * oneWeekMs;
        const snap = computeSnapshot(weekCutoffMs);
        const weekDateObj = new Date(weekCutoffMs);
        const dateLabel = weekDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        const bTasks = snap.breakdown.batchTasks;
        const tasksSolved = bTasks?.submitted ?? 0;
        const tasksTotal = bTasks?.total ?? 0;
        const tasksRemaining = Math.max(0, tasksTotal - tasksSolved);

        weeklyProgress.push({
          week: `Week ${w}`,
          label: `Week ${w}`,
          dateLabel,
          cutoffDate: weekDateObj.toISOString(),
          value: snap.overallProgress,
          tasksSolved,
          tasksRemaining,
          tasksTotal,
          breakdown: snap.breakdown,
        });
      }
    }

    // Calculate Monthly Progress History (Month 1, Month 2, Month 3 ...)
    const monthlyProgress = [];
    const oneMonthMs = 30 * 86400000;
    const totalMonths = Math.min(6, Math.max(3, Math.ceil(daysSinceJoin / 30)));

    if (daysSinceJoin > 60) {
      for (let m = 1; m <= totalMonths; m++) {
        const monthCutoffMs = (m === totalMonths) ? nowMs : Math.min(nowMs, startMs + m * oneMonthMs);
        const snap = computeSnapshot(monthCutoffMs);
        const monthDateObj = new Date(monthCutoffMs);
        const dateLabel = monthDateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

        monthlyProgress.push({
          month: `Month ${m}`,
          label: `Month ${m}`,
          dateLabel,
          cutoffDate: monthDateObj.toISOString(),
          value: snap.overallProgress,
          breakdown: snap.breakdown,
        });
      }
    } else {
      // 3-month window leading up to current month
      for (let m = 1; m <= 3; m++) {
        const monthCutoffMs = nowMs - (3 - m) * oneMonthMs;
        const snap = computeSnapshot(monthCutoffMs);
        const monthDateObj = new Date(monthCutoffMs);
        const dateLabel = monthDateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

        monthlyProgress.push({
          month: `Month ${m}`,
          label: `Month ${m}`,
          dateLabel,
          cutoffDate: monthDateObj.toISOString(),
          value: snap.overallProgress,
          breakdown: snap.breakdown,
        });
      }
    }

    // Current real-time snapshot
    const currentSnapshot = computeSnapshot(now.getTime());

    // 6 Activity Indicator Cards
    const b = currentSnapshot.breakdown;
    const activityCards = [
      {
        id: 'attendance',
        title: 'Attendance',
        icon: 'CalendarCheck',
        numerator: b.attendance.present,
        denominator: b.attendance.total,
        ratioLabel: b.attendance.hasData ? `${b.attendance.present} / ${b.attendance.total} Sessions` : 'No Sessions',
        percentage: b.attendance.percentage,
        subtext: b.attendance.hasData ? `${b.attendance.percentage}% attendance` : 'No attendance recorded',
        status: b.attendance.hasData ? 'active' : 'idle',
        color: '#ec4899',
        badgeColor: 'pink',
        hasData: b.attendance.hasData,
      },
      {
        id: 'batch_tasks',
        title: 'Batch Tasks',
        icon: 'BookOpen',
        numerator: b.batchTasks.submitted,
        denominator: b.batchTasks.total,
        ratioLabel: `${b.batchTasks.submitted} / ${b.batchTasks.total} Tasks`,
        percentage: b.batchTasks.percentage,
        subtext: b.batchTasks.total > 0 ? `${b.batchTasks.percentage}% submitted` : 'No tasks assigned',
        status: b.batchTasks.total > 0 ? 'active' : 'idle',
        color: '#4f46e5',
        badgeColor: 'blue',
      },
      {
        id: 'quizzes',
        title: 'Quizzes',
        icon: 'CheckSquare',
        numerator: b.quizzes.attempted,
        denominator: b.quizzes.total,
        ratioLabel: `${b.quizzes.attempted} / ${b.quizzes.total} Quizzes`,
        percentage: b.quizzes.percentage,
        subtext: b.quizzes.hasData ? `${b.quizzes.percentage}% attended (Avg ${b.quizzes.avgScore}%)` : 'No quizzes active',
        status: b.quizzes.hasData ? 'active' : 'idle',
        color: '#10b981',
        badgeColor: 'emerald',
      },
      {
        id: 'coding_practice',
        title: 'Coding Practice',
        icon: 'Code2',
        numerator: b.coding.solved,
        denominator: b.coding.total,
        ratioLabel: `${b.coding.solved} / ${b.coding.total} Solved`,
        percentage: b.coding.percentage,
        subtext: b.coding.total > 0 ? `${b.coding.percentage}% completed` : 'No problems active',
        status: b.coding.total > 0 ? 'active' : 'idle',
        color: '#06b6d4',
        badgeColor: 'cyan',
      },
      {
        id: 'ai_roadmap',
        title: 'AI Roadmap',
        icon: 'Sparkles',
        numerator: b.roadmap.completed,
        denominator: b.roadmap.total,
        ratioLabel: `${b.roadmap.completed} / ${b.roadmap.total} Modules`,
        percentage: b.roadmap.percentage,
        subtext: b.roadmap.total > 0 ? `${b.roadmap.percentage}% completed` : 'Roadmap pending',
        status: b.roadmap.total > 0 ? 'active' : 'idle',
        color: '#8b5cf6',
        badgeColor: 'purple',
      },
      {
        id: 'ai_interview',
        title: 'AI Interview',
        icon: 'Bot',
        numerator: b.interview.score ?? 0,
        denominator: 100,
        ratioLabel: b.interview.hasData ? `${b.interview.score}% Score` : 'Not Attempted',
        percentage: b.interview.hasData ? (b.interview.score ?? 0) : 0,
        subtext: b.interview.hasData
          ? (b.interview.delta !== 0 ? `${b.interview.delta > 0 ? '+' : ''}${b.interview.delta}% vs prior` : 'Latest score')
          : 'Pending first interview',
        status: b.interview.hasData ? 'active' : 'unattempted',
        color: '#f59e0b',
        badgeColor: 'amber',
        hasData: b.interview.hasData,
      },
    ];

    return {
      overallProgress: currentSnapshot.overallProgress,
      weeklyProgress,
      monthlyProgress,
      activityCards,
      breakdown: currentSnapshot.breakdown,
    };
  } catch (err) {
    console.error('[calculateStudentProgressAnalytics Error]:', err);
    return null;
  }
};
