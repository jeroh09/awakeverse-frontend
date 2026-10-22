// src/components/PodcastStudio/CaptionPopover.jsx
//
// The "Caption style" pop-out, opened from the Captions row in the right-hand panel
// (under Voice · Outfit · Sound). Captions are always on — this only picks their look.
// Same centred shell as the other studio pop-outs (portal, pinned header/footer).
//
// Four styles, each shown as a live preview over your host still, playing the same
// sample line word by word (mirrors remotion_overlays/src/Captions.jsx):
//   glass (default) · bold (Bold Pop) · karaoke · minimal
//
// Controlled: value ('glass' | 'bold' | 'karaoke' | 'minimal'), onChange(style), onClose.

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './CaptionPopover.module.css';
import { IconCaptions, IconClose } from './StudioIcons';

export const CAPTION_STYLES = [
  { id: 'glass',   name: 'Glass',    desc: 'A frosted pill; words light up as they’re said. Calm and premium — our default.' },
  { id: 'bold',    name: 'Bold Pop', desc: 'Big, heavy capitals, three words at a time; the word being said pops in indigo. Made for social.' },
  { id: 'karaoke', name: 'Karaoke',  desc: 'A dark band; each word fills with indigo as it’s spoken. Easy to follow along.' },
  { id: 'minimal', name: 'Minimal',  desc: 'Small, clean subtitles that simply fade. Lets the picture lead.' },
];
const SAMPLE = ['Most', 'teams', 'think', 'their', 'AI', 'bill', 'is', 'the', 'model.'];
const PUNCH = 8;                       // "model." is the *punch* word
const CHUNK = { glass: 6, bold: 3, karaoke: 6, minimal: 9 };
const STEP_MS = 380;

function Sample({ style, cur }) {
  const size = CHUNK[style];
  const start = Math.floor(Math.min(cur, SAMPLE.length - 1) / size) * size;
  const words = SAMPLE.slice(start, start + size);
  const at = cur - start;              // index of the word being said within the chunk
  return (
    <div className={`${styles.cap} ${styles['cap_' + style]}`} key={`${style}-${start}`}>
      {words.map((w, i) => {
        const g = start + i;
        const state = i < at ? 'said' : i === at ? 'now' : 'next';
        return (
          <span key={g} className={`${styles.w} ${styles[state]} ${g === PUNCH ? styles.punch : ''}`}>
            {style === 'bold' ? w.toUpperCase() : w}
          </span>
        );
      })}
    </div>
  );
}

export default function CaptionPopover({ value = 'glass', backdropUrl = null, onChange, onClose }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur((c) => (c + 1) % (SAMPLE.length + 3)), STEP_MS);   // brief pause at the end
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className={styles.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={styles.pop} role="dialog" aria-label="Caption style">
        <div className={styles.pophead}>
          <span className={styles.ic} aria-hidden="true"><IconCaptions size={20} /></span>
          <div className={styles.t}>Caption style<small>Captions are always on — pick how they look</small></div>
          <button type="button" className={styles.x} aria-label="Close" onClick={onClose}><IconClose size={14} /></button>
        </div>

        <div className={styles.body} role="radiogroup" aria-label="Caption style">
          {CAPTION_STYLES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={value === s.id}
                    className={`${styles.opt} ${value === s.id ? styles.optOn : ''}`}
                    onClick={() => onChange?.(s.id)}>
              <span className={styles.stage}>
                {backdropUrl ? <img className={styles.bg} src={backdropUrl} alt="" /> : <span className={styles.bgFallback} />}
                <Sample style={s.id} cur={Math.min(cur, SAMPLE.length - 1)} />
              </span>
              <span className={styles.name}>
                <span className={styles.radio} aria-hidden="true" />{s.name}
                {s.id === 'glass' ? <em>default</em> : null}
              </span>
              <span className={styles.desc}>{s.desc}</span>
            </button>
          ))}
        </div>

        <div className={styles.foot}>
          <span className={styles.hintFoot}>*Punch* words in your script stay indigo in every style. Free — no re-render cost.</span>
          <button type="button" className={styles.done} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
