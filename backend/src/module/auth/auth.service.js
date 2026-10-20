'use strict';

const jwt  = require('jsonwebtoken');
const User = require('./User.model');

/**
 * Register a new user.
 * Throws a structured error if email is already taken.
 */
async function register({ name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });
  return user;
}

/**
 * Authenticate a user by email + password.
 * Throws a generic 401 regardless of whether email or password was wrong
 * (prevents user-enumeration).
 */
async function login({ email, password }) {
  // Must explicitly select passwordHash since it is select:false in schema
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

  const isValid = user && (await user.verifyPassword(password));
  if (!isValid) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('This account has been deactivated.');
    err.statusCode = 403;
    throw err;
  }

  return user;
}

/**
 * Sign a JWT for a given user id.
 */
function signToken(userId) {
  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Verify a JWT string. Returns the decoded payload or throws.
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { register, login, signToken, verifyToken };
