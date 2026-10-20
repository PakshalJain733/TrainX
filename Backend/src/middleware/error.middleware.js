import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  const origin = req?.headers?.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  const requestHeaders = req?.headers?.['access-control-request-headers'];
  res.setHeader('Access-Control-Allow-Headers', requestHeaders || '*');
  res.setHeader('Access-Control-Expose-Headers', '*');

  console.error(`[Error Middleware] ${err.stack || err.message}`);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(res, message, statusCode, err.errors || []);
};

