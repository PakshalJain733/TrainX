import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error Middleware] ${err.stack || err.message}`);
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  // Prevent leaking internal SQL syntax, collation, file paths, or schema details
  const isSqlError = Boolean(err.sqlMessage || (err.code && String(err.code).startsWith('ER_')) || /SELECT|UPDATE|INSERT|DELETE|FROM|WHERE/i.test(err.message || ''));
  const message = (isProduction && statusCode === 500) || isSqlError
    ? 'An unexpected error occurred. Please try again later.'
    : (err.message || 'Internal Server Error');
  return sendError(res, message, statusCode, err.errors || []);
};
