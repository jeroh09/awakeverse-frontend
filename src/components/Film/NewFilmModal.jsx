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

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import StylePreview from './StylePreview';
import { GENRES, genreHint, genreLabel, AD_GENRE, isAdGenre, AD_LENGTHS, AD_RATIOS,
         adLengthTip } from './filmGenres';
import { filmAdAvailable } from './filmApi';
import './NewFilmModal.css';

// ADVERTISING MODE (2026-10-18): a film-room "Start an ad" leaves the user's request
// here; the modal opens on Advertise and the new ad's room sends it as its first message.
export const AD_SEED_KEY = 'awakeverse.adSeed';
const readAdSeed = () => { try { return window.sessionStorage.getItem(AD_SEED_KEY); } catch (_) { return null; } };

// Length made tangible — rough shot counts, matching the ideas mock. Keyed by
// the numeric duration values (60 / 120 / 180).
const STYLE_TIP = {
  anime: 'Anime — Japanese animation look',
  cartoon: 'Cartoon — bright, rounded animation',
  comic_book: 'Comic — inked lines and flat colour',
  realistic: 'Realistic — a painted, lifelike look',
  photoreal: 'Photoreal — photographic realism (adults only)',
};

const SHOTS = {
  60:  '~10 shots · a quick single-scene short',
  120: '~20 shots · room for a beginning, middle and end',
  180: '~30 shots · a fuller arc with subplots',
};

export default function NewFilmModal({
  styles = [], durations = [], aspects = [], AspectGlyph = () => null,
  style, duration, aspect, genre = null,
  onStyle = () => {}, onDuration = () => {}, onAspect = () => {}, onGenre = null,
  busy = false, onStart = () => {}, onClose = () => {},
}) {
  // ADVERTISING MODE — the Advertise pill shows only when the server's Ad studio is on
  // (its /ad routes answer). Choosing it swaps Length to ad lengths (10–60 s) and Frame
  // to vertical / landscape; leaving it puts a film length back.
  const [adOn, setAdOn] = useState(false);
  const isAd = isAdGenre(genre);
  useEffect(() => {
    let live = true;
    filmAdAvailable().then((cat) => {
      if (!live || !cat) return;
      setAdOn(true);
      if (onGenre && readAdSeed() && !isAdGenre(genre)) onGenre(AD_GENRE.key);
    });
    return () => { live = false; };
  }, []);   // once per open
  const wasAd = useRef(isAd);
  useEffect(() => {
    if (isAd) {
      if (!AD_LENGTHS.includes(Number(duration))) onDuration(15);
      if (!AD_RATIOS.includes(aspect)) onAspect('9:16');
    } else if (wasAd.current) {
      const film = durations.find(d => d.key === 60) || durations[0];
      if (film && !durations.some(d => d.key === duration)) onDuration(film.key);
    }
    wasAd.current = isAd;
  }, [isAd]);
  const lengthOptions = isAd ? AD_LENGTHS.map(n => ({ key: n, label: `${n}s` })) : durations;
  const frameOptions = isAd ? aspects.filter(a => AD_RATIOS.includes(a.key)) : aspects;

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
  const durLabel    = lengthOptions.find(d => d.key === duration)?.label || `${duration}s`;

  return createPortal(
    <div className="nf-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`nf-modal${isAd ? ' is-ad' : ''}`} role="dialog" aria-modal="true" aria-label={isAd ? 'New ad' : 'New film'}>
        <button className="nf-x" onClick={onClose} aria-label="Close" title="Close without starting a film">×</button>

        <div className="nf-head">
          <h3 className="nf-title">{isAd ? 'New ad' : 'New film'}</h3>
          <p className="nf-sub">{isAd
            ? 'A story-first video ad — a short brief, inspiration lenses, three concepts, then the script.'
            : 'Pick a look, frame and length — the preview updates live.'}</p>
        </div>

        <div className="nf-studio">
          {/* LEFT — live preview */}
          <div className="nf-stage">
            <StylePreview styleKey={style} aspect={aspect} />
            <div className="nf-cap">
              {styleLabel} · {aspectLabel} · {durLabel}{genre ? ` · ${genreLabel(genre) || ''}` : ''}
              <small>{isAd ? adLengthTip(Number(duration)) : (SHOTS[duration] || '')}</small>
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
                    onClick={() => onStyle(s.key)} title={STYLE_TIP[s.key] || `Make the film in ${s.label} style`}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* GENRE (2026-10-12) — under Style, optional. Selected = solid indigo like
                every other pill; clicking it again clears it. */}
            {onGenre && (
              <div className="nf-group">
                <div className="nf-glabel">Genre <span className="nf-opt">· optional — shapes how the writer helps, changes nothing on screen</span></div>
                <div className="nf-pillgroup nf-pillgroup--wrap">
                  {GENRES.map(g => (
                    <button key={g.key} type="button"
                      className={`nf-pill${genre === g.key ? ' is-on' : ''}`}
                      onClick={() => onGenre(genre === g.key ? null : g.key)}
                      title={genre === g.key ? `${g.label} — click again to clear` : `${g.label}: ${g.hint}`}>{g.label}</button>
                  ))}
                  {adOn && (
                    <button key={AD_GENRE.key} type="button"
                      className={`nf-pill nf-pill--ad${isAd ? ' is-on' : ''}`}
                      onClick={() => onGenre(isAd ? null : AD_GENRE.key)}
                      title={isAd ? 'Advertise — click again to make a film instead'
                                  : 'Make a video ad instead of a film — opens the Ad studio'}>{AD_GENRE.label}</button>
                  )}
                </div>
                <p className="nf-ghint">{genreHint(genre)}</p>
              </div>
            )}

            <div className="nf-group">
              <div className="nf-glabel">Frame <span className="nf-opt">· {isAd ? 'fixed for this ad once you choose a concept' : 'fixed for the whole film'}</span></div>
              <div className="nf-pillgroup">
                {frameOptions.map(a => (
                  <button key={a.key} type="button"
                    className={`nf-pill nf-pill--icon${aspect === a.key ? ' is-on' : ''}`}
                    onClick={() => onAspect(a.key)} title={isAd
                      ? `${a.label} (${a.key}) — ${a.key === '9:16' ? 'TikTok, Reels, Shorts' : 'YouTube, TV'}`
                      : `${a.label} (${a.key}) — fixed for the whole film`}>
                    <AspectGlyph w={a.w} h={a.h} /> {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="nf-group">
              <div className="nf-glabel">Length</div>
              <div className="nf-pillgroup">
                {lengthOptions.map(d => (
                  <button key={d.key} type="button"
                    className={`nf-pill${duration === d.key ? ' is-on' : ''}`}
                    onClick={() => onDuration(d.key)}
                    title={isAd ? `${d.label}: ${adLengthTip(d.key)}` : (SHOTS[d.key] ? `${d.label}: ${SHOTS[d.key]}` : d.label)}>{d.label}</button>
                ))}
              </div>
            </div>

            <div className="nf-foot">
              <button className="nf-btn ghost" onClick={onClose} disabled={busy} title="Close without starting a film">Cancel</button>
              <button className="nf-btn primary" onClick={onStart} disabled={busy}
                title={isAd ? 'Open the Ad studio for a new ad — writing is free' : "Open the writers' room for a new film — writing is free"}>
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