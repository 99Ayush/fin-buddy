import React, { useState, useRef } from 'react';
import './AssistantPage.css';

const MOCK_MESSAGES = [
  {
    role: 'assistant',
    text: 'Hello! I\'m your AI financial assistant. I can answer questions about your uploaded documents — payslips, Form 16, loan letters, and more. How can I help you today?',
  },
];

const QUICK_PROMPTS = [
  'What is my monthly in-hand salary?',
  'How much tax did I pay this year?',
  'Am I fully utilising my 80C deductions?',
  'Explain my Form 16 Part B.',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const endRef = useRef(null);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text };
    const botMsg = {
      role: 'assistant',
      text: `Based on your uploaded documents: your query about "${text}" is being analyzed. In the full version, this response would reference specific clauses and numbers from your stored reports.`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
  };

  return (
    <div className="assistant-page">
      {/* Header */}
      <div className="assistant-header">
        <div>
          <h2>Ask &amp; CA Help</h2>
          <p>AI answers grounded exclusively in your uploaded documents.</p>
        </div>
        <button
          id="btn-escalate-ca"
          className="escalate-btn"
          onClick={() => setShowEscalate(true)}
        >
          📞 Escalate to CA
        </button>
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'assistant' && (
                <span className="chat-avatar">🤖</span>
              )}
              <div className="chat-text">{msg.text}</div>
              {msg.role === 'user' && (
                <span className="chat-avatar user-avatar">👤</span>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant">
              <span className="chat-avatar">🤖</span>
              <div className="chat-text typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick Prompts */}
        <div className="quick-prompts">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              className="quick-chip"
              onClick={() => sendMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="chat-input-row">
          <input
            id="chat-input"
            type="text"
            className="chat-input"
            placeholder="Ask about your payslip, Form 16, tax..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          />
          <button
            id="btn-send-message"
            className="send-btn"
            onClick={() => sendMessage(input)}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>

      {/* Escalate Modal */}
      {showEscalate && (
        <div className="modal-overlay" onClick={() => setShowEscalate(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Escalate to a Human CA</h3>
            <p>
              A verified Chartered Accountant will review your case. A masked
              summary pack (with PII removed) will be shared with them.
            </p>
            <div className="modal-actions">
              <button id="btn-confirm-escalate" className="btn-primary-sm">
                ✅ Confirm Escalation
              </button>
              <button
                id="btn-cancel-escalate"
                className="btn-ghost"
                onClick={() => setShowEscalate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
