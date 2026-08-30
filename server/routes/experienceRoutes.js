import express from 'express';
import {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} from '../controllers/experienceController.js';
import { protect } from '../middleware/auth.js';
import { validate, experienceSchema } from '../middleware/validate.js';

const router = express.Router();

router.route('/')
  .get(getExperiences)
  .post(protect, validate(experienceSchema), createExperience);

router.route('/:id')
  .put(protect, validate(experienceSchema), updateExperience)
  .delete(protect, deleteExperience);

export default router;

