import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';
import { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } from '../config/jwt.js';
import { query } from '../config/db.js';

// In-memory cache for user active status to optimize high-frequency authenticated requests
// Structure: Map<userId, { exists: boolean, isActive: boolean, role: string, collegeId: any, expiresAt: number }>
const userActiveCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds bounded window

/**
 * Immediately invalidates cached authentication status for a user by evicting
 * the user entry from the cache. The next authenticated request will query MySQL
 * directly to obtain the fresh active status and role (SEC-01).
 */
export function invalidateUserAuthCache(userId) {
  if (!userId) return;
  const numId = Number(userId);
  userActiveCache.delete(numId);
}

/**
 * Explicitly marks a user as inactive/revoked in the cache for 10 minutes.
 * Used exclusively for administrative revoking or deactivation to prevent
 * in-flight race conditions during revocation.
 */
export function revokeUserAuthInCache(userId) {
  if (!userId) return;
  const numId = Number(userId);
  userActiveCache.delete(numId);
  userActiveCache.set(numId, {
    exists: true,
    isActive: false,
    role: null,
    collegeId: null,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
}

/**
 * Clears the entire user authentication cache (useful for testing and reloads).
 */
export function clearAllUserAuthCache() {
  userActiveCache.clear();
}

/**
 * Checks whether a user exists and is active, utilizing the cache and falling back to DB.
 * Guarantees FAIL-CLOSED behavior on database errors.
 */
export async function verifyUserIsActive(userId) {
  if (!userId) return false;
  const numId = Number(userId);

  const cached = userActiveCache.get(numId);
  if (cached && cached.expiresAt > Date.now()) {
    return Boolean(cached.exists && cached.isActive);
  }

  try {
    const rows = await query(
      'SELECT id, role, college_id, is_active FROM users WHERE id = ? LIMIT 1',
      [numId]
    );

    if (!rows || rows.length === 0) {
      userActiveCache.set(numId, {
        exists: false,
        isActive: false,
        role: null,
        collegeId: null,
        expiresAt: Date.now() + 60 * 1000,
      });
      return false;
    }

    const dbUser = rows[0];
    const isActive = dbUser.is_active === 1 || dbUser.is_active === true || dbUser.is_active === '1';

    userActiveCache.set(numId, {
      exists: true,
      isActive,
      role: dbUser.role,
      collegeId: dbUser.college_id,
      expiresAt: Date.now() + (isActive ? CACHE_TTL_MS : 5 * 60 * 1000),
    });

    return isActive;
  } catch (err) {
    console.error(`[Auth] Database check error for user ${numId} (FAIL-CLOSED):`, err.message);
    return false; // Fail closed on database error
  }
}

/**
 * Primary authentication middleware for TrainX HTTP endpoints.
 * Validates cryptographic JWT signature, verifies issuer/audience, and strictly
 * enforces that the referenced user exists and is active in the database (SEC-01).
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader =
    req.headers['authorization'] ||
    req.headers['Authorization'] ||
    req.headers['x-access-token'] ||
    req.headers['token'];

  if (!authHeader) {
    return sendError(res, 'Authentication token required', 401);
  }

  let token = authHeader;
  if (typeof token === 'string') {
    if (/^Bearer\s+/i.test(token)) {
      token = token.replace(/^Bearer\s+/i, '');
    }
    token = token.replace(/^["']|["']$/g, '').trim();
  }

  if (!token) {
    return sendError(res, 'Authentication required. Please log in.', 401);
  }

  const jwtSecret = getJwtSecret();

  let decodedUser;
  try {
    decodedUser = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    return sendError(res, 'Invalid or expired authentication token. Please log in again.', 401);
  }

  // Soft-check issuer / audience if present in token
  if (decodedUser.iss && decodedUser.iss !== JWT_ISSUER) {
    return sendError(res, 'Invalid token issuer. Please log in again.', 401);
  }
  if (decodedUser.aud && decodedUser.aud !== JWT_AUDIENCE) {
    return sendError(res, 'Invalid token audience. Please log in again.', 401);
  }

  // Normalize user identifiers
  const rawUserId = decodedUser.userId || decodedUser.id || (decodedUser.sub ? Number(decodedUser.sub) : undefined);
  const userId = Number(rawUserId);
  const role = decodedUser.role;

  if (!userId || isNaN(userId) || !role) {
    return sendError(res, 'Malformed authentication token. Please log in again.', 401);
  }

  // SEC-01: Verify referenced user exists and is active (with fail-closed error handling)
  const cached = userActiveCache.get(userId);
  let userStatus = null;

  if (cached && cached.expiresAt > Date.now()) {
    userStatus = cached;
  } else {
    try {
      const rows = await query(
        'SELECT id, role, college_id, is_active FROM users WHERE id = ? LIMIT 1',
        [userId]
      );

      if (!rows || rows.length === 0) {
        userActiveCache.set(userId, {
          exists: false,
          isActive: false,
          role: null,
          collegeId: null,
          expiresAt: Date.now() + 60 * 1000,
        });
        return sendError(res, 'User account no longer exists. Please register or contact support.', 401);
      }

      const dbUser = rows[0];
      const isActive = dbUser.is_active === 1 || dbUser.is_active === true || dbUser.is_active === '1';

      userStatus = {
        exists: true,
        isActive,
        role: dbUser.role,
        collegeId: dbUser.college_id,
        expiresAt: Date.now() + (isActive ? CACHE_TTL_MS : 5 * 60 * 1000),
      };
      userActiveCache.set(userId, userStatus);
    } catch (dbErr) {
      console.error(`[Auth Middleware] Database error checking active status for user ${userId} (FAIL-CLOSED):`, dbErr.message);
      // FAIL CLOSED: do not allow unverified tokens when database is unavailable or query fails
      return sendError(res, 'Authentication verification failed. Please try again.', 401);
    }
  }

  if (!userStatus.exists) {
    return sendError(res, 'User account no longer exists. Please register or contact support.', 401);
  }

  if (!userStatus.isActive) {
    return sendError(res, 'User account has been deactivated or revoked. Please contact support.', 401);
  }

  const effectiveRole = userStatus.role || role;
  const effectiveCollegeId =
    userStatus.collegeId !== undefined
      ? userStatus.collegeId
      : decodedUser.collegeId || decodedUser.college_id;

  req.user = {
    ...decodedUser,
    id: userId,
    userId: userId,
    collegeId: effectiveCollegeId || null,
    college_id: effectiveCollegeId || null,
    role: effectiveRole,
  };

  next();
};

/**
 * Optional authentication middleware: if token is present, validates signature and active status.
 * If token is invalid, expired, missing, or references an inactive user, sets req.user = null.
 */
export const optionalAuthenticateToken = async (req, res, next) => {
  const authHeader =
    req.headers['authorization'] ||
    req.headers['Authorization'] ||
    req.headers['x-access-token'] ||
    req.headers['token'];

  if (!authHeader) {
    req.user = null;
    return next();
  }

  let token = authHeader;
  if (typeof token === 'string') {
    if (/^Bearer\s+/i.test(token)) {
      token = token.replace(/^Bearer\s+/i, '');
    }
    token = token.replace(/^["']|["']$/g, '').trim();
  }

  if (!token) {
    req.user = null;
    return next();
  }

  const jwtSecret = getJwtSecret();

  let decodedUser;
  try {
    decodedUser = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    req.user = null;
    return next();
  }

  if (!decodedUser) {
    req.user = null;
    return next();
  }

  if (decodedUser.iss && decodedUser.iss !== JWT_ISSUER) {
    req.user = null;
    return next();
  }
  if (decodedUser.aud && decodedUser.aud !== JWT_AUDIENCE) {
    req.user = null;
    return next();
  }

  const rawUserId = decodedUser.userId || decodedUser.id || (decodedUser.sub ? Number(decodedUser.sub) : undefined);
  const userId = Number(rawUserId);
  const role = decodedUser.role;

  if (!userId || isNaN(userId) || !role) {
    req.user = null;
    return next();
  }

  const isActive = await verifyUserIsActive(userId);
  if (!isActive) {
    req.user = null;
    return next();
  }

  const cached = userActiveCache.get(userId);
  const effectiveRole = cached?.role || role;
  const effectiveCollegeId =
    cached?.collegeId !== undefined
      ? cached.collegeId
      : decodedUser.collegeId || decodedUser.college_id;

  req.user = {
    ...decodedUser,
    id: userId,
    userId: userId,
    collegeId: effectiveCollegeId || null,
    college_id: effectiveCollegeId || null,
    role: effectiveRole,
  };

  next();
};
