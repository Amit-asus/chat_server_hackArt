import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/env';
import { Request } from 'express';

function getStorage(subdir: 'images' | 'files') {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(config.uploadsDir, subdir));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

function imageFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files allowed'));
  }
}

export const uploadImage = multer({
  storage: getStorage('images'),
  limits: { fileSize: config.maxImageSizeMb * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const uploadFile = multer({
  storage: getStorage('files'),
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
});
