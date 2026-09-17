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
    password: process.env.DB_PASSWORD || 'Ganeshvs@2006',
    database: process.env.DB_NAME || 'training_portal_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'training.portal0987@gmail.com',
    pass: process.env.EMAIL_PASS || 'ocbaioexvynljtnz',
    from: process.env.EMAIL_FROM || '"Campus Training Portal" <noreply@pvppcoe.ac.in>',
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gemini-flash-latest',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    bucketName: process.env.SUPABASE_STORAGE_BUCKET || 'learning-materials',
  },
};
