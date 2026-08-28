import multer from 'multer';
import { ApiError } from '../lib/ApiError.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

// Property image uploads. Kept in memory because we forward the buffer straight to
// object storage. One file per request, 5 MB max, images only.
export const uploadPropertyImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new ApiError(422, 'Upload a JPEG, PNG, WebP, or AVIF image'));
  },
}).single('image');

// Property documents: PDFs, images, and common office formats. 20 MB max.
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_DOC_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new ApiError(422, 'Upload a PDF, image, or Word/Excel document'));
  },
}).single('file');
