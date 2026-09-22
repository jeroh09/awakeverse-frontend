// src/components/PodcastStudio/PodcastRenderPill.jsx
//
// Universal render-status pill — visible regardless of which top-level view
// is active, EXCEPT Podcast Studio itself (its own local progress UI already
// covers that case; showing both would be redundant). Reads/writes
// activePodcastRender from AppViewContext, which is what actually survives
// navigation — this component is just the display, all the polling logic
// lives in the context provider (see AppViewContext.js).
//
// Naming (Context ←→ Backend, GET /podcast/session/<id>):
//   sessionId     ←  session_id
//   status        ←  status        'queued'|'processing'|'complete'|'failed'
//   progress      ←  progress      0.0–1.0
//   finalUrl      ←  final_url
//   totalSeconds  ←  total_seconds
//   error         ←  error

import React from 'react';
import { useAppView } from '../../contexts/AppViewContext';
import styles from './PodcastRenderPill.module.css';

function Spinner() {
  return (
    <svg className={styles.spin} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#6366F1" strokeWidth="2.5"
        strokeDasharray="42" strokeDashoffset="14" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
      <path d="M12 9v4" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
    </svg>
  );
}

export default function PodcastRenderPill() {
  const { activePodcastRender, setActivePodcastRender, currentView, VIEW_STATES, switchView } = useAppView();

  // Nothing to show, or already on the page that has its own progress UI.
  if (!activePodcastRender) return null;
  if (currentView === VIEW_STATES.PODCAST_STUDIO) return null;

  const { status, progress, error } = activePodcastRender;
  const isTerminal = status === 'complete' || status === 'failed';

  const handleClick = () => {
    switchView(VIEW_STATES.PODCAST_STUDIO);
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setActivePodcastRender(null);
  };

  let icon, label, sublabel, labelClass = styles.label;

  if (status === 'complete') {
    icon = <CheckIcon />;
    label = 'Podcast ready!';
    sublabel = 'Tap to view';
    labelClass = `${styles.label} ${styles.labelComplete}`;
  } else if (status === 'failed') {
    icon = <AlertIcon />;
    label = 'Podcast render failed';
    sublabel = error ? String(error).slice(0, 40) : 'Tap for details';
    labelClass = `${styles.label} ${styles.labelFailed}`;
  } else {
    // 'queued' | 'processing'
    icon = <Spinner />;
    label = 'Rendering podcast…';
    const pct = typeof progress === 'number' ? Math.round(progress * 100) : null;
    sublabel = pct !== null ? `${pct}% complete` : 'This can take a few minutes';
  }

  return (
    <div className={styles.pill} onClick={handleClick} role="button" tabIndex={0}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>
        <span className={labelClass}>{label}</span>
        <span className={styles.sublabel}>{sublabel}</span>
      </span>
      {isTerminal && (
        <button className={styles.dismissBtn} onClick={handleDismiss} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}