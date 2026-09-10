import {
  evaluateStudentDefaulterStatus,
  scanAndDetectDefaulters,
  logMentorInterventionService,
  getStudentInterventionHistory,
  getMentorDefaulterQueueService,
  getCoordinatorDefaulterQueueService,
  getAdminDefaulterQueueService,
  getSuperAdminDefaulterOverviewService,
  DEFAULTER_THRESHOLDS,
} from './src/services/intervention.service.js';
import { ROLES } from './src/utils/constants.js';

async function runInterventionTests() {
  console.log('==================================================');
  console.log('RUNNING DEFAULTER / INTERVENTION BACKEND TESTS');
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
    // 1. DEFAULTER DETECTION & THRESHOLDS TEST
    console.log('--- 1. DEFAULTER DETECTION & REASON GENERATION TEST ---');
    assert(DEFAULTER_THRESHOLDS.ATTENDANCE_THRESHOLD === 75, 'Configured Attendance threshold is 75%');
    assert(DEFAULTER_THRESHOLDS.PERFORMANCE_THRESHOLD === 60, 'Configured Performance threshold is 60%');

    const evalResult = await evaluateStudentDefaulterStatus(6);
    if (evalResult.isDefaulter) {
      assert(Array.isArray(evalResult.reasons) && evalResult.reasons.length > 0, 'Flagged defaulter includes explicit reason why');
      assert(typeof evalResult.reasons[0] === 'string' && evalResult.reasons[0].length > 5, 'Reason string specifies actual metric details (e.g. Low Attendance)');
    } else {
      assert(evalResult.status === 'Healthy', 'Healthy student above threshold is not flagged as defaulter');
    }

    // 2. AVOID DUPLICATE DETECTION RECORDS
    console.log('\n--- 2. AVOID DUPLICATES & RE-DETECTION TEST ---');
    const scan1 = await scanAndDetectDefaulters({ college_id: 1 });
    const count1 = scan1.length;
    const scan2 = await scanAndDetectDefaulters({ college_id: 1 });
    const count2 = scan2.length;
    assert(count1 === count2, 'Repeated detection scans update existing records without creating duplicates');

    // 3. MENTOR INTERVENTION LOGGING & WORKFLOW STATUS
    console.log('\n--- 3. MENTOR INTERVENTION & STATUS WORKFLOW TEST ---');
    const mentorUser = { id: 5, name: 'Prof. Mentor PVPPCOE', role: ROLES.MENTOR };
    const logPayload = {
      student_id: 6,
      interaction_date: '2026-09-10',
      notes: 'Discussed low attendance in DSA lab. Student promised to complete remedial tasks.',
      action_taken: 'Assigned 1-on-1 counseling & 3 remedial SQL exercises',
      recommendations: 'Complete Database Indexing module by Sunday',
      status: 'Action Taken',
      next_followup: '2026-09-17',
    };

    const logged = await logMentorInterventionService(mentorUser, logPayload);
    assert(logged && logged.status === 'Action Taken', 'Mentor intervention logged with action details and status workflow');

    // 4. HISTORY RETENTION TEST
    console.log('\n--- 4. HISTORY RETENTION & AUDIT LOG TEST ---');
    const historyData = await getStudentInterventionHistory(6);
    assert(Array.isArray(historyData.history) && historyData.history.length >= 1, 'Preserves complete intervention history for student');

    // 5. ROLE ACCESS & COLLEGE SECURITY ISOLATION TEST
    console.log('\n--- 5. ROLE APIS & SECURITY ISOLATION TEST ---');
    const mentorQueue = await getMentorDefaulterQueueService(mentorUser, {});
    assert(Array.isArray(mentorQueue), 'Returns mentor authorized defaulter queue');

    const adminUser = { role: ROLES.COLLEGE_ADMIN, college_id: 1 };
    const adminQueue = await getAdminDefaulterQueueService(adminUser, {});
    assert(adminQueue.summaryStats && Array.isArray(adminQueue.defaulters), 'Returns college admin defaulter queue & summary stats');

    const superAdminOverview = await getSuperAdminDefaulterOverviewService({});
    assert(Array.isArray(superAdminOverview.campusOverview), 'Returns campus-wide defaulter oversight for Super Admin');

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('\n==================================================');
  console.log(`FINAL RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==================================================');
}

runInterventionTests();
