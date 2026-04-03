// src/components/SupportWidget/SupportWidget.jsx
// Floating support ticket widget — mounts in App.js, visible on all gated routes.
// Uses useUser() only — no AppViewProvider dependency.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import './SupportWidget.css';

const API = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const CATEGORIES = [
  { value: 'billing',          label: 'Billing & subscription' },
  { value: 'bug',              label: 'Bug report' },
  { value: 'feature_request',  label: 'Feature request' },
  { value: 'account',          label: 'Account issue' },
  { value: 'content',          label: 'Content issue' },
  { value: 'other',            label: 'Other' },
];

const MODES = [
  { value: 'chat',      label: 'Chat' },
  { value: 'dialogue',  label: 'Dialogue' },
  { value: 'story',     label: 'Story' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'general',   label: 'General' },
];

// CSRF helper — reads av_csrf cookie
const getCsrfToken = () => {
  try {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('av_csrf='))
      ?.split('=')[1] || '';
  } catch {
    return '';
  }
};

export default function SupportWidget() {
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // Form state
  const [category, setCategory] = useState('bug');
  const [mode, setMode] = useState('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketNumber, setTicketNumber] = useState(null);

  const modalRef = useRef(null);

  // ── Close with animation ───────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  }, []);

  // ── Click outside to close ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        // Don't close if clicking the trigger button (handled separately)
        handleClose();
      }
    };
    // Delay to avoid the open click itself triggering close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, handleClose]);

  // ── Escape to close ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, handleClose]);

  // ── Toggle open/close ──────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (open) {
      handleClose();
    } else {
      setTicketNumber(null);
      setError('');
      setOpen(true);
    }
  }, [open, handleClose]);

  // ── Reset form after success close ────────────────────────────────────
  const handleSuccessClose = useCallback(() => {
    handleClose();
    setTimeout(() => {
      setCategory('bug');
      setMode('general');
      setSubject('');
      setDescription('');
      setTicketNumber(null);
      setError('');
    }, 200);
  }, [handleClose]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!subject.trim()) {
      setError('Please enter a subject.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Please add a bit more detail in the description.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/support/ticket`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({
          name: user?.displayName || user?.display_name || user?.username || 'User',
          email: user?.username || '',
          subject: subject.trim(),
          category,
          mode_context: mode,
          description: description.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit. Please try again.');
      }

      setTicketNumber(data.ticket_number);

    } catch (err) {
      console.error('Support ticket error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [subject, description, category, mode, user]);

  // Don't render at all if user is not loaded
  if (!user) return null;

  const userEmail = user?.username || user?.email || '';
  const userName = user?.displayName || user?.display_name || '';

  return (
    <>
      {/* ── Floating trigger ─────────────────────────────────────────── */}
      <button
        className="sw-trigger"
        onClick={handleToggle}
        aria-label="Open support"
        title="Help & Support"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6366F1"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </button>

      {/* ── Modal ────────────────────────────────────────────────────── */}
      {open && (
        <div
          ref={modalRef}
          className={`sw-modal${closing ? ' sw-closing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Help & Support"
        >
          {/* Header */}
          <div className="sw-header">
            <div className="sw-header-left">
              <div className="sw-dot" />
              <p className="sw-title">Help & Support</p>
            </div>
            <button
              className="sw-close"
              onClick={handleClose}
              aria-label="Close support widget"
            >
              ×
            </button>
          </div>

          <hr className="sw-divider" />

          {/* ── Success state ──────────────────────────────────────────── */}
          {ticketNumber ? (
            <div className="sw-success">
              <div className="sw-success-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="sw-success-title">Request submitted</p>
              <p className="sw-success-ticket">{ticketNumber}</p>
              <p className="sw-success-sub">We'll get back to you at {userEmail}</p>
              <button className="sw-submit" onClick={handleSuccessClose} style={{ marginTop: '4px' }}>
                Done
              </button>
            </div>
          ) : (

            /* ── Form ──────────────────────────────────────────────────── */
            <form className="sw-form" onSubmit={handleSubmit} noValidate>

              {/* Category */}
              <div className="sw-field">
                <label className="sw-label">Category</label>
                <select
                  className="sw-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Mode pills */}
              <div className="sw-field">
                <label className="sw-label">Which mode?</label>
                <div className="sw-pills">
                  {MODES.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      className={`sw-pill${mode === m.value ? ' sw-pill--active' : ''}`}
                      onClick={() => setMode(m.value)}
                      disabled={loading}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="sw-field">
                <label className="sw-label" htmlFor="sw-subject">Subject</label>
                <input
                  id="sw-subject"
                  className="sw-input"
                  type="text"
                  placeholder="Briefly describe the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={loading}
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="sw-field">
                <label className="sw-label" htmlFor="sw-description">Description</label>
                <textarea
                  id="sw-description"
                  className="sw-textarea"
                  rows={3}
                  placeholder="Tell us what happened..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  maxLength={2000}
                />
              </div>

              {/* Sender line */}
              <p className="sw-sender">
                Sending as <strong>{userEmail}</strong>
                {userName ? ` (${userName})` : ''}
              </p>

              {/* Error */}
              {error && <p className="sw-error">{error}</p>}

              {/* Submit */}
              <button
                type="submit"
                className="sw-submit"
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Submit request'}
              </button>

            </form>
          )}
        </div>
      )}
    </>
  );
}