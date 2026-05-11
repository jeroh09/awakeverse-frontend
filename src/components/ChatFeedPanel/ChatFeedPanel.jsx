// src/components/ChatFeedPanel/ChatFeedPanel.jsx
//
// Collapsible feed panel — renders inside chat-panel-container as a
// flex sibling of .chat-window. Delegates all feed logic to FeedTab.
//
// Props:
//   isOpen          bool   — controlled by ChatWindow
//   onToggle        fn     — called when collapse button clicked
//   isAuthenticated bool   — passed through to FeedTab
//   onCharacterClick fn    — passed through to FeedTab PostCards

import React from 'react';
import FeedTab from '../MarketHub/FeedTab';
import './ChatFeedPanel.css';

// ── Icons (inline SVG — no library dependency) ─────────────────────────

const IconCollapseRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </svg>
);

const IconExpandLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="11 17 6 12 11 7" />
    <polyline points="18 17 13 12 18 7" />
  </svg>
);

const IconTrending = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ── Component ───────────────────────────────────────────────────────────

export default function ChatFeedPanel({
  isOpen = true,
  onToggle,
  isAuthenticated = false,
  onCharacterClick,
}) {
  return (
    <aside
      className={`chat-feed-panel${isOpen ? '' : ' cfp-collapsed'}`}
      aria-label="Live feed panel"
    >
      {/* ── Header: always visible ──────────────────────────────────── */}
      <div className="cfp-header">
        {isOpen && (
          <span className="cfp-title" aria-hidden="true">Live feed</span>
        )}
        <button
          className="cfp-toggle"
          onClick={onToggle}
          title={isOpen ? 'Collapse feed' : 'Expand feed'}
          aria-label={isOpen ? 'Collapse feed' : 'Expand feed'}
        >
          {isOpen ? <IconCollapseRight /> : <IconExpandLeft />}
        </button>
      </div>

      {/* ── Feed body: FeedTab owns all logic ───────────────────────── */}
      {isOpen && (
        <div className="cfp-body">
          <FeedTab
            isAuthenticated={isAuthenticated}
            topics={[]}
            onCharacterClick={onCharacterClick}
          />
        </div>
      )}

      {/* ── Collapsed strip: icon hints while closed ────────────────── */}
      {!isOpen && (
        <div className="cfp-strip" aria-hidden="true">
          <div className="cfp-strip-icon" title="Trending">
            <IconTrending />
          </div>
          <div className="cfp-strip-icon" title="Latest">
            <IconClock />
          </div>
        </div>
      )}
    </aside>
  );
}