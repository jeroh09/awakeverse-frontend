// src/components/OracleChat/OracleChat.jsx
// AwakeVerse Oracle — platform assistant chat panel
// Replaces the left panel welcome/recent section when oracle mode is active.
// Design matches ChatWindow dark theme exactly.
// Defensive-first: safe fallbacks, no external deps beyond React.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './OracleChat.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OracleAvatarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <filter id="oc-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.7"/>
      </filter>
    </defs>
    <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2z"
      stroke="#818cf8" strokeWidth="1.6" strokeLinejoin="round"
      fill="rgba(99,102,241,0.15)" filter="url(#oc-glow)"/>
  </svg>
);

// ── Typing indicator ──────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div className="oc-typing">
    <span className="oc-typing-dot" />
    <span className="oc-typing-dot" />
    <span className="oc-typing-dot" />
  </div>
);

// ── Message bubble ────────────────────────────────────────────────────────────

const OracleMessage = ({ role, content }) => (
  <div className={`oc-message oc-message--${role}`}>
    {role === 'assistant' && (
      <div className="oc-avatar">
        <OracleAvatarIcon />
      </div>
    )}
    <div className="oc-bubble">
      {content}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const GREETING = "I'm the AwakeVerse Oracle. Ask me anything about the platform — characters, Dialogue, the Verse Engine, or getting started.";

export default function OracleChat({ onBack, userName = null }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const abortRef    = useRef(null);   // for future streaming upgrade

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);

    // Optimistically add user message
    const userMsg      = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      // Send full conversation history — lets Oracle maintain context
      const res = await fetch(`${API_BASE}/api/oracle/chat`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: nextMessages.map(m => ({
            role:    m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();

      if (data.status !== 'success' || !data.reply) {
        throw new Error(data.error || 'Empty reply from Oracle');
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply }
      ]);

    } catch (e) {
      console.error('Oracle chat error:', e);
      setError(e.message || 'The Oracle is unavailable right now. Please try again.');
      // Remove the optimistic user message on failure
      setMessages(messages);
    } finally {
      setLoading(false);
      // Re-focus input after response
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = () => {
    setMessages([{ role: 'assistant', content: GREETING }]);
    setError(null);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="oc-shell">

      {/* ── Header ── */}
      <div className="oc-header">
        <button className="oc-back-btn" onClick={onBack} aria-label="Back to launcher">
          <BackIcon />
          <span>Back</span>
        </button>

        <div className="oc-header-center">
          <div className="oc-header-icon">
            <OracleAvatarIcon />
          </div>
          <div>
            <div className="oc-header-title">Oracle</div>
            <div className="oc-header-sub">AwakeVerse guide</div>
          </div>
        </div>

        <button className="oc-clear-btn" onClick={handleClear} aria-label="Clear conversation"
          title="Clear conversation">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Message thread ── */}
      <div className="oc-thread">
        {messages.map((msg, i) => (
          <OracleMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {loading && (
          <div className="oc-message oc-message--assistant">
            <div className="oc-avatar"><OracleAvatarIcon /></div>
            <div className="oc-bubble oc-bubble--typing">
              <TypingIndicator />
            </div>
          </div>
        )}

        {error && (
          <div className="oc-error-banner" role="alert">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="oc-input-area">
        <textarea
          ref={inputRef}
          className="oc-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the Oracle…"
          rows={1}
          disabled={loading}
          aria-label="Message the Oracle"
        />
        <button
          className="oc-send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>

    </div>
  );
}