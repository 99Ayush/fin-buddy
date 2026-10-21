'use strict';
const mongoose = require('mongoose');

const caRequestSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category:    {
    type: String,
    enum: ['income_tax', 'filing', 'financial_documentation', 'salary_dispute', 'other'],
    required: true,
  },
  description: { type: String, required: true, maxlength: 4000 },
  status:      { type: String, enum: ['submitted', 'pending', 'resolved'], default: 'submitted' },
  // Conversation context (optional, user-selected)
  conversationRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
  // No CA reply portal in this task — stored for future CA reviewer workspace
  resolvedAt:  { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('CaRequest', caRequestSchema);
