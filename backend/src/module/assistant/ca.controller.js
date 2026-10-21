'use strict';

const CaRequest    = require('./caRequest.model');
const Conversation = require('./conversation.model');
const reportStore  = require('../../shared/reportStore');

const VALID_CATEGORIES = ['income_tax', 'filing', 'financial_documentation', 'salary_dispute', 'other'];

// ── CA Request endpoints ──────────────────────────────────────────────────────

/** POST /api/assistant/ca-requests — submit a CA help request */
async function submitCaRequest(req, res) {
  const { category, description, conversationId } = req.body;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  if (!description || typeof description !== 'string' || description.trim().length < 20) {
    return res.status(400).json({ error: 'description must be at least 20 characters.' });
  }
  if (description.length > 4000) {
    return res.status(400).json({ error: 'description too long (max 4000 chars).' });
  }

  // Validate conversationId belongs to user if provided
  let conversationRef = null;
  if (conversationId) {
    const conv = await Conversation.findOne({ _id: conversationId, userId: req.user.id }).catch(() => null);
    if (!conv) return res.status(400).json({ error: 'Invalid conversationId.' });
    conversationRef = conv._id;
  }

  try {
    const request = await CaRequest.create({
      userId:          req.user.id,
      category,
      description:     description.trim(),
      conversationRef,
      status:          'submitted',
    });

    return res.status(201).json({
      request,
      notice: 'Your request has been recorded. No CA has been contacted yet — this is a logged request awaiting a CA assignment system.',
    });
  } catch (err) {
    console.error('[assistant/submitCaRequest]', err.message);
    return res.status(500).json({ error: 'Could not submit CA request.' });
  }
}

/** GET /api/assistant/ca-requests — list current user's CA requests */
async function listCaRequests(req, res) {
  try {
    const requests = await CaRequest.find({ userId: req.user.id })
      .select('category description status createdAt updatedAt conversationRef')
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json({ requests });
  } catch (err) {
    console.error('[assistant/listCaRequests]', err.message);
    return res.status(500).json({ error: 'Could not load CA requests.' });
  }
}

// ── CA Summary Pack ───────────────────────────────────────────────────────────

/**
 * POST /api/assistant/ca-pack — generate a CA summary pack as JSON.
 * The frontend renders this into a printable/exportable view.
 * No PDF library is available; the frontend handles print-to-PDF via window.print().
 */
async function generateCaPack(req, res) {
  const { conversationId, includeDocumentRefs } = req.body;

  // Load conversation if provided (ownership enforced)
  let conversationSummary = null;
  if (conversationId) {
    const conv = await Conversation.findOne({ _id: conversationId, userId: req.user.id }).catch(() => null);
    if (!conv) return res.status(400).json({ error: 'Invalid conversationId.' });

    const userMessages = conv.messages
      .filter(m => m.role === 'user')
      .map(m => ({ text: m.text, at: m.createdAt }));
    const assistantMessages = conv.messages
      .filter(m => m.role === 'assistant')
      .map(m => ({ text: m.text, at: m.createdAt }));

    conversationSummary = {
      conversationId: conv._id,
      title: conv.title,
      startedAt: conv.createdAt,
      userMessages,
      assistantMessages,
    };
  }

  // Load document metadata from report store (no raw content — metadata only)
  let documentRefs = [];
  if (includeDocumentRefs) {
    try {
      const reports = await reportStore.listReports(String(req.user.id));
      documentRefs = reports.map(r => ({
        documentId:   r.documentId,
        documentType: r.documentType,
        fileName:     r.sourceFileName || null,
        uploadedAt:   r.savedAt,
      }));
    } catch {
      documentRefs = [];
    }
  }

  const pack = {
    generatedAt:        new Date().toISOString(),
    user: {
      id:    req.user.id,
      name:  req.user.name,
      email: req.user.email,
    },
    disclaimer: 'This summary pack is prepared for sharing with a Chartered Accountant. It contains only information you have explicitly selected. Figures come from your uploaded documents. This is not legal or financial advice.',
    conversation:   conversationSummary,
    documentRefs,
    openQuestions:  req.body.openQuestions || [],  // user-provided questions to ask the CA
    assumptions:    req.body.assumptions   || [],  // user-provided assumptions
  };

  return res.json({ pack });
}

module.exports = { submitCaRequest, listCaRequests, generateCaPack };
