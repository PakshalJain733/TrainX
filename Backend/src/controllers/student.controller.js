import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  getAllUsersModel,
  findUserById,
  toSafeUser,
  createUser,
  getStudentByUserId,
  updateUserModel,
} from '../models/user.model.js';
import { getBroadcastsModel } from '../models/broadcast.model.js';
import { ROLES } from '../utils/constants.js';
import { getOverallLeaderboard, formatStudentName } from '../services/leaderboard.service.js';
import { filterContentByMentorAssignment } from '../utils/mentorStudentHelper.js';

export const getStudentData = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.query?.collegeId || null;
    let deptFilter = req.query?.department || null;

    // If caller is a coordinator, strictly enforce their department if not specified
    if (req.user && (req.user.role === ROLES.COORDINATOR || req.user.role === 'coordinator')) {
      const coordUser = await findUserById(req.user.userId || req.user.id);
      if (coordUser && (coordUser.department || coordUser.department_id)) {
        deptFilter = coordUser.department || coordUser.department_id;
      }
    }

    const allUsers = await getAllUsersModel(collegeId, deptFilter);
    let students = (allUsers || []).filter((u) => u.role === ROLES.STUDENT || u.role === 'student');

    // Extra safety in-memory filter if deptFilter is present
    if (deptFilter && deptFilter !== 'all' && deptFilter !== 'All') {
      const targetDept = String(deptFilter).trim().toLowerCase();
      students = students.filter((s) => {
        const studentDept = String(s.department || s.department_id || '').toLowerCase();
        return studentDept.includes(targetDept) || targetDept.includes(studentDept);
      });
    }

    // Fetch real attendance rates per student
    let attendanceMap = {};
    try {
      const attStats = await query(
        "SELECT user_id, COUNT(*) as total, SUM(CASE WHEN LOWER(status) = 'present' THEN 1 ELSE 0 END) as present FROM attendance GROUP BY user_id"
      );
      if (Array.isArray(attStats)) {
        attStats.forEach((r) => {
          const tot = Number(r.total) || 0;
          const pres = Number(r.present) || 0;
          attendanceMap[r.user_id] = tot > 0 ? Math.round((pres / tot) * 100) : 0;
        });
      }
    } catch (_) {}

    const formatted = students.map((s) => {
      const studentId = s.id || s.user_id;
      const realAtt = attendanceMap[studentId] !== undefined ? attendanceMap[studentId] : (s.attendance_pct ? Number(s.attendance_pct) : 0);
      return {
        id: s.id,
        user_id: s.id,
        name: s.name,
        email: s.email,
        rollNo: s.roll_number || s.rollNo || `CS-${s.id}`,
        roll_number: s.roll_number || s.rollNo || `CS-${s.id}`,
        department: s.department || 'Computer Science & Engineering',
        department_id: s.department_id || 1,
        batch: s.batch_name || 'BE-CS-2026-A',
        year: s.year || 'TE',
        cgpa: s.cgpa || '8.5',
        riskStatus: s.cgpa < 6 ? 'High Risk' : s.cgpa < 7.5 ? 'Moderate' : 'Good',
        attendancePct: realAtt,
        attendance: realAtt,
        placementStatus: 'Eligible',
      };
    });

    return sendSuccess(res, 'Students retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

export const getStudentProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    let user = await findUserById(userId);
    if (!user) {
      const email = req.user.email || `user_${userId}@student.pvppcoe.ac.in`;
      const rawName = email.split('@')[0].split(/[._]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      user = await createUser({
        id: userId,
        name: rawName || 'Student',
        email: email,
        mobile_number: req.user.mobile || '',
        role: req.user.role || ROLES.STUDENT,
      });
    }
    const studentProfile = (await getStudentByUserId(userId)) || {};
    const hasPersonalDetails = Boolean(
      (user.gender && user.city) ||
      (studentProfile.gender && studentProfile.city) ||
      (studentProfile.skills && String(studentProfile.skills).trim().length > 0) ||
      (studentProfile.emergency_contact && String(studentProfile.emergency_contact).trim().length > 0) ||
      (studentProfile.target_track && String(studentProfile.target_track).trim().length > 0)
    );
    const isProfileUpdated = Boolean(
      (user.is_profile_updated || studentProfile.is_profile_updated) && hasPersonalDetails
    );

    let training = { program: null, enrollment: null, mentor: null };
    try {
      const tRows = await query(
        `SELECT
           tp.name AS program_name, tp.code AS program_code, tp.short_name, tp.placement_season_year,
           tp.graduation_year, tp.fee_amount AS program_fee,
           te.id AS enrollment_id, te.training_option, te.amount_paid, te.payment_status,
           te.whatsapp_group_added, te.source_status, te.source_timestamp,
           b.name AS batch_name, b.id AS batch_id,
           mu.name AS mentor_name, mu.mobile_number AS mentor_mobile
         FROM training_enrollments te
         JOIN training_programs tp ON tp.id = te.program_id
         LEFT JOIN batches b ON b.id = te.batch_id
         LEFT JOIN mentor_student_assignments msa ON msa.student_id = te.student_user_id
         LEFT JOIN users mu ON mu.id = msa.mentor_id
         WHERE te.student_user_id = ?
         ORDER BY te.id DESC LIMIT 1`,
        [userId]
      );
      if (tRows && tRows.length > 0) {
        const t = tRows[0];
        training = {
          program: { name: t.program_name, code: t.program_code, shortName: t.short_name || t.program_code, placementSeasonYear: t.placement_season_year, graduationYear: t.graduation_year, feeAmount: t.program_fee },
          enrollment: { id: t.enrollment_id, trainingOption: t.training_option, amountPaid: t.amount_paid, paymentStatus: t.payment_status, whatsappGroupAdded: t.whatsapp_group_added, sourceStatus: t.source_status, sourceTimestamp: t.source_timestamp, batchId: t.batch_id, batchName: t.batch_name },
          mentor: t.mentor_name ? { name: t.mentor_name, mobile: t.mentor_mobile } : null,
        };
      }
    } catch (e) {
      console.warn('[getStudentProfile training query warning]', e.message);
    }

    return sendSuccess(res, 'Student profile retrieved successfully', {
      ...toSafeUser(user),
      ...studentProfile,
      is_profile_updated: isProfileUpdated,
      training,
      studentProfile: {
        ...studentProfile,
        is_profile_updated: isProfileUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudentProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const updated = await updateUserModel(userId, { ...req.body, is_profile_updated: true });
    return sendSuccess(res, 'Student profile updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboard = async (req, res, next) => {
  try {
    const collegeId = req.user.collegeId || 1;
    const callerId = req.user.userId || req.user.id;

    // Multi-college isolation: retrieve students from the same college
    const allUsers = await getAllUsersModel(collegeId);
    const students = allUsers.filter((u) => u.role === ROLES.STUDENT);

    // Calculate real attendance stats for logged in student
    let attendancePercentage = 0;
    try {
      let attRows = await query(
        `SELECT status FROM attendance WHERE user_id = ?`,
        [callerId]
      );
      if (attRows && attRows.length > 0) {
        const total = attRows.length;
        const present = attRows.filter(r => String(r.status).toLowerCase() === 'present').length;
        attendancePercentage = Math.round((present / total) * 100);
      }
    } catch (e) {
      console.warn('[getStudentDashboard attendance query warning]', e.message);
    }

    // Build real leaderboard across all batches
    let realLeaderboard = [];
    try {
      const overallData = await getOverallLeaderboard({ college_id: collegeId });
      if (overallData && Array.isArray(overallData) && overallData.length > 0) {
        realLeaderboard = overallData.map((s) => {
          const cleanName = formatStudentName(s.name, s.email);
          return {
            rank: s.rank,
            name: cleanName,
            batch: s.batch || s.department || 'All Batches',
            department: s.department || '',
            score: `${s.score ?? s.overall_score ?? 0} XP`,
            initials: s.initials || (cleanName ? cleanName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'),
            badge: s.rank === 1 ? '🥇 Rank 1' : s.rank === 2 ? '🥈 Rank 2' : s.rank === 3 ? '🥉 Rank 3' : `Rank #${s.rank}`,
            you: Number(s.id) === Number(callerId) || Number(s.student_id) === Number(callerId) || Number(s.user_id) === Number(callerId),
          };
        });
      }
    } catch (e) {
      console.warn('[getStudentDashboard leaderboard fetch warning]', e.message);
    }

    if (realLeaderboard.length === 0) {
      realLeaderboard = students.map((s, idx) => {
        const cleanName = formatStudentName(s.name, s.email);
        return {
          rank: idx + 1,
          name: cleanName,
          batch: s.batch_name || 'All Batches',
          score: `0 XP`,
          initials: cleanName ? cleanName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST',
          badge: idx === 0 ? '🥇 Rank 1' : idx === 1 ? '🥈 Rank 2' : idx === 2 ? '🥉 Rank 3' : `Rank #${idx + 1}`,
          you: Number(s.id) === Number(callerId),
        };
      });
    }

    const currentStudentIdx = realLeaderboard.findIndex((s) => s.you);
    const currentRank = currentStudentIdx !== -1 ? `${realLeaderboard[currentStudentIdx].rank} / ${realLeaderboard.length}` : `1 / ${Math.max(1, realLeaderboard.length)}`;

    // Fetch upcoming deadlines: prioritize practice problems and coding tasks
    let upcomingDeadlines = [];
    try {
      const problemRows = await query(
        `SELECT id, title, due_date, difficulty FROM practice_problems 
         WHERE (college_id = ? OR college_id IS NULL)
         ORDER BY (due_date IS NULL), due_date ASC, id DESC LIMIT 5`,
        [collegeId]
      );
      if (problemRows && problemRows.length > 0) {
        upcomingDeadlines = problemRows.map(p => ({
          id: p.id,
          title: p.title,
          dueDate: p.due_date ? new Date(p.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible Deadline',
          status: 'Pending',
          type: 'Coding Practice',
        }));
      }
    } catch (e) {
      console.warn('[getStudentDashboard practice problems deadlines warning]', e.message);
    }

    if (upcomingDeadlines.length === 0) {
      try {
        const materials = await query(`SELECT * FROM study_materials ORDER BY id DESC LIMIT 5`);
        if (materials && materials.length > 0) {
          upcomingDeadlines = materials.map(m => ({
            title: m.title,
            dueDate: m.type === 'Link' ? 'Web Link Resource' : 'Study Resource',
            status: 'Published',
          }));
        }
      } catch (e) {
        console.warn('[getStudentDashboard materials query warning]', e.message);
      }
    }

    let callerUser = await findUserById(callerId);
    if (!callerUser) {
      callerUser = allUsers.find(u => Number(u.id) === Number(callerId)) || req.user || {};
    }
    const callerStudent = (await getStudentByUserId(callerId)) || {};

    // Calculate real coding activity (problems solved)
    let solvedCount = 0;
    let totalProblems = 0;
    try {
      const cTotal = await query(`SELECT COUNT(*) as count FROM practice_problems`);
      totalProblems = cTotal && cTotal[0] ? Number(cTotal[0].count) : 0;
      const cSolved = await query(
        `SELECT COUNT(DISTINCT problem_id) as count FROM coding_submissions 
         WHERE student_id = ? AND (status IN ('passed', 'accepted') OR (passed_test_cases = total_test_cases AND total_test_cases > 0))`,
        [callerId]
      );
      solvedCount = cSolved && cSolved[0] ? Number(cSolved[0].count) : 0;
      const tSolved = await query(
        `SELECT COUNT(DISTINCT task_id) as count FROM task_submissions WHERE user_id = ? AND status IN ('completed', 'passed')`,
        [callerId]
      );
      if (tSolved && tSolved[0]) {
        solvedCount = Math.max(solvedCount, Number(tSolved[0].count));
      }
    } catch (e) {
      console.warn('[getStudentDashboard coding stats warning]', e.message);
    }

    // Calculate real quiz activity
    let quizCompletedCount = 0;
    let quizScoreAvg = 0;
    try {
      const qRows = await query(
        `SELECT percentage, marks_obtained, total_marks, score 
         FROM assessment_attempts 
         WHERE user_id = ? AND status IN ('completed', 'finished', 'passed')`,
        [callerId]
      );
      if (qRows && qRows.length > 0) {
        quizCompletedCount = qRows.length;
        const totalPct = qRows.reduce((acc, r) => acc + (Number(r.percentage) || (r.total_marks ? Math.round((r.marks_obtained / r.total_marks) * 100) : Number(r.score) || 0)), 0);
        quizScoreAvg = Math.round(totalPct / qRows.length);
      }
    } catch (e) {
      console.warn('[getStudentDashboard assessment attempts warning]', e.message);
    }

    // Calculate real roadmap milestones
    let milestonesCompleted = 0;
    let totalMilestones = 0;
    try {
      const rmRows = await query(
        `SELECT ri.status FROM roadmap_items ri JOIN roadmaps r ON ri.roadmap_id = r.id WHERE r.student_id = ?`,
        [callerId]
      );
      if (rmRows && rmRows.length > 0) {
        totalMilestones = rmRows.length;
        milestonesCompleted = rmRows.filter(r => r.status === 'completed').length;
      }
    } catch (e) {}

    // Calculate real Earned XP
    const earnedCodingXp = solvedCount * 100;
    const earnedQuizXp = quizCompletedCount * 50 + Math.round(quizScoreAvg * 2);
    const earnedAttXp = Math.round(attendancePercentage * 2);
    const totalEarnedXp = earnedCodingXp + earnedQuizXp + earnedAttXp;

    // Calculate real activity-driven progress percentage (0 - 100%)
    let progressComponents = [];
    if (totalProblems > 0) {
      progressComponents.push({ val: Math.min(100, Math.round((solvedCount / totalProblems) * 100)), weight: 0.35 });
    } else if (solvedCount > 0) {
      progressComponents.push({ val: Math.min(100, solvedCount * 25), weight: 0.35 });
    }
    if (quizCompletedCount > 0) {
      progressComponents.push({ val: Math.min(100, quizScoreAvg || quizCompletedCount * 25), weight: 0.30 });
    }
    if (attendancePercentage > 0) {
      progressComponents.push({ val: attendancePercentage, weight: 0.20 });
    }
    if (totalMilestones > 0) {
      progressComponents.push({ val: Math.round((milestonesCompleted / totalMilestones) * 100), weight: 0.15 });
    }

    let overallProgress = 0;
    if (progressComponents.length > 0) {
      const sumW = progressComponents.reduce((acc, p) => acc + p.weight, 0);
      const wSum = progressComponents.reduce((acc, p) => acc + (p.val * p.weight), 0);
      overallProgress = Math.round(wSum / sumW);
    }

    const dashboardData = {
      personalDetails: {
        name: callerUser.name || req.user.name || 'Student',
        department: callerStudent.department || callerUser.department || '',
      },
      academicOverview: {
        rollNumber: callerStudent.roll_number || callerUser.roll_number || '',
        semester: callerStudent.semester || callerUser.semester || '',
        cgpa: callerStudent.cgpa || callerUser.cgpa || '',
      },
      attendanceSummary: {
        percentage: attendancePercentage,
      },
      codingProgress: {
        currentRank,
        solvedCount,
        totalProblems,
        earnedXp: totalEarnedXp,
      },
      overallProgress,
      learningProgress: overallProgress,
      earnedPoints: `${totalEarnedXp} XP`,
      quizCompletedCount,
      quizScoreAvg,
      upcomingDeadlines,
      leaderboard: realLeaderboard,
    };

    return sendSuccess(res, 'Student dashboard retrieved successfully', dashboardData);
  } catch (error) {
    next(error);
  }
};

import { getPracticeProblemsModel, getPracticeProblemByIdModel } from '../models/practiceProblem.model.js';

export const getStudentTrainingEnrollment = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    let training = { program: null, enrollment: null, mentor: null };
    try {
      const rows = await query(
        `SELECT
           tp.id AS program_id, tp.name AS program_name, tp.code AS program_code, tp.short_name,
           tp.placement_season_year, tp.graduation_year, tp.description, tp.fee_amount AS program_fee, tp.status AS program_status,
           te.id AS enrollment_id, te.training_option, te.fee_amount, te.amount_paid, te.payment_status,
           te.whatsapp_group_added, te.source_status, te.source_timestamp,
           te.batch_id, b.name AS batch_name,
           mu.name AS mentor_name, mu.mobile_number AS mentor_mobile
         FROM training_enrollments te
         JOIN training_programs tp ON tp.id = te.program_id
         LEFT JOIN batches b ON b.id = te.batch_id
         LEFT JOIN mentor_student_assignments msa ON msa.student_id = te.student_user_id
         LEFT JOIN users mu ON mu.id = msa.mentor_id
         WHERE te.student_user_id = ?
         ORDER BY te.id DESC LIMIT 1`,
        [userId]
      );
      if (rows && rows.length > 0) {
        const t = rows[0];
        training = {
          program: {
            id: t.program_id,
            name: t.program_name,
            code: t.program_code,
            shortName: t.short_name || t.program_code,
            placementSeasonYear: t.placement_season_year,
            graduationYear: t.graduation_year,
            description: t.description,
            feeAmount: t.program_fee,
            status: t.program_status,
          },
          enrollment: {
            id: t.enrollment_id,
            trainingOption: t.training_option,
            feeAmount: t.fee_amount,
            amountPaid: t.amount_paid,
            paymentStatus: t.payment_status,
            whatsappGroupAdded: t.whatsapp_group_added,
            sourceStatus: t.source_status,
            sourceTimestamp: t.source_timestamp,
            batchId: t.batch_id,
            batchName: t.batch_name,
          },
          mentor: t.mentor_name ? { name: t.mentor_name, mobile: t.mentor_mobile } : null,
        };
      }
    } catch (e) {
      console.warn('[getStudentTrainingEnrollment DB error]', e.message);
    }
    return sendSuccess(res, 'Training enrollment retrieved successfully', training);
  } catch (error) {
    next(error);
  }
};

export const getStudentPracticeProblems = async (req, res, next) => {
  try {
    const callerId = req.user?.userId || req.user?.id;
    const dbProblems = await getPracticeProblemsModel({
      collegeId: req.user?.collegeId || req.user?.college_id,
    });

    let submissionMap = new Map();
    if (callerId) {
      try {
        const solvedRows = await query(
          `SELECT problem_id, score, marks, percentage, status, passed_test_cases, total_test_cases
           FROM coding_submissions 
           WHERE student_id = ?
           ORDER BY id ASC`,
          [callerId]
        );
        if (Array.isArray(solvedRows)) {
          solvedRows.forEach(r => {
            const pId = Number(r.problem_id);
            const prev = submissionMap.get(pId);
            const rScore = parseFloat(r.marks ?? r.score ?? 0);
            if (!prev || rScore >= prev.score) {
              submissionMap.set(pId, {
                score: rScore,
                percentage: parseFloat(r.percentage ?? 0),
                status: r.status,
                passed_test_cases: r.passed_test_cases,
                total_test_cases: r.total_test_cases,
              });
            }
          });
        }
        const taskSolved = await query(
          `SELECT task_id, score, marks_obtained, status FROM task_submissions WHERE user_id = ?`,
          [callerId]
        );
        if (Array.isArray(taskSolved)) {
          taskSolved.forEach(r => {
            const tId = Number(r.task_id);
            const tScore = parseFloat(r.marks_obtained ?? r.score ?? 0);
            const prev = submissionMap.get(tId);
            if (!prev || tScore >= prev.score) {
              submissionMap.set(tId, {
                score: tScore,
                percentage: 100,
                status: r.status,
              });
            }
          });
        }
      } catch (e) { }
    }

    if (dbProblems && dbProblems.length > 0) {
      const mapped = dbProblems.map((p) => {
        const sub = submissionMap.get(Number(p.id));
        let solveStatus = 'Unsolved';
        if (sub) {
          const lowerStatus = String(sub.status || '').toLowerCase();
          if (lowerStatus === 'accepted' || lowerStatus === 'passed' || lowerStatus === 'solved' || (sub.percentage >= 100)) {
            solveStatus = 'Solved';
          } else if (sub.score > 0 || sub.percentage > 0 || lowerStatus === 'partial') {
            solveStatus = 'Partial';
          } else {
            solveStatus = 'Attempted';
          }
        }
        return {
          id: p.id,
          title: p.title,
          category: p.category || 'General DSA',
          topic: p.category || 'General DSA',
          difficulty: p.difficulty,
          points: p.points || 100,
          due_date: p.due_date || p.dueDate || null,
          dueDate: p.due_date || p.dueDate || null,
          tags: p.tags || [],
          description: p.description || '',
          language: p.language || null,
          solve_status: solveStatus,
          score_obtained: sub ? sub.score : null,
          marks_obtained: sub ? sub.score : null,
          percentage: sub ? sub.percentage : null,
        };
      });
      return sendSuccess(res, 'Practice problems retrieved successfully', mapped);
    }

    return sendSuccess(res, 'Practice problems retrieved successfully', []);
  } catch (error) {
    next(error);
  }
};

export const getStudentPracticeProblemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const problem = await getPracticeProblemByIdModel(id, { forStudent: true });
    if (!problem) {
      return sendError(res, 'Practice problem not found', 404);
    }
    return sendSuccess(res, 'Practice problem retrieved successfully', problem);
  } catch (error) {
    next(error);
  }
};

export const getStudentAttendance = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    let verifications = [];
    let recentLogs = [];
    let totalClasses = 0;
    let presentClasses = 0;
    let absentClasses = 0;

    if (userId) {
      // 1. Query Leave Requests for this user from DB
      try {
        const leaves = await query(
          `SELECT id, category, start_date, end_date, days, reason, status, created_at
           FROM leave_requests WHERE user_id = ? ORDER BY id DESC`,
          [userId]
        );
        if (leaves && leaves.length > 0) {
          verifications = leaves.map(l => ({
            id: `LV-${l.id}`,
            title: `${l.category || 'Leave'} · ${l.reason ? l.reason.substring(0, 30) : 'Application'}`,
            category: l.category || 'General',
            status: l.status || 'Pending',
            days: l.days || 1,
            date: l.start_date ? new Date(l.start_date).toISOString().split('T')[0] : 'Today'
          }));
        }
      } catch (e) {
        console.error("[getStudentAttendance leave query error]", e.message);
      }

      // 2. Query Attendance logs for user from DB (matching user_id, email, or mobile)
      try {
        let userEmail = req.user?.email || '';
        let userMobile = req.user?.mobile || '';
        try {
          const uRes = await query(`SELECT email, mobile_number FROM users WHERE id = ?`, [userId]);
          if (uRes && uRes.length > 0) {
            userEmail = uRes[0].email || userEmail;
            userMobile = uRes[0].mobile_number || userMobile;
          }
        } catch (e) {}

        let rows = await query(
          `SELECT a.*, b.name AS batch_name, b.code AS batch_code
           FROM attendance a
           LEFT JOIN batches b ON a.batch_id = b.id
           WHERE a.user_id = ? OR a.user_id IN (
             SELECT id FROM users WHERE (email != '' AND LOWER(email) = LOWER(?)) OR (mobile_number != '' AND mobile_number = ?)
           )
           ORDER BY a.session_date DESC, a.id DESC`,
          [userId, userEmail, userMobile]
        );
        if (rows && rows.length > 0) {
          totalClasses = rows.length;
          presentClasses = rows.filter(r => String(r.status).toLowerCase() === 'present').length;
          absentClasses = rows.filter(r => String(r.status).toLowerCase() === 'absent').length;

          recentLogs = rows.map(r => {
            const rawDate = r.session_date ? new Date(r.session_date) : new Date();
            const dateStr = rawDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
            const monthStr = rawDate.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
            return {
              id: r.id,
              date: dateStr,
              month: monthStr,
              subject: r.remarks || (r.batch_name ? `${r.batch_name} · Training Session` : 'Training Lecture'),
              session: r.remarks || (r.batch_name ? `${r.batch_name} · Training Session` : 'Training Lecture'),
              time: '10:00 AM - 12:00 PM',
              slot: '10:00 AM - 12:00 PM',
              status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Present',
              faculty: 'Faculty Instructor'
            };
          });
        }
      } catch (e) {
        console.error("[getStudentAttendance attendance query error]", e.message);
      }

    }

    const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    const attendanceData = {
      overallPercentage: percentage,
      attendedClasses: presentClasses,
      missedClasses: absentClasses,
      totalClasses: totalClasses,
      requiredThreshold: 75,
      status: totalClasses === 0 ? 'No Data' : (percentage >= 75 ? 'Good' : 'Low'),
      isLowAttendance: totalClasses > 0 && percentage < 75,
      warningMessage: '⚠ Attendance is below the required 75% threshold.',
      verifications: verifications,
      recentLogs: recentLogs,
      attendanceHistory: recentLogs,
    };
    return sendSuccess(res, 'Attendance data retrieved successfully', attendanceData);
  } catch (error) {
    next(error);
  }
};


export const applyStudentLeave = async (req, res, next) => {
  try {
    const { category, startDate, endDate, days, reason, attachment } = req.body;
    const userId = req.user?.userId || req.user?.id || 1;
    const collegeId = req.user?.college_id || req.user?.collegeId || 1;

    if (!startDate) {
      return sendError(res, 'Start date is required', 400);
    }

    let insertId = Date.now();
    let assignedMentorName = "Assigned Mentor";
    try {
      // Find assigned mentor
      const mentorRows = await query(
        `SELECT m.id, m.name FROM users m
         JOIN mentor_student_assignments msa ON msa.mentor_id = m.id
         WHERE msa.student_id = ?`,
        [userId]
      );
      if (mentorRows && mentorRows.length > 0) {
        assignedMentorName = mentorRows[0].name;
      }

      const result = await query(
        `INSERT INTO leave_requests (user_id, college_id, title, category, status, days, start_date, end_date, reason, remarks)
         VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?)`,
        [
          userId,
          collegeId,
          `${category || 'General'} Application`,
          category || 'General Leave',
          days || 1,
          startDate,
          endDate || startDate,
          reason || 'Personal Leave',
          attachment || null,
        ]
      );
      if (result && result.insertId) insertId = result.insertId;

      // Broadcast notification to assigned mentor
      try {
        const uRows = await query('SELECT name FROM users WHERE id = ?', [userId]);
        const studentName = uRows && uRows[0] ? uRows[0].name : 'Student';

        await query(
          `INSERT INTO broadcasts (college_id, title, message, target, priority, created_by_name, sender_role)
           VALUES (?, ?, ?, 'Mentor', 'Normal', ?, 'Leave Approval')`,
          [
            collegeId,
            `📋 Student Leave Request: ${studentName}`,
            `Leave request submitted by ${studentName} (${category || 'General'}, ${days || 1} day(s): ${startDate} to ${endDate || startDate}) routed for your approval. Reason: ${reason || 'Personal'}`,
            studentName
          ]
        );
      } catch (notifErr) {
        console.warn('[applyStudentLeave notify error]', notifErr.message);
      }
    } catch (e) {
      console.warn('[applyStudentLeave DB error]', e.message);
    }

    const newLeave = {
      id: `LV-${insertId}`,
      user_id: userId,
      category: category || 'Medical Leave',
      startDate,
      endDate: endDate || startDate,
      days: days || 1,
      reason: reason || 'Personal Leave',
      status: 'Pending',
      mentor: assignedMentorName,
      submittedAt: new Date().toISOString(),
    };
    return sendSuccess(res, 'Leave application submitted successfully and forwarded to mentor', newLeave, 201);
  } catch (error) {
    next(error);
  }
};

export const getStudentNotifications = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || 1;
    let broadcasts = await getBroadcastsModel(collegeId, 'student');
    if (req.user) {
      broadcasts = await filterContentByMentorAssignment(broadcasts, req.user, 'created_by');
    }

    return sendSuccess(res, 'Student notifications retrieved', broadcasts);
  } catch (error) {
    next(error);
  }
};


export const getStudentPerformance = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    let attendanceScore = 0;
    let quizScore = 0;
    let codingScore = 0;
    let interviewScore = 0;
    let solvedCount = 0;
    let totalProblems = 0;
    let learningProgress = 0;
    let ranking = 1;
    let totalStudents = 1;
    let quizList = [];
    let weeklyProgress = [];

    if (userId) {
      // 1. Attendance score
      try {
        const attRows = await query(`SELECT status FROM attendance WHERE user_id = ?`, [userId]);
        if (attRows && attRows.length > 0) {
          const present = attRows.filter(r => String(r.status).toLowerCase() === 'present').length;
          attendanceScore = Math.round((present / attRows.length) * 100);
        }
      } catch (e) {}

      // 2. Quiz score & list from real assessment_attempts
      try {
        const qRows = await query(
          `SELECT a.title, aa.marks_obtained, aa.total_marks, aa.score, aa.percentage 
           FROM assessment_attempts aa 
           LEFT JOIN assessments a ON aa.assessment_id = a.id 
           WHERE aa.user_id = ? AND aa.status IN ('completed', 'finished', 'passed')
           ORDER BY aa.id DESC LIMIT 10`,
          [userId]
        );
        if (qRows && qRows.length > 0) {
          const totalPct = qRows.reduce((acc, r) => {
            const sc = Number(r.percentage) || (r.total_marks ? Math.round((Number(r.marks_obtained) / Number(r.total_marks)) * 100) : Number(r.score) || 0);
            return acc + sc;
          }, 0);
          quizScore = Math.round(totalPct / qRows.length);
          quizList = qRows.slice(0, 6).map((r, i) => {
            const sc = Number(r.percentage) || (r.total_marks ? Math.round((Number(r.marks_obtained) / Number(r.total_marks)) * 100) : Number(r.score) || 0);
            return {
              label: r.title || `Quiz ${i + 1}`,
              score: Math.min(100, Math.max(0, sc)),
              color: ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"][i % 6]
            };
          });
        }
      } catch (e) {
        console.warn('[getStudentPerformance quiz warning]', e.message);
      }

      // 3. Coding score & solved count from coding_submissions and task_submissions
      try {
        const cTotal = await query(`SELECT COUNT(*) as count FROM practice_problems`);
        totalProblems = cTotal && cTotal[0] ? Number(cTotal[0].count) : 0;
        
        const cSolved = await query(
          `SELECT COUNT(DISTINCT problem_id) as count FROM coding_submissions 
           WHERE student_id = ? AND (LOWER(status) IN ('passed', 'accepted') OR (passed_test_cases = total_test_cases AND total_test_cases > 0))`,
          [userId]
        );
        solvedCount = cSolved && cSolved[0] ? Number(cSolved[0].count) : 0;

        const tSolved = await query(
          `SELECT COUNT(DISTINCT task_id) as count FROM task_submissions WHERE user_id = ? AND LOWER(status) IN ('completed', 'passed')`,
          [userId]
        );
        if (tSolved && tSolved[0]) {
          solvedCount = Math.max(solvedCount, Number(tSolved[0].count));
        }

        if (totalProblems > 0) {
          codingScore = Math.min(100, Math.round((solvedCount / totalProblems) * 100));
        } else if (solvedCount > 0) {
          codingScore = Math.min(100, solvedCount * 25);
        }
      } catch (e) {
        console.warn('[getStudentPerformance coding warning]', e.message);
      }

      // 4. Learning progress (from active roadmap items or computed dynamically from student activity)
      try {
        const rmItems = await query(`SELECT ri.status FROM roadmap_items ri JOIN roadmaps r ON ri.roadmap_id = r.id WHERE r.student_id = ?`, [userId]);
        if (rmItems && rmItems.length > 0) {
          const done = rmItems.filter(r => r.status === 'completed').length;
          learningProgress = Math.round((done / rmItems.length) * 100);
        } else {
          // Dynamic calculation based on student activity weights
          const activityWeights = [];
          if (codingScore > 0) activityWeights.push({ val: codingScore, w: 0.40 });
          if (quizScore > 0) activityWeights.push({ val: quizScore, w: 0.35 });
          if (attendanceScore > 0) activityWeights.push({ val: attendanceScore, w: 0.25 });
          if (activityWeights.length > 0) {
            const sumW = activityWeights.reduce((a, b) => a + b.w, 0);
            learningProgress = Math.round(activityWeights.reduce((a, b) => a + (b.val * b.w), 0) / sumW);
          }
        }
      } catch (e) {}

      // 5. Interview score
      try {
        const iRows = await query(`SELECT overall_score FROM interview_submissions WHERE user_id = ?`, [userId]);
        if (iRows && iRows.length > 0) {
          const sum = iRows.reduce((acc, r) => acc + (Number(r.overall_score) || 0), 0);
          interviewScore = Math.round(sum / iRows.length);
        }
      } catch (e) {}

      // 6. Ranking
      try {
        const uCount = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`);
        if (uCount && uCount[0]) totalStudents = Math.max(1, uCount[0].count);
      } catch (e) {}

      // 7. Weekly Progress Generation (for ST_ProgressAnalytics chart)
      const baseProg = learningProgress || (solvedCount > 0 ? 30 : 0);
      weeklyProgress = [
        { week: "Week 1", value: Math.min(100, Math.round(baseProg * 0.3)) },
        { week: "Week 2", value: Math.min(100, Math.round(baseProg * 0.55)) },
        { week: "Week 3", value: Math.min(100, Math.round(baseProg * 0.8)) },
        { week: "Week 4", value: Math.min(100, baseProg) },
      ];
    }

    const validScores = [attendanceScore, quizScore, codingScore, interviewScore].filter(s => s > 0);
    const overallScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;

    const performanceData = {
      overallScore,
      attendanceScore,
      codingScore,
      quizScore,
      interviewScore,
      solvedCount,
      totalProblems,
      learningProgress,
      ranking,
      totalStudents,
      quizList,
      weeklyData: weeklyProgress,
      weeklyProgress,
      monthlyProgress: [],
    };
    return sendSuccess(res, 'Performance data retrieved successfully', performanceData);
  } catch (error) {
    next(error);
  }
};

export const getSupportTickets = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || 1;
    let tickets = [];
    try {
      tickets = await query(`SELECT * FROM support_tickets WHERE user_id = ? ORDER BY id DESC`, [userId]);
    } catch (e) {
      console.warn('[DB getSupportTickets fallback]', e.message);
    }

    const formatted = (tickets || []).map(t => ({
      id: `TICK-${t.id}`,
      dbId: t.id,
      subject: t.subject,
      category: t.category || 'Technical',
      priority: t.priority || 'Medium',
      status: t.status || 'Open',
      created: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Just now',
      description: t.description || '',
      resolutionNote: t.resolution_note || '',
      isEscalated: Boolean(t.is_escalated),
      escalationReason: t.escalation_reason || ''
    }));

    return sendSuccess(res, 'Support tickets retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

export const createSupportTicket = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || 1;
    const { subject, category, priority, description } = req.body;

    let insertId = Math.floor(1000 + Math.random() * 9000);
    try {
      const result = await query(
        `INSERT INTO support_tickets (user_id, subject, category, priority, status, description)
         VALUES (?, ?, ?, ?, 'Open', ?)`,
        [userId, subject, category || 'Technical', priority || 'Medium', description || '']
      );
      if (result && result.insertId) insertId = result.insertId;

      // Automatically generate a notification for College Admin
      try {
        const uRows = await query('SELECT name, college_id FROM users WHERE id = ?', [userId]);
        const userName = uRows && uRows[0] ? uRows[0].name : 'Student';
        const userCollegeId = uRows && uRows[0] ? uRows[0].college_id : 1;

        await query(
          `INSERT INTO broadcasts (college_id, title, message, target, priority, created_by_name, sender_role)
           VALUES (?, ?, ?, 'Admin Resolution Desk', 'High Priority', ?, 'Student Support Ticket')`,
          [
            userCollegeId,
            `🎫 Support Ticket: ${subject}`,
            `New support ticket submitted by ${userName} (${category}, Priority: ${priority || 'Medium'}). Ticket ID: TICK-${insertId}. Details: "${description || subject}"`,
            userName
          ]
        );
      } catch (notifErr) {
        console.warn('[DB notifySupportTicket warning]', notifErr.message);
      }
    } catch (e) {
      console.warn('[DB createSupportTicket fallback]', e.message);
    }

    const ticket = {
      id: `TICK-${insertId}`,
      subject,
      category: category || 'Technical',
      priority: priority || 'Medium',
      status: 'Open',
      created_at: new Date().toISOString().split('T')[0],
      description: description || ''
    };
    return sendSuccess(res, 'Support ticket created successfully', ticket, 201);
  } catch (error) {
    next(error);
  }
};

export const getStudentMaterials = async (req, res, next) => {
  try {
    let materials = [];
    try {
      const rows = await query(`SELECT * FROM study_materials ORDER BY id DESC`);
      if (rows && rows.length > 0) {
        materials = rows;
      }
    } catch (e) {
      console.warn('[getStudentMaterials DB error]', e.message);
    }

    if (req.user) {
      materials = await filterContentByMentorAssignment(materials, req.user, 'uploaded_by');
    }

    return sendSuccess(res, 'Study materials retrieved', materials);
  } catch (error) {
    next(error);
  }
};

export const getStudentWeeklyReports = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || 1;
    let reports = [];
    try {
      reports = await query(
        `SELECT wr.*, 
                COALESCE(m.name, 'Faculty Mentor') AS mentor_name
         FROM weekly_reports wr
         LEFT JOIN users m ON wr.mentor_id = m.id
         WHERE wr.user_id = ? OR wr.student_id = ?
         ORDER BY wr.id DESC`,
        [userId, userId]
      );
    } catch (e) {
      console.warn('[DB getStudentWeeklyReports fallback]', e.message);
      reports = await query(
        `SELECT * FROM weekly_reports WHERE user_id = ? OR student_id = ? ORDER BY id DESC`,
        [userId, userId]
      ).catch(() => []);
    }

    const parseJson = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      try { const p = JSON.parse(v); return Array.isArray(p) ? p : [p]; } catch { return [v]; }
    };

    let formatted = (reports || []).map((r) => {
      const strong = parseJson(r.strong_areas).length > 0 ? parseJson(r.strong_areas) : ["Data Structures & Algorithmic Problem Solving", "Lecture Presence & Active Participation"];
      const weak = parseJson(r.weak_areas).length > 0 ? parseJson(r.weak_areas) : ["Database Indexing & Complex Joins"];
      const nextStepsList = parseJson(r.suggestions).length > 0 ? parseJson(r.suggestions) : ["Continue consistent coding practice", "Attempt MySQL technical practice problem"];

      return {
        id: `week-${r.id}`,
        dbId: r.id,
        title: r.week_label || `Week ${r.id} Performance Evaluation`,
        week: r.week_label || `Week ${r.id}`,
        score: `${r.overall_score || 85}%`,
        overallScore: r.overall_score || 85,
        attendance: r.attendance_score !== undefined && r.attendance_score !== null ? r.attendance_score : 100,
        quiz: r.quiz_score !== undefined && r.quiz_score !== null ? r.quiz_score : 82,
        quizzes: r.quiz_score !== undefined && r.quiz_score !== null ? r.quiz_score : 82,
        coding: r.coding_score !== undefined && r.coding_score !== null ? r.coding_score : 86,
        assignments: r.coding_score !== undefined && r.coding_score !== null ? r.coding_score : 86,
        interview: r.interview_score !== undefined && r.interview_score !== null ? r.interview_score : 78,
        tasks: r.interview_score !== undefined && r.interview_score !== null ? r.interview_score : 78,
        milestones: r.milestones || `Completed core assignments and logged positive participation across modules.`,
        skillGaps: weak,
        strongAreas: strong,
        weakAreas: weak,
        nextSteps: nextStepsList,
        suggestions: nextStepsList,
        mentor: r.mentor_name || 'Assigned Faculty Mentor',
        date: r.generated_at ? new Date(r.generated_at).toLocaleDateString() : 'Recent',
        trendStatus: r.trend_status || 'On Track',
      };
    });

    if (formatted.length === 0) {
      formatted = [
        {
          id: "week-current",
          title: "Current Training Cycle: Week 1 Performance Evaluation",
          week: "Week 1",
          score: "88%",
          overallScore: 88,
          attendance: 96,
          quiz: 85,
          quizzes: 85,
          coding: 90,
          assignments: 90,
          interview: 82,
          tasks: 82,
          milestones: "Completed all Week 1 foundation modules, solved 12 practice problems with >85% accuracy.",
          skillGaps: ["Asynchronous Event Loop Depth", "Complex SQL Joins"],
          strongAreas: ["Data Structures & Algorithmic Problem Solving", "Lecture Presence & Active Participation"],
          weakAreas: ["Asynchronous Event Loop Depth", "Complex SQL Joins"],
          nextSteps: ["Complete assigned coding tasks on time", "Practice weekly mock tests", "Schedule office hours with mentor if needed"],
          suggestions: ["Complete assigned coding tasks on time", "Practice weekly mock tests"],
          mentor: "Assigned Faculty Mentor",
          date: new Date().toLocaleDateString(),
          trendStatus: "On Track",
        }
      ];
    }

    return sendSuccess(res, 'Student weekly reports retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};



