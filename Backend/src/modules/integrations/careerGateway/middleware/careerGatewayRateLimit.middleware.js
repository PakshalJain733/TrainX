import rateLimit from 'express-rate-limit';

/**
 * SEC-05: Rate limiting for Career Gateway integration endpoints.
 * Provides dual-tier rate limiting:
 * 1. activationRateLimiter: Strict limit for student account activation (prevents bcrypt DoS).
 * 2. m2mProvisioningRateLimiter: Burst-tolerant limit for M2M bulk synchronization.
 */

export const activationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 activation requests per 15 min per IP / token
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false, xForwardedForHeader: false },
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    const identifier = req.body?.activation_token || req.body?.email || req.ip;
    return `act_${String(identifier || req.ip).trim().toLowerCase()}`;
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many account activation attempts. Please wait 15 minutes before trying again.',
    });
  },
});

export const m2mProvisioningRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 600, // Up to 600 M2M calls per 5 minutes to accommodate bulk student synchronization
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false, xForwardedForHeader: false },
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    return `m2m_${String(req.ip).trim()}`;
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: 'Career Gateway service rate limit exceeded. Please back off and retry.',
    });
  },
});
