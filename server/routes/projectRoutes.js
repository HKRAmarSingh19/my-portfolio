import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { validate, projectSchema } from '../middleware/validate.js';

const router = express.Router();

router.route('/')
  .get(getProjects)
  .post(protect, validate(projectSchema), createProject);

router.route('/:slugOrId')
  .get(getProject);

router.route('/:id')
  .put(protect, validate(projectSchema), updateProject)
  .delete(protect, deleteProject);

export default router;

