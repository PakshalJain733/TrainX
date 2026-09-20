import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'Backend/.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'training_portal_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '"Campus Training Portal" <noreply@pvppcoe.ac.in>',
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gemini-flash-latest',
  },
};

// Validate critical env vars — error in production, warn in development
const required = [
  ['JWT_SECRET', config.jwt.secret],
  ['DB_PASSWORD', config.db.password],
];

const missing = required.filter(([, val]) => !val).map(([key]) => key);

if (missing.length > 0) {
  const msg = `[Config] Missing required environment variables: ${missing.join(', ')}`;

  if (missing.includes('JWT_SECRET')) {
    throw new Error(`${msg}. JWT_SECRET must come from an environment variable (Backend/.env). Refusing to start with insecure defaults.`);
  }

  if (config.nodeEnv === 'production') {
    throw new Error(msg);
  } else {
    console.warn(msg + ' — using insecure defaults (development only)');
    if (!config.db.password) config.db.password = '';
  }
}
