import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import ApiError from '../utils/ApiError';

// Configure multer storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed extensions
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|mov|avi|webm/;
  const allowedDocTypes = /pdf|doc|docx/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  // Check file type based on field name
  if (file.fieldname === 'profilePicture' || file.fieldname === 'photos') {
    if (allowedImageTypes.test(extname) && mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    return cb(new ApiError(400, 'Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }

  if (file.fieldname === 'videoIntro') {
    if (allowedVideoTypes.test(extname) && mimetype.startsWith('video/')) {
      return cb(null, true);
    }
    return cb(new ApiError(400, 'Only video files are allowed (mp4, mov, avi, webm)'));
  }

  if (file.fieldname === 'documents' || file.fieldname === 'verificationDocuments') {
    if (allowedDocTypes.test(extname)) {
      return cb(null, true);
    }
    return cb(new ApiError(400, 'Only document files are allowed (pdf, doc, docx)'));
  }

  cb(new ApiError(400, 'Invalid file type'));
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount: number }[]) => upload.fields(fields);

export default upload;