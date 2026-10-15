import express from 'express';
import { upload, uploadVideo, makeKey } from '../middleware/upload.js';
import { uploadToS3, getUploadProgress } from '../config/s3.js';
import GalleryItem from '../models/GalleryItem.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    const key = makeKey(req.file.fieldname, req.file.originalname);
    const { url, key: fileKey } = await uploadToS3(req.file.buffer, key, req.file.mimetype);
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url,
      filename: fileKey,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
  }
});
router.post('/multiple', protect, upload.array('images', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  try {
    const results = await Promise.all(
      req.files.map((f) => {
        const key = makeKey(f.fieldname, f.originalname);
        return uploadToS3(f.buffer, key, f.mimetype);
      })
    );
    res.status(200).json({
      success: true,
      message: `${results.length} files uploaded successfully`,
      urls: results.map((r) => r.url),
      files: results.map((r) => r.key),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
  }
});


router.post('/video', protect, (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'Video exceeds the maximum size of 500 MB.',
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No video uploaded',
    });
  }

  if (!req.file.s3Url) {
    return res.status(500).json({
      success: false,
      message: 'Video did not reach storage.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Video uploaded successfully',
    url: req.file.s3Url,
    filename: req.file.key,
  });
});


router.get('/video/progress/:uploadId', protect, (req, res) => {
  const progress = getUploadProgress(req.params.uploadId);
  res.status(200).json({ success: true, progress });
});

export default router;
