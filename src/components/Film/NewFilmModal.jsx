// src/components/Film/NewFilmModal.jsx
// The New Film picker as a dedicated popout (the "Idea 2" live-preview studio):
// a big looping style preview on the left, the style / frame / length controls
// on the right, and Start / Cancel. Portaled to <body> so no parent container
// can clip or squish it.
//
// Purely presentational. It reads the picker state passed down and calls the
// same setters + startNew the inline bar used, so the create payload
// (video_style / duration_seconds / aspect_ratio) and every downstream path are
// unchanged. STYLES / DURATIONS / ASPECTS / AspectGlyph are passed in from
// MyFilmsView so the canonical style keys stay defined in exactly one place.

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import StylePreview from './StylePreview';
import './NewFilmModal.css';

// Length made tangible — rough shot counts, matching the ideas mock. Keyed by
// the numeric duration values (60 / 120 / 180).
const SHOTS = {
  60:  '~10 shots · a quick single-scene short',
  120: '~20 shots · room for a beginning, middle and end',
  180: '~30 shots · a fuller arc with subplots',
};

export default function NewFilmModal({
  styles = [], durations = [], aspects = [], AspectGlyph = () => null,
  style, duration, aspect,
  onStyle = () => {}, onDuration = () => {}, onAspect = () => {},
  busy = false, onStart = () => {}, onClose = () => {},
}) {
  // Esc to close + lock background scroll while open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('nf-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('nf-open');
    };
  }, [onClose]);

  const styleLabel  = styles.find(s => s.key === style)?.label   || style;
  const aspectLabel = aspects.find(a => a.key === aspect)?.label || aspect;
  const durLabel    = durations.find(d => d.key === duration)?.label || `${duration}s`;

  return createPortal(
    <div className="nf-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="nf-modal" role="dialog" aria-modal="true" aria-label="New film">
        <button className="nf-x" onClick={onClose} aria-label="Close">×</button>

        <div className="nf-head">
          <h3 className="nf-title">New film</h3>
          <p className="nf-sub">Pick a look, frame and length — the preview updates live.</p>
        </div>

        <div className="nf-studio">
          {/* LEFT — live preview */}
          <div className="nf-stage">
            <StylePreview styleKey={style} aspect={aspect} />
            <div className="nf-cap">
              {styleLabel} · {aspectLabel} · {durLabel}
              <small>{SHOTS[duration] || ''}</small>
            </div>
          </div>

          {/* RIGHT — controls. Each group is a contained pill-group; the
              selected option fills indigo. The style group wraps within its pill
              so the 5th option (Photoreal) never overflows in the narrow
              widescreen layout (note 2). */}
          <div className="nf-controls">
            <div className="nf-group">
              <div className="nf-glabel">Style</div>
              <div className="nf-pillgroup nf-pillgroup--wrap">
                {styles.map(s => (
                  <button key={s.key} type="button"
                    className={`nf-pill${style === s.key ? ' is-on' : ''}`}
                    onClick={() => onStyle(s.key)}>{s.label}</button>
                ))}
              </div>
            </div>

            <div className="nf-group">
              <div className="nf-glabel">Frame <span className="nf-opt">· fixed for the whole film</span></div>
              <div className="nf-pillgroup">
                {aspects.map(a => (
                  <button key={a.key} type="button"
                    className={`nf-pill nf-pill--icon${aspect === a.key ? ' is-on' : ''}`}
                    onClick={() => onAspect(a.key)} title={a.key}>
                    <AspectGlyph w={a.w} h={a.h} /> {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="nf-group">
              <div className="nf-glabel">Length</div>
              <div className="nf-pillgroup">
                {durations.map(d => (
                  <button key={d.key} type="button"
                    className={`nf-pill${duration === d.key ? ' is-on' : ''}`}
                    onClick={() => onDuration(d.key)}>{d.label}</button>
                ))}
              </div>
            </div>

            <div className="nf-foot">
              <button className="nf-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="nf-btn primary" onClick={onStart} disabled={busy}>
                {busy ? 'Creating…' : 'Start'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}