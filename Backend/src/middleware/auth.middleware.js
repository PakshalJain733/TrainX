import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { sendError } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.headers['x-access-token'] || req.headers['token'];

  if (!authHeader) {
    return sendError(res, 'Authentication token required', 401);
  }

  let token = authHeader;
  if (typeof token === 'string') {
    // Support Bearer / bearer with variable whitespace
    if (/^Bearer\s+/i.test(token)) {
      token = token.replace(/^Bearer\s+/i, '');
    }
    // Remove surrounding quotes and trim whitespace
    token = token.replace(/^["']|["']$/g, '').trim();
  }

  if (!token) {
    return sendError(res, 'Authentication required. Please log in.', 401);
  }

  jwt.verify(token, config.jwt.secret, (err, decodedUser) => {
    if (err) {
      return sendError(res, 'Invalid or expired authentication token. Please log in again.', 401);
    }

    // Normalize user properties — do NOT provide dangerous defaults
    const userId = decodedUser.userId || decodedUser.id;
    const collegeId = decodedUser.collegeId || decodedUser.college_id;
    const role = decodedUser.role;

    if (!userId || !role) {
      return sendError(res, 'Malformed authentication token. Please log in again.', 401);
    }

    req.user = {
      ...decodedUser,
      id: userId,
      userId,
      collegeId: collegeId || null,
      college_id: collegeId || null,
      role,
    };

    next();
  });
};
