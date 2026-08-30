import express from 'express';
import { login, getMe, updateDetails, googleLogin, logout } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate, loginSchema, googleCodeSchema } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Both sign-in paths (password + Google) are rate-limited to blunt brute-force.
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/google', loginLimiter, validate(googleCodeSchema), googleLogin);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-details', protect, updateDetails);

export default router;
