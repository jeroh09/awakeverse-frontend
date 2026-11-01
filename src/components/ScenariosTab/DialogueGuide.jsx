// src/components/ScenariosTab/DialogueGuide.jsx
// 7-step paginated guide — light/dark mode aware, defensive image fallbacks
// Receives currentTheme from ScenariosTab ('awakeverse' | 'light')

import React, { useState, useEffect, useCallback } from 'react';
import './DialogueGuide.css';

// ─── Preload all images when guide opens ─────────────────────────────────────
// Fires once on mount — browsers cache the responses so navigation is instant
function usePreloadImages(srcs) {
  useEffect(() => {
    srcs.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []); 
}

// ─── Defensive image panel ────────────────────────────────────────────────────
// Opacity fade handles brief load delay. useEffect resets state on src change
// without remounting the DOM node — prevents the blank flash between steps.
function GuideImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  return (
    <div className="dg-img-wrap">
      {!failed ? (
        <img
          src={src}
          alt={alt}
          className={`dg-img ${loaded ? 'dg-img--loaded' : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="dg-img-fallback">
          <span className="dg-img-fallback__label">{alt}</span>
        </div>
      )}
    </div>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  {
    number: 1,
    eyebrow: 'Getting Started',
    title: 'Choose your format',
    body: 'Start from a curated template — philosophy, ethics, business, science — or build a dialogue from scratch. Templates pre-load characters and a debate question so you can launch in seconds.',
    img: '/images/guide/guide-dialogue-templates.webp',
    alt: 'Dialogue templates gallery',
    tip: 'New to Dialogue? Pick a template first. You can customise everything after.',
  },
  {
    number: 2,
    eyebrow: 'Characters',
    title: 'Pick your minds',
    body: 'Choose between 2 and 4 AI personas for your dialogue. Mix from AwakeVerse\'s curated library or add your own created characters. Each brings a distinct voice, era, and perspective.',
    img: '/images/guide/guide-dialogue-characters.webp',
    alt: 'Character selection panel',
    tip: 'Contrasting worldviews make for the most compelling dialogues — try pairing characters from different eras or philosophies.',
  },
  {
    number: 3,
    eyebrow: 'Topic',
    title: 'Set the debate question',
    body: 'Give the dialogue a focus with a debate question or opening premise. This is optional — leaving it blank lets the characters set their own direction based on their personalities and context.',
    img: '/images/guide/guide-dialogue-question.webp',
    alt: 'Debate question input',
    tip: 'Optional but powerful. A sharp question produces sharper dialogue.',
    badge: 'Optional',
  },
  {
    number: 4,
    eyebrow: 'Launching',
    title: 'Start the dialogue',
    body: 'Review your setup — characters, question, turn limit — then hit Start. The Verse engine initialises each AI mind separately. You\'ll see them enter the conversation one by one.',
    img: '/images/guide/guide-dialogue-scratch.webp',
    alt: 'Dialogue creator ready to launch',
    tip: 'Set a turn cap to keep dialogues focused. You can always continue past the cap.',
  },
  {
    number: 5,
    eyebrow: 'Controls',
    title: 'Auto mode vs manual',
    body: 'Auto mode runs the dialogue based on resonance and natural turn-taking — just watch it unfold. Switch to manual at any time to control exactly who speaks next and when.',
    img: '/images/guide/guide-dialogue-auto.webp',
    alt: 'Auto mode running',
    tip: 'Auto mode is great for exploration. Manual mode is best when you want to steer the debate.',
  },
  {
    number: 6,
    eyebrow: 'Managing',
    title: 'Control the conversation',
    body: 'Use Next Speaker to advance to the next character in the queue, or Continue to let the current speaker elaborate further. You can pause, resume, or switch modes mid-dialogue at any time.',
    img: '/images/guide/guide-dialogue-controls.webp',
    alt: 'Dialogue controls — Next and Continue buttons',
    tip: 'Pressing Continue on a strong argument often yields the most nuanced responses.',
  },
  {
    number: 7,
    eyebrow: 'Export',
    title: 'Generate scripts, audio & video',
    body: 'When your dialogue is complete, export it as a formatted script, generate audio with character voices, or produce a video — bringing your dialogue to life beyond the platform.',
    img: '/images/guide/guide-dialogue-export.webp',
    alt: 'Export options panel',
    tip: 'Audio and video generation are coming soon. Scripts are available now.',
    badge: 'Partial — coming soon',
  },
];

const TOTAL = STEPS.length;

// ─── Main component ───────────────────────────────────────────────────────────
export default function DialogueGuide({ isOpen, onClose, currentTheme = 'awakeverse' }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [exitDir, setExitDir] = useState('forward');

  // ✅ Preload all images immediately when guide mounts — browser caches them
  usePreloadImages(STEPS.map(s => s.img));

  // Reset to step 0 each time guide opens
  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  const navigate = useCallback((dir) => {
    if (exiting) return;
    const next = step + dir;
    if (next < 0 || next >= TOTAL) return;
    setExitDir(dir > 0 ? 'forward' : 'back');
    setExiting(true);
    setTimeout(() => {
      setStep(next);
      setExiting(false);
    }, 220);
  }, [exiting, step]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, navigate, onClose]);

  if (!isOpen) return null;

  const isDark = currentTheme === 'awakeverse';
  const current = STEPS[step];
  const isLast = step === TOTAL - 1;

  return (
    <div
      className={`dg-overlay ${isDark ? 'dg--dark' : 'dg--light'}`}
      onClick={onClose}
    >
      <div
        className={`dg-modal ${exiting
          ? (exitDir === 'forward' ? 'dg-modal--exit-fwd' : 'dg-modal--exit-back')
          : 'dg-modal--enter'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Dialogue Guide"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="dg-header">
          <div className="dg-header__left">
            <span className="dg-header__title">Dialogue Guide</span>
            <span className="dg-header__count">{step + 1} / {TOTAL}</span>
          </div>
          <button className="dg-close" onClick={onClose} aria-label="Close guide">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Progress dots — desktop ──────────────────────────── */}
        <div className="dg-dots">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <button
              key={i}
              className={`dg-dot ${i === step ? 'dg-dot--active' : ''} ${i < step ? 'dg-dot--done' : ''}`}
              onClick={() => {
                setExitDir(i > step ? 'forward' : 'back');
                setExiting(true);
                setTimeout(() => { setStep(i); setExiting(false); }, 220);
              }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* ── Step counter — mobile only ────────────────────────── */}
        <div className="dg-dots-mobile">
          Step {step + 1} of {TOTAL}
        </div>

        {/* ── Image ───────────────────────────────────────────── */}
        <GuideImage src={current.img} alt={current.alt} />

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="dg-content">
          <div className="dg-content__top">
            <span className="dg-eyebrow">{current.eyebrow}</span>
            {current.badge && (
              <span className="dg-badge">{current.badge}</span>
            )}
          </div>
          <h2 className="dg-title">{current.title}</h2>
          <p className="dg-body">{current.body}</p>
          <div className="dg-tip">
            <span className="dg-tip__icon">💡</span>
            <span className="dg-tip__text">{current.tip}</span>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="dg-footer">
          <button
            className="dg-btn dg-btn--ghost"
            onClick={() => navigate(-1)}
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            ← Back
          </button>

          {isLast ? (
            <button className="dg-btn dg-btn--primary" onClick={onClose}>
              Got it ✓
            </button>
          ) : (
            <button className="dg-btn dg-btn--primary" onClick={() => navigate(1)}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}