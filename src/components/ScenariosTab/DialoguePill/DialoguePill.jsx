// src/components/ScenariosTab/DialoguePill/DialoguePill.jsx
// Unified segmented pill: Verse Dialogues | My Dialogues | Dialogue Guide
// Defensive-first: safe prop defaults, no external deps, pure SVG icons

import React from 'react';
import './DialoguePill.css';

// ── Icons (inline SVG, matches Header.js glow pattern) ────────────────────────

const TemplatesIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <filter id="pill-tpl-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.5" />
      </filter>
    </defs>
    <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"
      filter="url(#pill-tpl-glow)" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"
      filter="url(#pill-tpl-glow)" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"
      filter="url(#pill-tpl-glow)" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"
      filter="url(#pill-tpl-glow)" />
  </svg>
);

const MyScenariosIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <filter id="pill-my-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.5" />
      </filter>
    </defs>
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"
      filter="url(#pill-my-glow)" />
    <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"
      filter="url(#pill-my-glow)" />
    <path d="M3 20c0-3 2.2-5 5-5M21 20c0-3-2.2-5-5-5M8 15c1-.4 2-.6 4-.6s3 .2 4 .6"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      filter="url(#pill-my-glow)" />
  </svg>
);

const GuideIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <filter id="pill-guide-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.5" />
      </filter>
    </defs>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"
      filter="url(#pill-guide-glow)" />
    <path d="M12 8.5v1M12 11.5v4.5" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" filter="url(#pill-guide-glow)" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function DialoguePill({
  activeTab = 'templates',       // 'templates' | 'mine'
  onTabChange = () => {},        // (tab: string) => void
  onOpenGuide = null,            // () => void — if null, guide segment is hidden
  myScenarioCount = 0,           // shows badge on My Dialogues
}) {
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    onTabChange(tab);
  };

  return (
    <div className="dialogue-pill-wrapper" role="navigation" aria-label="Dialogue navigation">
      <div className="dialogue-pill">

        {/* Segment 1 — Verse Dialogues */}
        <button
          className={`dp-segment ${activeTab === 'templates' ? 'dp-segment--active' : ''}`}
          onClick={() => handleTabChange('templates')}
          aria-pressed={activeTab === 'templates'}
          aria-label="Verse Dialogues — browse templates"
        >
          <TemplatesIcon />
          <span className="dp-label">Verse Dialogues</span>
        </button>

        {/* Divider */}
        <span className="dp-divider" aria-hidden="true" />

        {/* Segment 2 — My Dialogues */}
        <button
          className={`dp-segment ${activeTab === 'mine' ? 'dp-segment--active' : ''}`}
          onClick={() => handleTabChange('mine')}
          aria-pressed={activeTab === 'mine'}
          aria-label={`My Dialogues — ${myScenarioCount} saved`}
        >
          <MyScenariosIcon />
          <span className="dp-label">My Dialogues</span>
          {myScenarioCount > 0 && (
            <span className="dp-badge" aria-label={`${myScenarioCount} dialogues`}>
              {myScenarioCount}
            </span>
          )}
        </button>

        {/* Divider + Guide — only if handler provided */}
        {onOpenGuide && (
          <>
            <span className="dp-divider" aria-hidden="true" />
            <button
              className="dp-segment dp-segment--guide"
              onClick={onOpenGuide}
              aria-label="Open Dialogue Guide"
            >
              <GuideIcon />
              <span className="dp-label">Dialogue Guide</span>
            </button>
          </>
        )}

      </div>
    </div>
  );
}