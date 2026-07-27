// src/components/Film/Storyboard.jsx
// Left panel: the storyboard grid. One surface, three data states (review →
// render → edit). Beats are a 2-column grid; cards stay a fixed 16:9 size in
// every state (text-only or with a clip) so the panel never jumps height.
// Rendered/final beats play INLINE inside their card; the finished film plays
// in an in-panel overlay.

import React, { useRef, useState, useCallback } from 'react';
import {
  IconPlay, IconRegenerate, IconCut, IconDuplicate, IconGrip, IconStop,
  IconSoftened, IconVisual, KIND_ICON,
} from './filmIcons';

const pad = n => String(n).padStart(2, '0');

function Thumb({ beat, stageState }) {
  const { index, kind, seconds, clipUrl, status } = beat;
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const Kico = KIND_ICON[kind] || IconVisual;

  const play = useCallback((e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const N = <span className="film-n">{pad(index)}</span>;
  const Dur = <span className="film-dur">{seconds}s</span>;

  // review: plan placeholder (never a clip)
  if (stageState === 'review') {
    return <div className="film-thumb film-thumb--plan">{N}<Kico s={20} /><span className="film-chip">Plan</span>{Dur}</div>;
  }

  // render: per-beat status
  if (stageState === 'render') {
    if (status === 'rendering') {
      return <div className="film-thumb film-thumb--rendering">{N}<span className="film-spin" /><span className="film-chip">Rendering…</span>{Dur}</div>;
    }
    if (status === 'done' && clipUrl) {
      return (
        <div className="film-thumb film-thumb--preview">
          <video ref={videoRef} className="film-thumb-vid" src={clipUrl} playsInline preload="metadata"
                 controls={playing} onEnded={() => setPlaying(false)} />
          {N}
          {!playing && <button className="film-play" onClick={play} aria-label="Play preview"><IconPlay s={16} /></button>}
          {!playing && <span className="film-chip">Preview</span>}
          {!playing && Dur}
        </div>
      );
    }
    return <div className="film-thumb film-thumb--queued">{N}<Kico s={20} /><span className="film-chip">Queued</span>{Dur}</div>;
  }

  // edit: final clip, plays inline
  return (
    <div className="film-thumb film-thumb--final">
      {clipUrl && <video ref={videoRef} className="film-thumb-vid" src={clipUrl} playsInline preload="metadata"
                         controls={playing} onEnded={() => setPlaying(false)} />}
      {N}
      {clipUrl && !playing && <button className="film-play" onClick={play} aria-label="Play shot"><IconPlay s={16} /></button>}
      {!playing && <span className="film-chip">Final</span>}
      {!playing && Dur}
    </div>
  );
}

function Cell({ beat, stageState, selected, onSelect, onRegenerate, onDuplicate, onCut }) {
  const { index, kind, speaker, caption, softened } = beat;
  const kindLabel = kind.replace('_', ' ');
  return (
    <article className={`film-cell${selected ? ' is-sel' : ''}`} onClick={() => onSelect(index)}>
      <Thumb beat={beat} stageState={stageState} />
      <div className="film-cfoot">
        <div className="film-cfoot-row">
          <span className={`film-badge film-badge--${kind}`}>{kindLabel}</span>
          {softened && <span className="film-soft"><IconSoftened s={12} /> Softened</span>}
        </div>
        <div className="film-cap">
          {speaker ? <><span className="film-spk">{speaker}:</span> “{caption}”</> : caption}
        </div>
        {stageState === 'edit' && (
          <div className="film-cell-ctrls" onClick={e => e.stopPropagation()}>
            <button className="film-ctrl film-ctrl--regen" onClick={() => onRegenerate(index)}><IconRegenerate s={13} /> Regenerate</button>
            <button className="film-ctrl" onClick={() => onDuplicate(index)}><IconDuplicate s={13} /> Duplicate</button>
            <button className="film-ctrl film-ctrl--cut" onClick={() => onCut(index)}><IconCut s={13} /> Cut</button>
            <span className="film-grip" title="Drag to reorder"><IconGrip s={15} /></span>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Storyboard({
  stageState = 'empty',
  beats = [],
  selectedBeat = null,
  progress = null,
  finalUrl = null,
  editBusy = null,
  onSelectBeat = () => {},
  onGenerate = () => {},
  onExport = () => {},
  onStop = () => {},
  onRegenerate = () => {},
  onDuplicate = () => {},
  onCut = () => {},
}) {
  const [watching, setWatching] = useState(false);
  const total = beats.length;
  const totalSecs = beats.reduce((a, b) => a + (b.seconds || 0), 0);

  const sub =
    stageState === 'review' ? `${total} shots · ~${totalSecs}s · nothing rendered yet`
    : stageState === 'render' ? `${(progress && progress.done) || 0}/${(progress && progress.total) || total} rendered`
    : stageState === 'edit' ? `${total} shots · ${totalSecs}s`
    : 'no shots yet';

  const cta =
    stageState === 'review' ? <button className="film-btn film-btn--primary" onClick={onGenerate}>Generate film</button>
    : stageState === 'edit' ? (
        <div className="film-head-actions">
          {finalUrl && <button className="film-btn film-btn--primary" onClick={() => setWatching(true)}><IconPlay s={14} /> Play film</button>}
          <button className="film-btn film-btn--ghost" onClick={onExport}>Export</button>
        </div>
      )
    : null;

  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="film-pcontent">
      <div className="film-phead">
        <div className="film-htabs">
          <span className="film-htab is-on">Storyboard</span>
          <span className="film-hsub">{sub}</span>
        </div>
        {cta}
      </div>

      <div className="film-stage">
        {stageState === 'empty' || total === 0 ? (
          <div className="film-empty">
            <div className="film-empty-mark"><IconVisual s={26} /></div>
            <h3>Your storyboard appears here</h3>
            <p>Write your film in the chat. When the script’s ready, build it and the shots land here to review.</p>
          </div>
        ) : (
          <div className="film-grid">
            {beats.map((b, i) => (
              <Cell key={`${b.index}-${b.pos != null ? b.pos : i}`} beat={b} stageState={stageState}
                selected={selectedBeat === b.index} onSelect={onSelectBeat}
                onRegenerate={onRegenerate} onDuplicate={onDuplicate} onCut={onCut} />
            ))}
          </div>
        )}
      </div>

      {stageState === 'render' && progress && (
        <div className="film-prog">
          <span className="film-live">Live</span>
          <div className="film-prog-bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="film-prog-lbl"><b>Rendering {progress.done} of {progress.total}</b>{progress.etaText ? ` · ${progress.etaText}` : ''}</div>
          <button className="film-btn film-btn--ghost" style={{ padding: '7px 12px' }} onClick={onStop}><IconStop s={13} /> Stop after shot</button>
        </div>
      )}

      {watching && finalUrl && (
        <div className="film-player-overlay" onClick={() => setWatching(false)}>
          <div className="film-player-box" onClick={e => e.stopPropagation()}>
            <button className="film-player-close" onClick={() => setWatching(false)} aria-label="Close">×</button>
            <video src={finalUrl} controls autoPlay playsInline className="film-player-vid" />
          </div>
        </div>
      )}

      {editBusy && (
        <div className="film-edit-overlay">
          <div className="film-edit-card">
            <div className="film-spin" />
            <span>{editBusy}</span>
            <small>keeping every other shot as-is</small>
          </div>
        </div>
      )}
    </div>
  );
}