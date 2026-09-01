// src/components/PodcastStudio/ComparisonSetup.jsx
//
// Pop-out setup panel for solo "A vs B" comparison rails. Split layout:
//   LEFT  — live preview of the rails over a mock host frame (updates as you type)
//   RIGHT — the setup: two subjects (name + logo under the name) and points.
//
// IMPORTANT: Chip / Rail / Subject are defined at MODULE scope (not inside the
// component). Defining them inside the render gives them a new identity every
// keystroke, so React remounts the <input> and steals focus after one letter.
// Module scope keeps their identity stable so inputs keep focus while typing.
//
// Logo is optional: a letter by default; Upload swaps in an image via the existing
// uploadInsert(). Any bad/removed image falls back to the letter, so the card
// can't break. Rail COLOURS mirror podcast_compare.py's VISUAL DESIGN TOKENS.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ComparisonSetup.module.css';
import HostAvatar from './HostAvatar';

const monogram = (s) => (s.logo || s.name?.[0] || '?').slice(0, 2).toUpperCase();

function Chip({ s, side }) {
  return (
    <span className={`${styles.chip} ${styles['chip_' + side]}`}>
      {s.logoUrl
        ? <img src={s.logoUrl} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        : monogram(s)}
    </span>
  );
}

function Rail({ s, side, tag, points, reveal }) {
  return (
    <div className={`${styles.rail} ${styles['rail_' + side]}`}>
      <div className={styles.rhead}>
        <Chip s={s} side={side} />
        <div className={styles.rmeta}>
          <div className={styles.rtag}>{tag}</div>
          <div className={styles.rname}>{s.name || '—'}</div>
        </div>
      </div>
      <div className={styles.rrows}>
        {points.map((p, i) => {
          if (i >= reveal) return <div key={i} className={styles.rowOff} />;
          const hl = i === reveal - 1 ? styles['hl_' + side] : '';
          const val = side === 'left' ? p.left : p.right;
          return (
            <div key={i} className={`${styles.row} ${hl}`}>
              <div className={styles.rk}>{(p.label || '—').toUpperCase()}</div>
              <div className={styles.rv}>{val || '—'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Subject({ side, val, setter, tag, uploading, onLogo }) {
  return (
    <div className={`${styles.subj} ${styles['subj_' + side]}`}>
      <span className={styles.stag}>{tag}</span>
      <label className={styles.flabel}>Name</label>
      <input className={styles.input} value={val.name} placeholder={side === 'left' ? 'Claude' : 'ChatGPT'}
             onChange={e => setter(v => ({ ...v, name: e.target.value }))} />
      {/* logo row - directly under the name */}
      <label className={styles.flabel}>Logo</label>
      <div className={styles.logoRow}>
        <Chip s={val} side={side} />
        <input className={styles.mono} value={val.logo || ''} maxLength={2}
               placeholder={side === 'left' ? 'C' : 'G'}
               onChange={e => setter(v => ({ ...v, logo: e.target.value }))} />
        <label className={styles.uploadBtn}>
          <input type="file" accept="image/*" hidden
                 onChange={e => onLogo(side, e.target.files?.[0])} />
          {uploading === side ? 'Uploading…' : val.logoUrl ? 'Change' : 'Upload'}
        </label>
        {val.logoUrl && (
          <button type="button" className={styles.clearLogo} title="Remove image"
                  onClick={() => setter(v => ({ ...v, logoUrl: '' }))}>✕</button>
        )}
      </div>
      <span className={styles.hint}>Upload a logo - you're responsible for rights to images you add.</span>
    </div>
  );
}

export default function ComparisonSetup({
  open, onClose,
  enabled, setEnabled,
  left, setLeft,
  right, setRight,
  points, setPoints,
  uploadInsert,
}) {
  const [reveal, setReveal]       = useState(points.length);
  const [uploading, setUploading] = useState(null);
  const dialogRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement;
    setReveal(points.length);
    const t = setTimeout(() => dialogRef.current?.querySelector('input')?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line

  const handleClose = useCallback(() => {
    onClose?.();
    const el = restoreRef.current;
    if (el?.focus) setTimeout(() => el.focus(), 0);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); return; }
      if (e.key !== 'Tab') return;
      const f = [...dialogRef.current.querySelectorAll('button,input,[tabindex]:not([tabindex="-1"])')]
        .filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  if (!open) return null;

  const upd = (i, f, v) => setPoints(ps => ps.map((p, idx) => idx === i ? { ...p, [f]: v } : p));
  const addPoint = () => setPoints(ps => ps.length < 6 ? [...ps, { label: '', left: '', right: '', revealAtLine: '' }] : ps);
  const delPoint = (i) => setPoints(ps => ps.filter((_, idx) => idx !== i));

  const handleLogo = async (side, file) => {
    if (!file || !uploadInsert) return;
    setUploading(side);
    try {
      const url = await uploadInsert(file);
      (side === 'left' ? setLeft : setRight)(v => ({ ...v, logoUrl: url }));
    } catch (_e) { /* keep letter on failure */ }
    finally { setUploading(null); }
  };

  return (
    <div className={styles.backdrop} onMouseDown={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Comparison setup" ref={dialogRef}>
        <div className={styles.head}>
          <div className={styles.title}>Comparison setup<small>Solo · A vs B glass rails</small></div>
          <button type="button" className={styles.close} aria-label="Close" onClick={handleClose}>✕</button>
        </div>

        <div className={styles.split}>
          <div className={styles.preview}>
            <div className={styles.cap}>Live preview - how it looks on screen</div>
            <div className={styles.stage}>
              <div className={styles.host}>
                <HostAvatar className={styles.avatar} />
                <div className={styles.hl}>HOST VIDEO</div>
              </div>
              <Rail s={left}  side="left"  tag="OPTION A" points={points} reveal={reveal} />
              <Rail s={right} side="right" tag="OPTION B" points={points} reveal={reveal} />
            </div>
            <div className={styles.scrub}>
              <span>Reveal</span>
              <input type="range" min="0" max={points.length} value={reveal}
                     onChange={e => setReveal(+e.target.value)} />
              <b>{reveal} / {points.length}</b>
            </div>
            <div className={styles.note}>Drag to preview how points appear line-by-line as the host talks. Newest is highlighted.</div>
          </div>

          <div className={styles.controls}>
            <div className={styles.grpLabel}>The two subjects</div>
            <div className={styles.subjects}>
              <Subject side="left"  val={left}  setter={setLeft}  tag="Left · A"  uploading={uploading} onLogo={handleLogo} />
              <Subject side="right" val={right} setter={setRight} tag="Right · B" uploading={uploading} onLogo={handleLogo} />
            </div>

            <div className={styles.grpLabel} style={{ marginTop: 16 }}>Comparison points (max 6)</div>
            <div className={styles.colHead}><span>Label</span><span>Left value</span><span>Right value</span><span>Line</span><span /></div>
            <div className={styles.pts}>
              {points.map((p, i) => (
                <div key={i} className={styles.pt}>
                  <input className={styles.input} value={p.label}       placeholder="Reasoning" onChange={e => upd(i, 'label', e.target.value)} />
                  <input className={styles.input} value={p.left}        placeholder="Deep"      onChange={e => upd(i, 'left', e.target.value)} />
                  <input className={styles.input} value={p.right}       placeholder="Fast"      onChange={e => upd(i, 'right', e.target.value)} />
                  <input className={styles.input} value={p.revealAtLine} inputMode="numeric" placeholder="auto"
                         onChange={e => upd(i, 'revealAtLine', e.target.value.replace(/[^0-9]/g, ''))} />
                  <button type="button" className={styles.del} title="Remove" onClick={() => delPoint(i)}>✕</button>
                </div>
              ))}
            </div>
            {points.length < 6 && <button type="button" className={styles.addPt} onClick={addPoint}>+ Add point</button>}
            <p className={styles.note} style={{ marginTop: 8 }}>
              <b>Line</b> = the line number where that point appears (blank = auto-spaced across the episode).
            </p>
          </div>
        </div>

        <div className={styles.foot}>
          <label className={styles.switch}>
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            Comparison rails enabled for this episode
          </label>
          <div className={styles.footBtns}>
            <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={handleClose}>Cancel</button>
            <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={handleClose}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}