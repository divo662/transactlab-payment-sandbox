import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { logger } from '../../utils/helpers/logger';

// Configure storage
// Switch to memory storage so we can stream to Cloudinary or any remote storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file at a time
  }
});

// Error handling middleware
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only 1 file allowed',
        code: 'TOO_MANY_FILES'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed',
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  logger.error('Upload error:', error);
  res.status(500).json({
    success: false,
    message: 'File upload failed',
    code: 'UPLOAD_ERROR'
  });
};

export { upload };
export default upload; 