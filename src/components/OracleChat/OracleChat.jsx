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
  <span className="oc-av-mark" aria-hidden="true">AV</span>
);

// ── Typing indicator ──────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div className="oc-typing">
    <span className="oc-typing-dot" />
    <span className="oc-typing-dot" />
    <span className="oc-typing-dot" />
  </div>
);

// ── Lightweight markdown renderer ────────────────────────────────────────────
// Handles: bold (**text**), numbered lists, bullet lists, inline code.
// No external dep — pure React.

function renderMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — spacing
    if (line.trim() === '') {
      elements.push(<div key={i} className="oc-md-spacer" />);
      i++;
      continue;
    }

    // Numbered list item: "1. text" or "1) text"
    const numMatch = line.match(/^(\d+)[.)]\s+(.*)/);
    if (numMatch) {
      const listItems = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\d+)[.)]\s+(.*)/);
        if (!m) break;
        listItems.push(<li key={i}>{renderInline(m[2])}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="oc-md-ol">{listItems}</ol>);
      continue;
    }

    // Bullet list item: "* text" or "- text" or "• text"
    const bulletMatch = line.match(/^[*\-•]\s+(.*)/);
    if (bulletMatch) {
      const listItems = [];
      while (i < lines.length) {
        const m = lines[i].match(/^[*\-•]\s+(.*)/);
        if (!m) break;
        listItems.push(<li key={i}>{renderInline(m[1])}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="oc-md-ul">{listItems}</ul>);
      continue;
    }

    // Normal paragraph
    elements.push(<p key={i} className="oc-md-p">{renderInline(line)}</p>);
    i++;
  }

  return elements;
}

// Inline: bold (**text**), inline code (`code`)
function renderInline(text) {
  const parts = [];
  // Split on **bold** and `code` markers
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(<code key={key++} className="oc-md-code">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      parts.push(<strong key={key++} className="oc-md-bold">{token.slice(2, -2)}</strong>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ── Message bubble ────────────────────────────────────────────────────────────

const OracleMessage = ({ role, content }) => (
  <div className={`oc-message oc-message--${role}`}>
    {role === 'assistant' && (
      <div className="oc-avatar">
        <OracleAvatarIcon />
      </div>
    )}
    <div className="oc-bubble">
      {role === 'assistant' ? renderMarkdown(content) : content}
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

  // Auto-expand textarea height to match content
  const autosizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';        // reset first so shrink works
    el.style.height = el.scrollHeight + 'px';
  };

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
    if (inputRef.current) inputRef.current.style.height = 'auto';
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
          onChange={e => { setInput(e.target.value); autosizeInput(); }}
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