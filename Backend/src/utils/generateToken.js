import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getJwtSecret, JWT_EXPIRES_IN, JWT_ISSUER, JWT_AUDIENCE } from '../config/jwt.js';

export const generateToken = (payload, options = {}) => {
  const secret = getJwtSecret();
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || JWT_EXPIRES_IN || '7d';

  // Standardize user identifier as string subject
  const userId = payload.userId || payload.id;
  const standardSubject = userId !== undefined && userId !== null ? String(userId) : undefined;

  const standardPayload = {
    ...payload,
    userId: userId !== undefined && userId !== null ? Number(userId) : undefined,
    id: userId !== undefined && userId !== null ? Number(userId) : undefined,
    sub: standardSubject,
    jti: payload.jti || crypto.randomUUID(),
    tokenType: payload.tokenType || 'access',
  };

  return jwt.sign(standardPayload, secret, {
    algorithm: 'HS256',
    expiresIn,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};
