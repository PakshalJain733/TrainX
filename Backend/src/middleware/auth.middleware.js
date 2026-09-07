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
    return sendError(res, 'Authentication token required', 401);
  }

  jwt.verify(token, config.jwt.secret, (err, decodedUser) => {
    if (err) {
      return sendError(res, 'Invalid or expired authentication token', 401);
    }
    
    // Normalize user properties for consistent access across controllers/services
    req.user = {
      ...decodedUser,
      id: decodedUser.userId || decodedUser.id,
      userId: decodedUser.userId || decodedUser.id,
      collegeId: decodedUser.collegeId || decodedUser.college_id || 1,
      college_id: decodedUser.college_id || decodedUser.collegeId || 1,
      role: decodedUser.role || 'student',
    };

    next();
  });
};
