import 'dotenv/config';

/**
 * Returns the securely configured JWT secret.
 * In production environments, a valid JWT_SECRET environment variable is strictly required.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret) {
    if (isProduction) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is strictly required in production mode! Server startup aborted.'
      );
    }
    console.warn(
      '[Security Warning] JWT_SECRET is not defined in environment variables. Falling back to local development secret. Set JWT_SECRET in .env for production.'
    );
    return 'dev_jwt_secret_key_trainx_2026_super_secret';
  }

  return secret;
};

export const JWT_SECRET = getJwtSecret();
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
