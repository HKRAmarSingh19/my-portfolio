import express from 'express';
import { login, getMe, updateDetails } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate, loginSchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/update-details', protect, updateDetails);

export default router;

