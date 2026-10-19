// src/components/Film/Storyboard.jsx
// Left panel: the storyboard. One surface, several data states (review → cast
// review → render → edit), plus an animated empty state before any script exists.
// Layout (Option D, 2026-10-15): a one-row header the height of the Writers' Room
// header · the stage (soft grid = a working surface) · an action dock the height
// of the Writers' Room composer. Rendered/final beats play INLINE in their card;
// the finished film plays in an in-panel overlay.
//
// LOAD-BEARING INVENTORY — everything below must survive any restyle. If you move
// one of these, move it; never drop it.
//   Header ...... stage label + read-only facts (cast/places or shots, style,
//                 frame, length). Length is NOT editable here (Writers' Room owns it).
//   Notice ...... "Edit not applied: …" / "Previously on: …" + dismiss (onDismissNotice).
//   Stage chain . blocked → ContentBlockCard (adults-only, verbatim backend message)
//                 cast_rendering → CastBuilding (progressive portraits)
//                 plate_review → Cast zone (Edit look / Redraw / Use your own photo
//                   → ConsentModal → hidden file input) + Places zone (Change look /
//                   Original, LOCATION_REVIEW; null when the switch is off)
//                 empty → EmptyStoryboard
//                 otherwise → "Sketching the cast" pill + shot grid. In a finished
//                   series episode the grid opens with RecapSlot ("Previously on", shot
//                   00): off → Add recap opens RecapDrawer (clips ≤3, last moment fixed,
//                   narrator / No narrator) and only its Add recap builds; on → mosaic,
//                   plays inline, Edit recap / Remove; unavailable → server reason.
//                   Cell keeps: plain recap cell (fallback), locked preview cells,
//                   merged-clip per-line Edit, Regenerate / Duplicate / Cut, regen spinner.
//   Dock ........ ONE action per stage: Make the film (review → onGenerate,
//                 plate_review → onApproveCast) with the cost + "N short"; render
//                 progress + Stop after shot (onStop); preview → Finish your film
//                 (onFinish); finished → Start a series (canPromote) / Export /
//                 Play film; editBusy → the live edit label.
//   Overlays .... film player (Play film), edit-busy scrim, consent modal.

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  IconPlay, IconRegenerate, IconCut, IconDuplicate, IconGrip, IconStop,
  IconSoftened, IconVisual, IconCheck, IconUpload, KIND_ICON, IconSeries, IconClock,
} from './filmIcons';
import './AdStoryboard.css';
import AdFinish, { endCardLabel, aiLabelLabel, adFinishState } from './AdFinish';
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

// ── Small glyphs for the header facts and card pills (stroke icons, same weight
// as filmIcons). Local so this file doesn't depend on new filmIcons exports.
const Glyph = ({ s = 13, children }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const GUser = (p) => <Glyph {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Glyph>;
const GPin = (p) => <Glyph {...p}><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></Glyph>;
const GFilm = (p) => <Glyph {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14M17 5v14M3 12h18" /></Glyph>;
const GPalette = (p) => <Glyph {...p}><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z" /><circle cx="7.5" cy="11" r="1" /><circle cx="11" cy="7" r="1" /><circle cx="16" cy="8" r="1" /></Glyph>;
const GLock = (p) => <Glyph {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Glyph>;
const GEdit = (p) => <Glyph {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /></Glyph>;
// The frame glyph draws the film's own shape: tall for 9:16, square, wide for 16:9.
const GFrame = ({ ar = '9:16', s = 13 }) => {
  const box = ar === '16:9' ? { x: 3, y: 7.5, w: 18, h: 9 } : ar === '1:1' ? { x: 5, y: 5, w: 14, h: 14 } : { x: 7.5, y: 3, w: 9, h: 18 };
  return <Glyph s={s}><rect x={box.x} y={box.y} width={box.w} height={box.h} rx="2" /></Glyph>;
};

// ── A section of the review stage that scrolls INSIDE itself (owner, 2026-10-15:
// two columns, as many rows as needed, vertical scroll only — never sideways).
// Cast and Places each get one, so both stay on screen however many there are.
// "Scroll for more" + a fade appear only while there is more below.
// NOTE: a <div>, never a <section> — landing.css styles bare `section` globally
// (100vh, 60px padding, centred flex) and it leaks into any section in the app.
function Zone({ title, sub, grow = 1, children }) {
  const ref = useRef(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setMore(
      el.scrollHeight > el.clientHeight + 2 && el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) { ro.observe(el); if (el.firstElementChild) ro.observe(el.firstElementChild); }
    return () => { el.removeEventListener('scroll', update); if (ro) ro.disconnect(); };
  }, []);
  return (
    <div className="film-zone" style={{ flexGrow: grow }}>
      <div className="film-zone-h">
        <h3>{title}</h3>
        {sub && <span className="film-zone-sub">{sub}</span>}
        {more && <span className="film-zone-more" aria-hidden="true">Scroll for more ↓</span>}
      </div>
      <div ref={ref} className={`film-zone-scroll${more ? ' has-more' : ''}`}>
        <div className="film-g2">{children}</div>
      </div>
    </div>
  );
}

// ── Meet the cast — the review pause (stageState === 'plate_review') ──────────
// User-facing language throughout: "cast" not "character plates", "Redraw" not
// "regenerate", "make the film" not "render". Compact two-per-row card: portrait,
// name, two-line look, and Edit look / Redraw / Use your own photo. "Edit look"
// opens the description INSIDE the card (it works inside the scrolling zone, where
// a popover would be clipped). "Use your own photo" opens the consent gate first.
function CastMember({ name, info, busy, onRedraw, onUpload }) {
  const [desc, setDesc] = useState(info.description || '');
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState(null);
  const uploaded = info.source === 'upload';
  const recurring = !!info.recurring;   // series-aware: a locked, reused character
  // ADVERTISING MODE (2026-10-19): a photoreal ad's people are described in words —
  // no face is drawn (Seedance takes no realistic face images). The card shows the
  // written look; Edit look → Save stores the words. No Redraw, no own photo.
  const textOnly = !!info.text_only;
  const redraw = async (fromEditor) => {
    setErr(null);
    const r = await onRedraw(name, desc);
    if (r && r.error) setErr(r.error);
    else if (fromEditor) setEditing(false);
  };
  return (
    <article className={`film-cc${recurring ? ' is-locked' : ''}${editing ? ' is-editing' : ''}${busy ? ' is-busy' : ''}${textOnly ? ' is-text' : ''}`}>
      {!textOnly && (
        <div className="film-cc-img">
          {info.plate_url
            ? <img src={info.plate_url} alt={name} />
            : <div className="film-cc-empty" />}
          {busy && <div className="film-cc-veil" aria-label="Drawing…"><span className="film-spin film-spin--sm" /></div>}
        </div>
      )}
      <div className="film-cc-body">
        <div className="film-cc-name">
          <span className="film-cc-nm">{name}</span>
          {textOnly
            ? <span className="film-pill film-cc-wordpill" title="Photoreal ads describe people in words, so no face is drawn">In words</span>
            : recurring
            ? <span className="film-pill film-pill--series"><GLock s={9} /> Series</span>
            : uploaded && <span className="film-pill film-pill--photo">Your photo</span>}
        </div>
        {editing ? (
          <div className="film-cc-edit">
            <textarea className="film-cc-input" value={desc} spellCheck={false} autoFocus
              aria-label={`How ${name} looks`} placeholder="Describe how they look…"
              onChange={e => setDesc(e.target.value)} />
            {err && <div className="film-place-err" role="alert">{err}</div>}
            <div className="film-cc-row">
              <button className="film-sbtn" disabled={busy}
                onClick={() => { setDesc(info.description || ''); setErr(null); setEditing(false); }}
                title={textOnly ? 'Close without saving' : 'Close without redrawing'}>Cancel</button>
              {textOnly ? (
                <button className="film-sbtn film-sbtn--pri" disabled={busy || !desc.trim()} onClick={() => redraw(true)}
                  title="Save how they look — the ad uses these words">
                  {busy ? 'Saving…' : 'Save'}
                </button>
              ) : (
                <button className="film-sbtn film-sbtn--pri" disabled={busy || !desc.trim()} onClick={() => redraw(true)}
                  title="Draw this character again from the description above">
                  <IconRedraw s={12} /> Redraw
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="film-cc-desc" title={desc}>{desc}</p>
            {err && <div className="film-place-err" role="alert">{err}</div>}
            <div className="film-cc-acts">
              {recurring ? (
                // Locked: returning cast keeps its canonical look so it stays identical
                // across episodes. No per-episode redraw (that would diverge them);
                // change a series character's look from My Series → Refresh look.
                <span className="film-cc-lockline">Same look in every episode</span>
              ) : textOnly ? (
                <button className="film-sbtn film-sbtn--grow" disabled={busy} onClick={() => setEditing(true)}
                  title="Change how they look, in words">
                  <GEdit s={12} /> Edit look
                </button>
              ) : (
                <>
                  <button className="film-sbtn film-sbtn--grow" disabled={busy} onClick={() => setEditing(true)}
                    title="Change how they look, then redraw">
                    <GEdit s={12} /> Edit look
                  </button>
                  <button className="film-sbtn" disabled={busy} onClick={() => redraw(false)}
                    title="Draw this character again from their description" aria-label={`Redraw ${name}`}>
                    <IconRedraw s={12} />
                  </button>
                  <button className="film-sbtn" disabled={busy} onClick={() => onUpload(name)}
                    title="Turn your own photo into this character, redrawn in the film's style"
                    aria-label={`Use your own photo for ${name}`}>
                    <IconUpload s={12} />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

// ── Places — the film's locations at cast review (LOCATION_REVIEW, 2026-10-14) ──
// Painted right after the cast. The user can change how a place LOOKS (decor,
// materials, colours, wear, furniture style); its layout, doors and the things the
// scenes use (the "Kept" chips) stay where they are, and so do light / time /
// weather and how busy it is. Series locations are locked. Redraw only (no uploads).
const placeLabel = (name = '') => name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  .replace(/\b\w/g, c => c.toUpperCase());

// Place plates are painted in the FILM's frame shape, so the thumbnail column is
// sized to that shape (a 9:16 place is narrow and tall, a 16:9 one wide).
const placeThumbW = (arValue) => (arValue === '9 / 16' ? 64 : arValue === '1 / 1' ? 84 : 112);

function PlaceCard({ name, info, busy, onRedraw, onRevert, arValue }) {
  const [look, setLook] = useState('');
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState(null);
  const recurring = !!info.recurring;
  const feats = Array.isArray(info.features) ? info.features : [];
  const go = async (fn) => {
    setErr(null);
    const r = await fn();
    if (r && r.error) setErr(r.error);
    else { setLook(''); setEditing(false); }
  };
  return (
    <article className={`film-pc${recurring ? ' is-locked' : ''}${editing ? ' is-editing' : ''}${busy ? ' is-busy' : ''}`}
             style={{ gridTemplateColumns: `${placeThumbW(arValue)}px minmax(0, 1fr)` }}>
      <div className="film-pc-img" style={{ aspectRatio: arValue }}>
        {info.plate_url
          ? <img src={info.plate_url} alt={placeLabel(name)} />
          : <div className="film-cc-empty" />}
        {busy && <div className="film-cc-veil" aria-label="Repainting…"><span className="film-spin film-spin--sm" /></div>}
      </div>
      <div className="film-cc-body">
        <div className="film-cc-name">
          <span className="film-cc-nm" title={info.description || ''}>{placeLabel(name)}</span>
          {recurring
            ? <span className="film-pill film-pill--series"><GLock s={9} /> Series</span>
            : info.edited && <span className="film-pill film-pill--photo">Redrawn</span>}
        </div>
        {feats.length > 0 && (
          <div className="film-pc-kept" title="The scenes use these, so they stay where they are">
            <small>Kept</small>
            {feats.map(f => <span key={f}>{f}</span>)}
          </div>
        )}
        {err && <div className="film-place-err" role="alert">{err}</div>}
        {editing ? (
          <div className="film-cc-edit">
            <textarea className="film-cc-input" value={look} spellCheck={false} maxLength={300} autoFocus
              aria-label={`How ${placeLabel(name)} should look`}
              placeholder="How should it look? e.g. run-down and dim, peeling paint, worn leather stools"
              onChange={e => setLook(e.target.value)} />
            <div className="film-cc-row">
              <button className="film-sbtn" disabled={busy}
                onClick={() => { setEditing(false); setLook(''); setErr(null); }}
                title="Close without repainting">Cancel</button>
              <button className="film-sbtn film-sbtn--pri" disabled={busy || !look.trim()}
                onClick={() => go(() => onRedraw(name, look.trim()))}
                title="Repaint this place with the new look — its layout, doors and the things the scenes use stay put">
                <IconRedraw s={12} /> Redraw
              </button>
            </div>
          </div>
        ) : (
          <div className="film-cc-acts">
            {recurring ? (
              <span className="film-cc-lockline">Same in every episode</span>
            ) : (
              <>
                <button className="film-sbtn film-sbtn--grow" disabled={busy} onClick={() => setEditing(true)}
                  title="Repaint this place with a new look — its layout, doors and the things the scenes use stay put">
                  <GEdit s={12} /> Change look
                </button>
                {info.edited && (
                  <button className="film-sbtn" disabled={busy} onClick={() => go(() => onRevert(name))}
                    title="Go back to the place as it was first drawn">
                    Original
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function PlacesZone({ places, status, onRedraw, onRevert, arValue }) {
  const [busy, setBusy] = useState(null);
  const list = places ? Object.entries(places) : [];
  if (status === 'failed' || (!list.length && status !== 'building')) return null;
  const run = async (name, fn) => { setBusy(name); try { return await fn(); } finally { setBusy(null); } };
  const building = status === 'building' && !list.length;
  return (
    <Zone title="Places" grow={2}
          sub={building ? 'Painting the places…'
            : `${list.length} place${list.length === 1 ? '' : 's'} · layout and props stay put when you redraw`}>
      {building
        ? [0, 1].map(i => (
            <article key={i} className="film-pc film-pc--skel"
                     style={{ gridTemplateColumns: `${placeThumbW(arValue)}px minmax(0, 1fr)` }}>
              <div className="film-pc-img" style={{ aspectRatio: arValue }}>
                <span className="film-cast-skel-shine" aria-hidden="true" />
              </div>
              <div className="film-cc-body">
                <span className="film-cast-skel-line film-cast-skel-line--title" aria-hidden="true" />
                <span className="film-cast-skel-line" aria-hidden="true" />
              </div>
            </article>
          ))
        : list.map(([name, info]) => (
            <PlaceCard key={name} name={name} info={info} busy={busy === name} arValue={arValue}
              onRedraw={(n, l) => run(n, () => onRedraw(n, l))}
              onRevert={(n) => run(n, () => onRevert(n))} />
          ))}
    </Zone>
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
function ContentBlockCard({ block, videoStyle, isAd = false }) {
  // ADVERTISING MODE: the same card for an advert says "advert" and points to the Ad room.
  const noun = isAd ? 'advert' : 'film';
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
        ? (videoStyle ? `This ${noun} can’t be made in ${StyleName}`
                      : `This ${noun} can’t be made photorealistically`)
        : `This ${noun} can’t be made as written`}</h3>
      <p className="film-blockcard-msg">
        {block.message || (isMinor
          ? `${StyleName} ${noun}s are adults-only, and ${who.length === 1 ? 'a character reads' : 'some characters read'} as a minor. `
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
        in the {isAd ? <>Ad&nbsp;room</> : <>Writers&nbsp;Room</>} and build again whenever you’re ready.
      </p>
    </div>
  );
}

// ── Building your cast — the render pause (castPhase === 'cast_rendering') ─────
// Placeholder slots that show WHERE (and, once names are known, WHO) is being
// drawn, so the wait reads as progress. Uses the same .film-cc card and the same
// scrolling Zone as Meet the cast, so a finished portrait drops into the exact
// slot it will keep — each slot swaps to the real image the moment its plate_url
// exists (progressive); with no cast list yet we show 4 generic slots. The
// "no need to click again" message now lives in the dock (the dock and this grid
// read the same castPhase, so they never disagree). Presentational only.
function CastBuilding({ castList }) {
  const slots = castList.length > 0 ? castList : [[null, null], [null, null], [null, null], [null, null]];
  return (
    <Zone title="Cast" grow={3}
          sub={castList.length ? `Drawing ${castList.length} character${castList.length === 1 ? '' : 's'}…` : 'Drawing your characters…'}>
      {slots.map(([name, info], i) => {
        const ready = !!(info && info.plate_url);
        return (
          <article key={name || `slot-${i}`} className={`film-cc film-cc--skel${ready ? ' is-ready' : ''}`}>
            <div className="film-cc-img">
              {ready ? (
                <img src={info.plate_url} alt={name || ''} />
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
            <div className="film-cc-body">
              {name
                ? <div className="film-cc-name"><span className="film-cc-nm">{name}</span></div>
                : <span className="film-cast-skel-line film-cast-skel-line--title" aria-hidden="true" />}
              {!ready && (
                <>
                  <span className="film-cast-skel-line" aria-hidden="true" />
                  <span className="film-cast-skel-line film-cast-skel-line--short" aria-hidden="true" />
                </>
              )}
            </div>
          </article>
        );
      })}
    </Zone>
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

/* ── "PREVIOUSLY ON" — the cold-open slot (2026-10-15, Option A; SERIES_RECAP=1) ──
   Series episodes, finished films. The recap is shot 00: the first card in the grid,
   right where it plays. It replaces the old purple RecapBar above the grid AND the
   separate recap cell inside it — one card for one feature.
     · off          → an empty film-leader slot: "Add recap" opens the clip picker
                      FIRST; nothing is built until the user confirms (POST /recap
                      only fires from the drawer's "Add recap").
     · on           → the recap itself: the chosen clips as a mosaic ending on the
                      last moment, plays inline, Edit recap / Remove.
     · unavailable  → the server's reason, greyed, no button.
   The drawer (RecapDrawer) spans the grid under the first row: up to three clips
   (the previous episode's final beat always closes it and can't be unpicked), the
   narrator voice or "No narrator", and Add / Rebuild — Rebuild only after a change.
   Building, removing or rebuilding re-cuts the film on THIS job like any edit
   (busy overlay + poll; one job at a time); errors arrive as the
   "Previously on: …" notice. Not counted in the episode's length. ── */
const MAX_RECAP_CLIPS = 3;

const recapVoiceLabel = (recap, id) => {
  if (!id || id === 'none') return id === 'none' ? 'No narrator' : null;
  const v = ((recap && recap.voices) || []).find(x => x.id === id);
  return v ? v.label : null;
};

function RecapSlot({ recap, beat, busy, open, onOpen, onRemove }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const prev = recap.previous_episode || {};
  const epName = prev.ordinal ? `Episode ${prev.ordinal}` : 'the last episode';

  if (!recap.on) {
    const na = !recap.available;
    return (
      <article className={`film-recap film-recap--off${na ? ' is-na' : ''}${open ? ' is-open' : ''}`}
               aria-label="Previously on">
        <div className="film-recap-leader">
          <span className="film-recap-ring" aria-hidden="true"><b>3</b></span>
          <h4>Previously on</h4>
          {na ? (
            <>
              <p>{recap.reason || `Needs ${epName} finished in full before it can be recapped.`}</p>
              <small>Unlocks once {epName} is finished</small>
            </>
          ) : (
            <>
              <p>Open with a 10–20s recap of {epName}, ending on its last moment.</p>
              <button type="button" className="film-sbtn film-sbtn--pri" disabled={busy || open} onClick={onOpen}
                      title={`Choose which moments of ${epName} the recap shows — nothing is made until you confirm`}>
                + Add recap
              </button>
              <small>Not counted in this episode's length</small>
            </>
          )}
        </div>
      </article>
    );
  }

  // ON — the mosaic of what the recap shows (picked clips + the closing moment).
  const cands = recap.candidates || [];
  const byIndex = new Map(cands.map(c => [c.index, c]));
  const cur = recap.current || {};
  const picked = (cur.montage || []).map(i => byIndex.get(i)).filter(Boolean).slice(0, MAX_RECAP_CLIPS);
  const cliff = cands.find(c => c.cliffhanger);
  const tiles = [...picked];
  while (tiles.length < MAX_RECAP_CLIPS) tiles.push(null);
  const clipUrl = beat && beat.clipUrl;
  const secs = beat && beat.seconds;
  const narration = (beat && beat.raw && beat.raw.recap && beat.raw.recap.narration) || '';
  const voice = recapVoiceLabel(recap, cur.voice_id);
  const play = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    try { v.currentTime = 0; } catch (_) {}
    v.play().then(() => setPlaying(true)).catch(() => {});
  };
  return (
    <article className={`film-recap film-recap--on${open ? ' is-open' : ''}`} aria-label="Previously on">
      <div className="film-recap-mosaic">
        {tiles.map((c, i) => (
          <div key={c ? c.index : `empty-${i}`} className="film-recap-tile"
               style={c && c.poster_url ? { backgroundImage: `url(${c.poster_url})` } : undefined} />
        ))}
        <div className="film-recap-tile is-cliff"
             style={cliff && cliff.poster_url ? { backgroundImage: `url(${cliff.poster_url})` } : undefined}>
          <span>Ends here</span>
        </div>
        <span className="film-recap-sprocket is-l" aria-hidden="true" />
        <span className="film-recap-sprocket is-r" aria-hidden="true" />
        <span className="film-n">00</span>
        {clipUrl && (
          <video ref={videoRef} className={`film-recap-vid${playing ? ' is-on' : ''}`} src={`${clipUrl}#t=0.1`}
                 playsInline preload="metadata" controls={playing} onEnded={() => setPlaying(false)} />
        )}
        {clipUrl && !playing && (
          <button type="button" className="film-play film-recap-play" onClick={play}
                  aria-label="Play the recap" title="Play the recap"><IconPlay s={16} /></button>
        )}
        {!playing && (
          <div className="film-recap-title">
            <b>Previously on</b>
            <span>{epName}{secs ? ` · ~${secs}s` : ''}</span>
          </div>
        )}
      </div>
      <div className="film-cfoot">
        <div className="film-cfoot-row">
          <span className="film-badge film-badge--recap">Recap{voice ? ` · ${voice}` : ''}</span>
        </div>
        <div className="film-cap">{narration || `A short recap of ${epName} before this one starts.`}</div>
        <div className="film-cell-ctrls">
          <button type="button" className={`film-ctrl${open ? ' is-on' : ''}`} disabled={busy || open} onClick={onOpen}
                  title="Change which moments it shows, or the narrator">Edit recap</button>
          <button type="button" className="film-ctrl film-ctrl--cut" disabled={busy} onClick={onRemove}
                  title="Take the recap off — the episode starts straight away">Remove</button>
        </div>
      </div>
    </article>
  );
}

function RecapDrawer({ recap, picks, voice, busy, onToggle, onVoice, onCancel, onApply }) {
  const prev = recap.previous_episode || {};
  const epName = prev.ordinal ? `Episode ${prev.ordinal}` : 'the last episode';
  const cur = recap.current || {};
  const isAdd = !recap.on;
  const changed = isAdd || (cur.voice_id || '') !== (voice || '')
    || JSON.stringify(cur.montage || []) !== JSON.stringify(picks);
  const voices = recap.voices || [];
  const cands = recap.candidates || [];
  return (
    <div className="film-recap-drawer" role="group" aria-label="Previously on — choose clips and narrator">
      <div className="film-recap-dmain">
        <div className="film-zone-h">
          <h3>Clips from {epName}</h3>
          <span className="film-zone-sub">
            {picks.length} of {MAX_RECAP_CLIPS} picked · the last moment always closes it
          </span>
        </div>
        <div className="film-recap-clips">
          {cands.map(c => {
            const on = c.cliffhanger || picks.includes(c.index);
            const n = picks.indexOf(c.index) + 1;
            const full = !on && picks.length >= MAX_RECAP_CLIPS;
            return (
              <button type="button" key={c.index} disabled={c.cliffhanger || busy}
                      className={`film-recap-clip${on ? ' is-on' : ''}${c.cliffhanger ? ' is-cliff' : ''}${full ? ' is-full' : ''}`}
                      onClick={() => onToggle(c.index)}
                      style={c.poster_url ? { backgroundImage: `url(${c.poster_url})` } : undefined}
                      aria-pressed={c.cliffhanger ? undefined : on}
                      title={c.cliffhanger ? `The last moment of ${epName} — the recap always ends on it`
                             : on ? 'In the recap — click to leave it out'
                             : full ? `Up to ${MAX_RECAP_CLIPS} clips — remove one first` : 'Add this moment to the recap'}>
                {!c.cliffhanger && <i aria-hidden="true">{on ? n : ''}</i>}
                <span>{c.cliffhanger ? 'Ends on this' : (c.line || c.visual || `Shot ${c.index}`)}</span>
              </button>
            );
          })}
          {!cands.length && <p className="film-recap-none">The recap uses the last moment of {epName}.</p>}
        </div>
      </div>
      <div className="film-recap-dside">
        <label className="film-recap-lbl" htmlFor="film-recap-voice">Narrator</label>
        <select id="film-recap-voice" className="film-recap-voice" value={voice} disabled={busy}
                onChange={(e) => onVoice(e.target.value)} title="Who narrates the recap">
          {voices.map(v => (
            <option key={v.id} value={v.id}>{v.label}{v.id === recap.default_voice ? ' (default)' : ''}</option>
          ))}
          <option value="none">No narrator</option>
        </select>
        <small>~10–20s before Episode {(prev.ordinal || 0) + 1}'s first shot. Not counted in its length.</small>
        <div className="film-cc-row">
          <button type="button" className="film-sbtn" disabled={busy} onClick={onCancel}
                  title="Close without changing anything">Cancel</button>
          <button type="button" className="film-sbtn film-sbtn--pri" disabled={busy || !changed} onClick={onApply}
                  title={isAdd ? 'Make the recap with these clips and this voice'
                         : changed ? 'Rebuild the recap with these clips and this voice' : 'Change a clip or the voice first'}>
            {isAdd ? 'Add recap' : 'Rebuild recap'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ADVERTISING MODE (2026-10-19) — the storyboard for an ad ────────────────────
// Before anything is planned, an ad's storyboard shows its script as PLAN cards (one per
// VISUAL: block, with the line spoken over it), then the END CARD the studio composes
// (logo, offer, call to action, disclosure — never filmed). The end card also closes
// the grid in the later stages. Nothing here spends money; "Review cast" is the same
// action as the Ad room's button, and is greyed while ad renders are switched off.
export function parseAdPlan(script) {
  const lines = String(script || '').split('\n').map(l => l.trim());
  const beats = [];
  let cur = null, speaker = null;
  const close = () => { if (cur) beats.push(cur); cur = null; speaker = null; };
  lines.forEach((l) => {
    if (/^VISUAL:/i.test(l)) { close(); cur = { visual: l.replace(/^VISUAL:\s*/i, ''), speaker: '', line: '', vo: false }; return; }
    if (!cur || !l || /^\[/.test(l)) { if (/^\[FADE/i.test(l)) close(); return; }
    if (l === l.toUpperCase() && /[A-Z]/.test(l) && l.length < 48 && !cur.line) {
      speaker = l.replace(/\s*\(.*\)\s*$/, '').trim(); cur.vo = /\((V\.?O\.?|O\.?S\.?)\)/i.test(l); return;
    }
    if (speaker && !cur.line) { cur.speaker = speaker; cur.line = l; return; }
    if (!speaker) cur.visual = `${cur.visual} ${l}`.trim();
  });
  close();
  return beats.map((b, i) => ({
    index: i + 1,
    kind: b.line ? (b.vo ? 'vo_broll' : 'dialogue') : 'pure_visual',
    speaker: b.speaker, line: b.line, visual: b.visual,
  }));
}

function AdPlanCell({ beat }) {
  const Kico = KIND_ICON[beat.kind] || IconVisual;
  return (
    <article className="film-cell sb-ad-plan" title="Planned from the script — nothing is made yet">
      <div className="film-thumb film-thumb--plan"><span className="film-n">{pad(beat.index)}</span><Kico s={20} /><span className="film-chip">Plan</span></div>
      <div className="film-cfoot">
        <div className="film-cfoot-row"><span className={`film-badge film-badge--${beat.kind}`}>{beat.kind.replace('_', ' ')}</span></div>
        <div className="film-cap">{beat.visual}</div>
        {beat.line && <div className="film-cap sb-ad-line"><span className="film-spk">{beat.speaker}:</span> “{beat.line}”</div>}
      </div>
    </article>
  );
}

function AdEndCard({ ad, onOpen = null }) {
  // STEP 4 part 1 (AD_COMPOSE): the cell shows the saved finish choices and opens the picker.
  const f = ad.composeOpen ? ad.finish : null;
  const open = onOpen ? {
    role: 'button', tabIndex: 0, onClick: onOpen,
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } },
  } : {};
  const brandStyle = f ? { '--sb-ec-brand': f.brand_color, '--sb-ec-ink': f.ink || '#FFFFFF' } : undefined;
  return (
    <article className={`film-cell sb-ad-endcard${onOpen ? ' is-open' : ''}${f && f.end_card === 'slate' ? ' is-slate' : ''}`}
             style={brandStyle} {...open}
             title={onOpen ? 'Choose the end card, AI label, captions and brand colour'
                           : 'Drawn by the studio over the end of the film — not filmed'}>
      <div className="film-thumb sb-ad-endcard-th">
        {ad.endCard ? <span className="film-dur">{ad.endCard}s</span> : null}
        {onOpen ? <span className="sb-ad-ec-design" aria-hidden="true">Design ›</span> : null}
        <div className="sb-ad-ec">
          {ad.logo ? <img className="sb-ad-ec-logo" src={ad.logo.url} alt="" /> : null}
          {!ad.logo || !f || f.show_name !== false ? <b>{ad.brand || 'Your brand'}</b> : null}
          {ad.offer && <small>{ad.offer}</small>}
          {ad.cta ? <span className="sb-ad-ec-cta">{ad.cta}</span> : null}
        </div>
      </div>
      <div className="film-cfoot">
        <div className="film-cfoot-row"><span className="film-badge sb-ad-badge">End card</span>
          {f && <span className="sb-ad-ec-sw" aria-hidden="true" />}</div>
        <div className="film-cap">{f
          ? `${endCardLabel(f.end_card)} · AI label: ${aiLabelLabel(f.ai_label).toLowerCase()} · captions ${f.captions ? 'on' : 'off'}`
          : 'Added by the studio: logo, offer, call to action and the AI label.'}</div>
      </div>
    </article>
  );
}

export default function Storyboard({
  stageState = 'empty',
  contentBlock = null,               // { reason, characters, message } — photoreal gate
  castPhase = 'idle',
  beats = [],
  aspectRatio = '9:16',
  videoStyle = null,
  durationSeconds = null,             // shown read-only — the Writers' Room sets the length
  onDurationChange = null,           // still passed by the container; unused — no length picker here any more (owner, 2026-10-15)
  cost = null,
  costAffordable = null,
  balance = null,                    // credit balance — only used to say how many credits are missing
  cast = null,
  places = null,                     // LOCATION_REVIEW: review.locations, or null when off
  placesStatus = null,               // 'building' | 'ready' | 'failed'
  onRedrawPlace = null,              // (name, look) → {…entry} | {error}
  onRevertPlace = null,              // (name) → {…entry} | {error}
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
  // ADVERTISING MODE (2026-10-19): `ad` = { title, hook, brand, audience, offer, cta, length,
  // ratio, filmSeconds, endCard, locked } for an ad (null for films); `adScript` = its latest
  // script; `onEditAdSetup(step)` reopens Ad setup; `onReviewCast` starts the cast review;
  // `adRenderLocked` = why ad renders can't start yet (null when they can).
  ad = null,
  adScript = null,
  onEditAdSetup = null,
  onSaveAdFinish = null,             // step 4 part 1 (AD_COMPOSE): saves the finish choices → the picker shows
  adFinish = null,                   // step 4 part 3: manifest.ad_finish of the made advert
  adFilmUrl = null,                  //   the advert's film (the picker previews on it)
  onFinishAgain = null,              //   "Try again" → finish it again
  logoApi = null,                    // brand assets: {upload, remove} → the picker's Logo section
  onReviewCast = null,
  adRenderLocked = null,
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
  const castTextOnly = castList.length > 0 && castList.every(([, info]) => info && info.text_only);

  // The film's frame shape drives the storyboard card proportion so the preview
  // tells the truth about the output (a 9:16 film shows tall cards, not 16:9).
  const arValue = { '9:16': '9 / 16', '1:1': '1 / 1', '16:9': '16 / 9' }[aspectRatio] || '16 / 9';
  const gridStyle = { '--film-card-ar': arValue };

  // Returns the redraw result ({…plate} | {error}) so the card can show an error
  // inline and keep its editor open instead of silently closing.
  const handleRedraw = async (name, desc) => {
    setBusyMember(name);
    try { return await onRedrawCast(name, desc); } finally { setBusyMember(null); }
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

  // ── "Previously on" slot state (series episodes, finished films) ──
  // The drawer's picks/voice live HERE (not in the slot) because the slot and the
  // drawer are siblings in the grid. Opening seeds them from the current recap (or
  // the server's suggestions when adding); any rebuild/removal closes the drawer.
  const recapKey = recap ? `${(recap.current && recap.current.built_at) || ''}-${recap.on}` : '';
  const [recapOpen, setRecapOpen] = useState(false);
  const [recapPicks, setRecapPicks] = useState([]);
  const [recapVoice, setRecapVoice] = useState('');
  useEffect(() => { setRecapOpen(false); }, [recapKey]);
  const openRecap = () => {
    if (!recap) return;
    const cur = recap.current || {};
    const sugg = (recap.candidates || []).filter(c => c.suggested && !c.cliffhanger).map(c => c.index);
    setRecapPicks(recap.on && Array.isArray(cur.montage) ? cur.montage.slice() : sugg.slice(0, MAX_RECAP_CLIPS));
    setRecapVoice((recap.on && cur.voice_id) || recap.default_voice || ((recap.voices || [])[0] || {}).id || 'none');
    setRecapOpen(true);
  };
  const toggleRecapPick = (idx) => setRecapPicks(p => p.includes(idx) ? p.filter(x => x !== idx)
    : (p.length >= MAX_RECAP_CLIPS ? p : [...p, idx].sort((a, b) => a - b)));
  const applyRecap = () => { setRecapOpen(false); onRecap && onRecap({ on: true, picks: recapPicks, voiceId: recapVoice }); };
  const removeRecap = () => { setRecapOpen(false); onRecap && onRecap({ on: false }); };

  const sub =
    stageState === 'plate_review' ? `${castList.length} characters · check before making the film`
    : stageState === 'review' ? `${total} shots · ~${totalSecs}s · not made yet`
    : stageState === 'render' ? (planningCast ? 'sketching the cast…' : `${(progress && progress.done) || 0}/${(progress && progress.total) || total} rendered`)
    : stageState === 'edit' ? `${total} shots · ${totalSecs}s`
    : 'no shots yet';

  // ── OPTION D — "the action dock" (owner, 2026-10-15) ────────────────────────
  // Header: one row, the SAME height as the Writers' Room header (same capsule
  // metrics), carrying the stage name and the film's facts as read-only text.
  // Length is NOT editable here — the Writers' Room sets it (owner decision).
  // Dock: one bar at the bottom, the SAME height as the Writers' Room composer,
  // holding the stage's one action. It replaces four things that used to live in
  // different places: the header button (+ "You have N" balance line), the bottom
  // "Live" progress strip, the green "Making your film…" banner, and the preview
  // wall's "Finish your film" banner. Credits already show in the top bar, so the
  // dock only shows the COST, and — when short — how many credits are missing.
  const lockedN = beats.filter(b => b.status === 'locked').length;
  const doneN = beats.length - lockedN;
  const drawingCast = castPhase === 'cast_rendering' && stageState !== 'plate_review' && stageState !== 'blocked';
  const placesN = places ? Object.keys(places).length : 0;
  const fmt = (n) => Number(n).toLocaleString();
  const short = costAffordable === false;
  const shortBy = (short && cost != null && balance != null) ? Math.max(0, Number(cost) - Number(balance)) : null;
  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  const adPlan = ad && stageState === 'empty' ? parseAdPlan(adScript) : [];
  // STEP 4 part 1: the finish picker (end card, AI label, captions, colour).
  const [finishOpen, setFinishOpen] = useState(false);
  const canFinish = !!(ad && ad.composeOpen && onSaveAdFinish);
  const openFinish = canFinish ? () => setFinishOpen(true) : null;
  const sampleLine = ad ? ((parseAdPlan(adScript).find(b => b.line) || {}).line || '') : '';
  const finishState = ad ? adFinishState(adFinish) : null;
  const [finishErr, setFinishErr] = useState(null);
  const tryFinishAgain = async () => {
    setFinishErr(null);
    const r = await onFinishAgain();
    if (r && r.error) setFinishErr(r.error);
  };
  const adPlanOn = adPlan.length > 0;

  const stage =
    stageState === 'blocked' ? { label: 'Can’t be made as written', tone: 'warn' }
    : editBusy ? { label: 'Changing a shot', tone: 'busy' }
    : drawingCast ? { label: 'Drawing the cast', tone: 'live' }
    : stageState === 'plate_review' ? { label: 'Cast review', tone: 'live' }
    : stageState === 'review' || adPlanOn ? { label: 'Plan', tone: 'idle' }
    : stageState === 'render' ? { label: 'Rendering', tone: 'busy' }
    : stageState === 'edit' ? (lockedN ? { label: 'Preview', tone: 'busy' } : { label: 'Finished', tone: 'done' })
    : { label: 'No shots yet', tone: 'idle' };

  const castFacts = stageState === 'plate_review' || drawingCast;
  // Under a minute reads in seconds (a 10 s ad used to show "~0 min").
  const lengthLabel = ad && ad.length ? `Ad · ${ad.length}s`
    : durationSeconds ? (durationSeconds < 60 ? `${durationSeconds}s` : `~${Math.round(durationSeconds / 60)} min`) : null;

  // The cost rides inside the button that spends it; amber + "N short" when the
  // balance can't cover it (the button still fires → the 402 → the top-up card).
  const costTag = cost == null ? null : (
    <span className={`film-btn-cost${short ? ' is-short' : ''}`}>
      {short && shortBy ? `${fmt(cost)} · ${fmt(shortBy)} short` : <>{fmt(cost)} <small>credits</small></>}
    </span>
  );
  const lead = (title, small, before = null) => (
    <div className="film-dock-l">
      {before}
      <div className="film-dock-txt"><b>{title}</b>{small && <small>{small}</small>}</div>
    </div>
  );
  const faces = castList.filter(([, info]) => info && info.plate_url).slice(0, 4);
  const facesEl = faces.length ? (
    <div className="film-dock-faces" aria-hidden="true">
      {faces.map(([name, info]) => <img key={name} src={info.plate_url} alt="" />)}
    </div>
  ) : null;

  let dock = null;
  if (adPlanOn && !drawingCast && !editBusy) {
    dock = (<>
      {lead(`${adPlan.length} shot${adPlan.length === 1 ? '' : 's'} planned · ${ad.filmSeconds || '?'}s + ${ad.endCard || '?'}s end card`,
            adRenderLocked || 'Check the cast before the ad is made')}
      {onReviewCast && (
        <button className="film-btn film-btn--primary film-btn--dock" onClick={onReviewCast}
                disabled={!!adRenderLocked || castPhase !== 'idle'}
                title={adRenderLocked || 'Plan the shots and draw the cast so you can check them before the ad is made'}>
          Review cast
        </button>
      )}
    </>);
  } else if (stageState === 'blocked' || (stageState === 'empty' && !drawingCast)) {
    dock = null;   // the block card / empty state carry their own message
  } else if (editBusy) {
    // The stage overlay already scrims the panel and names the work; the dock
    // mirrors it so the bottom never shows a stale button underneath.
    dock = lead(editBusy, 'Every other shot stays as it is', <span className="film-spin film-spin--sm" />);
  } else if (drawingCast) {
    dock = (<>
      {lead('Drawing your cast…', 'No need to click again — your cast appears here as it’s ready',
            <span className="film-spin film-spin--sm" />)}
      <button className="film-btn film-btn--primary film-btn--dock film-btn--cost" disabled
              title="Available once your cast is ready">
        <IconCheck s={14} /> Make the film{costTag}
      </button>
    </>);
  } else if (stageState === 'plate_review') {
    const ready = `${castList.length} character${castList.length === 1 ? '' : 's'}`
      + (placesN ? ` and ${placesN} place${placesN === 1 ? '' : 's'}` : '') + ' ready';
    dock = (<>
      {short && shortBy
        ? lead(`You need ${fmt(shortBy)} more credits`, 'Your cast stays as it is while you top up', facesEl)
        : lead(placesStatus === 'building' ? `${ready} · painting the places…` : ready,
               'Change any look before you make it', facesEl)}
      <button className="film-btn film-btn--primary film-btn--dock film-btn--cost" onClick={onApproveCast}
              title="Approve the cast and places and start making the film — this uses credits">
        <IconCheck s={14} /> Make the film{costTag}
      </button>
    </>);
  } else if (stageState === 'review') {
    dock = (<>
      {lead(`${total} shot${total === 1 ? '' : 's'} planned${totalSecs ? ` · ~${totalSecs}s` : ''}`,
            short && shortBy ? `You need ${fmt(shortBy)} more credits to make it` : 'Nothing is made until you press the button')}
      <button className="film-btn film-btn--primary film-btn--dock film-btn--cost" onClick={onGenerate}
              title="Render the film from this plan — this uses credits">
        Make the film{costTag}
      </button>
    </>);
  } else if (stageState === 'render' && progress) {
    dock = (<>
      <div className="film-dock-prog" title="You can leave this page — it keeps rendering">
        <span className="film-live">Live</span>
        <div className="film-prog-bar"><i style={{ width: `${pct}%` }} /></div>
        <span className="film-dock-proglbl">
          <b>Rendering {progress.done} of {progress.total}</b>{progress.etaText ? ` · ${progress.etaText}` : ''}
          <span className="film-dock-hint"> · you can leave this page</span>
        </span>
      </div>
      <button className="film-btn film-btn--ghost film-btn--dock" onClick={onStop}
              title="Stop after the shot that's rendering now — finished shots are kept">
        <IconStop s={13} /> Stop after shot
      </button>
    </>);
  } else if (stageState === 'edit' && lockedN) {
    // PREVIEW WALL: the rest of the film is written and waiting (locked cells).
    dock = (<>
      {lead(`Preview · ${doneN} of ${beats.length} shots made`, 'The rest of your film is written and waiting')}
      <button className="film-btn film-btn--primary film-btn--dock film-btn--cost" onClick={onFinish}
              title="Render every remaining shot in full quality — this uses credits">
        Finish your film{costTag}
      </button>
    </>);
  } else if (stageState === 'edit') {
    dock = (<>
      {lead(`Your film${totalSecs ? ` · ${totalSecs}s` : ''}`, 'Click any shot to change it')}
      <div className="film-dock-acts">
        {finalUrl && canPromote && (
          <button className="film-btn film-btn--ghost film-btn--dock" onClick={onPromote}
                  title="Turn this film into Episode 1 of a series">
            <IconSeries s={14} /> <span className="film-dock-hide-sm">Start a series</span>
          </button>
        )}
        <button className="film-btn film-btn--ghost film-btn--dock" onClick={onExport}
                title="Open the finished video file in a new tab to download it">Export</button>
        {finalUrl && (
          <button className="film-btn film-btn--primary film-btn--dock" onClick={() => setWatching(true)}
                  title="Watch the finished film">
            <IconPlay s={14} /> Play film
          </button>
        )}
      </div>
    </>);
  }

  const zoned = stageState !== 'blocked' && (drawingCast || stageState === 'plate_review');

  return (
    <div className="film-pcontent">
      <div className="film-phead film-phead--sb" title={sub}>
        <span className="film-sb-capsule"><span className="film-sb-capsule-on">Storyboard</span></span>
        <span className={`film-sb-stage is-${stage.tone}`}>{stage.label}</span>
        <div className="film-sb-meta" role="group" aria-label="Film details">
          {castFacts ? (
            <>
              <span title="The characters in this film"><GUser />{castList.length} cast</span>
              {placesN > 0 && <span title="The places in this film"><GPin />{placesN} place{placesN === 1 ? '' : 's'}</span>}
            </>
          ) : total > 0 ? (
            <span title="Shots in this film"><GFilm />{total} shot{total === 1 ? '' : 's'}{totalSecs ? ` · ${totalSecs}s` : ''}</span>
          ) : null}
          {videoStyle && <span title="The film's visual style"><GPalette />{styleLabel(videoStyle)}</span>}
          {aspectRatio && <span title="The frame shape — 9:16 is vertical, for phones"><GFrame ar={aspectRatio} />{aspectRatio}</span>}
          {lengthLabel && (ad
            ? <span title={ad.locked ? 'Length and frame are fixed for this ad' : 'Ad length — set in Ad setup'}>
                {ad.locked ? <GLock /> : <IconClock s={13} />}{lengthLabel}</span>
            : <span title="Film length — set in the Writers' Room"><IconClock s={13} />{lengthLabel}</span>)}
        </div>
      </div>

      {ad && stageState !== 'blocked' && (
        <div className="sb-ad-strip">
          <div className="sb-ad-strip-t">
            <b>{ad.title || 'Your ad'}</b>
            <span>{[ad.hook, ad.brand, ad.audience, ad.offer].filter(Boolean).join(' · ')}</span>
          </div>
          {canFinish && (
            // Owner 17:57: the end-card picker must be easy to find — a filled button, first on the strip.
            <button type="button" className="film-btn film-btn--primary sb-ad-design" onClick={openFinish}
                    title="Design the end card: style, brand colour, AI label and captions">
              <svg className="sb-ad-design-ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M12 3a9 9 0 0 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/>
              </svg>
              Design end card
            </button>
          )}
          {finishState && (
            <span className={`sb-ad-fin is-${finishState.key}`} title={finishErr || finishState.tip} role="status">
              {finishState.key === 'finishing' && <span className="film-spin film-spin--sm" aria-hidden="true" />}
              {finishState.label}
            </span>
          )}
          {finishState && finishState.key === 'failed' && onFinishAgain && (
            <button type="button" className="film-btn film-btn--ghost sb-ad-edit" onClick={tryFinishAgain}
                    title="Finish your advert again: end card, captions and AI label (free — the film is kept)">Try again</button>
          )}
          {onEditAdSetup && (
            <button type="button" className="film-btn film-btn--ghost sb-ad-edit" onClick={() => onEditAdSetup(0)}
                    title={ad.locked ? 'Reopen Ad setup — the brief and script can change; length and frame stay fixed'
                                     : 'Reopen Ad setup'}>Edit setup</button>
          )}
        </div>
      )}
      {finishOpen && canFinish && (
        <AdFinish ad={ad} sampleLine={sampleLine} onSave={onSaveAdFinish} onClose={() => setFinishOpen(false)}
                  filmUrl={adFilmUrl} logoApi={logoApi}
                  onEditWords={onEditAdSetup ? () => { setFinishOpen(false); onEditAdSetup(0); } : null} />
      )}

      <div className={`film-stage${zoned ? ' film-stage--zoned' : ''}`}>
        {/* "Edit not applied: …" — an edit failed on a film that is still fine. */}
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
        {/* The old in-stage lifecycle banners ("Making your film…", "Preview — N of M
            shots rendered") moved into the dock, which reads the same castPhase /
            locked-cell count, so the two can never disagree. castPhase === 'editing'
            still has NO in-stage banner: the .film-edit-overlay below names the work. */}
        {/* 'blocked' leads the chain, mirroring the container's own precedence
            (stageState = job.contentBlock ? 'blocked' : …). A blocked plan has
            failed, so no other branch should get a chance to claim the stage. */}
        {stageState === 'blocked' && contentBlock ? (
          <ContentBlockCard block={contentBlock} videoStyle={videoStyle} isAd={!!ad} />
        ) : drawingCast ? (
          <CastBuilding castList={castList} />
        ) : stageState === 'plate_review' ? (
          <>
            <Zone title="Cast" grow={3}
                  sub={`${castList.length} character${castList.length === 1 ? '' : 's'} · ${castTextOnly
                    ? 'described in words · edit a look' : 'change a look, or use your own photo'}`}>
              {castList.map(([name, info]) => (
                <CastMember key={name} name={name} info={info}
                  busy={busyMember === name}
                  onRedraw={handleRedraw} onUpload={handleUploadClick} />
              ))}
            </Zone>
            {onRedrawPlace && (places || placesStatus) && (
              <PlacesZone places={places} status={placesStatus} arValue={arValue}
                onRedraw={onRedrawPlace} onRevert={onRevertPlace || (() => ({}))} />
            )}
          </>
        ) : adPlanOn ? (
          <div className="film-grid" style={gridStyle}>
            {adPlan.map(b => <AdPlanCell key={`plan-${b.index}`} beat={b} />)}
            <AdEndCard ad={ad} onOpen={openFinish} />
          </div>
        ) : stageState === 'empty' || total === 0 ? (
          <EmptyStoryboard />
        ) : (
          <>
          {(() => {
            // "PREVIOUSLY ON" (SERIES_RECAP) — the cold-open slot is shot 00, the first
            // card in the grid. When it's shown, the recap BEAT is drawn by the slot, so
            // it is skipped below (one card, not two). With no recap info (not an
            // episode, switch off, or not fetched yet) any recap beat falls back to the
            // plain recap Cell, exactly as before.
            const showSlot = stageState === 'edit' && !!recap && !!onRecap;
            const recapBeat = beats.find(b => b.kind === 'recap') || null;
            const items = (showSlot ? beats.filter(b => b.kind !== 'recap') : beats).map((b, i) => (
              <Cell key={`${b.index}-${b.pos != null ? b.pos : i}`} beat={b} stageState={stageState}
                selected={selectedBeat === b.index} regenBusy={regenBusyIndex === b.index}
                onSelect={onSelectBeat}
                onRegenerate={onRegenerate} onDuplicate={onDuplicate} onCut={onCut}
                onEditLine={onEditLine}
                onRemoveRecap={onRecap ? () => onRecap({ on: false }) : null} />
            ));
            if (showSlot) {
              items.unshift(
                <RecapSlot key="recap-slot" recap={recap} beat={recapBeat} busy={!!editBusy}
                  open={recapOpen} onOpen={openRecap} onRemove={removeRecap} />
              );
              // the drawer spans the grid right under the first row (3 columns)
              if (recapOpen) items.splice(Math.min(3, items.length), 0,
                <RecapDrawer key="recap-drawer" recap={recap} picks={recapPicks} voice={recapVoice}
                  busy={!!editBusy} onToggle={toggleRecapPick} onVoice={setRecapVoice}
                  onCancel={() => setRecapOpen(false)} onApply={applyRecap} />
              );
            }
            return (
              <div className="film-grid" style={gridStyle}>
                {planningCast && (
                  <div className="film-buildpill-row">
                    <span className="film-buildpill"><span className="film-buildpill-dot" /> Sketching the cast…</span>
                  </div>
                )}
                {items}
                {ad && <AdEndCard ad={ad} onOpen={openFinish} />}
              </div>
            );
          })()}
          </>
        )}
      </div>

      {dock && (
        <div className={`film-dock${short && (stageState === 'plate_review' || stageState === 'review') ? ' is-short' : ''}`}>
          {dock}
        </div>
      )}

      {consentFor && (
        <ConsentModal onAgree={handleConsentAgree} onCancel={() => setConsentFor(null)} />
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
             style={{ display: 'none' }} onChange={handleFilePicked} />

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