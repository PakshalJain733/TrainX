import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};