// src/components/Film/Storyboard.jsx
// Left panel: the storyboard grid. One surface, three data states driven by the
// job (review → render → edit) — never a different panel, just different content.
// Beats are a 2-column grid; the panel scrolls internally for more than ~6.

import React from 'react';
import {
  IconPlay, IconRegenerate, IconCut, IconDuplicate, IconGrip, IconStop,
  IconSoftened, IconVisual, KIND_ICON,
} from './filmIcons';

const pad = n => String(n).padStart(2, '0');

function Thumb({ beat, stageState }) {
  const { index, kind, seconds, clipUrl, status } = beat;
  const N = <span className="film-n">{pad(index)}</span>;
  const Dur = <span className="film-dur">{seconds}s</span>;
  const Kico = KIND_ICON[kind] || IconVisual;

  // review: plan placeholder
  if (stageState === 'review') {
    return (
      <div className="film-thumb film-thumb--plan">
        {N}<Kico s={20} /><span className="film-chip">Plan</span>{Dur}
      </div>
    );
  }
  // render: per-beat status
  if (stageState === 'render') {
    if (status === 'rendering') {
      return <div className="film-thumb film-thumb--rendering">{N}<span className="film-spin" /><span className="film-chip">Rendering…</span>{Dur}</div>;
    }
    if (status === 'done') {
      return (
        <div className="film-thumb film-thumb--preview">
          {clipUrl && <video src={clipUrl} muted playsInline preload="metadata" className="film-thumb-vid" />}
          {N}<span className="film-play"><IconPlay s={16} /></span><span className="film-chip">Preview</span>{Dur}
        </div>
      );
    }
    return <div className="film-thumb film-thumb--queued">{N}<Kico s={20} /><span className="film-chip">Queued</span>{Dur}</div>;
  }
  // edit: final
  return (
    <div className="film-thumb film-thumb--final">
      {clipUrl && <video src={clipUrl} muted playsInline preload="metadata" className="film-thumb-vid" />}
      {N}<span className="film-play"><IconPlay s={16} /></span><span className="film-chip">Final</span>{Dur}
    </div>
  );
}

function Cell({ beat, stageState, selected, onSelect, onRegenerate, onDuplicate, onCut }) {
  const { index, kind, speaker, caption, softened } = beat;
  const kindLabel = kind.replace('_', ' ');
  return (
    <article
      className={`film-cell${selected ? ' is-sel' : ''}`}
      onClick={() => onSelect(index)}
    >
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
            <button className="film-ctrl film-ctrl--regen" onClick={() => onRegenerate(index)}>
              <IconRegenerate s={13} /> Regenerate
            </button>
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
  progress = null,               // { done, total, etaText }
  onSelectBeat = () => {},
  onGenerate = () => {},
  onExport = () => {},
  onStop = () => {},
  onRegenerate = () => {},
  onDuplicate = () => {},
  onCut = () => {},
}) {
  const total = beats.length;
  const totalSecs = beats.reduce((a, b) => a + (b.seconds || 0), 0);

  const sub =
    stageState === 'review' ? `${total} shots · ~${totalSecs}s · nothing rendered yet`
    : stageState === 'render' ? 'streaming beats as they finish'
    : stageState === 'edit' ? `${total} shots · ${totalSecs}s · drag, cut, regenerate`
    : 'no shots yet';

  const cta =
    stageState === 'review' ? <button className="film-btn film-btn--primary" onClick={onGenerate}>Generate film</button>
    : stageState === 'edit' ? <button className="film-btn film-btn--ghost" onClick={onExport}>Export</button>
    : null;

  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="film-pcontent">
      <div className="film-phead">
        <div className="film-phead-ttl">Storyboard <span className="film-sub">{sub}</span></div>
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
            {beats.map(b => (
              <Cell
                key={b.index}
                beat={b}
                stageState={stageState}
                selected={selectedBeat === b.index}
                onSelect={onSelectBeat}
                onRegenerate={onRegenerate}
                onDuplicate={onDuplicate}
                onCut={onCut}
              />
            ))}
          </div>
        )}
      </div>

      {stageState === 'render' && progress && (
        <div className="film-prog">
          <span className="film-live">Live</span>
          <div className="film-prog-bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="film-prog-lbl">
            <b>Rendering {progress.done} of {progress.total}</b>{progress.etaText ? ` · ${progress.etaText}` : ''}
          </div>
          <button className="film-btn film-btn--ghost" style={{ padding: '7px 12px' }} onClick={onStop}>
            <IconStop s={13} /> Stop after shot
          </button>
        </div>
      )}
    </div>
  );
}