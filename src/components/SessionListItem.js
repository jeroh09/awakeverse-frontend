// src/components/SessionListItem.js
import React, { useState, useRef, useEffect } from 'react';
import './SessionListItem.css';

export default function SessionListItem({ session, onClick, onArchive, onClear }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e) {
      if (menuOpen && containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, [menuOpen]);

  // Prepare timestamp & snippet
  const msgs = Array.isArray(session.messages) ? session.messages : [];
  const last = msgs[msgs.length - 1];
  const timestamp = last?.ts || session.started;
  const time = new Date(timestamp).toLocaleString();
  const snippet = last?.text
    ? last.text.length > 30
      ? last.text.slice(0, 30) + '…'
      : last.text
    : 'New conversation';

  return (
    <li className="session-item" onClick={() => onClick(session.id)} ref={containerRef}>
      <div className="session-meta">
        <span className="session-time">{time}</span>
        <p className="session-snippet">{snippet}</p>
      </div>

      {/* Ellipsis actions button */}
      <button
        className="session-actions-button"
        onClick={e => {
          e.stopPropagation();
          setMenuOpen(open => !open);
        }}
        aria-label="Session actions"
      >
        ...
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <ul className="session-actions-dropdown">
          <li
            onClick={e => {
              e.stopPropagation();
              onClick(session.id);
              setMenuOpen(false);
            }}
          >
            Open
          </li>
          <li
            onClick={e => {
              e.stopPropagation();
              onArchive(session.id);
              setMenuOpen(false);
            }}
          >
            Archive
          </li>
          <li
            onClick={e => {
              e.stopPropagation();
              onClear(session.id);
              setMenuOpen(false);
            }}
          >
            Clear Chat
          </li>
        </ul>
      )}
    </li>
  );
}
