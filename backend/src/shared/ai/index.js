/**
 * Shared AI Services - Public Exports
 * Unified interface for all AI/privacy services used by Documents and Offers modules.
 */

const mask = require('./mask');
const ocr = require('./ocr');
const llm = require('./llm');
const explain = require('./explain');

module.exports = {
  // PII Masking
  maskText: mask.maskText,
  unmaskText: mask.unmaskText,
  getMaskMap: mask.getMaskMap,
  clearMaskMap: mask.clearMaskMap,

  // OCR Pipeline
  extractTextFromPdf: ocr.extractTextFromPdf,
  extractTextFromImage: ocr.extractTextFromImage,
  processDocument: ocr.processDocument,

  // LLM Adapter
  callLlm: llm.callLlm,
  callLlmStructured: llm.callLlmStructured,
  getLlmCacheStats: llm.getCacheStats,
  clearLlmCache: llm.clearCache,

  // Plain-Language Explainer
  explainClause: explain.explainClause,
  explainTerm: explain.explainTerm,
  setExplanationDepth: explain.setDepth,
  setExplanationLanguage: explain.setLanguage,
};