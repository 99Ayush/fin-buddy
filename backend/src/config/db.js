'use strict';

const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using MONGODB_URI from environment.
 * Exits the process if the connection fails — no silent fallback.
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Recommended options for Mongoose 8+
      serverSelectionTimeoutMS: 10000, // fail fast in CI/dev
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
