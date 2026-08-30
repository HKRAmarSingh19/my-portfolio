import express from 'express';
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from '../controllers/skillController.js';
import { protect } from '../middleware/auth.js';
import { validate, skillSchema } from '../middleware/validate.js';

const router = express.Router();

router.route('/')
  .get(getSkills)
  .post(protect, validate(skillSchema), createSkill);

router.route('/:id')
  .put(protect, validate(skillSchema), updateSkill)
  .delete(protect, deleteSkill);

export default router;

