import express from 'express';
import {
  createMessage,
  getMessages,
  toggleRead,
  toggleStar,
  deleteMessage,
} from '../controllers/messageController.js';
import {
  startGmailOAuth,
  handleGmailOAuthCallback,
  getGmailStatus,
  sendMessageReply,
} from '../controllers/gmailController.js';
import { protect } from '../middleware/auth.js';
import { validate, contactSchema } from '../middleware/validate.js';

const router = express.Router();

// OAuth callback must be public because Google redirects the browser here.
// The signed state parameter is validated inside the callback controller.
router.get('/gmail/callback', handleGmailOAuthCallback);

// Admin-only Gmail operations.
router.get('/gmail/connect', protect, startGmailOAuth);
router.get('/gmail/status', protect, getGmailStatus);

router.post('/submit', validate(contactSchema), createMessage);

router.route('/')
  .get(protect, getMessages)
  .post(validate(contactSchema), createMessage);

router.post('/:id/reply', protect, sendMessageReply);

router.route('/:id/read')
  .patch(protect, toggleRead);

router.route('/:id/star')
  .patch(protect, toggleStar);

router.route('/:id')
  .delete(protect, deleteMessage);

export default router;
