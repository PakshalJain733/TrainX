import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || 'learning-materials';

// Initialize Supabase client if credentials exist
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseServiceKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Ensure local uploads directory exists as fallback across working environments
const uploadDirs = [
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(__dirname, '../uploads'),
  path.resolve(__dirname, '../../uploads'),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
});

// Multer Memory Storage Configuration for file buffer processing
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max limit
});

/**
 * Uploads a file buffer to Supabase Storage Bucket or Local Uploads folder fallback
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Public file URL
 */
export const uploadFileToStorage = async (file) => {
  if (!file) return null;

  const fileExtension = path.extname(file.originalname);
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
  const filePath = `materials/${fileName}`;

  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        console.warn('[Supabase Storage Upload Warning]', error.message, '- Falling back to local disk storage');
      } else {
        // Retrieve public URL from Supabase Bucket
        const { data: publicUrlData } = supabase.storage
          .from(supabaseBucket)
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('[Supabase Storage Error]', err.message, '- Falling back to local disk storage');
    }
  }

  // Fallback to local uploads directory if Supabase credentials are not set or upload fails
  const cleanOriginalName = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_') : 'document.pdf';
  const localFileName = `${Date.now()}_${cleanOriginalName}`;

  uploadDirs.forEach((dir) => {
    try {
      if (fs.existsSync(dir)) {
        fs.writeFileSync(path.join(dir, localFileName), file.buffer);
      }
    } catch (e) {}
  });

  return `/uploads/${localFileName}`;
};

// Backwards compatibility alias
export const uploadFileToS3 = uploadFileToStorage;
