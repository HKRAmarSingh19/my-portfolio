import express from 'express';
import { upload, uploadVideo } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    url: fileUrl,
    filename: req.file.filename,
  });
});

// Multiple images in one request (gallery). Reuses the same multer config
// (5MB/file cap + image filter); up to 10 files at a time.
router.post('/multiple', protect, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const urls = req.files.map((f) => `/uploads/${f.filename}`);

  res.status(200).json({
    success: true,
    message: `${urls.length} files uploaded successfully`,
    urls,
    files: req.files.map((f) => f.filename),
  });
});

// Single video upload for a gallery item. Accepts common web video formats
// with a higher cap (100 MB); returns the same { url } shape as images.
router.post('/video', protect, uploadVideo.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No video uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: 'Video uploaded successfully',
    url: fileUrl,
    filename: req.file.filename,
  });
});

export default router;

