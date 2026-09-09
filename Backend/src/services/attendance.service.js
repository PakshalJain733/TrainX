import {
  getStudentAttendanceCounts,
  getStudentAttendanceLogs,
  getAggregatedStudentsAttendance,
  getDepartmentAttendanceStatsModel,
  getBatchAttendanceStatsModel,
  upsertStudentAttendanceSummary,
  findOrCreateAttendanceSession,
} from '../models/attendance.model.js';

/**
 * Task 1: Calculate Attendance Percentage (Pure Business Logic)
 * Formula: Attendance % = (Present Classes / Total Classes) * 100
 */
export const calculateAttendancePercentage = (presentCount, totalClasses) => {
  const present = Number(presentCount) || 0;
  const total = Number(totalClasses) || 0;
  if (total <= 0) return 0.0;
  const percentage = (present / total) * 100;
  return Number(percentage.toFixed(2));
};

/**
 * Task 2: Evaluate Attendance Status
 * Threshold Levels:
 * - Good: >= 80%
 * - Warning: 70% - 79.99%
 * - Low Attendance: < 70% (or < specified threshold)
 * - No Records: totalClasses === 0
 */
export const evaluateAttendanceStatus = (percentage, totalClasses, threshold = 75) => {
  if (Number(totalClasses) === 0) {
    return 'No Records';
  }
  const pct = Number(percentage);
  if (pct >= 80) {
    return 'Good';
  } else if (pct >= 70) {
    return 'Warning';
  } else {
    return 'Low Attendance';
  }
};

/**
 * Task 3: Get Individual Student Attendance Summary & Persist in attendance_summary table
 */
export const getStudentAttendanceSummaryService = async (userId) => {
  const counts = await getStudentAttendanceCounts(userId);
  const percentage = calculateAttendancePercentage(counts.present_count, counts.total_classes);
  const status = evaluateAttendanceStatus(percentage, counts.total_classes);

  const isLowAttendance = percentage < 75 && counts.total_classes > 0;

  const summary = {
    // CamelCase keys per Ganesh's spec
    studentId: Number(userId),
    totalSessions: counts.total_classes,
    present: counts.present_count,
    absent: counts.absent_count,
    percentage: percentage,
    status: status,
    lowAttendance: isLowAttendance,

    // Legacy snake_case keys for backward compatibility
    student_id: Number(userId),
    total_classes: counts.total_classes,
    present_count: counts.present_count,
    absent_count: counts.absent_count,
    late_count: counts.late_count,
    excused_count: counts.excused_count,
    attendance_percentage: percentage,
    attendance_status: status,
  };

  // Synchronize dedicated attendance_summary database table
  try {
    await upsertStudentAttendanceSummary(userId, summary);
  } catch (err) {
    console.error("[attendance_summary upsert error]", err.message);
  }

  return summary;
};

/**
 * Task 3: Get Individual Student Attendance Log History
 */
export const getStudentAttendanceHistoryService = async (userId, limit = 50) => {
  const summary = await getStudentAttendanceSummaryService(userId);
  const logs = await getStudentAttendanceLogs(userId, limit);
  return {
    summary,
    history: logs,
  };
};

/**
 * Task 3: Get Aggregated Students Attendance List with Filtering (Department, Batch, Threshold)
 */
export const getFilteredStudentsAttendanceService = async ({
  collegeId = null,
  department = null,
  batchId = null,
  batchName = null,
  threshold = 75,
  onlyLowAttendance = false,
} = {}) => {
  const rawStudents = await getAggregatedStudentsAttendance({
    collegeId,
    department,
    batchId,
    batchName,
  });

  const parsedThreshold = Number(threshold) || 75;

  const processedStudents = rawStudents.map((student) => {
    const total_classes = Number(student.total_classes || 0);
    const present_count = Number(student.present_count || 0);
    const absent_count = Number(student.absent_count || 0);
    const late_count = Number(student.late_count || 0);
    const excused_count = Number(student.excused_count || 0);

    const attendance_percentage = calculateAttendancePercentage(present_count, total_classes);
    const attendance_status = evaluateAttendanceStatus(attendance_percentage, total_classes, parsedThreshold);

    const isBelowThreshold = attendance_percentage < parsedThreshold && total_classes > 0;

    return {
      // CamelCase keys per Ganesh's spec
      studentId: student.student_id,
      studentName: student.student_name,
      studentEmail: student.student_email,
      department: student.department || 'General',
      batchName: student.batch_name || 'Unassigned',
      totalSessions: total_classes,
      present: present_count,
      absent: absent_count,
      percentage: attendance_percentage,
      status: attendance_status,
      lowAttendance: isBelowThreshold,

      // Legacy snake_case keys for backward compatibility
      student_id: student.student_id,
      student_name: student.student_name,
      student_email: student.student_email,
      total_classes,
      present_count,
      absent_count,
      late_count,
      excused_count,
      attendance_percentage,
      attendance_status,
      is_below_threshold: isBelowThreshold,
    };
  });

  if (onlyLowAttendance) {
    return processedStudents.filter(
      (s) => s.lowAttendance || s.status === 'Low Attendance' || s.status === 'Warning'
    );
  }

  return processedStudents;
};

/**
 * Task 3: Department Summary
 */
export const getDepartmentSummaryService = async (collegeId = null) => {
  const raw = await getDepartmentAttendanceStatsModel(collegeId);
  return raw.map((dept) => {
    const total_sessions = Number(dept.total_session_records || 0);
    const total_presents = Number(dept.total_presents || 0);
    const avg_percentage = calculateAttendancePercentage(total_presents, total_sessions);

    return {
      department: dept.department,
      total_students: Number(dept.total_students || 0),
      total_sessions,
      total_presents,
      total_absents: Number(dept.total_absents || 0),
      average_attendance_percentage: avg_percentage,
      status: evaluateAttendanceStatus(avg_percentage, total_sessions),
    };
  });
};

/**
 * Task 3: Batch Summary
 */
export const getBatchSummaryService = async (collegeId = null) => {
  const raw = await getBatchAttendanceStatsModel(collegeId);
  return raw.map((b) => {
    const total_sessions = Number(b.total_session_records || 0);
    const total_presents = Number(b.total_presents || 0);
    const avg_percentage = calculateAttendancePercentage(total_presents, total_sessions);

    return {
      batch_name: b.batch_name,
      total_students: Number(b.total_students || 0),
      total_sessions,
      total_presents,
      total_absents: Number(b.absent_count || 0),
      average_attendance_percentage: avg_percentage,
      status: evaluateAttendanceStatus(avg_percentage, total_sessions),
    };
  });
};

/**
 * Task 3: Coordinator Overall Attendance Dashboard Summary
 */
export const getAttendanceDashboardSummaryService = async (collegeId = null, threshold = 75) => {
  const allStudents = await getFilteredStudentsAttendanceService({ collegeId, threshold: 75 });
  const departmentSummary = await getDepartmentSummaryService(collegeId);
  const batchSummary = await getBatchSummaryService(collegeId);

  const totalStudents = allStudents.length;
  let goodCount = 0;
  let warningCount = 0;
  let lowCount = 0;
  let totalPercentageSum = 0;

  allStudents.forEach((s) => {
    totalPercentageSum += s.percentage;
    if (s.status === 'Good') goodCount++;
    else if (s.status === 'Warning') warningCount++;
    else if (s.status === 'Low Attendance') lowCount++;
  });

  const overallAvg = totalStudents > 0 ? Number((totalPercentageSum / totalStudents).toFixed(2)) : 0.0;

  const lowAttendanceList = allStudents.filter((s) => s.lowAttendance || s.status === 'Low Attendance');

  return {
    total_students_tracked: totalStudents,
    overall_average_attendance: overallAvg,
    good_status_count: goodCount,
    warning_status_count: warningCount,
    low_attendance_count: lowCount,
    departments_summary: departmentSummary,
    batches_summary: batchSummary,
    low_attendance_alert_list: lowAttendanceList,
  };
};
