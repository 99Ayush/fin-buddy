'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be 100 characters or fewer'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // normalise before save
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* ── Instance helpers ─────────────────────────────────────────── */

/** Verify a plaintext password against the stored hash. */
userSchema.methods.verifyPassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

/** Return a safe public representation (no passwordHash). */
userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    createdAt: this.createdAt,
  };
};

/* ── Static helpers ───────────────────────────────────────────── */

/** Hash a plaintext password. */
userSchema.statics.hashPassword = async function (plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
