'use strict';

const mongoose    = require('mongoose');
const Conversation = require('./conversation.model');
const ai           = require('./ai.provider');
const reportStore  = require('../../shared/reportStore');

const MAX_MESSAGE_LEN = 4000;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build minimal user context from report store for the AI (no raw doc content). */
async function buildUserContext(userId) {
  try {
    const reports = await reportStore.listReports(userId);
    return {
      documentCount: reports.length,
      docTypes: [...new Set(reports.map(r => r.documentType).filter(Boolean))],
    };
  } catch {
    return { documentCount: 0, docTypes: [] };
  }
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** POST /api/assistant/conversations — create a new conversation */
async function createConversation(req, res) {
  try {
    const conv = await Conversation.create({
      userId: req.user.id,
      title: req.body.title?.slice(0, 200) || 'New conversation',
      messages: [],
    });
    return res.status(201).json({ conversation: conv });
  } catch (err) {
    console.error('[assistant/createConversation]', err.message);
    return res.status(500).json({ error: 'Could not create conversation.' });
  }
}

/** GET /api/assistant/conversations — list all conversations for the user */
async function listConversations(req, res) {
  try {
    const convs = await Conversation.find({ userId: req.user.id, archivedAt: null })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);
    return res.json({ conversations: convs });
  } catch (err) {
    console.error('[assistant/listConversations]', err.message);
    return res.status(500).json({ error: 'Could not list conversations.' });
  }
}

/** GET /api/assistant/conversations/:id — get a single conversation with messages */
async function getConversation(req, res) {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    return res.json({ conversation: conv });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid conversation ID.' });
    console.error('[assistant/getConversation]', err.message);
    return res.status(500).json({ error: 'Could not load conversation.' });
  }
}

/** DELETE /api/assistant/conversations/:id — archive (soft-delete) a conversation */
async function deleteConversation(req, res) {
  try {
    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { archivedAt: new Date() },
      { returnDocument: 'after' }
    );
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[assistant/deleteConversation]', err.message);
    return res.status(500).json({ error: 'Could not delete conversation.' });
  }
}

/** POST /api/assistant/conversations/:id/messages — send a message, get AI reply */
async function sendMessage(req, res) {
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Message text is required.' });
  if (text.trim().length === 0)          return res.status(400).json({ error: 'Message cannot be empty.' });
  if (text.length > MAX_MESSAGE_LEN)     return res.status(400).json({ error: `Message too long (max ${MAX_MESSAGE_LEN} chars).` });

  try {
    const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

    // Save user message
    const userMsg = { role: 'user', text: text.trim() };
    conv.messages.push(userMsg);

    // Auto-title from first user message
    if (conv.messages.filter(m => m.role === 'user').length === 1) {
      conv.title = text.trim().slice(0, 80) + (text.length > 80 ? '…' : '');
    }

    // Build context from report store
    const userContext = await buildUserContext(String(req.user.id));

    // Get AI response
    const history = conv.messages.slice(-20).map(m => ({ role: m.role, text: m.text }));
    const aiResp  = await ai.ask(text.trim(), history.slice(0, -1), userContext);

    // Save assistant message
    const assistantMsg = {
      role: 'assistant',
      text: aiResp.text,
      citations: aiResp.citations || [],
    };
    conv.messages.push(assistantMsg);
    await conv.save();

    return res.json({
      userMessage:      conv.messages[conv.messages.length - 2],
      assistantMessage: conv.messages[conv.messages.length - 1],
      aiConfigured:     aiResp.configured,
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid conversation ID.' });
    console.error('[assistant/sendMessage]', err.message);
    return res.status(500).json({ error: 'Could not process message.' });
  }
}

module.exports = { createConversation, listConversations, getConversation, deleteConversation, sendMessage };
