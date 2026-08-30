import express from 'express';
import { upload, uploadVideo, makeKey } from '../middleware/upload.js';
import { uploadToS3, getUploadProgress } from '../config/s3.js';
import {
  isMediaConvertConfigured,
  submitHlsJob,
  pollJobUntilDone,
  getHlsManifestUrl,
} from '../config/mediaconvert.js';
import GalleryItem from '../models/GalleryItem.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// --- Background HLS transcode tracking -------------------------------------
// After a video is uploaded we fire-and-forget a MediaConvert job (so the admin
// save isn't blocked) and record it here; a single poller drains the map and
// writes the finished master playlist URL back onto the gallery item's
// `videoHls` field. The player then switches to adaptive playback next time the
// item is read. Kept module-local: fine for a single-admin portfolio.
const pendingJobs = new Map(); // jobId -> { mp4Url, mp4Key }
let pollerStarted = false;
const POLL_MS = 20000;

const processPendingJobs = async () => {
  for (const [jobId, job] of pendingJobs) {
    let done = false;
    try {
      const { status } = await pollJobUntilDone(jobId, { intervalMs: POLL_MS, timeoutMs: POLL_MS * 3 });
      if (status === 'COMPLETE') {
        const hlsUrl = getHlsManifestUrl(job.mp4Key);
        // Match by the stored public URL so we update exactly the right item.
        await GalleryItem.updateOne({ video: job.mp4Url }, { $set: { videoHls: hlsUrl } });
        // eslint-disable-next-line no-console
        console.log(`HLS ready for ${job.mp4Key} -> ${hlsUrl}`);
      }
      done = true;
    } catch (err) {
      // Terminal error / timeout for this job — drop it so we don't spin on it.
      // eslint-disable-next-line no-console
      console.error(`HLS transcode for ${job.mp4Key} failed:`, err.message);
      done = true;
    }
    if (done) pendingJobs.delete(jobId);
  }
};

const ensurePoller = () => {
  if (pollerStarted) return;
  pollerStarted = true;
  setInterval(() => {
    if (!pendingJobs.size) return; // idle: skip empty polls
    processPendingJobs().catch(() => {});
  }, POLL_MS);
};

// Kick off a transcode for a just-uploaded video. No-op (returns false) when
// MediaConvert isn't configured, so uploads always succeed as progressive MP4.
const startTranscode = async (mp4Key, mp4Url) => {
  if (!isMediaConvertConfigured()) return false;
  const jobId = await submitHlsJob({ mp4Key });
  if (!jobId) return false;
  pendingJobs.set(jobId, { mp4Url, mp4Key });
  ensurePoller();
  return true;
};

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

// Multiple images in one request (gallery). Reuses the same multer config
// (5MB/file cap + image filter); up to 10 files at a time.
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

// Single video upload for a gallery item. Accepts common web video formats
// with a higher cap (500 MB); returns the same { url } shape as images.
router.post('/video', protect, (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    // The multer middleware itself throws for e.g. LIMIT_FILE_SIZE, which
    // happens BEFORE the route handler runs — so it would otherwise fall to
    // Express's default error handler and surface as a bare 500. Catch it here
    // and translate into a clean 4xx error.
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'Video exceeds the maximum size of 500 MB.',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No video uploaded' });
  }

  // The video was streamed to S3 directly by the storage during the request;
  // the S3 URL is on req.file. (The storage reads req.body.uploadId itself for
  // progress reporting; no further upload happens in this handler.)
  if (!req.file.s3Url) {
    return res.status(500).json({ success: false, message: 'Video did not reach storage.' });
  }

  // Fire off an adaptive-HLS transcode for this upload (async, non-blocking).
  // When MediaConvert isn't configured this is a no-op and hlsAvailable=false,
  // so the video still saves + plays as a normal progressive MP4 below.
  const hlsAvailable = await startTranscode(req.file.key, req.file.s3Url);

  res.status(200).json({
    success: true,
    message: 'Video uploaded successfully',
    url: req.file.s3Url,
    filename: req.file.key,
    // Whether an HLS manifest is being produced for this video (adaptive
    // playback). If false, the player falls back to the progressive MP4.
    hlsAvailable,
  });
});

// Live server→S3 upload progress, polled by the admin while a video streams.
// Returns the stored { percent, loaded, total } for an in-flight upload, or
// null when nothing is being uploaded under that id.
router.get('/video/progress/:uploadId', protect, (req, res) => {
  const progress = getUploadProgress(req.params.uploadId);
  res.status(200).json({ success: true, progress });
});

export default router;
