import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local uploads directory exists on disk across all working directories
export const uploadDirs = [
  path.resolve(__dirname, '../../uploads'),
  path.resolve(__dirname, '../uploads'),
  path.resolve(process.cwd(), 'uploads'),
];

uploadDirs.forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    console.warn(`[Local Storage Setup Warning] Failed to create directory: ${dir}`, e.message);
  }
});

// Primary uploads directory
export const primaryUploadDir = uploadDirs[0];

// Configure Multer Memory Storage for safe validation and streaming to local disk
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max limit
  fileFilter: (req, file, cb) => {
    // Allow documents, presentations, spreadsheets, archives, images, videos, audio, and code
    cb(null, true);
  },
});

/**
 * Saves an uploaded file buffer directly to the local server disk storage
 * (100% local storage - no Cloudinary or external cloud dependencies).
 *
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Relative URL for accessing the uploaded file locally (e.g. '/uploads/1740000000_sample.pdf')
 */
export const uploadFileToStorage = async (file) => {
  if (!file) return null;

  // Clean the original filename to be URL-safe while preserving extension
  const originalName = file.originalname || 'file';
  const fileExtension = path.extname(originalName) || '';
  const baseNameWithoutExt = path.basename(originalName, fileExtension).replace(/[^a-zA-Z0-9_-]/g, '_');
  const localFileName = `${Date.now()}_${baseNameWithoutExt}${fileExtension}`;

  let written = false;

  uploadDirs.forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const targetPath = path.join(dir, localFileName);
      fs.writeFileSync(targetPath, file.buffer);
      written = true;
    } catch (err) {
      console.warn(`[Local Storage Write Warning] Failed writing to ${dir}:`, err.message);
    }
  });

  if (!written) {
    throw new Error('Failed to write uploaded file to local server storage.');
  }

  // Returns local relative URL served statically by express
  return `/uploads/${localFileName}`;
};

/**
 * Deletes a file from local server disk storage
 * @param {string} fileUrl - Local URL path (e.g. '/uploads/1740000000_sample.pdf')
 */
export const deleteFileFromStorage = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;

  const rawFilename = path.basename(fileUrl.split('?')[0]);
  if (!rawFilename) return;

  uploadDirs.forEach((dir) => {
    try {
      const fullPath = path.join(dir, rawFilename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {}
  });
};

// Aliases for compatibility across the codebase
export const uploadFileToLocalStorage = uploadFileToStorage;
export const uploadFileToS3 = uploadFileToStorage;
export const deleteFileFromLocalStorage = deleteFileFromStorage;
