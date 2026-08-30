import express from 'express';
import { getPublicProfile } from '../controllers/profileController.js';

const router = express.Router();

// Public — consumed by the homepage hero. Writes go through
// PUT /api/auth/update-details, which is behind `protect`.
router.get('/', getPublicProfile);

export default router;
