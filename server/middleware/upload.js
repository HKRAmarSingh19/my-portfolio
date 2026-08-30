import multer from 'multer';
import path from 'path';
import { uploadStreamToS3 } from '../config/s3.js';

// Media is uploaded to AWS S3 (see server/routes/uploadRoutes.js), so multer
// keeps files in MEMORY (req.file.buffer) rather than writing to local disk.
// This is the standard pairing with object-storage uploads and avoids relying
// on Render's ephemeral filesystem. Same file filters + size caps as before.
const memoryStorage = multer.memoryStorage();

// Generate the S3 object key (filename). Mirrors the old disk scheme
// `<fieldname>-<timestamp>-<random><ext>` so keys are unique and recognizable.
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

// Multer storage that pipes the incoming video stream STRAIGHT to AWS S3 via
// lib-storage's multipart `Upload`, instead of buffering the whole file in RAM
// first (a full in-memory copy of a large video was crashing the process and
// leaving orphaned S3 objects). Only part-sized buffers are ever held.
const s3VideoStorage = {
  async _handleFile(req, file, cb) {
    const key = makeKey(file.fieldname, file.originalname);
    // The client appends uploadId to the FormData BEFORE the file field, so
    // busboy has it parsed by the time this runs.
    const uploadId = typeof req.body?.uploadId === 'string' ? req.body.uploadId : undefined;
    try {
      const { url, key: objectKey } = await uploadStreamToS3(file.stream, key, file.mimetype, { uploadId });
      // Expose the S3 URL to the route via req.file; multer's own dest can't
      // hold it, so stash it on the file object.
      file.s3Url = url;
      file.key = objectKey;
      cb(null, { url, key: objectKey });
    } catch (err) {
      cb(err);
    }
  },
  _removeFile(req, file, cb) {
    // Nothing persisted to local disk; aborting is handled inside the stream
    // upload on error. Nothing to clean up on disk.
    cb(null);
  },
};

// Separate for .single('video') uploads — accepts common web video formats,
// with a higher size cap for video (500 MB). Streams directly to S3.
export const uploadVideo = multer({
  storage: s3VideoStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: videoFileFilter,
});
