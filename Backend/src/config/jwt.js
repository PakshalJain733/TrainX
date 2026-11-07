import 'dotenv/config';

/**
 * Returns the securely configured JWT secret.
 * In production environments, a valid JWT_SECRET environment variable is strictly required.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error(
      'CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be defined in your environment (.env file). Server startup aborted.'
    );
  }

  return secret.trim();
};

export const JWT_SECRET = getJwtSecret();
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const JWT_ISSUER = process.env.JWT_ISSUER || 'https://api.trainingportal.getflytechnologies.com';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'trainx-portal';
