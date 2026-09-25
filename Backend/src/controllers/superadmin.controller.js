import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import { getAvailableTables, tableExists } from '../utils/tableAvailability.js';

const round1 = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
};

const toInt = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

// C2C 2029 is identified by the program code, never by a hard-coded id.
const C2C_PROGRAM_CODE = 'C2C 2029';

const loadC2CStats = async () => {
  const available = await getAvailableTables([
    'training_programs',
    'training_enrollments',
    'mentor_student_assignments',
    'batches',
  ]);

  if (!available.has('training_programs') || !available.has('training_enrollments')) {
    return {
      available: false,
      program: null,
      totals: {
        students: null,
        mentors: null,
        batches: null,
        enrollments: null,
        feePerStudent: null,
        feeCollected: null,
        feeOutstanding: null,
      },
      payments: { paid: null, partial: null, unpaid: null },
      whatsapp: { added: null, notAdded: null },
      branches: [],
    };
  }

  const [program] = await query(
    `SELECT id, name, code, short_name, placement_season_year, graduation_year, fee_amount, status
       FROM training_programs
      WHERE code = ?
      ORDER BY id ASC
      LIMIT 1`,
    [C2C_PROGRAM_CODE]
  );

  if (!program) {
    return {
      available: false,
      program: null,
      totals: {
        students: null,
        mentors: null,
        batches: null,
        enrollments: null,
        feePerStudent: null,
        feeCollected: null,
        feeOutstanding: null,
      },
      payments: { paid: null, partial: null, unpaid: null },
      whatsapp: { added: null, notAdded: null },
      branches: [],
    };
  }

  const mentorSubquery = available.has('mentor_student_assignments')
    ? `(SELECT COUNT(DISTINCT msa.mentor_id) FROM mentor_student_assignments msa
         JOIN training_enrollments e2 ON e2.student_user_id = msa.student_id
        WHERE e2.program_id = ?) AS mentors`
    : `NULL AS mentors`;

  const [totals] = await query(
    `SELECT
        (SELECT COUNT(DISTINCT e.student_user_id) FROM training_enrollments e WHERE e.program_id = ?) AS students,
        ${mentorSubquery},
        (SELECT COUNT(DISTINCT e3.batch_id) FROM training_enrollments e3
          WHERE e3.program_id = ? AND e3.batch_id IS NOT NULL) AS batches,
        (SELECT COUNT(*) FROM training_enrollments e4 WHERE e4.program_id = ?) AS enrollments,
        (SELECT COALESCE(SUM(e5.amount_paid), 0) FROM training_enrollments e5 WHERE e5.program_id = ?) AS collected,
        (SELECT COALESCE(SUM(GREATEST(e6.fee_amount - e6.amount_paid, 0)), 0) FROM training_enrollments e6
          WHERE e6.program_id = ?) AS outstanding`,
    [program.id, ...(available.has('mentor_student_assignments') ? [program.id] : []), program.id, program.id, program.id, program.id]
  );

  const [payments] = await query(
    `SELECT
        SUM(CASE WHEN e.payment_status = 'paid' THEN 1 ELSE 0 END) AS paid,
        SUM(CASE WHEN e.payment_status = 'partial' THEN 1 ELSE 0 END) AS partial,
        SUM(CASE WHEN e.payment_status = 'unpaid' THEN 1 ELSE 0 END) AS unpaid
       FROM training_enrollments e
      WHERE e.program_id = ?`,
    [program.id]
  );

  const [whatsapp] = await query(
    `SELECT
        SUM(CASE WHEN LOWER(TRIM(e.whatsapp_group_added)) = 'yes' THEN 1 ELSE 0 END) AS added,
        SUM(CASE WHEN LOWER(TRIM(e.whatsapp_group_added)) <> 'yes' OR e.whatsapp_group_added IS NULL THEN 1 ELSE 0 END) AS not_added
       FROM training_enrollments e
      WHERE e.program_id = ?`,
    [program.id]
  );

  const branches = available.has('batches')
    ? await query(
        `SELECT b.id, b.name, COUNT(DISTINCT e.student_user_id) AS students
           FROM training_enrollments e
           JOIN batches b ON b.id = e.batch_id
          WHERE e.program_id = ?
          GROUP BY b.id, b.name
          ORDER BY students DESC, b.name ASC`,
        [program.id]
      )
    : [];

  return {
    available: true,
    program: {
      id: program.id,
      name: program.name,
      code: program.code,
      shortName: program.short_name,
      placementSeasonYear: program.placement_season_year,
      graduationYear: program.graduation_year,
      status: program.status,
    },
    totals: {
      students: toInt(totals?.students) || 0,
      mentors: toInt(totals?.mentors) || 0,
      batches: toInt(totals?.batches) || 0,
      enrollments: toInt(totals?.enrollments) || 0,
      feePerStudent: toInt(program.fee_amount) || 0,
      feeCollected: toInt(totals?.collected) || 0,
      feeOutstanding: toInt(totals?.outstanding) || 0,
    },
    payments: {
      paid: toInt(payments?.paid) || 0,
      partial: toInt(payments?.partial) || 0,
      unpaid: toInt(payments?.unpaid) || 0,
    },
    whatsapp: {
      added: toInt(whatsapp?.added) || 0,
      notAdded: toInt(whatsapp?.not_added) || 0,
    },
    branches: (branches || []).map((b) => ({
      id: b.id,
      name: b.name,
      students: toInt(b.students),
    })),
  };
};

export const getSuperAdminC2CStats = async (req, res, next) => {
  try {
    const c2c = await loadC2CStats();
    return sendSuccess(
      res,
      c2c.available ? 'C2C statistics retrieved successfully' : 'C2C data is not available yet',
      c2c
    );
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminOverview = async (req, res, next) => {
  try {
    const [[colleges], [students], [departments]] = await Promise.all([
      query('SELECT COUNT(*) AS n FROM colleges'),
      query(`SELECT COUNT(*) AS n FROM users WHERE role = 'student'`),
      query('SELECT COUNT(*) AS n FROM departments'),
    ]);

    const collegeRows = await query(
      `SELECT c.id, c.name, c.code,
              (SELECT COUNT(*) FROM departments d WHERE d.college_id = c.id) AS departmentsCount,
              (SELECT COUNT(*) FROM students s WHERE s.college_id = c.id) AS studentsCount
       FROM colleges c
       ORDER BY c.id DESC
       LIMIT 4`
    );

    const stats = [
      { id: 'colleges', label: 'Total Colleges', value: String(toInt(colleges?.n)), change: 'Registered institutions', trend: 'up', icon: 'Building2' },
      { id: 'students', label: 'Active Students', value: String(toInt(students?.n)), change: 'Enrolled students', trend: 'up', icon: 'Users' },
      { id: 'departments', label: 'Departments Covered', value: String(toInt(departments?.n)), change: 'Across all colleges', trend: 'neutral', icon: 'GraduationCap' },
      { id: 'verifications', label: 'Pending Verifications', value: '0', change: 'No verification workflow yet', trend: 'neutral', icon: 'ShieldAlert' },
    ];

    const recentColleges = (collegeRows || []).map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      location: '—',
      departmentsCount: toInt(c.departmentsCount),
      studentsCount: toInt(c.studentsCount),
      status: 'Active',
    }));

    return sendSuccess(res, 'Super admin overview retrieved successfully', {
      stats,
      colleges: recentColleges,
      verifications: [],
    });
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminColleges = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT c.id, c.name, c.code, c.created_at,
              (SELECT COUNT(*) FROM departments d WHERE d.college_id = c.id) AS departmentsCount,
              (SELECT COUNT(*) FROM students s WHERE s.college_id = c.id) AS studentsCount,
              (SELECT a.name FROM users a WHERE a.college_id = c.id AND a.role = 'college_admin' ORDER BY a.id ASC LIMIT 1) AS adminName,
              (SELECT a.email FROM users a WHERE a.college_id = c.id AND a.role = 'college_admin' ORDER BY a.id ASC LIMIT 1) AS adminEmail
       FROM colleges c
       ORDER BY c.id ASC`
    );

    return sendSuccess(res, 'Colleges retrieved successfully', (rows || []).map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      location: '—',
      created_at: c.created_at,
      adminName: c.adminName || '—',
      adminEmail: c.adminEmail || '—',
      departmentsCount: toInt(c.departmentsCount),
      studentsCount: toInt(c.studentsCount),
      status: 'Active',
    })));
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminDepartments = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT d.id, d.name, d.code, d.college_id, c.name AS college_name,
              (SELECT COUNT(*) FROM batches b WHERE b.department_id = d.id) AS batchesCount
       FROM departments d
       LEFT JOIN colleges c ON d.college_id = c.id
       ORDER BY d.id ASC`
    );
    return sendSuccess(res, 'Departments retrieved successfully', rows.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      collegeId: d.college_id,
      collegeName: d.college_name,
      collegesCount: 1,
      activeStudents: 0,
      batchesCount: toInt(d.batchesCount),
      status: 'Active',
    })));
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminBatches = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT b.id, b.name, b.year, b.division, b.status, b.mentor, b.students,
              c.name AS college_name, d.name AS department_name,
              (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id) AS enrolled_students
       FROM batches b
       LEFT JOIN colleges c ON b.college_id = c.id
       LEFT JOIN departments d ON b.department_id = d.id
       ORDER BY b.id DESC`
    );
    return sendSuccess(res, 'Batches retrieved successfully', rows.map((b) => ({
      id: b.id,
      name: b.name,
      college: b.college_name || '—',
      department: b.department_name || '—',
      students: toInt(b.enrolled_students) || toInt(b.students),
      mentor: b.mentor || '—',
      progress: null,
      status: b.status === 'inactive' ? 'Inactive' : 'Active',
    })));
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminCoordinators = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT u.id, u.name, u.email, c.name AS college_name,
              (SELECT COUNT(*) FROM coordinator_departments cd WHERE cd.coordinator_id = u.id) AS assigned_departments,
              (SELECT COUNT(DISTINCT b.id) FROM batches b
                 JOIN departments d ON b.department_id = d.id
                 JOIN coordinator_departments cd2 ON cd2.department_id = d.id
               WHERE cd2.coordinator_id = u.id) AS assigned_batches
       FROM users u
       LEFT JOIN colleges c ON u.college_id = c.id
       WHERE u.role = 'coordinator'
       ORDER BY u.id ASC`
    );
    return sendSuccess(res, 'Coordinators retrieved successfully', rows.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      college: c.college_name || '—',
      department: `Departments: ${toInt(c.assigned_departments)}`,
      assignedBatches: toInt(c.assigned_batches),
      status: 'Active',
    })));
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminMentors = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT u.id, u.name, u.email, c.name AS college_name,
              (SELECT COUNT(*) FROM mentor_assignments ma WHERE ma.mentor_id = u.id) AS batches_count,
              (SELECT COUNT(*) FROM mentor_student_assignments msa WHERE msa.mentor_id = u.id) AS allocated_students
       FROM users u
       LEFT JOIN colleges c ON u.college_id = c.id
       WHERE u.role = 'mentor'
       ORDER BY u.id ASC`
    );
    return sendSuccess(res, 'Mentors retrieved successfully', rows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      college: m.college_name || '—',
      specialization: `Batches: ${toInt(m.batches_count)}`,
      allocatedStudents: toInt(m.allocated_students),
      rating: null,
      status: 'Active',
    })));
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminStudents = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT u.id, u.name, u.email, c.name AS college_name, d.name AS department_name,
              b.name AS batch_name, att.attendance_percentage,
              ag.assessment
       FROM users u
       JOIN students s ON s.user_id = u.id
       LEFT JOIN colleges c ON u.college_id = c.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN attendance_summary att ON att.user_id = u.id
       LEFT JOIN (SELECT user_id, ROUND(AVG(percentage), 1) AS assessment
                  FROM assessment_attempts WHERE status = 'completed' GROUP BY user_id) ag ON ag.user_id = u.id
       WHERE u.role = 'student'
       ORDER BY u.id DESC
       LIMIT 500`
    );
    return sendSuccess(res, 'Students retrieved successfully', rows.map((s) => {
      const attendance = round1(s.attendance_percentage);
      const score = round1(s.assessment);
      let riskLevel = 'Low';
      if (attendance != null && attendance < 50) riskLevel = 'High';
      else if (attendance != null && attendance < 75) riskLevel = 'Medium';
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        college: s.college_name || '—',
        department: s.department_name || '—',
        batch: s.batch_name || '—',
        attendance,
        assessment: score,
        riskLevel,
        score: attendance != null && score != null ? `${Math.round((attendance + score) / 2)}%` : (attendance != null ? `${Math.round(attendance)}%` : score != null ? `${Math.round(score)}%` : '—'),
      };
    }));
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminAttendance = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT b.id, b.name AS batch_name, c.name AS college_name,
              (SELECT COUNT(DISTINCT sb.user_id) FROM student_batches sb WHERE sb.batch_id = b.id) AS total_students,
              (SELECT ROUND(AVG(att.attendance_percentage), 1) FROM attendance_summary att
                 JOIN student_batches sb2 ON sb2.user_id = att.user_id WHERE sb2.batch_id = b.id) AS avg_attendance,
              (SELECT COUNT(DISTINCT att2.user_id) FROM attendance_summary att2
                 JOIN student_batches sb3 ON sb3.user_id = att2.user_id
               WHERE sb3.batch_id = b.id AND att2.attendance_percentage < 75) AS flagged_students
       FROM batches b
       LEFT JOIN colleges c ON b.college_id = c.id
       ORDER BY b.id DESC`
    );
    return sendSuccess(res, 'Attendance overview retrieved successfully', rows.map((b) => {
      const avg = round1(b.avg_attendance);
      const status = avg == null ? 'No Data' : avg >= 90 ? 'Healthy' : avg >= 80 ? 'Moderate' : 'Attention Required';
      return {
        id: b.id,
        college: b.college_name || '—',
        batch: b.batch_name,
        totalStudents: toInt(b.total_students),
        avgAttendance: avg != null ? `${avg}%` : '—',
        flaggedStudents: toInt(b.flagged_students),
        status,
      };
    }));
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminPerformance = async (req, res, next) => {
  try {
    const [overall] = await query(
      `SELECT ROUND(AVG(per.avg_assessment), 1) AS overall_pass_rate,
              ROUND(AVG(per.combined), 1) AS readiness
       FROM (
         SELECT s.user_id,
                (SELECT ROUND(AVG(aa.percentage), 1) FROM assessment_attempts aa
                 WHERE aa.user_id = s.user_id AND aa.status = 'completed') AS avg_assessment,
                att.attendance_percentage
         FROM students s
         LEFT JOIN attendance_summary att ON att.user_id = s.user_id
       ) per
       WHERE per.avg_assessment IS NOT NULL`
    );

    const benchmarks = await query(
      `SELECT c.name AS college_name,
              (SELECT COUNT(*) FROM students s2 WHERE s2.college_id = c.id) AS active_students,
              (SELECT ROUND(AVG(x.avg), 1) FROM (
                 SELECT s3.user_id, (SELECT ROUND(AVG(aa2.percentage), 1) FROM assessment_attempts aa2
                   WHERE aa2.user_id = s3.user_id AND aa2.status = 'completed') AS avg
                 FROM students s3 WHERE s3.college_id = c.id) x WHERE x.avg IS NOT NULL) AS pass_rate,
              (SELECT ROUND(AVG(y.combined), 1) FROM (
                 SELECT s4.user_id,
                        (SELECT ROUND(AVG(aa3.percentage), 1) FROM assessment_attempts aa3
                          WHERE aa3.user_id = s4.user_id AND aa3.status = 'completed') AS avg,
                        (SELECT attendance_percentage FROM attendance_summary at3 WHERE at3.user_id = s4.user_id) AS att
                 FROM students s4 WHERE s4.college_id = c.id) y
               WHERE y.avg IS NOT NULL AND y.att IS NOT NULL) AS readiness_score
       FROM colleges c
       ORDER BY c.id ASC`
    );

    const subjectProficiency = await query(
      `SELECT d.name AS subject,
              (SELECT ROUND(AVG(aa4.percentage), 1) FROM assessment_attempts aa4
                 JOIN students s5 ON s5.user_id = aa4.user_id
               WHERE s5.department_id = d.id AND aa4.status = 'completed') AS score
       FROM departments d
       HAVING score IS NOT NULL
       ORDER BY score DESC`
    );

    return sendSuccess(res, 'Performance analytics retrieved successfully', {
      overallPassRate: round1(overall?.overall_pass_rate),
      avgPlacementReadiness: round1(overall?.readiness),
      collegeBenchmarks: (benchmarks || []).map((b) => ({
        college: b.college_name,
        passRate: round1(b.pass_rate),
        readinessScore: round1(b.readiness_score),
        activeStudents: toInt(b.active_students),
      })),
      subjectProficiency: (subjectProficiency || []).map((p) => ({ subject: p.subject, score: round1(p.score) })),
    });
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminWeeklyReports = async (req, res, next) => {
  try {
    const weekly = await query(
      `SELECT wr.id, wr.title, wr.week_number, wr.year, wr.created_at,
              u.name AS mentor_name
       FROM weekly_reports wr
       LEFT JOIN users u ON wr.mentor_id = u.id
       ORDER BY wr.id DESC
       LIMIT 100`
    );
    const generated = await query(
      `SELECT r.id, r.title, r.report_type, r.created_at, u.name AS generated_by
       FROM reports r
       LEFT JOIN users u ON r.generated_by = u.id
       ORDER BY r.id DESC
       LIMIT 100`
    );

    const list = [
      ...(weekly || []).map((w) => ({
        id: `weekly-${w.id}`,
        title: w.title || `Week ${w.week_number}, ${w.year}`,
        weekRange: `Week ${w.week_number}, ${w.year}`,
        reportType: 'Weekly Report',
        generatedBy: w.mentor_name || 'System',
        status: 'Verified',
        size: '—',
      })),
      ...(generated || []).map((r) => ({
        id: `report-${r.id}`,
        title: r.title,
        weekRange: r.created_at ? String(r.created_at).slice(0, 10) : '—',
        reportType: r.report_type || 'Report',
        generatedBy: r.generated_by || 'System',
        status: 'Verified',
        size: '—',
      })),
    ];

    return sendSuccess(res, 'Weekly reports retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminRoadmaps = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT r.id, r.target_role, r.career_track, r.created_at, u.name AS student_name, c.name AS college_name,
              (SELECT COUNT(*) FROM roadmap_items ri WHERE ri.roadmap_id = r.id) AS modules_count,
              (SELECT ROUND(AVG(ri.progress), 0) FROM roadmap_items ri WHERE ri.roadmap_id = r.id) AS avg_progress
       FROM roadmaps r
       JOIN users u ON r.student_id = u.id
       LEFT JOIN colleges c ON u.college_id = c.id
       ORDER BY r.id DESC
       LIMIT 200`
    );
    return sendSuccess(res, 'AI roadmaps retrieved successfully', rows.map((r) => ({
      id: r.id,
      title: r.target_role || r.career_track || 'Training Roadmap',
      track: r.career_track || r.target_role || 'General',
      student: r.student_name,
      college: r.college_name || '—',
      modulesCount: toInt(r.modules_count),
      enrolledStudents: 1,
      completionRate: r.avg_progress != null ? `${toInt(r.avg_progress)}%` : '0%',
      aiAdaptation: '—',
    })));
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminVerifications = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Admin verification requests retrieved successfully', {
      requests: [],
      registeredAdmins: [],
    });
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminDashboardSummary = async (req, res, next) => {
  try {
    const [[colleges], [students], [mentors], [coordinators], [batches], [departments]] = await Promise.all([
      query('SELECT COUNT(*) AS n FROM colleges'),
      query(`SELECT COUNT(*) AS n FROM users WHERE role = 'student'`),
      query(`SELECT COUNT(*) AS n FROM users WHERE role = 'mentor'`),
      query(`SELECT COUNT(*) AS n FROM users WHERE role = 'coordinator'`),
      query('SELECT COUNT(*) AS n FROM batches'),
      query('SELECT COUNT(*) AS n FROM departments'),
    ]);

    const c2c = await loadC2CStats();

    return sendSuccess(res, 'Dashboard summary retrieved successfully', {
      colleges: toInt(colleges?.n),
      students: toInt(students?.n),
      mentors: toInt(mentors?.n),
      coordinators: toInt(coordinators?.n),
      batches: toInt(batches?.n),
      departments: toInt(departments?.n),
      admins: null,
      roadmaps: null,
      averageAttendance: null,
      averageAssessment: null,
      defaulters: 0,
      c2c: c2c.available
        ? {
            code: c2c.program.code,
            students: c2c.totals.students,
            mentors: c2c.totals.mentors,
            batches: c2c.totals.batches,
            feePerStudent: c2c.totals.feePerStudent,
            feeCollected: c2c.totals.feeCollected,
            feeOutstanding: c2c.totals.feeOutstanding,
            payments: c2c.payments,
            whatsapp: c2c.whatsapp,
          }
        : { available: false, code: C2C_PROGRAM_CODE, students: null, mentors: null, batches: null },
    });
  } catch (error) {
    next(error);
  }
};