// src/components/Onboarding/OnboardingFlow.jsx
// DEFENSIVE-FIRST: Self-contained, no external deps, safe localStorage fallbacks
// Calls onComplete(path): 'discover' | 'create' | 'story' | 'workspace'

import React, { useState, useEffect, useCallback } from 'react';
import './OnboardingFlow.css';

// ─── Storage ─────────────────────────────────────────────────────────────────
export const ONBOARDING_KEY = 'awakeverse_onboarding_complete';

export function isOnboardingComplete() {
  try { return localStorage.getItem(ONBOARDING_KEY) === 'true'; }
  catch { return false; }
}

function markOnboardingComplete() {
  try { localStorage.setItem(ONBOARDING_KEY, 'true'); }
  catch { /* silent fail — user still proceeds */ }
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const SparkIcon = () => (
  <svg width="42" height="42" viewBox="0 0 44 44" fill="none">
    <defs>
      <filter id="ob-sg">
        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.7"/>
      </filter>
    </defs>
    <path d="M22 3 L25.5 18 L41 22 L25.5 26 L22 41 L18.5 26 L3 22 L18.5 18 Z"
      stroke="#6366f1" strokeWidth="1.8" strokeLinejoin="round"
      fill="rgba(99,102,241,0.1)" filter="url(#ob-sg)"/>
    <circle cx="34" cy="11" r="2.2" fill="#818cf8" opacity="0.8" filter="url(#ob-sg)"/>
    <circle cx="11" cy="33" r="1.6" fill="#818cf8" opacity="0.55" filter="url(#ob-sg)"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Defensive image panel ────────────────────────────────────────────────────
// Shows gradient fallback if image is missing — never breaks the step
function ImagePanel({ src, alt, fallbackLabel }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="ob-img-panel">
      {!failed ? (
        <img
          src={src}
          alt={alt}
          className="ob-img-panel__img"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="ob-img-panel__fallback">
          <span className="ob-img-panel__fallback-label">{fallbackLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const TOTAL_STEPS = 5;

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [exitDir, setExitDir] = useState('forward');

  const handleComplete = useCallback((path) => {
    markOnboardingComplete();
    if (onComplete) onComplete(path);
  }, [onComplete]);

  const navigate = useCallback((dir) => {
    if (exiting) return;
    const next = step + dir;
    if (next < 0 || next >= TOTAL_STEPS) return;
    setExitDir(dir > 0 ? 'forward' : 'back');
    setExiting(true);
    setTimeout(() => {
      setStep(next);
      setExiting(false);
    }, 260);
  }, [exiting, step]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'Escape') handleComplete('discover');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, handleComplete]);

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="ob-shell">
      <div className="ob-bg" />
      <div className={`ob-card ${exiting
        ? (exitDir === 'forward' ? 'ob-card--exit-fwd' : 'ob-card--exit-back')
        : 'ob-card--enter'}`}
      >
        {/* Progress dots */}
        <div className="ob-dots">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={
              `ob-dot${i === step ? ' ob-dot--active' : ''}${i < step ? ' ob-dot--done' : ''}`
            } />
          ))}
        </div>

        {/* Step */}
        <div className="ob-body">
          {step === 0 && <StepWelcome />}
          {step === 1 && <StepOneOnOne />}
          {step === 2 && <StepMultiChar />}
          {step === 3 && <StepCommand />}
          {step === 4 && <StepPath onComplete={handleComplete} />}
        </div>

        {/* Footer */}
        {!isLast && (
          <div className="ob-footer">
            <button
              className="ob-btn ob-btn--ghost"
              onClick={() => navigate(-1)}
              style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
            >
              ← Back
            </button>
            <button className="ob-btn ob-btn--skip" onClick={() => handleComplete('discover')}>
              Skip
            </button>
            <button className="ob-btn ob-btn--primary" onClick={() => navigate(1)}>
              {step === TOTAL_STEPS - 2 ? 'Choose your path →' : 'Next →'}
            </button>
          </div>
        )}

        {isLast && (
          <div className="ob-footer ob-footer--last">
            <button className="ob-btn ob-btn--ghost" onClick={() => navigate(-1)}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────
function StepWelcome() {
  return (
    <div className="ob-step ob-step--welcome">
      <SparkIcon />
      <div className="ob-wordmark">
        <span className="ob-wm--indigo">A</span><span className="ob-wm--ivory">wake</span>
        <span className="ob-wm--indigo">V</span><span className="ob-wm--ivory">erse</span>
      </div>
      <p className="ob-tagline">Where conversations come alive.</p>
      <p className="ob-text">
        AwakeVerse orchestrates real, simultaneous AI minds —
        custom characters, and multi-LLM dialogue — all in one place.
        Create Chracters, Enable Dialogue, Explore Stories, Get Multiple LLMs collaborating on Your Project
      </p>
      <div className="ob-pills">
        <span className="ob-pill">Multi-AI Experience</span>
        <span className="ob-pill">Creator economy</span>
        <span className="ob-pill">80% revenue share</span>
        <span className="ob-pill">Your characters, your rules</span>
      </div>
    </div>
  );
}

// ─── Step 2: One-on-One ───────────────────────────────────────────────────────
function StepOneOnOne() {
  return (
    <div className="ob-step">
      <p className="ob-eyebrow">One-on-One</p>
      <h2 className="ob-heading">Two modes for personal journeys</h2>
      <div className="ob-panels-2">
        <div className="ob-panel">
          <ImagePanel
            src="/images/onboarding/onboarding-chat.webp"
            alt="Chat mode"
            fallbackLabel="Chat"
          />
          <div className="ob-panel__text">
            <span className="ob-panel__name">Chat</span>
            <span className="ob-panel__desc">Direct conversation with your created characters. They remember the thread.</span>
          </div>
        </div>
        <div className="ob-panel">
          <ImagePanel
            src="/images/onboarding/onboarding-story.webp"
            alt="Story mode"
            fallbackLabel="Story"
          />
          <div className="ob-panel__text">
            <span className="ob-panel__name">Story Mode</span>
            <span className="ob-panel__desc">Co-author a narrative that unfolds with your character.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Multi-Character ──────────────────────────────────────────────────
function StepMultiChar() {
  return (
    <div className="ob-step">
      <p className="ob-eyebrow">Multi-Character</p>
      <h2 className="ob-heading">Where AwakeVerse gets extraordinary</h2>
      <div className="ob-panels-2">
        <div className="ob-panel">
          <ImagePanel
            src="/images/onboarding/onboarding-dialogue.webp"
            alt="Dialogue mode"
            fallbackLabel="Dialogue"
          />
          <div className="ob-panel__text">
            <span className="ob-panel__name">Dialogue</span>
            <span className="ob-panel__desc">Two or more AI minds debating any topic you set.</span>
          </div>
        </div>
        <div className="ob-panel">
          <ImagePanel
            src="/images/onboarding/onboarding-workspace.webp"
            alt="Workspace mode"
            fallbackLabel="Workspace"
          />
          <div className="ob-panel__text">
            <span className="ob-panel__name">Workspace</span>
            <span className="ob-panel__desc">Multiple AI LLMs working on Your task, together.</span>
          </div>
        </div>
      </div>
      <div className="ob-callout">
        <span className="ob-callout__dot" />
        Character.AI simulates multi-character with a single AI. AwakeVerse doesn't — genuinely separate minds.
      </div>
    </div>
  );
}

// ─── Step 4: Command ──────────────────────────────────────────────────────────
function StepCommand() {
  return (
    <div className="ob-step ob-step--command">
      <p className="ob-eyebrow">The Command</p>
      <h2 className="ob-heading">Your launcher, anywhere</h2>
      <p className="ob-text">
        Press <span className="ob-kbd">Ctrl</span> + <span className="ob-kbd">A</span> from
        any screen to open the launcher overlay. Switch characters, modes, or start something
        new — then dismiss to return instantly.
      </p>
      <div className="ob-keys">
        <div className="ob-key">Ctrl</div>
        <span className="ob-key-plus">+</span>
        <div className="ob-key ob-key--highlight">A</div>
      </div>
      <p className="ob-keys-label">Open the AwakeVerse launcher from anywhere</p>
      <p className="ob-hint">On mobile — tap the AwakeVerse mark at the top of your screen.</p>
    </div>
  );
}

// ─── Step 5: Path ─────────────────────────────────────────────────────────────
function StepPath({ onComplete }) {
  const paths = [
    {
      key: 'discover',
      img: '/images/onboarding/onboarding-path-discover.webp',
      label: 'Discover',
      desc: 'Explore curated AI minds',
    },
    {
      key: 'create',
      img: '/images/onboarding/onboarding-path-create.webp',
      label: 'Create',
      desc: 'Build your own character, Dialogue',
    },
    {
      key: 'story',
      img: '/images/onboarding/onboarding-path-story.webp',
      label: 'Story',
      desc: 'Start a narrative',
    },
    {
      key: 'workspace',
      img: '/images/onboarding/onboarding-path-workspace.webp',
      label: 'Workspace',
      desc: 'Multi-AI collaboration',
    },
  ];

  return (
    <div className="ob-step ob-step--path">
      <p className="ob-eyebrow">Your Path</p>
      <h2 className="ob-heading">Where do you want to begin?</h2>
      <p className="ob-text">You can always change direction — this is just your starting point.</p>
      <div className="ob-panels-4">
        {paths.map((p) => (
          <button key={p.key} className="ob-path-panel" onClick={() => onComplete(p.key)}>
            <ImagePanel src={p.img} alt={p.label} fallbackLabel={p.label} />
            <div className="ob-path-panel__text">
              <span className="ob-path-panel__name">{p.label}</span>
              <span className="ob-path-panel__desc">{p.desc}</span>
              <span className="ob-path-panel__arrow"><ArrowIcon /></span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}