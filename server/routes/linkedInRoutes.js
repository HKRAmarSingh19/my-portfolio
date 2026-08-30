import express from 'express';
import {
  getLinkedInPosts,
  getLinkedInMeta,
  addLinkedInPost,
  deleteLinkedInPost,
} from '../controllers/linkedInController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getLinkedInPosts); // public feed
router.get('/meta', getLinkedInMeta); // public metadata (username, last update)
router.post('/', protect, addLinkedInPost); // admin: add a curated post URL
router.delete('/:id', protect, deleteLinkedInPost); // admin remove

export default router;
