'use strict';
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  text:      { type: String, required: true, maxlength: 8000 },
  citations: [{ label: String, source: String }], // numbered references
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, default: 'New conversation', maxlength: 200 },
  messages:  [messageSchema],
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
