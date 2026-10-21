'use strict';

/**
 * Assistant Module — Public Interface (P3 Owned)
 * Routes: /api/assistant/*
 */

const express  = require('express');
const router   = express.Router();
const { requireAuth } = require('../auth');
const chat     = require('./chat.controller');
const ca       = require('./ca.controller');
const { CONFIGURED } = require('./ai.provider');

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) =>
  res.json({ status: 'ok', module: 'assistant', aiConfigured: CONFIGURED })
);

// ── Conversation routes ───────────────────────────────────────────────────────
router.post  ('/conversations',           requireAuth, chat.createConversation);
router.get   ('/conversations',           requireAuth, chat.listConversations);
router.get   ('/conversations/:id',       requireAuth, chat.getConversation);
router.delete('/conversations/:id',       requireAuth, chat.deleteConversation);
router.post  ('/conversations/:id/messages', requireAuth, chat.sendMessage);

// ── CA routes ─────────────────────────────────────────────────────────────────
router.post('/ca-requests', requireAuth, ca.submitCaRequest);
router.get ('/ca-requests', requireAuth, ca.listCaRequests);
router.post('/ca-pack',     requireAuth, ca.generateCaPack);

module.exports = { router, basePath: '/assistant' };