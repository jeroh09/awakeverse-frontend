// src/components/PodcastStudio/DataCardPopover.jsx
//
// The "Data card" pop-out, opened from the Visual panel (type ▤ Data card) or by
// accepting a "Show stat / Show chart" suggestion. Same centred shell as the hook
// and sound pop-outs (portal to <body>, header + footer pinned, middle scrolls).
//
//   left  — a taste of the result: your host still with the card at the chosen
//           position, animating like the render (number counts up, % ring fills,
//           bars grow), ↻ to replay; then the position picker.
//   right — the choices: Stat or Chart, the numbers and words, ✨ Fill from this line
//           (the AI reads the line and fills the card — only with numbers the line
//           actually says).
//
// Controlled: `ov` is the line's overlay ({mode:'data', preset, data}); every edit
// calls onPatch(partialOverlay). vertical (2026-10-18): a 9:16 solo episode — tall
// preview and the vertical positions (podcastFormat.js); ov.preset arrives mapped. Card shape matches podcast_datacard.py:
//   stat  {kind, number, label?, sub?, trend?: 'up'|'down'}
//   chart {kind, title?, unit?, bars:[{label, value}], highlight?}

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './DataCardPopover.module.css';
import HostAvatar from './HostAvatar';
import { PRESETS_VERTICAL, PRESET_RECT_VERTICAL } from './podcastFormat';

// preset → [left%, top%, width%, height%] of the 16:9 frame (podcast_overlays._preset_rect)
export const PRESET_RECT = {
  side_panel_left: [3.75, 14.03, 33.98, 71.94], side_panel_right: [62.27, 14.03, 33.98, 71.94],
  corner_card_tl: [3.75, 6.67, 25.94, 25.83], corner_card_tr: [70.31, 6.67, 25.94, 25.83],
  corner_card_bl: [3.75, 67.5, 25.94, 25.83], corner_card_br: [70.31, 67.5, 25.94, 25.83],
  lower_third: [3.75, 71.39, 92.5, 21.94],
  corner_small_tl: [3.75, 6.67, 17.97, 17.92], corner_small_tr: [78.28, 6.67, 17.97, 17.92],
  corner_small_bl: [3.75, 75.42, 17.97, 17.92], corner_small_br: [78.28, 75.42, 17.97, 17.92],
  lower_third_small_left: [3.75, 78.33, 55, 15], lower_third_small_right: [41.25, 78.33, 55, 15],
};
const POS_SOLO = [
  ['side_panel_left', 'Left panel'], ['side_panel_right', 'Right panel'],
  ['corner_card_tl', 'Top left'], ['corner_card_tr', 'Top right'],
  ['corner_card_bl', 'Bottom left'], ['corner_card_br', 'Bottom right'], ['lower_third', 'Bottom bar'],
];
const POS_MULTI = [
  ['corner_small_tl', 'Top left'], ['corner_small_tr', 'Top right'],
  ['corner_small_bl', 'Bottom left'], ['corner_small_br', 'Bottom right'],
  ['lower_third_small_left', 'Lower left bar'], ['lower_third_small_right', 'Lower right bar'],
];
const MAX_BARS = 6;

function parseNumber(s) {
  const m = /^([^\d\-−]*)([\-−]?)([\d][\d,]*(?:\.\d+)?)(.*)$/.exec((s || '').trim());
  if (!m) return null;
  const raw = m[3];
  return { pre: m[1], sign: m[2], n: Number(raw.replace(/,/g, '')),
           dec: (raw.split('.')[1] || '').length, comma: raw.includes(','), post: m[4] };
}
function formatNumber(p, v) {
  let s = v.toFixed(p.dec);
  if (p.comma) { const [i, d] = s.split('.'); s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? `.${d}` : ''); }
  return `${p.pre}${p.sign}${s}${p.post}`;
}
const toNum = (v) => { const n = Number(String(v ?? '').replace(/,/g, '').trim()); return Number.isFinite(n) ? n : null; };
function compact(v) {
  const a = Math.abs(v);
  if (a >= 1e9) return `${+(v / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${+(v / 1e6).toFixed(1)}M`;
  if (a >= 1e4) return `${+(v / 1e3).toFixed(0)}k`;
  if (a >= 1e3) return `${+(v / 1e3).toFixed(1)}k`;
  return Number.isInteger(v) ? `${v}` : `${+v.toFixed(1)}`;
}

// Is this card complete enough to render? (same rules as the backend)
export function dataCardReady(d) {
  if (!d) return false;
  if (d.kind === 'chart') return (d.bars || []).filter(b => (b.label || '').trim() && toNum(b.value) !== null).length >= 2;
  return /\d/.test(d.number || '');
}
// The card as the session payload wants it (numbers as numbers, blanks dropped).
export function dataCardPayload(d) {
  if (d.kind === 'chart') {
    const bars = (d.bars || []).filter(b => (b.label || '').trim() && toNum(b.value) !== null)
      .slice(0, MAX_BARS).map(b => ({ label: b.label.trim(), value: toNum(b.value) }));
    const out = { kind: 'chart', bars };
    if ((d.title || '').trim()) out.title = d.title.trim();
    if ((d.unit || '').trim()) out.unit = d.unit.trim();
    if (Number.isInteger(d.highlight) && d.highlight >= 0 && d.highlight < bars.length) out.highlight = d.highlight;
    return out;
  }
  const out = { kind: 'stat', number: (d.number || '').trim() };
  ['label', 'sub'].forEach(k => { if ((d[k] || '').trim()) out[k] = d[k].trim(); });
  if (d.trend === 'up' || d.trend === 'down') out.trend = d.trend;
  return out;
}
export function dataCardSummary(d) {
  if (!d) return '';
  if (d.kind === 'chart') return d.title || `${(d.bars || []).length} bars`;
  return [d.number, d.label].filter(Boolean).join(' ');
}

function CountUp({ value, playKey }) {
  const p = useMemo(() => parseNumber(value), [value]);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!p) { setShown(value); return undefined; }
    let raf; const t0 = performance.now() + 300;
    const tick = (now) => {
      const x = Math.min(1, Math.max(0, (now - t0) / 1100));
      setShown(formatNumber(p, p.n * (1 - Math.pow(1 - x, 3))));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [p, value, playKey]);
  return <>{shown}</>;
}

function MiniCard({ d, rect, playKey, frameRatio = 16 / 9 }) {
  const [l, t, w, h] = rect;
  const ratio = (w / h) * frameRatio;               // the card's real shape on the frame
  const wide = ratio > 2.2;
  const p = d.kind === 'stat' ? parseNumber(d.number) : null;
  const pct = p && /%/.test(p.post) && p.n >= 0 && p.n <= 100 ? p.n / 100 : null;
  let body;
  if (d.kind === 'chart') {
    const bars = (d.bars || []).filter(b => toNum(b.value) !== null);
    const max = Math.max(...bars.map(b => Math.abs(toNum(b.value))), 1e-9);
    body = (
      <>
        {d.title ? <div className={styles.cTitle}><span />{d.title}</div> : null}
        <div className={wide ? styles.hBars : styles.vBars}>
          {bars.map((b, i) => {
            const frac = Math.abs(toNum(b.value)) / max;
            const on = i === d.highlight;
            return wide ? (
              <div key={i} className={styles.hRow}>
                <span className={styles.hLab}>{b.label}</span>
                <span className={styles.hTrack}>
                  <span className={`${styles.hBar} ${on ? styles.barOn : ''}`}
                        style={{ width: `${frac * 100}%`, animationDelay: `${0.3 + i * 0.12}s` }} />
                  <b>{compact(toNum(b.value))}{d.unit || ''}</b>
                </span>
              </div>
            ) : (
              <div key={i} className={styles.vCol}>
                <b>{compact(toNum(b.value))}{d.unit || ''}</b>
                <span className={`${styles.vBar} ${on ? styles.barOn : ''}`}
                      style={{ height: `${Math.max(2, frac * 100)}%`, animationDelay: `${0.3 + i * 0.12}s` }} />
                <i>{b.label}</i>
              </div>
            );
          })}
        </div>
      </>
    );
  } else {
    const r = 20, c = 2 * Math.PI * r;
    body = (
      <div className={wide ? styles.sRow : styles.sCol}>
        {d.label && !wide ? <div className={styles.sLabel}><span />{d.label}</div> : null}
        <div className={styles.sMain}>
          <div className={styles.sNum}><CountUp value={d.number} playKey={playKey} /></div>
          {pct != null ? (
            <svg className={styles.ring} viewBox="0 0 48 48">
              <circle cx="24" cy="24" r={r} className={styles.ringBg} />
              <circle cx="24" cy="24" r={r} className={styles.ringFg}
                      style={{ strokeDasharray: `${c * pct} ${c}`, '--c': c }} />
            </svg>
          ) : null}
        </div>
        <div className={styles.sSide}>
          {d.label && wide ? <div className={styles.sLabel}><span />{d.label}</div> : null}
          {d.sub ? <div className={styles.sSub}>{d.sub}</div> : null}
          {d.trend ? <span className={`${styles.trend} ${d.trend === 'up' ? styles.up : styles.down}`}>
            {d.trend === 'up' ? '▲ up' : '▼ down'}</span> : null}
        </div>
      </div>
    );
  }
  return (
    <div key={playKey} className={styles.card}
         style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }}>
      <div className={styles.cardIn}>{body}</div>
    </div>
  );
}

export default function DataCardPopover({
  ov = {},
  multi = false,
  vertical = false,
  backdropUrl = null,
  lineText = '',
  filling = false,
  fillNote = null,             // e.g. "No numbers in this line" after a fill attempt
  onPatch,
  onFill,
  onRemove,
  onClose,
}) {
  const d = ov.data || { kind: 'stat', number: '' };
  const kind = d.kind || 'stat';
  const vert = vertical && !multi;
  const preset = ov.preset || (multi ? 'corner_small_tr' : vert ? 'top_card' : 'side_panel_right');
  const rect = vert ? (PRESET_RECT_VERTICAL[preset] || PRESET_RECT_VERTICAL.top_card)
                    : (PRESET_RECT[preset] || PRESET_RECT.side_panel_right);
  const [playKey, setPlayKey] = useState(0);
  const sig = JSON.stringify([d, preset]);
  useEffect(() => { setPlayKey(k => k + 1); }, [sig]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setData = (patch) => onPatch?.({ data: { ...d, ...patch } });
  const pickKind = (k) => {
    if (k === kind) return;
    if (k === 'chart') {
      const seed = (d.bars && d.bars.length >= 2) ? d.bars : [{ label: '', value: '' }, { label: '', value: '' }];
      onPatch?.({ data: { kind: 'chart', title: d.title || d.label || '', unit: d.unit || '', bars: seed, highlight: d.highlight ?? 1 } });
    } else {
      onPatch?.({ data: { kind: 'stat', number: d.number || '', label: d.label || d.title || '', sub: d.sub || '', trend: d.trend } });
    }
  };
  const bars = d.bars || [];
  const setBar = (i, patch) => setData({ bars: bars.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const ready = dataCardReady(d);
  const positions = vert ? PRESETS_VERTICAL.map(([id, lbl]) => [id, lbl]) : multi ? POS_MULTI : POS_SOLO;

  return createPortal(
    <div className={styles.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={styles.pop} role="dialog" aria-label="Data card">
        <div className={styles.pophead}>
          <span className={styles.ic} aria-hidden="true">▤</span>
          <div className={styles.t}>Data card<small>Your numbers, designed — free, exact, no image needed</small></div>
          <button type="button" className={styles.x} aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.col}>
            <div className={styles.grp}>Preview</div>
            <div className={styles.stage}
                 style={vert ? { aspectRatio: '9 / 16', width: 'min(100%, 240px)', margin: '0 auto' } : undefined}>
              {backdropUrl
                ? <img className={styles.bg} src={backdropUrl} alt="" />
                : <><div className={styles.bgFallback} /><div className={styles.host}
                       style={vert ? { left: '12%', width: '76%', height: '60%' } : undefined}><HostAvatar size="78%" /></div></>}
              {ready ? <MiniCard d={d} rect={rect} playKey={playKey} frameRatio={vert ? 9 / 16 : 16 / 9} /> : (
                <div className={styles.ghost} style={{ left: `${rect[0]}%`, top: `${rect[1]}%`, width: `${rect[2]}%`, height: `${rect[3]}%` }}>
                  {kind === 'chart' ? 'Add at least 2 bars' : 'Add a number'}
                </div>
              )}
              <button type="button" className={styles.replay} onClick={() => setPlayKey(k => k + 1)} aria-label="Replay preview">↻</button>
            </div>
            {lineText ? <p className={styles.quote}>“{lineText.slice(0, 120)}{lineText.length > 120 ? '…' : ''}”</p> : null}
            <div className={styles.grp} style={{ marginTop: 12 }}>Position</div>
            <div className={styles.posGrid}>
              {positions.map(([id, lbl]) => (
                <button key={id} type="button" className={`${styles.pos} ${preset === id ? styles.posOn : ''}`}
                        onClick={() => onPatch?.({ preset: id })}>{lbl}</button>
              ))}
            </div>
          </div>

          <div className={styles.col}>
            <div className={styles.grp}>Kind</div>
            <div className={styles.pillStrip}>
              {[['stat', 'Stat'], ['chart', 'Chart']].map(([k, lbl]) => (
                <button key={k} type="button" className={`${styles.pillBtn} ${kind === k ? styles.pillOn : ''}`}
                        onClick={() => pickKind(k)}>{lbl}</button>
              ))}
            </div>

            {kind === 'stat' ? (
              <>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Number</label>
                    <input className={styles.input} maxLength={12} value={d.number || ''} placeholder="-38%"
                           onChange={(e) => setData({ number: e.target.value })} />
                  </div>
                  <div className={styles.field} style={{ flex: 2 }}>
                    <label>What it counts</label>
                    <input className={styles.input} maxLength={48} value={d.label || ''} placeholder="drop in churn"
                           onChange={(e) => setData({ label: e.target.value })} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Context <span className={styles.opt}>optional</span></label>
                  <input className={styles.input} maxLength={48} value={d.sub || ''} placeholder="in three months"
                         onChange={(e) => setData({ sub: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>Trend</label>
                  <div className={styles.pillStrip} style={{ margin: 0 }}>
                    {[[undefined, 'None'], ['up', '▲ Up'], ['down', '▼ Down']].map(([v, lbl]) => (
                      <button key={lbl} type="button" className={`${styles.pillBtn} ${d.trend === v ? styles.pillOn : ''}`}
                              onClick={() => setData({ trend: v })}>{lbl}</button>
                    ))}
                  </div>
                </div>
                <p className={styles.hint}>A percentage between 0 and 100 also gets a ring that fills to the value.</p>
              </>
            ) : (
              <>
                <div className={styles.row2}>
                  <div className={styles.field} style={{ flex: 3 }}>
                    <label>Title</label>
                    <input className={styles.input} maxLength={48} value={d.title || ''} placeholder="New users a week"
                           onChange={(e) => setData({ title: e.target.value })} />
                  </div>
                  <div className={styles.field}>
                    <label>Unit <span className={styles.opt}>opt.</span></label>
                    <input className={styles.input} maxLength={6} value={d.unit || ''} placeholder="%"
                           onChange={(e) => setData({ unit: e.target.value })} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Bars <span className={styles.opt}>tap ● to highlight the one you’re talking about</span></label>
                  {bars.map((b, i) => (
                    <div key={i} className={styles.barRow}>
                      <button type="button" title="Highlight this bar"
                              className={`${styles.dot} ${d.highlight === i ? styles.dotOn : ''}`}
                              onClick={() => setData({ highlight: d.highlight === i ? -1 : i })} />
                      <input className={styles.input} maxLength={14} value={b.label} placeholder={`Label ${i + 1}`}
                             onChange={(e) => setBar(i, { label: e.target.value })} />
                      <input className={`${styles.input} ${styles.val}`} inputMode="decimal" value={b.value}
                             placeholder="0" onChange={(e) => setBar(i, { value: e.target.value })} />
                      <button type="button" className={styles.rm} aria-label="Remove bar" disabled={bars.length <= 2}
                              onClick={() => setData({ bars: bars.filter((_, j) => j !== i),
                                                       highlight: d.highlight === i ? -1 : (d.highlight > i ? d.highlight - 1 : d.highlight) })}>✕</button>
                    </div>
                  ))}
                  {bars.length < MAX_BARS ? (
                    <button type="button" className={styles.add}
                            onClick={() => setData({ bars: [...bars, { label: '', value: '' }] })}>＋ Add bar</button>
                  ) : null}
                </div>
              </>
            )}

            <button type="button" className={styles.suggest} onClick={onFill} disabled={filling || !lineText}>
              {filling ? 'Reading the line…' : '✨ Fill from this line'}
            </button>
            {fillNote ? <p className={styles.hint} style={{ marginTop: 6 }}>{fillNote}</p> : null}
          </div>
        </div>

        <div className={styles.foot}>
          <button type="button" className={styles.remove} onClick={onRemove}>Remove card</button>
          <span className={styles.hintFoot}>Free — drawn over your video, numbers exactly as typed.</span>
          <button type="button" className={styles.done} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}