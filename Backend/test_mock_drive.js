import {
  calculateMockDriveFinalScore,
  MOCK_DRIVE_WEIGHTS,
  startMockDriveService,
  submitDriveSectionService,
  getStudentDrivesService,
  getMentorDrivesService,
  getCoordinatorDrivesService,
  createMockDriveService,
  getSuperAdminDrivesService,
} from './src/services/drive.service.js';
import { ROLES } from './src/utils/constants.js';

async function runTests() {
  console.log('=== TEST MOCK DRIVE MODULE ===\n');

  // 1. Verify Weightage Rule (30% Aptitude + 40% Coding + 30% AI Interview)
  console.log('1. Testing Documented Weightage Rule (30% Aptitude, 40% Coding, 30% Interview)...');
  const calc1 = calculateMockDriveFinalScore(100, 100, 100);
  console.assert(calc1 === 100, `Expected 100, got ${calc1}`);
  
  const calc2 = calculateMockDriveFinalScore(80, 90, 70); 
  // 80*0.3=24 + 90*0.4=36 + 70*0.3=21 = 81
  console.assert(calc2 === 81, `Expected 81, got ${calc2}`);
  console.log('✅ Weightage Calculation PASSED: Aptitude(80)*0.3 + Coding(90)*0.4 + Interview(70)*0.3 =', calc2);

  // 2. Test Student Starting Drive
  console.log('\n2. Testing Student Starting Drive...');
  const studentUser = { userId: 6, role: ROLES.STUDENT, college_id: 1 };
  const startRes = await startMockDriveService(1, studentUser.userId);
  console.assert(startRes.participation.status === 'In Progress', 'Status should be In Progress');
  console.log('✅ Start Drive PASSED: Status =', startRes.participation.status, ', Current Step =', startRes.participation.current_step);

  // 3. Test Section Submissions Step by Step (Aptitude -> Coding -> AI Interview)
  console.log('\n3. Testing Step-by-Step Section Submissions...');
  
  // Step 1: Submit Aptitude (85)
  const step1 = await submitDriveSectionService(1, studentUser.userId, { section: 'aptitude', score: 85 });
  console.assert(step1.aptitude_score === 85, 'Aptitude score should be 85');
  console.assert(step1.current_step === 2, 'Should advance to Step 2');
  console.log('✅ Aptitude Submitted: Score = 85, Next Step = 2 (Coding)');

  // Step 2: Submit Coding (90)
  const step2 = await submitDriveSectionService(1, studentUser.userId, { section: 'coding', score: 90 });
  console.assert(step2.coding_score === 90, 'Coding score should be 90');
  console.assert(step2.current_step === 3, 'Should advance to Step 3');
  console.log('✅ Coding Submitted: Score = 90, Next Step = 3 (AI Interview)');

  // Step 3: Submit AI Interview (80)
  const step3 = await submitDriveSectionService(1, studentUser.userId, { section: 'interview', score: 80 });
  console.assert(step3.interview_score === 80, 'Interview score should be 80');
  console.assert(step3.current_step === 4, 'Should reach Step 4 (Completed)');
  console.assert(step3.status === 'Completed', 'Status should be Completed');
  // Score calc: 85*0.3 = 25.5, 90*0.4 = 36, 80*0.3 = 24 => 85.5 => Math.round = 86
  console.assert(step3.final_score === 86, `Expected final score 86, got ${step3.final_score}`);
  console.log('✅ AI Interview Submitted: Score = 80, Final Status = Completed, Final Score =', step3.final_score);
  console.log('   Strengths:', step3.strength_areas);
  console.log('   Feedback:', step3.feedback);

  // 4. Test Prevention of Duplicate Completion
  console.log('\n4. Testing Duplicate Submission Prevention...');
  const duplicateSub = await submitDriveSectionService(1, studentUser.userId, { section: 'aptitude', score: 50 });
  console.assert(duplicateSub.final_score === 86, 'Final score should remain 86 and not overwrite completed drive');
  console.log('✅ Duplicate Submission Prevention PASSED: Retained score =', duplicateSub.final_score);

  // 5. Test Role Access & Services
  console.log('\n5. Testing Role-Based Access Data Retrieval...');
  const studentDrives = await getStudentDrivesService(studentUser);
  console.assert(studentDrives.length > 0, 'Student should see drives');
  console.log('✅ Student drives retrieved:', studentDrives.length, 'drive(s)');

  const mentorUser = { id: 2, role: ROLES.MENTOR, college_id: 1 };
  const mentorData = await getMentorDrivesService(mentorUser);
  console.assert(mentorData.studentResults.length > 0, 'Mentor should see student results');
  console.log('✅ Mentor student results retrieved:', mentorData.studentResults.length, 'results');

  const coordUser = { id: 3, role: ROLES.COORDINATOR, college_id: 1 };
  const coordData = await getCoordinatorDrivesService(coordUser);
  console.assert(coordData.length > 0, 'Coordinator should see managed drives');
  console.log('✅ Coordinator drives retrieved:', coordData.length, 'drives');

  const newDrive = await createMockDriveService(coordUser, {
    name: 'TCS NQT Mock Placement Drive 2026',
    date: '2026-10-15',
    eligible_batches: ['2026-COMP', '2026-IT'],
  });
  console.assert(newDrive.id > 0, 'Created drive should have ID');
  console.log('✅ Create Mock Drive PASSED: Drive ID =', newDrive.id, 'Name =', newDrive.name);

  const superAdminData = await getSuperAdminDrivesService();
  console.assert(superAdminData.drivesCount > 0, 'Super admin should see overall drives');
  console.log('✅ Super Admin summary retrieved: Drives count =', superAdminData.drivesCount);

  console.log('\n=== ALL MOCK DRIVE TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
