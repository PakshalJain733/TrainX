import { query } from '../config/db.js';
import {
  getAllDrivesModel,
  createDriveModel,
  getDriveParticipationModel,
  saveOrUpdateDriveParticipationModel,
} from '../models/drive.model.js';
import { ROLES } from '../utils/constants.js';

// Central Documented Weightage Rule for Mock Placement Drives
export const MOCK_DRIVE_WEIGHTS = {
  APTITUDE_WEIGHT: 0.30,  // 30% Aptitude
  CODING_WEIGHT: 0.40,    // 40% Coding
  INTERVIEW_WEIGHT: 0.30, // 30% Interview
};

/**
 * Calculates final Mock Drive score using central documented rule
 */
export const calculateMockDriveFinalScore = (aptitude, coding, interview) => {
  const apt = Number(aptitude) || 0;
  const cod = Number(coding) || 0;
  const inv = Number(interview) || 0;

  return Math.round(
    apt * MOCK_DRIVE_WEIGHTS.APTITUDE_WEIGHT +
      cod * MOCK_DRIVE_WEIGHTS.CODING_WEIGHT +
      inv * MOCK_DRIVE_WEIGHTS.INTERVIEW_WEIGHT
  );
};

/**
 * 1. START MOCK DRIVE FOR A STUDENT
 */
export const startMockDriveService = async (driveId, studentId) => {
  const dId = Number(driveId);
  const sId = Number(studentId);

  const existing = await getDriveParticipationModel(dId, sId);

  if (existing && existing.status === 'Completed') {
    return { message: 'Drive already completed', participation: existing };
  }

  const updated = await saveOrUpdateDriveParticipationModel({
    drive_id: dId,
    student_id: sId,
    status: 'In Progress',
    current_step: existing ? existing.current_step || 1 : 1,
    aptitude_score: existing ? existing.aptitude_score : 0,
    coding_score: existing ? existing.coding_score : 0,
    interview_score: existing ? existing.interview_score : 0,
  });

  return { message: 'Drive started successfully', participation: updated };
};

/**
 * 2. SUBMIT MOCK DRIVE SECTION (Aptitude -> Coding -> AI Interview -> Final Result)
 */
export const submitDriveSectionService = async (driveId, studentId, payload = {}) => {
  const dId = Number(driveId);
  const sId = Number(studentId);
  const { section, score = 80, answers, code, interview_notes } = payload;

  let existing = await getDriveParticipationModel(dId, sId);

  if (!existing) {
    existing = await saveOrUpdateDriveParticipationModel({
      drive_id: dId,
      student_id: sId,
      status: 'In Progress',
      current_step: 1,
    });
  }

  // Prevent duplicate completion
  if (existing.status === 'Completed') {
    return existing;
  }

  let aptitudeScore = existing.aptitude_score || 0;
  let codingScore = existing.coding_score || 0;
  let interviewScore = existing.interview_score || 0;
  let currentStep = existing.current_step || 1;

  if (section === 'aptitude') {
    aptitudeScore = Math.min(100, Math.max(0, Number(score)));
    currentStep = 2; // Advance to Coding
  } else if (section === 'coding') {
    codingScore = Math.min(100, Math.max(0, Number(score)));
    currentStep = 3; // Advance to Interview
  } else if (section === 'interview') {
    interviewScore = Math.min(100, Math.max(0, Number(score)));
    currentStep = 4; // Complete Drive
  }

  const isDriveCompleted = currentStep >= 4 || (aptitudeScore > 0 && codingScore > 0 && interviewScore > 0);
  const finalStatus = isDriveCompleted ? 'Completed' : 'In Progress';
  const finalScore = calculateMockDriveFinalScore(aptitudeScore, codingScore, interviewScore);

  // Generate Strength / Weakness & Feedback Breakdown
  const strengthAreas = [];
  const weakAreas = [];

  if (aptitudeScore >= 75) strengthAreas.push('Aptitude & Logical Reasoning');
  else weakAreas.push('Logical Reasoning & Math Drills');

  if (codingScore >= 75) strengthAreas.push('DSA & Algorithmic Problem Solving');
  else weakAreas.push('Array & Hash Map Algorithmic Tasks');

  if (interviewScore >= 75) strengthAreas.push('AI Technical Communication & System Concepts');
  else weakAreas.push('Database Normalization & SQL Queries');

  const feedback = isDriveCompleted
    ? `Completed Placement Mock Drive with an overall score of ${finalScore}%. ${
        finalScore >= 75
          ? 'Recommended for Tier-1 Industry Placement Drives!'
          : 'Requires targeted remedial practice in weak technical topics before final placement rounds.'
      }`
    : 'Mock Drive in progress.';

  const updatedParticipation = await saveOrUpdateDriveParticipationModel({
    drive_id: dId,
    student_id: sId,
    status: finalStatus,
    current_step: isDriveCompleted ? 4 : currentStep,
    aptitude_score: aptitudeScore,
    coding_score: codingScore,
    interview_score: interviewScore,
    final_score: finalScore,
    feedback,
    strength_areas: strengthAreas,
    weak_areas: weakAreas,
  });

  return updatedParticipation;
};

/**
 * 3. GET STUDENT ELIGIBLE MOCK DRIVES & RESULTS
 */
export const getStudentDrivesService = async (user = {}) => {
  const userId = user.userId || user.id || 6;
  const collegeId = user.college_id || 1;

  const drives = await getAllDrivesModel({ college_id: collegeId });

  const result = [];
  for (const d of drives) {
    const participation = await getDriveParticipationModel(d.id, userId);
    result.push({
      ...d,
      participation: participation || {
        status: 'Not Started',
        current_step: 1,
        aptitude_score: 0,
        coding_score: 0,
        interview_score: 0,
        final_score: 0,
      },
    });
  }

  return result;
};

/**
 * 4. GET MENTOR MOCK DRIVES & STUDENT RESULTS
 */
export const getMentorDrivesService = async (user = {}, queryParams = {}) => {
  const collegeId = user.college_id || 1;
  const drives = await getAllDrivesModel({ college_id: collegeId });

  const sampleResults = [
    { student_name: 'Ganesh Shinde', roll: '2026COMP042', aptitude: 85, coding: 90, interview: 82, final: 86, status: 'Completed' },
    { student_name: 'Aarav Sharma', roll: '2026COMP001', aptitude: 95, coding: 96, interview: 94, final: 95, status: 'Completed' },
    { student_name: 'Ananya Verma', roll: '2026ECS012', aptitude: 90, coding: 85, interview: 88, final: 87, status: 'Completed' },
  ];

  return {
    drives,
    studentResults: sampleResults,
  };
};

/**
 * 5. GET COORDINATOR MOCK DRIVES (Create & Manage Placement Drives)
 */
export const getCoordinatorDrivesService = async (user = {}, queryParams = {}) => {
  const collegeId = user.college_id || 1;
  const drives = await getAllDrivesModel({ college_id: collegeId });
  return drives;
};

/**
 * 6. CREATE NEW PLACEMENT MOCK DRIVE (Coordinator & Admin Action)
 */
export const createMockDriveService = async (user = {}, drivePayload = {}) => {
  const collegeId = user.college_id || 1;
  const newDrive = await createDriveModel({
    ...drivePayload,
    college_id: collegeId,
  });
  return newDrive;
};

/**
 * 7. SUPER ADMIN MOCK DRIVES OVERVIEW
 */
export const getSuperAdminDrivesService = async () => {
  const drives = await getAllDrivesModel({});
  return {
    drivesCount: drives.length,
    collegesCovered: ['PVPPCOE', 'DBIT', 'KJSCE'],
    drives,
  };
};
