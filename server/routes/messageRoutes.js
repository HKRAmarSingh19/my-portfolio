import express from 'express';
import {
  createMessage,
  getMessages,
  toggleRead,
  toggleStar,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validate, contactSchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/submit', validate(contactSchema), createMessage);

router.route('/')
  .get(protect, getMessages)
  .post(validate(contactSchema), createMessage);

router.route('/:id/read')
  .patch(protect, toggleRead);

router.route('/:id/star')
  .patch(protect, toggleStar);

router.route('/:id')
  .delete(protect, deleteMessage);

export default router;

