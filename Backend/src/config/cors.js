import 'dotenv/config';

/**
 * Authoritative Centralized CORS Configuration for TrainX Platform
 * 
 * Supports:
 * - Production: https://trainingportal.getflytechnologies.com
 * - API Domain: https://api.trainingportal.getflytechnologies.com
 * - Local Development: localhost/127.0.0.1 on all required ports (5173, 3000, 4173, 5000, etc.)
 * - Configured process.env.FRONTEND_URL
 */

const STATIC_ALLOWED_ORIGINS = new Set([
  'https://trainingportal.getflytechnologies.com',
  'https://api.trainingportal.getflytechnologies.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
]);

/**
 * Validate whether an incoming origin is authorized
 * @param {string|undefined} origin 
 * @returns {boolean}
 */
export const isOriginAllowed = (origin) => {
  // Allow server-to-server, curl, Postman, native mobile, and requests without an Origin header
  if (!origin) return true;

  const normalized = origin.trim().replace(/\/+$/, '');

  // 1. Direct match with static allowlist
  if (STATIC_ALLOWED_ORIGINS.has(normalized)) {
    return true;
  }

  // 2. Match with custom FRONTEND_URL environment variable(s)
  if (process.env.FRONTEND_URL) {
    const envOrigins = process.env.FRONTEND_URL.split(',').map((o) => o.trim().replace(/\/+$/, ''));
    if (envOrigins.includes(normalized)) {
      return true;
    }
  }

  // 3. Match any getflytechnologies.com trainingportal subdomains
  if (/^https:\/\/([a-zA-Z0-9-]+\.)?trainingportal\.getflytechnologies\.com$/.test(normalized)) {
    return true;
  }

  // 4. In development / testing, allow any localhost or 127.0.0.1 port
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
    return true;
  }

  return false;
};

export const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

export const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers',
  'Range',
  'Cache-Control',
  'Pragma',
];

export const EXPOSED_HEADERS = [
  'Content-Length',
  'Content-Range',
  'Content-Disposition',
  'ETag',
];

/**
 * Express CORS Middleware
 * Mounted before ALL authentication, rate limiters, compression, and routes.
 */
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    if (isOriginAllowed(origin)) {
      // Set exact allowed origin (never wildcard '*' when credentials are true)
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // Reject unauthorized origin
      if (req.method === 'OPTIONS') {
        return res.status(403).json({
          success: false,
          message: `CORS policy violation: Origin '${origin}' is not authorized.`,
        });
      }
      return res.status(403).json({
        success: false,
        message: `CORS policy violation: Origin '${origin}' is not authorized.`,
      });
    }
  }

  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
  res.setHeader('Access-Control-Expose-Headers', EXPOSED_HEADERS.join(', '));
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  res.setHeader('Vary', 'Origin, Access-Control-Request-Headers, Access-Control-Request-Method');

  // Handle preflight OPTIONS immediately across all routes
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};

/**
 * Socket.IO CORS configuration options
 */
export const socketCorsConfig = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by Socket.IO CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
};

