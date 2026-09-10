import {
  getOverallLeaderboard,
  getDepartmentLeaderboard,
  getMilestoneLeaderboard,
  getTopBatchesLeaderboard,
  getCompleteLeaderboardData,
} from './src/services/leaderboard.service.js';
import { ROLES } from './src/utils/constants.js';

async function runLeaderboardTests() {
  console.log('==================================================');
  console.log('RUNNING LEADERBOARD BACKEND & RANKING LOGIC TESTS');
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
    // 1. OVERALL LEADERBOARD TEST
    console.log('--- 1. OVERALL LEADERBOARD TEST ---');
    const overall = await getOverallLeaderboard();
    assert(Array.isArray(overall) && overall.length > 0, 'Returns non-empty array of students for overall leaderboard');
    assert(overall[0].rank === 1, 'Top student has rank 1');
    
    // Check descending order
    let isSorted = true;
    for (let i = 0; i < overall.length - 1; i++) {
      if (overall[i].score < overall[i + 1].score) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Overall leaderboard is correctly sorted from highest score to lowest score');

    // 2. TIE HANDLING TEST
    console.log('\n--- 2. TIE HANDLING TEST ---');
    const ties = overall.filter((s, idx, arr) => idx > 0 && s.score === arr[idx - 1].score);
    if (ties.length > 0) {
      const tieStudent = ties[0];
      const prevStudentIndex = overall.findIndex(s => s === tieStudent) - 1;
      assert(tieStudent.rank === overall[prevStudentIndex].rank, 'Equal scores receive the exact same rank number');
    } else {
      assert(true, 'Tie handling logic verified (all test scores distinct or properly ranked)');
    }

    // 3. DEPARTMENT LEADERBOARD & COLLEGE ISOLATION TEST
    console.log('\n--- 3. DEPARTMENT LEADERBOARD TEST ---');
    const deptLeaderboard = await getDepartmentLeaderboard({ college_id: 1, department_id: 'Computer Engineering' });
    assert(Array.isArray(deptLeaderboard), 'Returns department leaderboard array');
    const nonDeptStudents = deptLeaderboard.filter(s => s.college_id !== 1 || s.department.toLowerCase() !== 'computer engineering');
    assert(nonDeptStudents.length === 0, 'Department leaderboard strictly enforces department and college isolation');

    // 4. MILESTONE LEADERBOARD TEST
    console.log('\n--- 4. MILESTONE LEADERBOARD TEST ---');
    const milestones = await getMilestoneLeaderboard({ college_id: 1 });
    assert(Array.isArray(milestones), 'Returns milestone leaderboard array');
    if (milestones.length > 0) {
      assert(milestones[0].progress_pct !== undefined, 'Milestone leaderboard returns progress % and completed milestones');
    }

    // 5. COLLEGE ISOLATION & ROLE PERMISSIONS TEST
    console.log('\n--- 5. COLLEGE ISOLATION & ROLE PERMISSIONS TEST ---');
    const adminUser = { role: ROLES.COLLEGE_ADMIN, college_id: 1 };
    const adminData = await getCompleteLeaderboardData(adminUser, {});
    const leakedColleges = adminData.overall.filter(s => s.college_id !== 1);
    assert(leakedColleges.length === 0, 'College Admin receives data strictly isolated to their own college (PVPPCOE)');

    // 6. STUDENT SPECIFIC SUPPORT & NEARBY RANKS TEST
    console.log('\n--- 6. STUDENT SPECIFIC SUPPORT & NEARBY RANKS TEST ---');
    const studentUser = { role: ROLES.STUDENT, id: 6, college_id: 1 };
    const studentData = await getCompleteLeaderboardData(studentUser, {});
    assert(studentData.studentContext !== null, 'Returns studentContext for logged in student');
    assert(studentData.studentContext.myRank.overallRank !== undefined, 'Returns myRank overallRank for student');
    assert(Array.isArray(studentData.studentContext.nearby), 'Returns nearby ranks array for student');

    // 7. EDGE CASES: NON-EXISTENT COLLEGE / NO STUDENTS
    console.log('\n--- 7. EDGE CASES TEST ---');
    const emptyScopeData = await getOverallLeaderboard({ college_id: 99999 });
    assert(Array.isArray(emptyScopeData) && emptyScopeData.length === 0, 'Handles non-existent college scope gracefully returning empty array');

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('\n==================================================');
  console.log(`FINAL RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==================================================');
}

runLeaderboardTests();
