import jwt from 'jsonwebtoken';
import { getJwtSecret, JWT_EXPIRES_IN } from '../config/jwt.js';

export const generateToken = (payload) => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, {
    expiresIn,
  });
};


