import express from 'express';
import {
  getGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from '../controllers/galleryController.js';
import { protect } from '../middleware/auth.js';
import { validate, gallerySchema } from '../middleware/validate.js';

const router = express.Router();

router.route('/')
  .get(getGalleryItems)
  .post(protect, validate(gallerySchema), createGalleryItem);

router.route('/:id')
  .get(getGalleryItem)
  .put(protect, validate(gallerySchema), updateGalleryItem)
  .delete(protect, deleteGalleryItem);

export default router;
