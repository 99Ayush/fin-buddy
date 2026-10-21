/**
 * assistantApi.js — all HTTP calls for the Ask & CA Help module.
 */
import { api } from '../../../services/api';

// ── Conversations ─────────────────────────────────────────────────────────────
export const createConversation = (title)  => api.post('/assistant/conversations', { title });
export const listConversations  = ()       => api.get('/assistant/conversations');
export const getConversation    = (id)     => api.get(`/assistant/conversations/${id}`);
export const deleteConversation = (id)     => api.delete(`/assistant/conversations/${id}`);
export const sendMessage        = (id, text) => api.post(`/assistant/conversations/${id}/messages`, { text });

// ── CA Help ───────────────────────────────────────────────────────────────────
export const submitCaRequest = (data)  => api.post('/assistant/ca-requests', data);
export const listCaRequests  = ()      => api.get('/assistant/ca-requests');
export const generateCaPack  = (data)  => api.post('/assistant/ca-pack', data);
