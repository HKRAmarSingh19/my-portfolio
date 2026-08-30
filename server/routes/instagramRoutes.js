import express from 'express';
import {
  getInstagramPosts,
  getInstagramMeta,
  syncInstagram,
  deleteInstagramPost,
} from '../controllers/instagramController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getInstagramPosts); // public feed
router.get('/meta', getInstagramMeta); // public metadata (username, last sync)
router.post('/sync', protect, syncInstagram); // admin trigger
router.delete('/:id', protect, deleteInstagramPost); // admin remove

export default router;
