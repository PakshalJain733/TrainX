import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

let isTableInitialized = false;
const ensureTableExists = async () => {
  if (isTableInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS feature_switches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        feature_key VARCHAR(100) NOT NULL UNIQUE,
        feature_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        notice_message TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    isTableInitialized = true;
  } catch (err) {
    console.warn('[FeatureSwitches] Table check warning:', err.message);
  }
};

/**
 * GET /api/v1/feature-switches
 * Retrieves all feature switch states directly from the database
 */
export const getFeatureSwitches = async (req, res, next) => {
  try {
    await ensureTableExists();
    const rows = await query(`SELECT feature_key, feature_name, category, is_active, notice_message FROM feature_switches`);
    const switches = {};
    const messages = {};
    let globalEmergencyMode = false;

    (rows || []).forEach((row) => {
      if (row.feature_key === '__global_emergency_mode') {
        globalEmergencyMode = Boolean(row.is_active);
      } else {
        switches[row.feature_key] = Boolean(row.is_active);
        if (row.notice_message) {
          messages[row.feature_key] = row.notice_message;
        }
      }
    });

    return sendSuccess(res, 'Feature switches retrieved successfully', {
      switches,
      messages,
      globalEmergencyMode,
      total: Object.keys(switches).length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/feature-switches/toggle
 * Toggles a single feature switch ON (true / 1) or OFF (false / 0) in the database
 */
export const toggleFeatureSwitch = async (req, res, next) => {
  try {
    await ensureTableExists();
    const { feature_key, is_active, notice_message, feature_name, category } = req.body;
    if (!feature_key) {
      return sendError(res, 'feature_key is required', 400);
    }

    const activeVal = is_active === false || is_active === 0 || is_active === 'false' ? 0 : 1;

    await query(`
      INSERT INTO feature_switches (feature_key, feature_name, category, is_active, notice_message)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_active = VALUES(is_active),
        notice_message = COALESCE(VALUES(notice_message), notice_message),
        updated_at = CURRENT_TIMESTAMP
    `, [
      feature_key,
      feature_name || feature_key,
      category || 'General',
      activeVal,
      notice_message || null,
    ]);

    // Also sync shared_content maintenance record if it exists
    try {
      const existing = await query(`SELECT id, data_json FROM shared_content WHERE type = 'maintenance' ORDER BY id DESC LIMIT 1`);
      if (existing && existing.length > 0) {
        const cur = JSON.parse(existing[0].data_json || '{}');
        const updatedSwitches = { ...(cur.switches || {}), [feature_key]: Boolean(activeVal) };
        const updatedModules = { ...(cur.modules || {}) };
        if (updatedModules[feature_key]) {
          updatedModules[feature_key] = {
            ...updatedModules[feature_key],
            active: Boolean(activeVal),
          };
        }
        await query(`UPDATE shared_content SET data_json = ? WHERE id = ?`, [
          JSON.stringify({ ...cur, switches: updatedSwitches, modules: updatedModules }),
          existing[0].id,
        ]);
      }
    } catch (_) {}

    return sendSuccess(res, `Feature ${feature_key} is now ${activeVal === 1 ? 'ON (true)' : 'OFF (false)'}`, {
      feature_key,
      is_active: Boolean(activeVal),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/feature-switches/emergency
 * Toggles global emergency lockout mode in the database
 */
export const toggleEmergencyMode = async (req, res, next) => {
  try {
    const { globalEmergencyMode } = req.body;
    const activeVal = Boolean(globalEmergencyMode) ? 1 : 0;

    await query(`
      INSERT INTO feature_switches (feature_key, feature_name, category, is_active)
      VALUES ('__global_emergency_mode', 'Global Emergency Lockout', 'System', ?)
      ON DUPLICATE KEY UPDATE
        is_active = VALUES(is_active),
        updated_at = CURRENT_TIMESTAMP
    `, [activeVal]);

    return sendSuccess(res, `Emergency mode is now ${activeVal === 1 ? 'ON' : 'OFF'}`, {
      globalEmergencyMode: Boolean(activeVal),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/feature-switches/restore-all
 * Turns ALL feature switches ON (true / 1) in the database
 */
export const restoreAllFeatureSwitches = async (req, res, next) => {
  try {
    await query(`UPDATE feature_switches SET is_active = 1 WHERE feature_key != '__global_emergency_mode'`);
    await query(`
      INSERT INTO feature_switches (feature_key, feature_name, category, is_active)
      VALUES ('__global_emergency_mode', 'Global Emergency Lockout', 'System', 0)
      ON DUPLICATE KEY UPDATE is_active = 0, updated_at = CURRENT_TIMESTAMP
    `);

    return sendSuccess(res, 'All feature switches have been restored to ON (true)', {
      all_active: true,
      globalEmergencyMode: false,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/feature-switches/notice
 * Updates custom notice message for a feature in the database
 */
export const updateFeatureNotice = async (req, res, next) => {
  try {
    const { feature_key, notice_message } = req.body;
    if (!feature_key) {
      return sendError(res, 'feature_key is required', 400);
    }

    await query(`
      UPDATE feature_switches
      SET notice_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE feature_key = ?
    `, [notice_message || null, feature_key]);

    return sendSuccess(res, 'Feature notice updated successfully', {
      feature_key,
      notice_message,
    });
  } catch (err) {
    next(err);
  }
};
