'use strict';

// Load env vars FIRST, before any other module reads process.env
require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv(); // exits loudly if required vars are missing

const { connectDB }  = require('./config/db');
const { authRouter } = require('./module/auth');

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

/* ── Middleware ───────────────────────────────────────────────── */

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // allow cookies to be sent cross-origin
}));

app.use(express.json());
app.use(cookieParser());

/* ── Routes ───────────────────────────────────────────────────── */

// Health check — does not require auth or DB
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// Auth module
app.use('/api/auth', authRouter);

// 404 handler for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

/* ── Start server after DB connects ──────────────────────────── */

const PORT = Number(process.env.PORT) || 4000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀  Fin-Buddy API running on http://localhost:${PORT}`);
  });
})();
