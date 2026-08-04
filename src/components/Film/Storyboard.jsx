// src/components/Film/Storyboard.jsx
// Left panel: the storyboard grid. One surface, three data states (review →
// render → edit), plus a captivating animated empty state before any script
// exists. Beats are a 3-column grid; cards stay a fixed 16:9 size in every
// state (text-only or with a clip) so the panel never jumps height.
// Rendered/final beats play INLINE inside their card; the finished film plays
// in an in-panel overlay.

import React, { useRef, useState, useCallback } from 'react';
import {
  IconPlay, IconRegenerate, IconCut, IconDuplicate, IconGrip, IconStop,
  IconSoftened, IconVisual, IconCheck, IconUpload, KIND_ICON,
} from './filmIcons';
// Redraw reuses the regenerate glyph (a redraw IS a regenerate, user-facing name).
const IconRedraw = IconRegenerate;

const pad = n => String(n).padStart(2, '0');

function EmptyStoryboard() {
  return (
    <div className="film-empty">
      <div className="film-filmstrip">
        <span className="film-sweep" />
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="film-frame" style={{ animationDelay: `${(i * 0.18).toFixed(2)}s` }}>
            <span className="film-frame-dot tl" /><span className="film-frame-dot tr" />
            <span className="film-frame-dot bl" /><span className="film-frame-dot br" />
            <IconPlay s={16} />
          </div>
        ))}
      </div>
      <h3>The reel's loaded. Nothing's shot yet.</h3>
      <p>Talk it through with the director on the right — once the script locks, every frame here fills in live.</p>
    </div>
  );
}

function Thumb({ beat, stageState }) {
  const { index, kind, seconds, clipUrl, status } = beat;
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const Kico = KIND_ICON[kind] || IconVisual;

  const play = useCallback((e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    // The src carries #t=0.1 so Safari/WebKit paints a real first frame as the
    // poster (preload="metadata" alone leaves it blank on macOS). That fragment
    // can leave the playhead at 0.1s, so rewind to 0 before playing.
    try { if (v.currentTime > 0) v.currentTime = 0; } catch (_) {}
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const N = <span className="film-n">{pad(index)}</span>;
  const Dur = <span className="film-dur">{seconds}s</span>;
  // Safari/WebKit shows a blank poster for <video preload="metadata"> until it's
  // told to seek — appending #t=0.1 makes it decode and paint that frame, so the
  // thumbnail shows on macOS the way it already does on Windows/Chrome. Works on
  // existing clips (no re-render needed). play() rewinds to 0 first.
  const posterSrc = clipUrl ? `${clipUrl}#t=0.1` : clipUrl;

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
          <video ref={videoRef} className="film-thumb-vid" src={posterSrc} playsInline preload="metadata"
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
      {clipUrl && <video ref={videoRef} className="film-thumb-vid" src={posterSrc} playsInline preload="metadata"
                         controls={playing} onEnded={() => setPlaying(false)} />}
      {N}
      {clipUrl && !playing && <button className="film-play" onClick={play} aria-label="Play shot"><IconPlay s={16} /></button>}
      {!playing && <span className="film-chip">Final</span>}
      {!playing && Dur}
    </div>
  );
}

function Cell({ beat, stageState, selected, regenBusy, onSelect, onRegenerate, onDuplicate, onCut }) {
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
            <button
              className="film-ctrl film-ctrl--regen"
              disabled={regenBusy}
              onClick={() => onRegenerate(index)}
            >
              {regenBusy ? <span className="film-ctrl-spin" /> : <IconRegenerate s={13} />}
              {regenBusy ? 'Regenerating…' : 'Regenerate'}
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

// ── Meet the cast — the review pause (stageState === 'plate_review') ──────────
// User-facing language throughout: "cast" not "character plates", "Redraw" not
// "regenerate", "make the film" not "render". Each member: their look, a Redraw,
// and "Use your own photo" (which opens the consent gate first).
function CastMember({ name, info, busy, onRedraw, onUpload }) {
  const [desc, setDesc] = useState(info.description || '');
  const uploaded = info.source === 'upload';
  return (
    <div className={`film-cast-card${busy ? ' is-busy' : ''}`}>
      <div className="film-cast-portrait">
        {info.plate_url
          ? <img src={info.plate_url} alt={name} className="film-cast-img" />
          : <div className="film-cast-img film-cast-img--empty" />}
        {uploaded && <span className="film-cast-badge">From your photo</span>}
        {busy && <div className="film-cast-veil"><span className="film-spin" /> Drawing…</div>}
      </div>
      <div className="film-cast-body">
        <div className="film-cast-name">{name}</div>
        <textarea className="film-cast-desc" value={desc} spellCheck={false}
          onChange={e => setDesc(e.target.value)}
          placeholder="Describe how they look…" />
        <div className="film-cast-actions">
          <button className="film-cast-btn" disabled={busy} onClick={() => onRedraw(name, desc)}>
            <IconRedraw s={14} /> Redraw
          </button>
          <button className="film-cast-btn film-cast-btn--up" disabled={busy} onClick={() => onUpload(name)}>
            <IconUpload s={14} /> Use your own photo
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsentModal({ onAgree, onCancel }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="film-modal-scrim" onClick={onCancel}>
      <div className="film-modal" onClick={e => e.stopPropagation()}>
        <div className="film-modal-k">Before you upload</div>
        <h2 className="film-modal-h">Use your own images</h2>
        <p className="film-modal-p">You can turn a photo into a character. Every image you upload is
          redrawn in the film's style — it becomes a painted character, not a photo of a real person.</p>
        <div className="film-modal-terms">
          By continuing you confirm you <b>own or have permission to use</b> each image you upload,
          and that it doesn't show anyone who hasn't agreed to appear. You're responsible for the
          images you provide.
        </div>
        <label className="film-modal-check">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
          <span>I understand, and I have the right to use the images I upload.</span>
        </label>
        <div className="film-modal-foot">
          <button className="film-btn film-btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="film-btn film-btn--primary" disabled={!agreed} onClick={onAgree}>Agree &amp; continue</button>
        </div>
      </div>
    </div>
  );
}

export default function Storyboard({
  stageState = 'empty',
  beats = [],
  aspectRatio = '9:16',
  cost = null,
  costAffordable = null,
  cast = null,
  planningCast = false,
  onRedrawCast = () => {},
  onUploadCastPhoto = () => {},
  onAcceptUploadConsent = () => {},
  onApproveCast = () => {},
  selectedBeat = null,
  progress = null,
  finalUrl = null,
  editBusy = null,
  regenBusyIndex = null,
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

  // Cast review interactions.
  const [busyMember, setBusyMember] = useState(null);   // name currently drawing
  const [consentFor, setConsentFor] = useState(null);   // name awaiting consent before upload
  const [uploadingMember, setUploadingMember] = useState(null);  // name whose photo is uploading
  const fileInputRef = useRef(null);
  const pendingNameRef = useRef(null);   // which cast member the picked file belongs to
  const castList = cast ? Object.entries(cast) : [];

  // The film's frame shape drives the storyboard card proportion so the preview
  // tells the truth about the output (a 9:16 film shows tall cards, not 16:9).
  const arValue = { '9:16': '9 / 16', '1:1': '1 / 1', '16:9': '16 / 9' }[aspectRatio] || '16 / 9';
  const gridStyle = { '--film-card-ar': arValue };

  const handleRedraw = async (name, desc) => {
    setBusyMember(name);
    try { await onRedrawCast(name, desc); } finally { setBusyMember(null); }
  };

  // "Use your own photo": consent gate first. Agreeing records consent, then opens
  // the file picker. The picked file is uploaded to storage, and its URL is handed
  // to the container's upload handler (the backend takes a photo_url, not bytes).
  const handleUploadClick = (name) => setConsentFor(name);

  const handleConsentAgree = () => {
    const name = consentFor;
    setConsentFor(null);
    pendingNameRef.current = name;
    // Record consent in parallel — do NOT await before opening the picker.
    // Browsers only allow input.click() from within the user-gesture call
    // stack; an intervening `await` (a network round-trip) detaches it and the
    // file dialog silently never opens. Consent is a fast POST that completes
    // well before the user picks a file, and the upload endpoint re-checks the
    // gate server-side regardless, so firing it alongside is safe.
    Promise.resolve(onAcceptUploadConsent()).catch(() => {});
    if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); }
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files && e.target.files[0];
    const name = pendingNameRef.current;
    pendingNameRef.current = null;
    if (!file || !name) return;
    setUploadingMember(name);
    setBusyMember(name);
    try {
      await onUploadCastPhoto(name, file);   // container: file → Spaces URL → stylize
    } finally {
      setUploadingMember(null);
      setBusyMember(null);
    }
  };

  const sub =
    stageState === 'plate_review' ? `${castList.length} characters · check before making the film`
    : stageState === 'review' ? `${total} shots · ~${totalSecs}s · not made yet`
    : stageState === 'render' ? (planningCast ? 'sketching the cast…' : `${(progress && progress.done) || 0}/${(progress && progress.total) || total} rendered`)
    : stageState === 'edit' ? `${total} shots · ${totalSecs}s`
    : 'no shots yet';

  const cta =
    stageState === 'plate_review' ? (
        <div className="film-head-actions">
          <button className="film-btn film-btn--primary" onClick={onApproveCast}>
            <IconCheck s={14} /> Looks good — make the film
          </button>
        </div>
      )
    : stageState === 'review' ? <button className="film-btn film-btn--primary" onClick={onGenerate}>Make the film</button>
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
        <div className="film-phead-right">
          {cost != null && (stageState === 'review' || stageState === 'plate_review') && (
            <span
              className={`film-cost-badge${costAffordable === false ? ' is-short' : ''}`}
              title="What making this film will use"
            >
              ~{Number(cost).toLocaleString()} credits
            </span>
          )}
          {cta}
        </div>
      </div>

      <div className="film-stage">
        {stageState === 'plate_review' ? (
          <div className="film-cast-wrap">
            <div className="film-cast-lead">
              <h3>Meet the cast</h3>
              <p>These are the characters in your film. Tweak how one looks and redraw them, or use your
                own photo — then make the film when they look right.</p>
            </div>
            <div className="film-cast-grid">
              {castList.map(([name, info]) => (
                <CastMember key={name} name={name} info={info}
                  busy={busyMember === name}
                  onRedraw={handleRedraw} onUpload={handleUploadClick} />
              ))}
            </div>
          </div>
        ) : stageState === 'empty' || total === 0 ? (
          <EmptyStoryboard />
        ) : (
          <div className="film-grid" style={gridStyle}>
            {planningCast && (
              <div className="film-buildpill-row">
                <span className="film-buildpill"><span className="film-buildpill-dot" /> Sketching the cast…</span>
              </div>
            )}
            {beats.map((b, i) => (
              <Cell key={`${b.index}-${b.pos != null ? b.pos : i}`} beat={b} stageState={stageState}
                selected={selectedBeat === b.index} regenBusy={regenBusyIndex === b.index}
                onSelect={onSelectBeat}
                onRegenerate={onRegenerate} onDuplicate={onDuplicate} onCut={onCut} />
            ))}
          </div>
        )}
      </div>

      {consentFor && (
        <ConsentModal onAgree={handleConsentAgree} onCancel={() => setConsentFor(null)} />
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
             style={{ display: 'none' }} onChange={handleFilePicked} />

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