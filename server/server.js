import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import experienceRoutes from './routes/experienceRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import instagramRoutes from './routes/instagramRoutes.js';
import linkedInRoutes from './routes/linkedInRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Refuse to boot without a strong JWT secret. A missing/wrong secret would
// silently use a hardcoded default — forgeable tokens for a personal admin.
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 16) {
  console.error('[Fatal] JWT_SECRET is missing or too short (< 16 chars).');
  console.error('Set a strong random value in server/.env before starting.');
  process.exit(1);
}

connectDB();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many messages sent from this IP, please try again in 15 minutes.',
  },
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// In production, serve the built React client (client/dist) from the same
// origin as the API. Dev uses the Vite proxy instead, so this only activates
// when NODE_ENV=production. Built by `npm run build:client` before start.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  // SPA fallback — any non-/api route hands control back to index.html so
  // client-side routes (/, /projects/:id, /admin, ...) work on refresh/deep link.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contact', contactLimiter, messageRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/linkedin', linkedInRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 [Server] Minimal Editorial Portfolio API running on port ${PORT}`);
});

// Best-effort Instagram feed sync on boot (when configured): keeps a fresh
// deploy's feed up to date without manual action. Never blocks or fails server
// startup — if the API errors (bad/expired token, network), we log and continue.
import('./config/instagram.js')
  .then(async ({ isInstagramConfigured, syncInstagramNow }) => {
    if (!isInstagramConfigured()) return; // not configured — skip, feed stays empty
    try {
      const r = await syncInstagramNow();
      console.log(`📸 Instagram feed synced on boot (${r.synced} posts, ${r.total} stored)`);
    } catch (err) {
      console.error('Instagram boot sync failed (continuing):', err.message);
    }
  })
  .catch(() => { /* import failure — ignore, feature stays off */ });
// (LinkedIn feed needs no boot sync — it is curated manually by the admin via
// pasting post URLs, so there is nothing to auto-fetch on startup.)

export default app;

