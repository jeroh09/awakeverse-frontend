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
  IconSoftened, IconVisual, IconCheck, IconUpload, KIND_ICON, IconSeries,
} from './filmIcons';
// Redraw reuses the regenerate glyph (a redraw IS a regenerate, user-facing name).
const IconRedraw = IconRegenerate;

const pad = n => String(n).padStart(2, '0');

// Friendly style labels. Backend "stylized_real" and "realistic" are the same
// thing and both read as "Realistic" in the UX.
const STYLE_LABEL = { stylized_real: 'Realistic', realistic: 'Realistic', anime: 'Anime', cartoon: 'Cartoon', comic_book: 'Comic' };
const styleLabel = (s) => STYLE_LABEL[s] || String(s || '').replace('_', ' ');

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
          {!playing && <button className="film-play" onClick={play} aria-label="Play preview" title="Play this shot"><IconPlay s={16} /></button>}
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
      {clipUrl && !playing && <button className="film-play" onClick={play} aria-label="Play shot" title="Play this shot"><IconPlay s={16} /></button>}
      {!playing && <span className="film-chip">Final</span>}
      {!playing && Dur}
    </div>
  );
}

function Cell({ beat, stageState, selected, regenBusy, onSelect, onRegenerate, onDuplicate, onCut,
               onEditLine, onRemoveRecap }) {
  const { index, kind, speaker, caption, softened } = beat;
  const kindLabel = kind.replace('_', ' ');
  // "PREVIOUSLY ON" (SERIES_RECAP): the recap is cut from the previous episode — it can't
  // be regenerated, duplicated or cut like a shot; the recap bar above controls it.
  if (kind === 'recap') {
    const narration = (beat.raw && beat.raw.recap && beat.raw.recap.narration) || '';
    return (
      <article className="film-cell film-cell--recap" title="Previously on — built from the last episode; change it with the bar above">
        <Thumb beat={beat} stageState={stageState} />
        <div className="film-cfoot">
          <div className="film-cfoot-row"><span className="film-badge film-badge--recap">Previously on</span></div>
          <div className="film-cap">{narration || 'A recap of the last episode before this one starts.'}</div>
          {stageState === 'edit' && onRemoveRecap && (
            <div className="film-cell-ctrls" onClick={e => e.stopPropagation()}>
              <button className="film-ctrl" onClick={onRemoveRecap}
                      title="Take the recap off — the episode starts straight away">Remove recap</button>
            </div>
          )}
        </div>
      </article>
    );
  }
  const subLines = beat.subLines || [];
  // PREVIEW WALL: a locked cell is a teaser of the un-rendered plan — caption
  // and kind visible, no thumb, no controls, not selectable. The pull is the
  // user's own next scene, sitting right there.
  if (beat.status === 'locked') {
    return (
      <article className="film-cell is-locked" aria-disabled="true">
        <div className="film-lockthumb"><span className="film-lockicon">🔒</span>
          <span className="film-locksecs">{beat.seconds}s</span></div>
        <div className="film-cfoot">
          <div className="film-cfoot-row">
            <span className={`film-badge film-badge--${kind}`}>{kindLabel}</span>
          </div>
          <div className="film-cap film-cap--locked">
            {speaker ? <><span className="film-spk">{speaker}:</span> “{caption}”</> : caption}
          </div>
        </div>
      </article>
    );
  }
  return (
    <article className={`film-cell${selected ? ' is-sel' : ''}`} onClick={() => onSelect(index)}>
      <Thumb beat={beat} stageState={stageState} />
      <div className="film-cfoot">
        <div className="film-cfoot-row">
          <span className={`film-badge film-badge--${kind}`}>{kindLabel}</span>
          {softened && <span className="film-soft"><IconSoftened s={12} /> Softened</span>}
        </div>
        {subLines.length ? (
          // MERGED CLIP — one row per line; each line can be edited on its own.
          <div className="film-lines">
            {subLines.map((l, i) => (
              <div className="film-line" key={l.sourceIndex}>
                <span className="film-line-txt">{l.speaker && <span className="film-spk">{l.speaker}:</span>} “{l.text}”</span>
                {stageState === 'edit' && onEditLine && (
                  <button className="film-line-edit" onClick={(e) => { e.stopPropagation(); onEditLine(index, l.sourceIndex, i + 1); }}
                          title={`Edit line ${i + 1} on its own — the clip splits into one shot per line`}>Edit</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="film-cap">
            {speaker ? <><span className="film-spk">{speaker}:</span> “{caption}”</> : caption}
          </div>
        )}
        {stageState === 'edit' && (
          <div className="film-cell-ctrls" onClick={e => e.stopPropagation()}>
            <button
              className="film-ctrl film-ctrl--regen"
              disabled={regenBusy}
              onClick={() => onRegenerate(index)}
              title={subLines.length ? 'Make fresh takes of this clip — its lines are re-rendered as separate shots'
                                     : 'Make a fresh take of this shot — same script, new render'}
            >
              {regenBusy ? <span className="film-ctrl-spin" /> : <IconRegenerate s={13} />}
              {regenBusy ? 'Regenerating…' : 'Regenerate'}
            </button>
            <button className="film-ctrl" onClick={() => onDuplicate(index)} title="Repeat this shot straight after itself"><IconDuplicate s={13} /> Duplicate</button>
            <button className="film-ctrl film-ctrl--cut" onClick={() => onCut(index)} title="Remove this shot from the film — the rest stay as they are"><IconCut s={13} /> Cut</button>
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
  const recurring = !!info.recurring;   // series-aware: a locked, reused character
  return (
    <div className={`film-cast-card${busy ? ' is-busy' : ''}`}
         style={recurring ? { borderColor: 'rgba(52,211,153,.32)' } : undefined}>
      <div className="film-cast-portrait">
        {info.plate_url
          ? <img src={info.plate_url} alt={name} className="film-cast-img" />
          : <div className="film-cast-img film-cast-img--empty" />}
        {recurring
          ? <span className="film-cast-badge" style={{ background: 'rgba(16,64,48,.85)', color: '#bff0dc' }}>Reused</span>
          : uploaded && <span className="film-cast-badge">From your photo</span>}
        {busy && <div className="film-cast-veil"><span className="film-spin" /> Drawing…</div>}
      </div>
      <div className="film-cast-body">
        <div className="film-cast-name">{name}</div>
        {recurring ? (
          // Locked: returning cast keeps its canonical look so it stays identical
          // across episodes. No per-episode redraw (that would diverge them);
          // change a series character's look from My Series → Refresh look.
          <>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4, padding: '2px 0' }}>{desc}</div>
            <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11.5, fontWeight: 600,
                          color: '#64748b', padding: 7, background: 'rgba(99,102,241,.05)', borderRadius: 8 }}>
              Locked · from your series
            </div>
          </>
        ) : (
          <>
            <textarea className="film-cast-desc" value={desc} spellCheck={false}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe how they look…" />
            <div className="film-cast-actions">
              <button className="film-cast-btn" disabled={busy} onClick={() => onRedraw(name, desc)}
                title="Draw this character again from the description above">
                <IconRedraw s={14} /> Redraw
              </button>
              <button className="film-cast-btn film-cast-btn--up" disabled={busy} onClick={() => onUpload(name)}
                title="Turn your own photo into this character, redrawn in the film's style">
                <IconUpload s={14} /> Use your own photo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Photoreal adults-only block (stageState === 'blocked') ────────────────────
// content_jobs.plan_film_for_job gates BEFORE any plate spend: a character that
// reads as a minor on the Veo/photoreal pathway hard-stops the plan, writes
//   beats_manifest = { block: { reason:'minor_photoreal', characters, message } }
// and fails the job (which also refunds the reservation, so nothing is charged).
// Without this card the blocked plan fell through to <EmptyStoryboard /> and the
// user saw an empty grid with no reason — the gate worked, the explanation did
// not. Amber, not red: this is a choice to make, not a failure to mourn.
// Scoped to photoreal only (the VEO_STYLES set); Seedance styles are untouched.
//
// COPY OWNERSHIP: `message` is the backend's own wording (content_jobs `_msg`) and
// already carries both ways forward, so it is rendered VERBATIM and never
// rewritten here. The hint below adds only what the backend does NOT say — that
// nothing was charged — and falls back to a full explanation only when no message
// arrives at all.
//
// Shape is confirmed (`characters` is a list of plain name strings), but object
// forms and missing keys are tolerated: a block must never crash the stage.
function ContentBlockCard({ block, videoStyle }) {
  const who = (Array.isArray(block.characters) ? block.characters : [])
    .map(c => (typeof c === 'string' ? c : (c && (c.name || c.character)) || ''))
    .map(s => String(s).trim())
    .filter(Boolean);
  const isMinor = block.reason === 'minor_photoreal';
  const styleName = videoStyle ? styleLabel(videoStyle) : 'photorealistic';
  const StyleName = styleName.charAt(0).toUpperCase() + styleName.slice(1);  // sentence-initial
  return (
    <div className="film-blockcard" role="alert">
      <span className="film-blockcard-badge">Adults only</span>
      <h3>{isMinor
        ? (videoStyle ? `This film can’t be made in ${StyleName}`
                      : 'This film can’t be made photorealistically')
        : 'This film can’t be made as written'}</h3>
      <p className="film-blockcard-msg">
        {block.message || (isMinor
          ? `${StyleName} films are adults-only, and ${who.length === 1 ? 'a character reads' : 'some characters read'} as a minor. `
            + 'Age them up in the script, or switch to a stylized style to keep them as they are.'
          : 'Something in this script can’t be filmed as written.')}
      </p>
      {who.length > 0 && (
        <div className="film-blockcard-who">
          {who.map((name, i) => (
            <span key={`${name}-${i}`} className="film-blockcard-chip">{name}</span>
          ))}
        </div>
      )}
      <p className="film-blockcard-hint">
        We stopped before making anything, so you haven’t been charged — edit the script
        in the Writers&nbsp;Room and build again whenever you’re ready.
      </p>
    </div>
  );
}

// ── Building your cast — the render pause (castPhase === 'cast_rendering') ─────
// Placeholder slots that show WHERE (and, once names are known, WHO) is being
// drawn, so the wait reads as progress and no one re-clicks the funnel. Reuses
// the real .film-cast-card / .film-cast-grid, so a finished portrait drops into
// the exact same slot — each slot swaps to the real image the moment its
// plate_url exists (progressive), and if the cast list isn't populated yet we
// show 3 generic slots. Presentational only; no cast/render logic here.
function CastBuilding({ castList }) {
  const slots = castList.length > 0 ? castList : [[null, null], [null, null], [null, null]];
  return (
    <div className="film-cast-wrap">
      <div className="film-lifebanner film-lifebanner--cast_rendering" role="status" aria-live="polite">
        <span className="film-spin film-spin--sm" />
        <div className="film-lifebanner-txt">
          <b>Building your cast…</b>
          <span>This takes a minute — no need to click again. Your cast appears right here as it's ready.</span>
        </div>
      </div>
      <div className="film-cast-grid">
        {slots.map(([name, info], i) => {
          const ready = !!(info && info.plate_url);
          return (
            <div key={name || `slot-${i}`}
                 className={`film-cast-card film-cast-card--skel${ready ? ' is-ready' : ''}`}>
              <div className="film-cast-portrait">
                {ready ? (
                  <img src={info.plate_url} alt={name || ''} className="film-cast-img" />
                ) : (
                  <>
                    <svg className="film-cast-skel-sil" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="8.5" r="4" />
                      <path d="M4.5 20.5c0-3.6 3.4-5.8 7.5-5.8s7.5 2.2 7.5 5.8z" />
                    </svg>
                    <span className="film-cast-skel-shine" aria-hidden="true" />
                  </>
                )}
              </div>
              <div className="film-cast-body">
                {name
                  ? <div className="film-cast-name">{name}</div>
                  : <span className="film-cast-skel-line film-cast-skel-line--title" aria-hidden="true" />}
                {!ready && (
                  <>
                    <span className="film-cast-skel-line" aria-hidden="true" />
                    <span className="film-cast-skel-line film-cast-skel-line--short" aria-hidden="true" />
                  </>
                )}
              </div>
            </div>
          );
        })}
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
          <button className="film-btn film-btn--ghost" onClick={onCancel} title="Close without uploading">Cancel</button>
          <button className="film-btn film-btn--primary" disabled={!agreed} onClick={onAgree}
                  title={agreed ? 'Record your agreement and choose a photo' : 'Tick the box first'}>Agree &amp; continue</button>
        </div>
      </div>
    </div>
  );
}

/* ── "PREVIOUSLY ON" bar (2026-10-12, SERIES_RECAP=1) — series episodes, finished films.
   A toggle, the narrator voice, and the clips from the last episode (up to three; the
   last episode's final beat always closes the recap). Turning it on or rebuilding it
   re-cuts the film on this job, like any edit. Not counted in the episode's length. ── */
const MAX_RECAP_CLIPS = 3;
function RecapBar({ recap, busy, onRecap }) {
  const cur = recap && recap.current;
  const sugg = ((recap && recap.candidates) || []).filter(c => c.suggested && !c.cliffhanger).map(c => c.index);
  const [voice, setVoice] = useState((cur && cur.voice_id) || (recap && recap.default_voice) || '');
  const [picks, setPicks] = useState((cur && cur.montage) || sugg);
  const [showClips, setShowClips] = useState(false);
  if (!recap) return null;
  const prev = recap.previous_episode || {};
  if (!recap.available) {
    return <div className="film-recapbar is-off" title="Previously on needs the previous episode finished in full">
      <span className="film-recapbar-lbl">Previously on</span><small>{recap.reason}</small></div>;
  }
  const voices = recap.voices || [];
  const changed = recap.on && ((cur && cur.voice_id) !== voice || JSON.stringify((cur && cur.montage) || []) !== JSON.stringify(picks));
  const toggle = (idx) => setPicks(p => p.includes(idx) ? p.filter(x => x !== idx)
                                          : (p.length >= MAX_RECAP_CLIPS ? p : [...p, idx].sort((a, b) => a - b)));
  const clips = (recap.candidates || []);
  return (
    <div className="film-recapbar">
      <button type="button" role="switch" aria-checked={!!recap.on} className="film-switch" disabled={busy}
              onClick={() => onRecap(recap.on ? { on: false } : { on: true, picks, voiceId: voice })}
              title={recap.on ? 'Take the recap off' : `Open with a short recap of Episode ${prev.ordinal} — not counted in this episode's length`} />
      <span className="film-recapbar-lbl">Previously on</span>
      <select className="film-recapbar-voice" value={voice} onChange={(e) => setVoice(e.target.value)} disabled={busy}
              aria-label="Narrator voice" title="Who narrates the recap">
        {voices.map(v => <option key={v.id} value={v.id}>{v.label}{v.id === recap.default_voice ? ' (default)' : ''}</option>)}
        <option value="none">No narrator</option>
      </select>
      <button type="button" className="film-ctrl" onClick={() => setShowClips(s => !s)} disabled={busy}
              title={`Choose which moments of Episode ${prev.ordinal} the recap shows`}>
        Clips · {picks.length}/{MAX_RECAP_CLIPS}</button>
      {recap.on && changed && (
        <button type="button" className="film-btn film-btn--primary film-recapbar-apply" disabled={busy}
                onClick={() => onRecap({ on: true, picks, voiceId: voice })}
                title="Rebuild the recap with this voice and these clips">Rebuild recap</button>
      )}
      <small className="film-recapbar-sub">~10–20s before Episode {(prev.ordinal || 0) + 1}'s first shot · not counted in its length</small>
      {showClips && (
        <div className="film-recapclips">
          {clips.map(c => {
            const on = c.cliffhanger || picks.includes(c.index);
            return (
              <button type="button" key={c.index} disabled={c.cliffhanger || busy}
                      className={`film-recapclip${on ? ' is-on' : ''}${c.cliffhanger ? ' is-cliff' : ''}`}
                      onClick={() => toggle(c.index)}
                      style={c.poster_url ? { backgroundImage: `url(${c.poster_url})` } : undefined}
                      title={c.cliffhanger ? 'The last moment of the episode — the recap always ends on it'
                             : on ? 'In the recap — click to leave it out'
                             : picks.length >= MAX_RECAP_CLIPS ? `Up to ${MAX_RECAP_CLIPS} clips — remove one first` : 'Add this moment to the recap'}>
                <span className="film-recapclip-txt">{c.cliffhanger ? 'Ends on this' : (c.line || c.visual || `Shot ${c.index}`)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Storyboard({
  stageState = 'empty',
  contentBlock = null,               // { reason, characters, message } — photoreal gate
  castPhase = 'idle',
  beats = [],
  aspectRatio = '9:16',
  videoStyle = null,
  durationSeconds = null,
  onDurationChange = null,
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
  notice = null,                     // "Edit not applied: …" — the film itself is unchanged
  onDismissNotice = () => {},
  recap = null,                      // "Previously on" options (series episodes, SERIES_RECAP) or null
  onRecap = null,                    // ({on, picks, voiceId}) → re-cut with/without the recap
  onEditLine = null,                 // (beatIndex, sourceIndex, lineNo) → edit one line of a merged clip
  onSelectBeat = () => {},
  onGenerate = () => {},
  onExport = () => {},
  onStop = () => {},
  onFinish = () => {},
  onRegenerate = () => {},
  onDuplicate = () => {},
  onCut = () => {},
  canPromote = false,
  onPromote = () => {},
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
          <button className="film-btn film-btn--primary" onClick={onApproveCast}
                  title="Approve the cast and start making the film — this uses credits">
            <IconCheck s={14} /> Looks good — make the film
          </button>
        </div>
      )
    : stageState === 'review' ? <button className="film-btn film-btn--primary" onClick={onGenerate} title="Render the film from this plan — this uses credits">Make the film</button>
    : stageState === 'edit' ? (
        <div className="film-head-actions">
          {finalUrl && <button className="film-btn film-btn--primary" onClick={() => setWatching(true)} title="Watch the finished film"><IconPlay s={14} /> Play film</button>}
          {finalUrl && canPromote && (
            <button className="film-btn film-btn--ghost" onClick={onPromote} title="Turn this film into Episode 1 of a series">
              <IconSeries s={14} /> Start a series
            </button>
          )}
          <button className="film-btn film-btn--ghost" onClick={onExport} title="Open the finished video file in a new tab to download it">Export</button>
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
          {videoStyle && (
            <span className="film-hstyle" title="Style · frame"
              style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: '#818cf8',
                       background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.3)',
                       borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>
              {styleLabel(videoStyle)} · {aspectRatio}
            </span>
          )}
          {durationSeconds != null && onDurationChange && (
            <select
              className="film-hduration"
              value={durationSeconds}
              disabled={stageState === 'rendering'}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              title="Film length — the script is fitted to this before directing; too short and connective scenes get condensed away"
              style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: '#818cf8',
                       background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.3)',
                       borderRadius: 999, padding: '3px 10px', cursor: 'pointer',
                       appearance: 'none', WebkitAppearance: 'none' }}>
              <option value={60}>~1 min</option>
              <option value={120}>~2 min</option>
              <option value={180}>~3 min</option>
            </select>
          )}
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
        {/* Lifecycle banner (2026-08-26): the sub-line under the Storyboard tab
            wasn't loud enough — users kept re-clicking the funnel while a render
            was already running. This is the in-stage state change they can't
            miss, driven by the same castPhase the funnel button reads, so the
            two never disagree. Cast/film renders only; plate_review keeps its
            own "Meet the cast" lead below. */}
        {notice && !editBusy && (
          <div className="film-notice" role="status">
            <span className="film-notice-ico" aria-hidden="true">!</span>
            <div className="film-notice-txt">
              <b>{notice.split(':')[0]}:</b>{notice.slice(notice.indexOf(':') + 1)}
              <span className="film-notice-sub">Your film is as it was before this change.</span>
            </div>
            <button type="button" className="film-notice-x" onClick={onDismissNotice}
                    aria-label="Dismiss" title="Dismiss this message">×</button>
          </div>
        )}
        {castPhase === 'film_rendering' && (
          <div className="film-lifebanner film-lifebanner--film_rendering" role="status" aria-live="polite">
            <span className="film-spin film-spin--sm" />
            <div className="film-lifebanner-txt">
              <b>Making your film…</b>
              <span>Each shot appears below as it finishes. You can leave this page — it keeps rendering.</span>
            </div>
          </div>
        )}
        {/* castPhase === 'editing' deliberately has NO in-stage banner: the
            .film-edit-overlay at the foot of this file already scrims the stage
            and names the exact work ("Regenerating shot 5…"). A banner here would
            sit behind that blur saying the same thing twice. The 'editing' phase
            still matters — it's what keeps CastBuilding from hijacking the grid
            below and keeps the funnel CTA honest. */}
        {/* 'blocked' leads the chain, mirroring the container's own precedence
            (stageState = job.contentBlock ? 'blocked' : …). A blocked plan has
            failed, so no other branch should get a chance to claim the stage. */}
        {stageState === 'blocked' && contentBlock ? (
          <ContentBlockCard block={contentBlock} videoStyle={videoStyle} />
        ) : (castPhase === 'cast_rendering' && stageState !== 'plate_review') ? (
          <CastBuilding castList={castList} />
        ) : stageState === 'plate_review' ? (
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
          <>
          {(() => {
            const lockedN = beats.filter(b => b.status === 'locked').length;
            if (!lockedN) return null;
            const doneN = beats.length - lockedN;
            return (
              <div className="film-lifebanner film-lifebanner--partial" role="status">
                <div className="film-lifebanner-txt">
                  <b>Preview — {doneN} of {beats.length} shots rendered.</b>{' '}
                  The rest of your film is written and waiting.
                </div>
                <button type="button" className="film-btn film-btn--primary film-btn--cta"
                        onClick={onFinish} title="Render every remaining shot in full quality — this uses credits">
                  Finish your film{cost != null ? ` · ${Number(cost).toLocaleString()} credits` : ''}
                </button>
              </div>
            );
          })()}
          {stageState === 'edit' && recap && onRecap && (
            <RecapBar key={`${(recap.current && recap.current.built_at) || ''}-${recap.on}`}
                      recap={recap} busy={!!editBusy} onRecap={onRecap} />
          )}
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
                onRegenerate={onRegenerate} onDuplicate={onDuplicate} onCut={onCut}
                onEditLine={onEditLine}
                onRemoveRecap={onRecap ? () => onRecap({ on: false }) : null} />
            ))}
          </div>
          </>
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
          <button className="film-btn film-btn--ghost" style={{ padding: '7px 12px' }} onClick={onStop}
                  title="Stop after the shot that's rendering now — finished shots are kept"><IconStop s={13} /> Stop after shot</button>
        </div>
      )}

      {watching && finalUrl && (
        <div className="film-player-overlay" onClick={() => setWatching(false)}>
          <div className="film-player-box" onClick={e => e.stopPropagation()}>
            <button className="film-player-close" onClick={() => setWatching(false)} aria-label="Close" title="Close the player">×</button>
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