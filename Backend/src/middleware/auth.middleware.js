import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { sendError } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

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
