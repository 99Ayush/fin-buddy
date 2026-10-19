/**
 * Fin-Buddy Backend - Main Application Entry Point
 * Mounts module routers. P1 owns ONLY documents and offers routes.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import module routers (P1 owned)
const documentsModule = require('./module/documents');
const offersModule = require('./module/offers');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet({
  contentSecurityPolicy: false, // Allow frontend to load
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (sanitized)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Sanitized log - no body, no PII
    console.log(`[REQ] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ============================================
// P1 MODULE ROUTES (ONLY these two)
// ============================================

// Documents module - Page 3
app.use('/api/documents', documentsModule.router);

// Offers module - Page 4
app.use('/api/offers', offersModule.router);

// ============================================
// PLACEHOLDER ROUTES FOR OTHER MODULES (P2, P3)
// These are mounted by respective owners - P1 does NOT modify
// ============================================

// P2: Salary & Tax module
app.use('/api/salarytax', require('./module/salarytax').router);

// P2: Money Plan module
app.use('/api/moneyplan', require('./module/moneyplan').router);

// P3: Home/Dashboard module
// app.use('/api/home', require('./module/home').router);

// P3: Assistant module
// app.use('/api/assistant', require('./module/assistant').router);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message, err.stack);

  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'File upload error',
      details: err.message,
      code: err.code,
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.message,
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

module.exports = app;

// Keep the app importable for Supertest while making `npm start` useful.
if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Fin-Buddy API listening on http://localhost:${port}`));
}
