import multer from 'multer';
import path from 'path';
import { uploadStreamToS3 } from '../config/s3.js';

const memoryStorage = multer.memoryStorage();

export const makeKey = (fieldname, originalname) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(originalname);
  return `${fieldname}-${uniqueSuffix}${ext}`;
};

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|webp|svg|gif/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, SVG, GIF) are allowed.'));
  }
};

const videoFileFilter = (req, file, cb) => {
  const allowedFileTypes = /mp4|webm|mov|m4v|ogg/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files (MP4, WebM, MOV, M4V, OGG) are allowed.'));
  }
};

export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const s3VideoStorage = {
  async _handleFile(req, file, cb) {
    const key = makeKey(file.fieldname, file.originalname);
    const uploadId = typeof req.body?.uploadId === 'string' ? req.body.uploadId : undefined;
    try {
      const { url, key: objectKey } = await uploadStreamToS3(file.stream, key, file.mimetype, { uploadId });
      file.s3Url = url;
      file.key = objectKey;
      cb(null, { url, key: objectKey });
    } catch (err) {
      cb(err);
    }
  },
  _removeFile(req, file, cb) {
    cb(null);
  },
};
export const uploadVideo = multer({
  storage: s3VideoStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: videoFileFilter,
});
