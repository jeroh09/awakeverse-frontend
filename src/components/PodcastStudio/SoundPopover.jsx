// src/components/PodcastStudio/SoundPopover.jsx
//
// The "Sound effects" pop-out, opened from the Sound row in the right-hand panel
// (under Voice and Outfit). Same centred shell as the other studio pop-outs.
//
//   top      — Sounds on/off for this episode (off until the user turns them on)
//              and the level: Subtle · Normal · Bold.
//   left     — "The set": every sound with ▶ to listen and when it plays. The
//              automatic ones follow your graphics; accents only play where picked.
//   right    — "Line by line": each line with its sound — Auto (follows the
//              line's graphic), None (silent), or a pick (plays as the line starts;
//              replaces the card's whoosh, or adds an accent on a plain line).
//
// Controlled. Props:
//   library   [{name, label, when, accent, url}]   (GET /api/podcast/sfx-library)
//   enabled, level, levels, onEnable(bool), onLevel(level)
//   lines     [{id, n, text, speaker, hasCard}]
//   choiceFor(id) → 'auto' | 'none' | <name>;  onChoice(id, value)
//   onClose

import React, { useEffect, useRef, useState } from 'react';
import styles from './SoundPopover.module.css';

const LEVEL_LABEL = { subtle: 'Subtle', normal: 'Normal', bold: 'Bold' };
const LEVEL_TIP = {
  subtle: 'Barely there — sounds sit well under the voice',
  normal: 'Noticeable but never over the voice',
  bold: 'Punchy — for energetic, social-first episodes',
};
const PREVIEW_VOL = { subtle: 0.45, normal: 0.7, bold: 0.95 };

export default function SoundPopover({
  library = [],
  enabled = false,
  level = 'subtle',
  levels = ['subtle', 'normal', 'bold'],
  onEnable,
  onLevel,
  lines = [],
  choiceFor,
  onChoice,
  onClose,
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(null);
  const [menuFor, setMenuFor] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (menuFor !== null) setMenuFor(null); else onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, menuFor]);
  useEffect(() => () => audioRef.current?.pause(), []);

  const byName = Object.fromEntries(library.map((s) => [s.name, s]));
  const play = (name) => {
    const s = byName[name];
    if (!s?.url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    if (playing === name) { a.pause(); setPlaying(null); return; }
    a.pause();
    a.src = s.url;
    a.volume = PREVIEW_VOL[level] ?? 0.6;
    a.onended = () => setPlaying(null);
    a.play().then(() => setPlaying(name)).catch(() => setPlaying(null));
  };

  const auto = library.filter((s) => !s.accent);
  const accents = library.filter((s) => s.accent);
  const labelOf = (v, hasCard) => {
    if (v === 'none') return 'None';
    if (v && v !== 'auto') return byName[v]?.label || v;
    return hasCard ? `Auto · ${byName.card_in?.label || 'whoosh'}` : 'Auto · silent';
  };

  const PlayBtn = ({ name }) => (
    <button type="button" className={`${styles.play} ${playing === name ? styles.playOn : ''}`}
            aria-label={playing === name ? 'Stop' : `Listen to ${byName[name]?.label || name}`}
            onClick={(e) => { e.stopPropagation(); play(name); }}>
      {playing === name ? '■' : '▶'}
    </button>
  );

  return (
    <div className={styles.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={styles.pop} role="dialog" aria-label="Sound effects">
        <div className={styles.pophead}>
          <span className={styles.ic} aria-hidden="true">🔈</span>
          <div className={styles.t}>Sound effects<small>Subtle glass sounds that move with your graphics</small></div>
          <button type="button" className={styles.x} aria-label="Close" onClick={onClose}>✕</button>
        </div>

        {!library.length ? (
          <div className={styles.empty}>
            <strong>Sounds are being set up</strong>
            The sound library isn’t ready yet — check back soon.
          </div>
        ) : (
          <>
            <div className={styles.topRow}>
              <label className={styles.toggle}>
                <span className={styles.sw}>
                  <input type="checkbox" checked={!!enabled} onChange={(e) => onEnable?.(e.target.checked)} />
                  <span />
                </span>
                Sounds for this episode
              </label>
              <div className={`${styles.pillStrip} ${!enabled ? styles.dim : ''}`} role="radiogroup" aria-label="Level">
                {levels.map((l) => (
                  <button key={l} type="button" title={LEVEL_TIP[l]} disabled={!enabled}
                          className={`${styles.pillBtn} ${level === l ? styles.pillOn : ''}`}
                          aria-pressed={level === l} onClick={() => onLevel?.(l)}>
                    {LEVEL_LABEL[l] || l}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${styles.body} ${!enabled ? styles.dim : ''}`}>
              <div className={styles.col}>
                <div className={styles.grp}>The set — plays automatically</div>
                {auto.map((s) => (
                  <div key={s.name} className={styles.snd}>
                    <PlayBtn name={s.name} />
                    <span className={styles.sndTxt}><b>{s.label}</b><span>{s.when}</span></span>
                  </div>
                ))}
                {accents.length ? (
                  <>
                    <div className={styles.grp} style={{ marginTop: 12 }}>Accents — only where you pick them</div>
                    {accents.map((s) => (
                      <div key={s.name} className={styles.snd}>
                        <PlayBtn name={s.name} />
                        <span className={styles.sndTxt}><b>{s.label}</b><span>{(w => w.charAt(0).toUpperCase() + w.slice(1))(s.when.replace(/^Your pick: /, ''))}</span></span>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>

              <div className={styles.col}>
                <div className={styles.grp}>Line by line</div>
                {!lines.length ? <p className={styles.hint}>Write some lines first.</p> : null}
                <div className={styles.lines}>
                  {lines.map((ln) => {
                    const v = choiceFor?.(ln.id) || 'auto';
                    const open = menuFor === ln.id;
                    return (
                      <div key={ln.id} className={`${styles.ln} ${open ? styles.lnOpen : ''}`}>
                        <span className={styles.lnN}>{ln.n}</span>
                        <span className={styles.lnTxt} title={ln.text}>
                          {ln.hasCard ? <span className={styles.badge} title="This line has a visual">▣</span> : null}
                          {ln.text || <i>empty line</i>}
                        </span>
                        <div className={styles.pick}>
                          <button type="button" disabled={!enabled}
                                  className={`${styles.pickBtn} ${v !== 'auto' ? styles.pickSet : ''}`}
                                  onClick={() => setMenuFor(open ? null : ln.id)} aria-expanded={open}>
                            {labelOf(v, ln.hasCard)} <span aria-hidden="true">▾</span>
                          </button>
                          {open ? (
                            <div className={styles.menu} role="menu">
                              {[['auto', labelOf('auto', ln.hasCard)], ['none', 'None — silent']].map(([val, lbl]) => (
                                <button key={val} type="button" role="menuitem"
                                        className={`${styles.item} ${v === val ? styles.itemOn : ''}`}
                                        onClick={() => { onChoice?.(ln.id, val); setMenuFor(null); }}>
                                  {lbl}
                                </button>
                              ))}
                              <div className={styles.menuSep}>Accents</div>
                              {accents.map((s) => (
                                <div key={s.name} className={styles.itemRow}>
                                  <button type="button" role="menuitem"
                                          className={`${styles.item} ${v === s.name ? styles.itemOn : ''}`}
                                          onClick={() => { onChoice?.(ln.id, s.name); setMenuFor(null); }}>
                                    {s.label}
                                  </button>
                                  <PlayBtn name={s.name} />
                                </div>
                              ))}
                              <div className={styles.menuSep}>From the set</div>
                              {auto.map((s) => (
                                <div key={s.name} className={styles.itemRow}>
                                  <button type="button" role="menuitem"
                                          className={`${styles.item} ${v === s.name ? styles.itemOn : ''}`}
                                          onClick={() => { onChoice?.(ln.id, s.name); setMenuFor(null); }}>
                                    {s.label}
                                  </button>
                                  <PlayBtn name={s.name} />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        <div className={styles.foot}>
          <span className={styles.hintFoot}>
            {enabled ? 'Free — mixed under the voice, never over it.' : 'Off — your episode renders without sounds.'}
          </span>
          <button type="button" className={styles.done} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}