const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { seedDemoData } = require('./seed');

// Load env vars: prefer the Vercel sandbox project env file when present, then fall back to local .env
dotenv.config({ path: '/vercel/share/.env.project' });
dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  // Provide a dev-only fallback so sign-in does not crash if the env is misconfigured.
  // Production deployments must set JWT_SECRET explicitly.
  process.env.JWT_SECRET = 'dev-only-insecure-jwt-secret-change-me';
  console.warn('[backend] JWT_SECRET not set; using dev fallback. Set JWT_SECRET in env for security.');
}

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (!isProd) app.use(morgan('dev'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

let initPromise = null;

const initBackend = async () => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await connectDB();
    if (process.env.SEED_DEMO !== 'false') {
      try {
        await seedDemoData();
      } catch (err) {
        console.error('Seed error:', err.message);
      }
    }
    console.log('[backend] Initialization complete');
  })();
  return initPromise;
};

module.exports = { app, initBackend };
