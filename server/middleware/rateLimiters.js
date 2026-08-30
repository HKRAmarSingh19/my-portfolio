import rateLimit from 'express-rate-limit';

// Brute-force guard for the admin login endpoints (password + Google exchange).
// Only FAILED attempts count toward the cap (skipSuccessfulRequests), so a few
// typos are fine but an attacker grinding credentials gets locked out for the
// window. Generic message on purpose — never hint at whether an email exists.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: false, // keep responses small/clean for a personal API
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
  },
});
