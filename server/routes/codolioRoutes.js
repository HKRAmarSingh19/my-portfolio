import express from 'express';
import { getCodolioStats } from '../controllers/codolioController.js';

const router = express.Router();

// Public — live Codolio stats for the homepage coding section.
router.get('/', getCodolioStats);

export default router;