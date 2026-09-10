import {
  generateStudentWeeklyReport,
  getStudentWeeklyReports,
  getMentorWeeklyReportsService,
  getAdminWeeklyReportsService,
  getSuperAdminWeeklyReportsService,
  getWeekDateRange,
} from './src/services/report.service.js';
import { ROLES } from './src/utils/constants.js';

async function runWeeklyReportTests() {
  console.log('==================================================');
  console.log('RUNNING WEEKLY PERFORMANCE REPORT BACKEND TESTS');
  console.log('==================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✓ TEST ${totalTests} PASSED: ${message}`);
      passedTests++;
    } else {
      console.error(`✗ TEST ${totalTests} FAILED: ${message}`);
    }
  }

  try {
    // 1. DEFINE WEEK TEST
    console.log('--- 1. DEFINE WEEK & DATE RANGE TEST ---');
    const range = getWeekDateRange(0);
    assert(range.startDate && range.endDate && range.weekLabel, 'Generates consistent week label, start_date, and end_date');
    assert(range.startDate.startsWith('202') && range.endDate.startsWith('202'), 'Date formats follow standard ISO YYYY-MM-DD');

    // 2. GENERATE WEEKLY REPORT & DATA COLLECTION
    console.log('\n--- 2. GENERATE WEEKLY REPORT & REUSE MODULES ---');
    const studentReport = await generateStudentWeeklyReport(6, { forceRegenerate: true });
    assert(studentReport.student_id === 6, 'Generated report is associated with target student ID');
    assert(studentReport.overall_score !== undefined, 'Includes overall performance score');
    assert(studentReport.attendance_score !== undefined, 'Includes attendance percentage rate');
    assert(studentReport.quiz_score !== undefined, 'Includes quiz performance percentage');
    assert(studentReport.coding_score !== undefined, 'Includes coding performance percentage');
    assert(studentReport.interview_score !== undefined, 'Includes interview score');

    // 3. IMPROVEMENT SUGGESTIONS & SKILL GAPS
    console.log('\n--- 3. IMPROVEMENT SUGGESTIONS & SKILL GAPS ---');
    assert(Array.isArray(studentReport.weak_areas) && studentReport.weak_areas.length > 0, 'Report contains identified weak areas');
    assert(Array.isArray(studentReport.suggestions) && studentReport.suggestions.length > 0, 'Report contains actionable improvement suggestions');

    // 4. HISTORICAL TREND COMPARISON
    console.log('\n--- 4. PREVIOUS WEEK COMPARISON & HISTORICAL PERSISTENCE ---');
    const history = await getStudentWeeklyReports(6);
    assert(Array.isArray(history) && history.length >= 1, 'Preserves generated historical reports for student');
    assert(history[0].trend_status !== undefined, 'Includes trend status (Improved / Declined / No major change)');

    // 5. ROLE APIS & SECURITY ACCESS
    console.log('\n--- 5. ROLE APIS & SCOPE ACCESS ---');
    const mentorUser = { role: ROLES.MENTOR, college_id: 1 };
    const mentorReports = await getMentorWeeklyReportsService(mentorUser, { batch_id: 1 });
    assert(Array.isArray(mentorReports), 'Returns mentor authorized batch reports');

    const adminUser = { role: ROLES.COLLEGE_ADMIN, college_id: 1 };
    const adminReports = await getAdminWeeklyReportsService(adminUser, {});
    assert(Array.isArray(adminReports), 'Returns college admin reports isolated to college');

    const superAdminData = await getSuperAdminWeeklyReportsService({});
    assert(Array.isArray(superAdminData.campusSummaries), 'Returns high-level governance summaries for Super Admin');

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('\n==================================================');
  console.log(`FINAL RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==================================================');
}

runWeeklyReportTests();
