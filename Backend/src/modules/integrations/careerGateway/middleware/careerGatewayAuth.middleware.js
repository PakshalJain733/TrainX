import jwt from 'jsonwebtoken';
import { sendError } from '../../../../utils/response.js';

/**
 * Middleware to authenticate inbound service-to-service requests from Career Gateway.
 * Strictly enforces HS256 with the dedicated shared secret and validates exact claims.
 *
 * Expected Claims:
 * - iss: 'career-gateway'
 * - aud: 'trainx'
 * - sub: 'career-gateway-integration-service'
 * - scope: 'student_sync'
 * - exp: ~15m
 */
export const authenticateCareerGatewayService = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // Dedicated Inbound Secret agreed with Career Gateway
  const serviceSecret =
    process.env.TRAINX_INTEGRATION_SECRET ||
    process.env.CAREER_GATEWAY_SERVICE_SECRET ||
    process.env.CAREER_GATEWAY_SERVICE_KEY;

  if (!serviceSecret) {
    return sendError(
      res,
      'Internal Server Error: Inbound service secret is not configured on TrainX. Please set TRAINX_INTEGRATION_SECRET or CAREER_GATEWAY_SERVICE_SECRET in .env',
      500
    );
  }

  // SEC-04: X-Service-Key bypass has been removed. All inbound requests must use Bearer JWT.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      'Unauthorized: Missing Career Gateway service authorization Bearer token',
      401
    );
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  try {
    const decoded = jwt.verify(token, serviceSecret, {
      algorithms: ['HS256'],
      issuer: 'career-gateway',
      audience: 'trainx',
    });

    // SEC-03: Validate expected subject strictly (mandatory subject claim)
    if (!decoded.sub || decoded.sub !== 'career-gateway-integration-service') {
      return sendError(res, 'Forbidden: Invalid or missing service token subject', 403);
    }

    // Validate expected scope (student provisioning or on-demand synchronization)
    const validScopes = ['student_sync', 'training_sync', 'student'];
    if (!decoded.scope || !validScopes.includes(decoded.scope)) {
      return sendError(res, 'Forbidden: Insufficient token scope for integration operation', 403);
    }

    req.serviceAuth = {
      type: 'jwt',
      ...decoded,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Unauthorized: Service token has expired', 401);
    }
    return sendError(res, `Unauthorized: Invalid service token (${err.message})`, 401);
  }
};
