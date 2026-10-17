// src/components/PodcastStudio/HookPopover.jsx
//
// The "Opening hook" pop-out, opened from the Visual panel's Episode-wide section
// or the hook chip on line 1. Same centred shell as OverlayTypePopover.
//
//   left  — a taste of what to expect: a 16:9 mini frame (your host in your studio
//           when we have that still, else the studio + silhouette) playing the hook
//           on a loop, with the same motion as the render (words rise in, the punch
//           word gets its indigo underline, numbers count up). ↻ replays.
//   right — the choices: kind (Headline · Stat · Question · Versus*), the words,
//           the punch word (tap a word), 3 / 4 / 5 seconds, and ✨ Suggest again.
//           * Versus only when the episode has a comparison.
//   foot  — "Show this hook" switch + Done. Free: drawn over the video.
//
// Controlled: `draft` is the hook object ({kind, eyebrow, text, number, label,
// left, right, dur}); every edit calls onChange(nextDraft). The AI's options
// arrive in `suggestion` ({options:[hook…], reason}); switching kind adopts the
// AI's option of that kind when there is one.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './HookPopover.module.css';
import HostAvatar from './HostAvatar';
import { plainHookText } from './podcastExtras';

const KINDS = [
  { id: 'headline', label: 'Headline', tip: 'A few bold words — the tension or surprise in your opening' },
  { id: 'stat',     label: 'Stat',     tip: 'A number that counts up — when your opening has a striking figure' },
  { id: 'question', label: 'Question', tip: 'The question this episode answers' },
  { id: 'versus',   label: 'Versus',   tip: 'A vs B — for comparison episodes' },
];
const DURS = [3, 4, 5];

// "-38%" → parts; "$2.4M", "5,000+" (same rules as the renderer's HookCard)
function parseNumber(s) {
  const m = /^([^\d\-−]*)([\-−]?)([\d][\d,]*(?:\.\d+)?)(.*)$/.exec((s || '').trim());
  if (!m) return null;
  const raw = m[3];
  return { pre: m[1], sign: m[2], n: Number(raw.replace(/,/g, '')),
           dec: (raw.split('.')[1] || '').length, comma: raw.includes(','), post: m[4] };
}
function formatNumber(p, v) {
  let s = v.toFixed(p.dec);
  if (p.comma) {
    const [i, d] = s.split('.');
    s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? `.${d}` : '');
  }
  return `${p.pre}${p.sign}${s}${p.post}`;
}
function tokens(text) {
  const out = [];
  let inEmph = false;
  for (const raw of (text || '').split(/\s+/).filter(Boolean)) {
    let w = raw, emph = inEmph;
    if (w.startsWith('*')) { emph = true; inEmph = true; w = w.slice(1); }
    const closes = /\*[^\w]*$/.test(w);
    w = w.replace(/\*/g, '');
    if (closes) inEmph = false;
    if (w) out.push({ w, emph });
  }
  return out;
}
// rebuild text with the punch word at index i (or none when i < 0)
function withPunch(plain, i) {
  return plain.split(/\s+/).filter(Boolean)
    .map((w, j) => (j === i ? `*${w}*` : w)).join(' ');
}

function CountUp({ value, playKey }) {
  const p = useMemo(() => parseNumber(value), [value]);
  const [shown, setShown] = useState(p ? formatNumber(p, 0) : value);
  useEffect(() => {
    if (!p) { setShown(value); return undefined; }
    let raf; const t0 = performance.now() + 280;
    const tick = (now) => {
      const x = Math.min(1, Math.max(0, (now - t0) / 1100));
      const e = 1 - Math.pow(1 - x, 3);
      setShown(formatNumber(p, p.n * e));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [p, value, playKey]);
  return <>{shown}</>;
}

function MiniHook({ draft, playKey }) {
  const kind = draft.kind || 'headline';
  let body;
  if (kind === 'stat') {
    body = (
      <>
        <div className={styles.mStat}><CountUp value={draft.number} playKey={playKey} /></div>
        {draft.label ? <div className={styles.mLabel}>{draft.label}</div> : null}
      </>
    );
  } else if (kind === 'versus') {
    body = (
      <div className={styles.mVs}>
        <div className={styles.mVsName} style={{ animationDelay: '0.28s' }}>{draft.left || 'A'}</div>
        <div className={styles.mVsPill}>VS</div>
        <div className={styles.mVsName} style={{ animationDelay: '0.53s' }}>{draft.right || 'B'}</div>
      </div>
    );
  } else {
    body = (
      <div className={`${styles.mWords} ${kind === 'question' ? styles.mQuestion : ''}`}>
        {kind === 'question' ? <span className={styles.mQ} aria-hidden="true">?</span> : null}
        {tokens(draft.text).map((t, i) => (
          <span key={i} className={`${styles.mWord} ${t.emph ? styles.mEmph : ''}`}
                style={{ animationDelay: `${0.28 + i * 0.085}s` }}>
            {t.w}
            {t.emph ? <span className={styles.mUnder} style={{ animationDelay: `${0.46 + i * 0.085}s` }} /> : null}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className={styles.mCard} key={playKey}
         style={{ animationDuration: `${draft.dur || 4}s` }}>
      {draft.eyebrow ? <div className={styles.mEyebrow}><span />{draft.eyebrow}</div> : null}
      {body}
    </div>
  );
}

export default function HookPopover({
  draft,
  enabled = false,
  suggestion = null,
  suggesting = false,
  comparison = null,          // { left, right } names when the episode has one
  backdropUrl = null,         // host-in-studio still (or the studio) for the preview
  onChange,
  onToggle,
  onSuggest,
  onClose,
}) {
  const d = draft || { kind: 'headline', text: '', dur: 4 };
  const kind = d.kind || 'headline';
  const [playKey, setPlayKey] = useState(0);
  const loopRef = useRef(null);

  // loop the preview; restart it whenever the content changes
  const sig = JSON.stringify([d.kind, d.eyebrow, d.text, d.number, d.label, d.left, d.right, d.dur]);
  useEffect(() => {
    setPlayKey((k) => k + 1);
    clearInterval(loopRef.current);
    loopRef.current = setInterval(() => setPlayKey((k) => k + 1), ((d.dur || 4) + 1.4) * 1000);
    return () => clearInterval(loopRef.current);
  }, [sig]);

  // Esc closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const options = suggestion?.options || [];
  const set = (patch) => onChange?.({ ...d, ...patch });

  const pickKind = (k) => {
    if (k === kind) return;
    const ai = options.find((o) => o.kind === k);
    if (ai) { onChange?.({ ...ai, dur: d.dur || ai.dur || 4 }); return; }
    if (k === 'versus') { set({ kind: k, left: d.left || comparison?.left || '', right: d.right || comparison?.right || '' }); return; }
    if (k === 'stat') { set({ kind: k }); return; }
    // headline ↔ question keep the words
    let text = d.text || '';
    if (k === 'question' && text && !/\?$/.test(plainHookText(text))) text = `${text.replace(/[.!]+$/, '')}?`;
    if (k === 'headline') text = text.replace(/\?$/, '');
    set({ kind: k, text });
  };

  const plain = plainHookText(d.text);
  const words = plain.split(/\s+/).filter(Boolean);
  const punchIdx = tokens(d.text).findIndex((t) => t.emph);
  const editText = (v) => {
    // keep the punch on the same word if it's still there
    const prevWord = punchIdx >= 0 ? words[punchIdx] : null;
    const nw = v.split(/\s+/).filter(Boolean);
    const j = prevWord ? nw.indexOf(prevWord) : -1;
    set({ text: j >= 0 ? withPunch(v, j) : v });
  };

  const kinds = KINDS.filter((k) => k.id !== 'versus' || comparison);
  const ready = kind === 'stat' ? /\d/.test(d.number || '')
    : kind === 'versus' ? !!((d.left || '').trim() && (d.right || '').trim())
    : !!plain.trim();

  return (
    <div className={styles.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={styles.pop} role="dialog" aria-label="Opening hook">
        <div className={styles.pophead}>
          <span className={styles.ic} aria-hidden="true">🪝</span>
          <div className={styles.t}>Opening hook<small>The first {d.dur || 4} seconds · keeps viewers watching</small></div>
          <button type="button" className={styles.x} aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* ── the taste ── */}
          <div className={styles.col}>
            <div className={styles.grp}>Preview</div>
            <div className={styles.stage}>
              {backdropUrl
                ? <img className={styles.bg} src={backdropUrl} alt="" />
                : <><div className={styles.bgFallback} /><div className={styles.host}><HostAvatar size="78%" /></div></>}
              {ready ? <MiniHook draft={d} playKey={playKey} /> : null}
              <button type="button" className={styles.replay} onClick={() => setPlayKey((k) => k + 1)}
                      aria-label="Replay preview">↻</button>
            </div>
            <p className={styles.hint}>
              Sits on the left, clear of your face; captions move beside it while it’s up.
              {comparison ? ' Your comparison table follows once it leaves.' : ''}
            </p>
            {suggestion?.reason ? (
              <p className={styles.why}><b>Why this hooks:</b> {suggestion.reason}</p>
            ) : null}
          </div>

          {/* ── the choices ── */}
          <div className={styles.col}>
            <div className={styles.grp}>Kind</div>
            <div className={styles.pillStrip}>
              {kinds.map((k) => (
                <button key={k.id} type="button" title={k.tip}
                        className={`${styles.pillBtn} ${kind === k.id ? styles.pillOn : ''}`}
                        onClick={() => pickKind(k.id)}>
                  {k.label}{options.some((o) => o.kind === k.id) ? <span className={styles.aiDot} title="AI suggestion" /> : null}
                </button>
              ))}
            </div>

            <div className={styles.field}>
              <label>Kicker <span className={styles.opt}>optional · 1–3 words</span></label>
              <input className={styles.input} maxLength={28} value={d.eyebrow || ''}
                     placeholder="e.g. The hidden cost" onChange={(e) => set({ eyebrow: e.target.value })} />
            </div>

            {kind === 'stat' ? (
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Number</label>
                  <input className={styles.input} maxLength={12} value={d.number || ''}
                         placeholder="5,000" onChange={(e) => set({ number: e.target.value })} />
                </div>
                <div className={styles.field} style={{ flex: 2 }}>
                  <label>What it counts</label>
                  <input className={styles.input} maxLength={48} value={d.label || ''}
                         placeholder="new users, zero ad spend" onChange={(e) => set({ label: e.target.value })} />
                </div>
              </div>
            ) : kind === 'versus' ? (
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Option A</label>
                  <input className={styles.input} maxLength={24} value={d.left || ''}
                         onChange={(e) => set({ left: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>Option B</label>
                  <input className={styles.input} maxLength={24} value={d.right || ''}
                         onChange={(e) => set({ right: e.target.value })} />
                </div>
              </div>
            ) : (
              <>
                <div className={styles.field}>
                  <label>{kind === 'question' ? 'The question' : 'Headline'} <span className={styles.opt}>up to {kind === 'question' ? 10 : 7} words</span></label>
                  <input className={styles.input} maxLength={64} value={plain}
                         placeholder={kind === 'question' ? 'Is AI making us worse at thinking?' : "Your AI bill isn't the model."}
                         onChange={(e) => editText(e.target.value)} />
                </div>
                {words.length ? (
                  <div className={styles.field}>
                    <label>Punch word <span className={styles.opt}>tap one — it turns indigo</span></label>
                    <div className={styles.words}>
                      {words.map((w, i) => (
                        <button key={`${w}-${i}`} type="button"
                                className={`${styles.word} ${i === punchIdx ? styles.wordOn : ''}`}
                                onClick={() => set({ text: withPunch(plain, i === punchIdx ? -1 : i) })}>
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}

            <div className={styles.field}>
              <label>On screen for</label>
              <div className={styles.pillStrip} style={{ margin: 0 }}>
                {DURS.map((s) => (
                  <button key={s} type="button"
                          className={`${styles.pillBtn} ${(d.dur || 4) === s ? styles.pillOn : ''}`}
                          onClick={() => set({ dur: s })}>{s} seconds</button>
                ))}
              </div>
            </div>

            <button type="button" className={styles.suggest} onClick={onSuggest} disabled={suggesting}>
              {suggesting ? 'Reading your opening…' : '✨ Suggest again'}
            </button>
          </div>
        </div>

        <div className={styles.foot}>
          <label className={styles.toggle}>
            <span className={styles.sw}>
              <input type="checkbox" checked={!!enabled && ready} disabled={!ready}
                     onChange={(e) => onToggle?.(e.target.checked)} />
              <span />
            </span>
            Show this hook
          </label>
          <span className={styles.hintFoot}>Free — drawn over your video.</span>
          <button type="button" className={styles.done} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}