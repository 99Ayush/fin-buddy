'use strict';

/**
 * Validates required environment variables at startup.
 * Throws with a clear message so the server never silently starts misconfigured.
 */

const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
];

const OPTIONAL_WITH_DEFAULTS = {
  PORT: '4000',
  NODE_ENV: 'development',
  JWT_EXPIRES_IN: '7d',
  FRONTEND_URL: 'http://localhost:5173',
};

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n❌  Missing required environment variables:\n');
    missing.forEach((key) => console.error(`   • ${key}`));
    console.error('\nCopy backend/.env.example → backend/.env and fill in real values.\n');
    process.exit(1);
  }

  // Apply defaults for optional vars
  Object.entries(OPTIONAL_WITH_DEFAULTS).forEach(([key, value]) => {
    if (!process.env[key]) process.env[key] = value;
  });
}

module.exports = { validateEnv };
