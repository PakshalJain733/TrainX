import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';

// Initialize Supabase client if credentials exist
const hasSupabaseConfig = Boolean(config.supabase.url && config.supabase.serviceKey);

export const supabase = hasSupabaseConfig
  ? createClient(config.supabase.url, config.supabase.serviceKey)
  : null;

// Ensure local uploads directory exists as fallback
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
        .from(config.supabase.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        console.warn('[Supabase Storage Upload Warning]', error.message, '- Falling back to local disk storage');
      } else {
        // Retrieve public URL from Supabase Bucket
        const { data: publicUrlData } = supabase.storage
          .from(config.supabase.bucketName)
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
  const localFilePath = path.join(uploadDir, localFileName);
  fs.writeFileSync(localFilePath, file.buffer);

  return `/uploads/${localFileName}`;
};

// Backwards compatibility alias
export const uploadFileToS3 = uploadFileToStorage;
