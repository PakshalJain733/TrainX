import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { sendError } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return sendError(res, 'Authentication token required', 401);
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return sendError(res, 'Invalid or expired token', 403);
    }
    req.user = user;
    next();
  });
};
