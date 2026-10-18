import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  if (req?.headers?.origin && !res.getHeader('Access-Control-Allow-Origin')) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  }
  console.error(`[Error Middleware] ${err.stack || err.message}`);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(res, message, statusCode, err.errors || []);
};
