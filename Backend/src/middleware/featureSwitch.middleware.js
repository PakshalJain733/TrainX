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

// Normalized alias mappings
const KEY_ALIASES = {
  adminApproveUsers: ['adminApproveUsers', 'superAdminApproveUsers', 'approveUsers'],
  superAdminApproveUsers: ['superAdminApproveUsers', 'adminApproveUsers', 'approveUsers'],
  approveUsers: ['adminApproveUsers', 'superAdminApproveUsers', 'approveUsers'],
  adminCareerGatewaySync: ['adminCareerGatewaySync', 'careerGatewaySync', 'career-gateway'],
  careerGatewaySync: ['adminCareerGatewaySync', 'careerGatewaySync'],
  register: ['userRegistration', 'register'],
  userRegistration: ['userRegistration', 'register'],
  loginWithPassword: ['loginWithPassword'],
  loginWithOTP: ['loginWithOTP'],
  passwordReset: ['passwordReset'],
  codingCompiler: ['codingCompiler', 'compiler'],
  practiceCoding: ['practiceCoding', 'codingCompiler'],
  aiRoadmaps: ['aiRoadmaps', 'roadmaps'],
  aiInterviews: ['aiInterviews', 'interviews'],
  academicQuizzes: ['academicQuizzes', 'quizzes'],
  studentLeaderboard: ['studentLeaderboard', 'leaderboard'],
  coordinatorLeaderboard: ['coordinatorLeaderboard', 'studentLeaderboard'],
  attendance: ['attendance'],
  weeklyReports: ['weeklyReports', 'adminWeeklyReports'],
  defaulters: ['defaulters'],
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
 * Checks if the user registration approval requirement is currently active.
 * Checks the feature switch table, defaulting to true for strict security.
 */
export const isApprovalFeatureActive = async () => {
  return await isFeatureActive('adminApproveUsers');
};

/**
 * Express Route Middleware: Enforces feature switch checks on the backend.
 * Blocks access with HTTP 403 when a feature is turned OFF.
 */
export const requireFeature = (featureKey, fallbackMessage) => {
  return async (req, res, next) => {
    try {
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

