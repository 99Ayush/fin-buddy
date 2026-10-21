/**
 * Ask & CA Help — full implementation
 * Tabs: Chat | CA Requests | CA Summary Pack
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  createConversation, listConversations, getConversation,
  deleteConversation, sendMessage,
  submitCaRequest, listCaRequests,
} from '../services/assistantApi';

// ── Constants ─────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'What is the difference between Old and New tax regime?',
  'How does Section 80C work?',
  'What should I check in an offer letter?',
  'How is monthly in-hand salary calculated from CTC?',
];

const CA_CATEGORIES = [
  { value: 'income_tax',             label: 'Income Tax' },
  { value: 'filing',                 label: 'Tax Filing' },
  { value: 'financial_documentation', label: 'Financial Documentation' },
  { value: 'salary_dispute',         label: 'Salary Dispute' },
  { value: 'other',                  label: 'Other' },
];

const STATUS_COLOR = { submitted: '#7c3aed', pending: '#d97706', resolved: '#059669' };

// ── Speech helpers ────────────────────────────────────────────────────────────

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

const speechSupported    = !!SpeechRecognitionAPI;
const synthesisSupported = typeof window !== 'undefined' && !!window.speechSynthesis;

function speak(text, lang = 'en-IN') {
  if (!synthesisSupported) return;
  window.speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(text.slice(0, 500)); // limit length
  utt.lang   = lang;
  utt.rate   = 0.95;
  window.speechSynthesis.speak(utt);
}

// ── Reusable micro-components ─────────────────────────────────────────────────

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 18px',
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      transition: 'all 0.15s',
      flexShrink: 0,
    }}
  >
    {label}
  </button>
);

const Spinner = () => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '6px 0' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: '50%',
        background: 'var(--primary)',
        animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
      }} />
    ))}
  </div>
);

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel() {
  const { user } = useAuth();

  const [convList,     setConvList]     = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [sending,      setSending]      = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [listenActive, setListenActive] = useState(false);
  const [speakingId,   setSpeakingId]   = useState(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);

  const endRef     = useRef(null);
  const inputRef   = useRef(null);
  const recogRef   = useRef(null);

  // Load conversation list
  const loadConvList = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const { conversations } = await listConversations();
      setConvList(conversations || []);
    } catch {
      setConvList([]);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { loadConvList(); }, [loadConvList]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    setLoadingMsgs(true);
    getConversation(activeConvId)
      .then(({ conversation }) => setMessages(conversation.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [activeConvId]);

  // Auto-scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  // Start new conversation
  const startNew = async () => {
    try {
      const { conversation } = await createConversation('New conversation');
      setConvList(prev => [conversation, ...prev]);
      setActiveConvId(conversation._id);
      setMessages([]);
      inputRef.current?.focus();
    } catch { /* ignore */ }
  };

  // Send message
  const handleSend = async (text = input) => {
    const msg = (text || '').trim();
    if (!msg || sending || !activeConvId) return;
    setInput('');
    setSending(true);

    // Optimistic UI
    setMessages(prev => [...prev, { role: 'user', text: msg, _id: 'opt-user', createdAt: new Date() }]);

    try {
      const res = await sendMessage(activeConvId, msg);
      setAiConfigured(res.aiConfigured !== false);
      setMessages(prev => {
        const without = prev.filter(m => m._id !== 'opt-user');
        return [...without, res.userMessage, res.assistantMessage];
      });
      // Update conversation title in sidebar
      setConvList(prev => prev.map(c =>
        c._id === activeConvId ? { ...c, title: res.userMessage?.text?.slice(0, 50) || c.title } : c
      ));
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => m._id !== 'opt-user'),
        { role: 'user', text: msg, createdAt: new Date() },
        { role: 'assistant', text: `⚠️ ${err.message || 'Failed to get a response. Please try again.'}`, createdAt: new Date() },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Voice input
  const toggleListen = () => {
    if (!speechSupported) return;
    if (listenActive) {
      recogRef.current?.stop();
      setListenActive(false);
      return;
    }
    const recog           = new SpeechRecognitionAPI();
    recog.lang            = 'en-IN';
    recog.interimResults  = false;
    recog.maxAlternatives = 1;
    recog.onresult  = e => { setInput(e.results[0][0].transcript); setListenActive(false); };
    recog.onerror   = () => setListenActive(false);
    recog.onend     = () => setListenActive(false);
    recogRef.current = recog;
    recog.start();
    setListenActive(true);
  };

  // Read-aloud
  const readAloud = (id, text) => {
    if (speakingId === id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
    speak(text);
    setSpeakingId(id);
    // Clear after ~10s
    setTimeout(() => setSpeakingId(null), 10000);
  };

  // Delete conversation
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await deleteConversation(id).catch(() => {});
    setConvList(prev => prev.filter(c => c._id !== id));
    if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)', minHeight: 500, gap: 0, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#fff' }}>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <div style={{ width: 250, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)', flexShrink: 0 }}>
          <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <button
              onClick={startNew}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              + New Chat
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
            {loadingConvs ? (
              <p style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
            ) : convList.length === 0 ? (
              <p style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>No conversations yet.</p>
            ) : convList.map(c => (
              <div
                key={c._id}
                onClick={() => setActiveConvId(c._id)}
                style={{
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: activeConvId === c._id ? '#e0e7ff' : 'transparent',
                  marginBottom: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 12.5, color: 'var(--text-main)', fontWeight: activeConvId === c._id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {c.title || 'Untitled'}
                </span>
                <button onClick={e => handleDelete(c._id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, flexShrink: 0, padding: 2 }} title="Delete">🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }} title="Toggle sidebar">☰</button>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)', flex: 1 }}>
            {activeConvId ? (convList.find(c => c._id === activeConvId)?.title || 'Chat') : 'Ask & CA Help'}
          </span>
          {!aiConfigured && (
            <span style={{ fontSize: 11, padding: '3px 10px', background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: 999, fontWeight: 600 }}>
              AI not configured
            </span>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!activeConvId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <div style={{ fontSize: 52 }}>🤖</div>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 380 }}>
                Ask anything about personal finance, salary, tax, or your uploaded documents.
              </p>
              <button onClick={startNew} style={{ padding: '10px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Start a conversation
              </button>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 480 }}>
                {QUICK_PROMPTS.map(q => (
                  <button key={q} onClick={async () => { const { conversation } = await createConversation(q.slice(0, 60)); setConvList(prev => [conversation, ...prev]); setActiveConvId(conversation._id); setMessages([]); setTimeout(() => handleSend(q), 300); }}
                    style={{ padding: '7px 14px', background: '#f5f3ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', fontWeight: 500 }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : loadingMsgs ? (
            <div style={{ textAlign: 'center', paddingTop: 40, color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            <>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                  Send a message to start.
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
                    {QUICK_PROMPTS.map(q => (
                      <button key={q} onClick={() => handleSend(q)}
                        style={{ padding: '7px 14px', background: '#f5f3ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={msg._id || i} style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{msg.role === 'user' ? '👤' : '🤖'}</div>
                  <div style={{ maxWidth: '75%' }}>
                    <div style={{
                      padding: '10px 14px',
                      background: msg.role === 'user' ? 'var(--primary)' : '#f8fafc',
                      color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: 14,
                      lineHeight: 1.65,
                      border: msg.role === 'assistant' ? '1px solid var(--border-subtle)' : 'none',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {msg.role === 'assistant' && synthesisSupported && (
                        <button onClick={() => readAloud(msg._id || i, msg.text)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}
                          title={speakingId === (msg._id || i) ? 'Stop reading' : 'Read aloud'}>
                          {speakingId === (msg._id || i) ? '⏹' : '🔊'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 22 }}>🤖</div>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '16px 16px 16px 4px' }}>
                    <Spinner />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        {activeConvId && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, alignItems: 'flex-end', background: '#fff' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask about your finances… (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{
                flex: 1, padding: '10px 14px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                fontSize: 14, resize: 'none', fontFamily: 'var(--font-sans)', outline: 'none', maxHeight: 120, overflowY: 'auto',
              }}
            />
            {speechSupported && (
              <button onClick={toggleListen} title={listenActive ? 'Stop listening' : 'Voice input'}
                style={{ padding: '10px 12px', background: listenActive ? '#fef2f2' : 'var(--bg-subtle)', color: listenActive ? '#dc2626' : 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 16 }}>
                {listenActive ? '⏹' : '🎙️'}
              </button>
            )}
            <button
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: sending || !input.trim() ? 0.5 : 1 }}
            >
              Send
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ padding: '6px 16px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          🛡️ Educational only · Not SEBI-registered · Not financial or legal advice · AI may be incorrect — verify with a CA
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── CA Requests Panel ─────────────────────────────────────────────────────────

function CaPanel({ activeConvId }) {
  const [form,     setForm]     = useState({ category: 'income_tax', description: '', conversationId: '' });
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice,   setNotice]   = useState('');
  const [error,    setError]    = useState('');

  useEffect(() => {
    listCaRequests()
      .then(({ requests: r }) => setRequests(r || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.conversationId) delete payload.conversationId;
      const { request, notice: n } = await submitCaRequest(payload);
      setRequests(prev => [request, ...prev]);
      setNotice(n);
      setForm({ category: 'income_tax', description: '', conversationId: '' });
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

      {/* Submit form */}
      <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-xs)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>Request CA Help</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
          Describe your issue. Your request will be recorded. No CA has been assigned yet.
        </p>

        {notice && (
          <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#065f46', marginBottom: 16 }}>
            ✅ {notice}
          </div>
        )}
        {error && (
          <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#be123c', marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
            Category
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              {CA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>

          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
            Describe your issue <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(min 20 chars)</span>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={5} required maxLength={4000}
              placeholder="Describe what you need help with…"
              style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
            />
          </label>

          {activeConvId && (
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox"
                checked={form.conversationId === activeConvId}
                onChange={e => setForm(f => ({ ...f, conversationId: e.target.checked ? activeConvId : '' }))}
              />
              Attach current conversation as context
            </label>
          )}

          <button type="submit" disabled={submitting || form.description.trim().length < 20}
            style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Request list */}
      <div>
        <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>Your Requests</h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
        ) : requests.length === 0 ? (
          <div style={{ padding: 24, background: 'var(--bg-subtle)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No CA requests yet.
          </div>
        ) : requests.map(r => (
          <div key={r._id} style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 12, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[r.status] || '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {r.status}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {r.category.replace('_', ' ')}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-main)', lineHeight: 1.55 }}>
              {r.description.slice(0, 200)}{r.description.length > 200 ? '…' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CA Summary Pack Panel ─────────────────────────────────────────────────────

function PackPanel({ conversations, activeConvId }) {
  const [selectedConvId, setSelectedConvId] = useState(activeConvId || '');
  const [includeDocs,    setIncludeDocs]    = useState(true);
  const [openQuestions,  setOpenQuestions]  = useState('');
  const [assumptions,    setAssumptions]    = useState('');
  const [pack,           setPack]           = useState(null);
  const [generating,     setGenerating]     = useState(false);
  const [error,          setError]          = useState('');

  const generate = async () => {
    setError('');
    setGenerating(true);
    try {
      const { pack: p } = await generateCaPack({
        conversationId:  selectedConvId || undefined,
        includeDocumentRefs: includeDocs,
        openQuestions: openQuestions.split('\n').map(s => s.trim()).filter(Boolean),
        assumptions:   assumptions.split('\n').map(s => s.trim()).filter(Boolean),
      });
      setPack(p);
    } catch (err) {
      setError(err.message || 'Failed to generate pack.');
    } finally {
      setGenerating(false);
    }
  };

  const printPack = () => window.print();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
      {/* Config */}
      <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-xs)' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>Generate CA Summary Pack</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
          Create an organized summary for sharing with your CA. Preview before exporting.
        </p>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#be123c', marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Include conversation
            <select value={selectedConvId} onChange={e => setSelectedConvId(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              <option value="">— None —</option>
              {conversations.map(c => <option key={c._id} value={c._id}>{c.title || 'Untitled'}</option>)}
            </select>
          </label>

          <label style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={includeDocs} onChange={e => setIncludeDocs(e.target.checked)} />
            Include uploaded document references
          </label>

          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Open questions for CA <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(one per line)</span>
            <textarea value={openQuestions} onChange={e => setOpenQuestions(e.target.value)} rows={3}
              placeholder="What questions do you want the CA to answer?"
              style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
            />
          </label>

          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Assumptions you are making <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(one per line)</span>
            <textarea value={assumptions} onChange={e => setAssumptions(e.target.value)} rows={3}
              placeholder="e.g. I'm in the 30% tax bracket"
              style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
            />
          </label>

          <button onClick={generate} disabled={generating}
            style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: generating ? 0.6 : 1 }}>
            {generating ? 'Generating…' : '📋 Generate Preview'}
          </button>
        </div>
      </div>

      {/* Pack preview */}
      {pack && (
        <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-xs)' }} id="ca-pack-preview">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Pack Preview</h3>
            <button onClick={printPack} style={{ padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              🖨️ Export / Print PDF
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Generated {new Date(pack.generatedAt).toLocaleString('en-IN')}</div>

          <div style={{ padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#92400e', marginBottom: 16 }}>
            ⚠️ {pack.disclaimer}
          </div>

          <div style={{ fontSize: 13, marginBottom: 12 }}>
            <strong>User:</strong> {pack.user.name} &lt;{pack.user.email}&gt;
          </div>

          {pack.conversation && (
            <details open style={{ marginBottom: 14 }}>
              <summary style={{ fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>Conversation: {pack.conversation.title}</summary>
              <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 12.5, lineHeight: 1.6 }}>
                {pack.conversation.userMessages.map((m, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>You: </span>{m.text}
                  </div>
                ))}
              </div>
            </details>
          )}

          {pack.documentRefs.length > 0 && (
            <details style={{ marginBottom: 14 }}>
              <summary style={{ fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>Documents ({pack.documentRefs.length})</summary>
              {pack.documentRefs.map(d => (
                <div key={d.documentId} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  📁 {d.documentType} {d.fileName ? `— ${d.fileName}` : ''} <span style={{ color: 'var(--text-muted)' }}>({new Date(d.uploadedAt).toLocaleDateString('en-IN')})</span>
                </div>
              ))}
            </details>
          )}

          {pack.openQuestions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 8px' }}>Open Questions for CA</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {pack.openQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}

          {pack.assumptions.length > 0 && (
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 8px' }}>My Assumptions</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {pack.assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AssistantPage() {
  const [tab,          setTab]     = useState('chat');
  const [convList,     setConvList] = useState([]);
  const [activeConvId, setActive]  = useState(null);

  // Shared conv list across tabs
  useEffect(() => {
    listConversations().then(({ conversations }) => setConvList(conversations || [])).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1100, margin: '0 auto', padding: '24px 24px 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
          🤖 Ask & CA Help
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
          AI financial chat · CA escalation · Summary pack export
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-subtle)', padding: 4, borderRadius: 'var(--radius-md)', marginBottom: 20, width: 'fit-content' }}>
        <Tab label="💬 Chat"        active={tab === 'chat'} onClick={() => setTab('chat')} />
        <Tab label="📞 CA Requests" active={tab === 'ca'}   onClick={() => setTab('ca')} />
      </div>

      {tab === 'chat' && <ChatPanel />}
      {tab === 'ca'   && <CaPanel activeConvId={activeConvId} />}
    </div>
  );
}