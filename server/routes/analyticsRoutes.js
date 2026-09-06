import express from 'express';
import { trackPageView, getAnalyticsOverview } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { trackLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Public pageview ingestion (via navigator.sendBeacon) — rate-limited.
router.post('/', trackLimiter, trackPageView);

// Admin-only consolidated analytics overview.
router.get('/overview', protect, getAnalyticsOverview);

export default router;