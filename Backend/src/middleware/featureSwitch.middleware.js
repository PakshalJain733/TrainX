import { query } from '../config/db.js';
import { sendError } from '../utils/response.js';

// In-memory cache for ultra-fast switch lookups without slamming MySQL
let cachedSwitches = null;
let cachedMessages = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 4000; // 4 seconds TTL

/**
 * Clear in-memory cache to force immediate reload from MySQL
 */
export const clearFeatureCache = () => {
  cachedSwitches = null;
  cachedMessages = {};
  lastFetchTime = 0;
};

// Normalized alias mappings: Role-specific toggles take precedence, falling back to master switches
const KEY_ALIASES = {
  // User Approval
  adminApproveUsers: ['adminApproveUsers', 'superAdminApproveUsers', 'approveUsers'],
  superAdminApproveUsers: ['superAdminApproveUsers', 'adminApproveUsers', 'approveUsers'],
  approveUsers: ['adminApproveUsers', 'superAdminApproveUsers', 'approveUsers'],

  // Career Gateway
  adminCareerGatewaySync: ['adminCareerGatewaySync', 'careerGatewaySync', 'career-gateway'],
  careerGatewaySync: ['adminCareerGatewaySync', 'careerGatewaySync', 'career-gateway'],

  // Auth & Registration
  register: ['userRegistration', 'register', 'studentRegistration'],
  userRegistration: ['userRegistration', 'register', 'studentRegistration'],
  loginWithPassword: ['loginWithPassword', 'passwordLogin'],
  loginWithOTP: ['loginWithOTP', 'otpLogin'],
  passwordReset: ['passwordReset', 'forgotPassword'],

  // Coding & Compiler
  codingCompiler: ['codingCompiler', 'compiler', 'coding-platform'],
  practiceCoding: ['practiceCoding', 'codingCompiler', 'adminPracticeProblems', 'mentorCodingPractice'],
  adminPracticeProblems: ['adminPracticeProblems', 'practiceCoding', 'codingCompiler'],
  mentorCodingPractice: ['mentorCodingPractice', 'practiceCoding', 'codingCompiler'],

  // AI Roadmaps (Role specific + Master)
  studentAIRoadmap: ['studentAIRoadmap', 'aiRoadmaps', 'roadmaps'],
  mentorRoadmaps: ['mentorRoadmaps', 'aiRoadmaps', 'roadmaps'],
  aiRoadmaps: ['aiRoadmaps', 'roadmaps', 'roadmap'],

  // AI Interviews (Role specific + Master)
  studentAIInterview: ['studentAIInterview', 'aiInterviews', 'interviews'],
  mentorAIInterviews: ['mentorAIInterviews', 'aiInterviews', 'interviews'],
  aiInterviews: ['aiInterviews', 'interviews', 'interview', 'ai-interview'],

  // Quizzes & Assessments (Role specific + Master)
  studentQuizzes: ['studentQuizzes', 'academicQuizzes', 'quizzes'],
  adminQuizzes: ['adminQuizzes', 'academicQuizzes', 'quizzes'],
  mentorQuizzes: ['mentorQuizzes', 'academicQuizzes', 'quizzes'],
  academicQuizzes: ['academicQuizzes', 'quizzes', 'quiz', 'assessments'],

  // Leaderboard (Role specific + Master)
  studentLeaderboard: ['studentLeaderboard', 'leaderboard'],
  adminLeaderboard: ['adminLeaderboard', 'leaderboard', 'studentLeaderboard'],
  coordinatorLeaderboard: ['coordinatorLeaderboard', 'leaderboard', 'studentLeaderboard'],
  mentorLeaderboard: ['mentorLeaderboard', 'leaderboard', 'studentLeaderboard'],
  trainerLeaderboard: ['trainerLeaderboard', 'leaderboard', 'studentLeaderboard'],
  leaderboard: ['studentLeaderboard', 'leaderboard'],

  // Attendance (Role specific + Master)
  studentAttendance: ['studentAttendance', 'attendance'],
  adminAttendance: ['adminAttendance', 'attendance'],
  coordinatorAttendance: ['coordinatorAttendance', 'attendance'],
  mentorAttendance: ['mentorAttendance', 'attendance'],
  attendance: ['attendance'],

  // Weekly Reports (Role specific + Master)
  studentWeeklyReports: ['studentWeeklyReports', 'weeklyReports'],
  adminWeeklyReports: ['adminWeeklyReports', 'weeklyReports'],
  coordinatorWeeklyReports: ['coordinatorWeeklyReports', 'weeklyReports'],
  mentorWeeklyReports: ['mentorWeeklyReports', 'weeklyReports'],
  weeklyReports: ['weeklyReports', 'adminWeeklyReports'],

  // Batches (Role specific + Master)
  studentBatches: ['studentBatches', 'batches'],
  adminBatches: ['adminBatches', 'batches'],
  coordinatorBatches: ['coordinatorBatches', 'batches'],
  mentorBatches: ['mentorBatches', 'batches'],
  trainerBatches: ['trainerBatches', 'batches'],
  batches: ['batches'],

  // Skill Gap & Progress (Role specific + Master)
  studentProgress: ['studentProgress', 'skillGapAnalysis'],
  adminProgress: ['adminProgress', 'skillGapAnalysis'],
  mentorSkillGaps: ['mentorSkillGaps', 'skillGapAnalysis'],
  mentorPerformance: ['mentorPerformance', 'skillGapAnalysis'],
  coordinatorPerformances: ['coordinatorPerformances', 'skillGapAnalysis'],
  skillGapAnalysis: ['skillGapAnalysis', 'studentProgress', 'progress'],

  // Trainings & C2C
  studentTrainings: ['studentTrainings', 'trainings'],
  adminTrainings: ['adminTrainings', 'adminC2CEnrollments', 'trainings'],
  adminC2CEnrollments: ['adminC2CEnrollments', 'trainings', 'adminC2C'],
  trainings: ['trainings', 'adminTrainings', 'adminC2CEnrollments'],

  // Departments
  adminDepartments: ['adminDepartments', 'departments'],
  departments: ['departments', 'adminDepartments'],

  // Broadcast & Communication
  adminBroadcast: ['adminBroadcast', 'broadcast'],
  coordinatorBroadcast: ['coordinatorBroadcast', 'broadcast'],
  mentorBroadcast: ['mentorBroadcast', 'broadcast'],
  broadcast: ['broadcast', 'adminBroadcast', 'coordinatorBroadcast'],

  // Help & Support Tickets
  studentHelp: ['studentHelp', 'supportTickets'],
  adminHelp: ['adminHelp', 'supportTickets'],
  coordinatorHelp: ['coordinatorHelp', 'supportTickets'],
  mentorHelp: ['mentorHelp', 'supportTickets'],
  trainerHelp: ['trainerHelp', 'supportTickets'],
  supportTickets: ['supportTickets', 'adminHelp', 'studentHelp'],

  // Trainer Features
  trainerOverview: ['trainerOverview'],
  trainerTasks: ['trainerTasks', 'batches', 'codingCompiler'],
  trainerSubmissions: ['trainerSubmissions', 'codingCompiler', 'batches'],
  trainerProfile: ['trainerProfile'],
};

/**
 * Loads switches directly from the feature_switches table
 */
export const loadSwitchesFromDb = async () => {
  const now = Date.now();
  if (cachedSwitches && now - lastFetchTime < CACHE_TTL_MS) {
    return { switches: cachedSwitches, messages: cachedMessages };
  }
  try {
    const rows = await query('SELECT feature_key, is_active, notice_message FROM feature_switches');
    const switches = {};
    const messages = {};
    if (Array.isArray(rows)) {
      rows.forEach((r) => {
        switches[r.feature_key] = Boolean(
          r.is_active === 1 || r.is_active === true || String(r.is_active) === '1'
        );
        if (r.notice_message) {
          messages[r.feature_key] = r.notice_message;
        }
      });
    }
    cachedSwitches = switches;
    cachedMessages = messages;
    lastFetchTime = now;
    return { switches, messages };
  } catch (err) {
    return { switches: cachedSwitches || {}, messages: cachedMessages || {} };
  }
};

/**
 * Checks whether a feature is active.
 * Returns true if active/enabled, false if disabled by Super Admin.
 */
export const isFeatureActive = async (featureKey) => {
  const { switches } = await loadSwitchesFromDb();
  if (!switches) return true;

  // Global Emergency Lockout
  if (switches['__global_emergency_mode'] === true) {
    if (featureKey !== 'superAdminSystemHealth' && featureKey !== 'superAdminFeatureSwitches') {
      return false;
    }
  }

  // Check direct key
  if (switches[featureKey] !== undefined) {
    return Boolean(switches[featureKey]);
  }

  // Check aliases
  const aliases = KEY_ALIASES[featureKey];
  if (Array.isArray(aliases)) {
    for (const a of aliases) {
      if (switches[a] !== undefined) {
        return Boolean(switches[a]);
      }
    }
  }

  // Default to enabled if not explicitly turned OFF in database
  return true;
};

/**
 * Feature Active Helper Functions:
 * Checks individual feature switches from the database, defaulting to true.
 */
export const isApprovalFeatureActive = async () => isFeatureActive('adminApproveUsers');
export const isRegistrationFeatureActive = async () => isFeatureActive('userRegistration');
export const isPasswordLoginFeatureActive = async () => isFeatureActive('loginWithPassword');
export const isOtpLoginFeatureActive = async () => isFeatureActive('loginWithOTP');
export const isPasswordResetFeatureActive = async () => isFeatureActive('passwordReset');
export const isCareerGatewayFeatureActive = async () => isFeatureActive('adminCareerGatewaySync');
export const isCodingCompilerFeatureActive = async () => isFeatureActive('codingCompiler');
export const isPracticeProblemsFeatureActive = async () => isFeatureActive('adminPracticeProblems');
export const isAiRoadmapsFeatureActive = async () => isFeatureActive('aiRoadmaps');
export const isAiInterviewsFeatureActive = async () => isFeatureActive('aiInterviews');
export const isAcademicQuizzesFeatureActive = async () => isFeatureActive('academicQuizzes');
export const isAttendanceFeatureActive = async () => isFeatureActive('attendance');
export const isWeeklyReportsFeatureActive = async () => isFeatureActive('weeklyReports');
export const isLeaderboardFeatureActive = async () => isFeatureActive('studentLeaderboard');
export const isBatchesFeatureActive = async () => isFeatureActive('batches');
export const isSkillGapFeatureActive = async () => isFeatureActive('skillGapAnalysis');
export const isTrainingsFeatureActive = async () => isFeatureActive('trainings');
export const isDepartmentsFeatureActive = async () => isFeatureActive('departments');
export const isBroadcastFeatureActive = async () => isFeatureActive('broadcast');
export const isManageUsersFeatureActive = async () => isFeatureActive('manageUsers');
export const isDefaultersFeatureActive = async () => isFeatureActive('defaulters');
export const isSupportTicketsFeatureActive = async () => isFeatureActive('supportTickets');

/**
 * Express Route Middleware: Enforces feature switch checks on the backend.
 * Blocks access with HTTP 403 when a feature is turned OFF.
 * Super Admin accounts bypass feature switches so system administration is never blocked.
 */
export const requireFeature = (featureKey, fallbackMessage) => {
  return async (req, res, next) => {
    try {
      // Super Admin bypasses feature switches so administrative control is never blocked
      const userRole = String(req.user?.role || '').toLowerCase().replace(/_/g, '');
      if (userRole === 'superadmin' || userRole.includes('super')) {
        return next();
      }

      // 1. Role-Specific Feature Check:
      // If a student is accessing a feature, check their role-specific switch first (e.g. 'studentBatches')
      if (req.user?.role) {
        const rawRole = String(req.user.role).toLowerCase();
        let rolePrefix = '';
        if (rawRole.includes('student')) rolePrefix = 'student';
        else if (rawRole.includes('admin')) rolePrefix = 'admin';
        else if (rawRole.includes('mentor')) rolePrefix = 'mentor';
        else if (rawRole.includes('coordinator')) rolePrefix = 'coordinator';
        else if (rawRole.includes('trainer')) rolePrefix = 'trainer';

        if (rolePrefix) {
          const capitalized = featureKey.charAt(0).toUpperCase() + featureKey.slice(1);
          const roleKey = `${rolePrefix}${capitalized}`;
          const isRoleActive = await isFeatureActive(roleKey);
          if (!isRoleActive) {
            const { messages } = await loadSwitchesFromDb();
            const msg =
              messages[roleKey] ||
              messages[featureKey] ||
              fallbackMessage ||
              `The ${featureKey} feature is currently disabled for ${rawRole}s by administrator policy.`;
            return sendError(res, msg, 403);
          }
        }
      }

      // 2. Master Feature Check
      const active = await isFeatureActive(featureKey);
      if (!active) {
        const { messages } = await loadSwitchesFromDb();
        const msg =
          messages[featureKey] ||
          fallbackMessage ||
          `The ${featureKey} feature is currently undergoing maintenance or has been disabled by system policy.`;
        return sendError(res, msg, 403);
      }
      next();
    } catch (err) {
      // Fail-open on unexpected internal middleware evaluation error to avoid breaking API
      next();
    }
  };
};

