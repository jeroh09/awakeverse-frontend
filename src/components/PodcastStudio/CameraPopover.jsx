// src/components/PodcastStudio/CameraPopover.jsx
//
// The "Camera" pop-out (2026-10-22), opened from the Camera row in the Visual panel
// (Whole episode). Vertical duo only: in a 9:16 two-speaker episode the camera moves
// to whoever talks — this picks HOW it moves (podcast_video.CAMERA_STYLES).
//
//   tiles  — Swing (default) · Soft drift · Whip · Over the shoulder, each looping a
//            short clip of the real move (from the 2026-10-22 test reel). The clips are
//            NOT bundled: they live on DO Spaces and load from the CDN —
//            content/podcast_studio/camera/<style>.mp4 + <style>.jpg (HANDOVER_media_integration).
//   strip  — "Your episode, shot by shot", built from the script's speakers: a move at
//            each change of speaker, a straight cut when the same person talks twice.
//   foot   — the duo fee (from POST /api/podcast/quote; never hard-coded) + Done.
//
// Controlled, presentational only. Props:
//   value      'swing' | 'soft' | 'whip' | 'ots'
//   onChange(value)
//   shots      [{ n, role: 'host' | 'guest', name, look? }]   (lines with text, in order;
//              a look other than 'auto' is marked on the shot with its glyph)
//   fee        number | null                           (duo fee in credits)
//   onClose

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './CameraPopover.module.css';
import { IconClose } from './StudioIcons';
import { LookGlyph, LOOK_BY_ID } from './LineLook';

// Studio media on the CDN (DO Spaces, public-read). Override with REACT_APP_CDN_BASE.
export const STUDIO_MEDIA = `${(process.env.REACT_APP_CDN_BASE
  || 'https://awakeverse-blog.lon1.cdn.digitaloceanspaces.com').replace(/\/$/, '')}/content/podcast_studio`;
const cam = (id) => ({ clip: `${STUDIO_MEDIA}/camera/${id}.mp4`, poster: `${STUDIO_MEDIA}/camera/${id}.jpg` });

// = podcast_video.CAMERA_STYLES / CAMERA_SECONDS
export const CAMERA_STYLES = [
  { id: 'swing', name: 'Swing', secs: 2, tip: 'A smooth arc to whoever talks. The default.', ...cam('swing') },
  { id: 'soft', name: 'Soft drift', secs: 3, tip: 'A slow, gentle move. Calm conversations.', ...cam('soft') },
  { id: 'whip', name: 'Whip', secs: 1, tip: 'A fast whip pan with motion blur. Energy.', ...cam('whip') },
  { id: 'ots', name: 'Over the shoulder', secs: 2, tip: 'Lands behind the listener’s shoulder; talking shots stay over the shoulder.', ...cam('ots') },
];
export const cameraName = (id) => (CAMERA_STYLES.find(s => s.id === id) || CAMERA_STYLES[0]).name;

export const IconCamera = ({ size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7" width="13" height="10" rx="2" />
    <path d="M16 11l5-3v8l-5-3" style={{ stroke: 'var(--si-accent, currentColor)' }} />
  </svg>
);

const MAX_SHOTS = 9;
// Reduced motion: the clips show their still frame and don't play by themselves.
const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function CameraPopover({ value = 'swing', onChange, shots = [], fee = null, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const style = CAMERA_STYLES.find(s => s.id === value) || CAMERA_STYLES[0];
  const still = reduceMotion();
  const shown = shots.slice(0, MAX_SHOTS);
  const more = shots.length - shown.length;

  return createPortal(
    <div className={styles.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={styles.pop} role="dialog" aria-label="Camera">
        <div className={styles.pophead}>
          <span className={styles.ic}><IconCamera size={20} /></span>
          <div className={styles.t}>Camera<small>Vertical duo · how the shot moves between you</small></div>
          <button type="button" className={styles.x} onClick={onClose} aria-label="Close"><IconClose size={13} /></button>
        </div>

        <div className={styles.body}>
          <div className={styles.tiles} role="radiogroup" aria-label="Camera style">
            {CAMERA_STYLES.map(s => (
              <button key={s.id} type="button" role="radio" aria-checked={value === s.id}
                className={`${styles.tile} ${value === s.id ? styles.tileOn : ''}`}
                onClick={() => onChange?.(s.id)} title={s.tip}>
                <span className={styles.clip}>
                  <video src={s.clip} poster={s.poster} autoPlay={!still} muted loop playsInline preload="metadata" />
                  <span className={styles.tag}>9:16</span>
                </span>
                <span className={styles.name}><i className={styles.radio} />{s.name}<em>{s.secs} s</em></span>
                <span className={styles.tip}>{s.tip}</span>
              </button>
            ))}
          </div>

          {shown.length > 0 && (
            <div className={styles.plan}>
              <div className={styles.grp}>Your episode, shot by shot</div>
              <div className={styles.strip}>
                <span className={styles.shot}>Wide · 2 s</span>
                {shown.map((s, i) => {
                  const cut = i > 0 && shown[i - 1].role === s.role;
                  return (
                    <React.Fragment key={s.n}>
                      <span className={cut ? `${styles.mv} ${styles.cut}` : styles.mv}>{cut ? '| cut' : `↷ ${style.secs} s`}</span>
                      <span className={`${styles.shot} ${s.role === 'host' ? styles.host : styles.guest}`}
                        title={s.look && s.look !== 'auto' && LOOK_BY_ID[s.look] ? `Look: ${LOOK_BY_ID[s.look].name}` : undefined}>
                        {s.n} · {s.name}
                        {s.look && s.look !== 'auto' && LOOK_BY_ID[s.look] ? <span className={styles.look}><LookGlyph look={s.look} size={11} /></span> : null}
                      </span>
                    </React.Fragment>
                  );
                })}
                {more > 0 ? <span className={styles.mv}>+{more} more</span> : null}
                <span className={styles.mv}>↷</span>
                <span className={styles.shot}>Wide</span>
              </div>
              <p className={styles.hint}>A move at each change of speaker, a straight cut when the same person talks twice (or changes where they look). Moves add a few seconds and aren’t charged.</p>
            </div>
          )}
        </div>

        <div className={styles.foot}>
          {fee != null && fee > 0
            ? <span className={styles.fee}><b>+{fee.toLocaleString()} credits</b> · vertical two-person (in the price on Generate)</span>
            : <span className={styles.fee}>Vertical two-person episode</span>}
          <button type="button" className={styles.done} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}