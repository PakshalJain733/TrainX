import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error Middleware] ${err.stack || err.message}`);
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  // Prevent leaking internal SQL syntax, collation, or stack traces in production
  const message = (isProduction && statusCode === 500)
    ? 'An unexpected internal server error occurred. Please try again later.'
    : (err.message || 'Internal Server Error');
  return sendError(res, message, statusCode, err.errors || []);
};
