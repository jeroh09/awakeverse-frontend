// src/components/Film/FilmLibrary.jsx
// The LEFT column of My Films — glass shelves. Frosted spines with accent corner
// brackets that lift on hover AND on scroll-spotlight (nearest-to-centre), and open
// into a frosted card. Same data + callbacks as before (nothing downstream changes):
// existing films/episodes open via the RESUME path (projectId only), "Play" watches
// output_url in a takeover, and the right marketing column is untouched.

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './FilmSeries.css';
import SeasonBoard from './SeasonBoard';
import { posterOf } from './filmPoster';
import { genreLabel, isAdGenre, adLengthTip } from './filmGenres';
import './FilmAdShelf.css';
import {
  IconSeries, IconBook, IconPlus, IconLock, IconRefreshLook, IconPlay, IconChevron, IconTrash,
} from './filmIcons';

const hash = (s = '') => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
// The episode's own THUMBNAIL first, AI key art second — one helper for every surface.
export { posterOf };
const cover = (item) => {
  const art = posterOf(item);
  if (art) return `url(${art})`;
  const h = hash(item?.title || 'x'); const a = h % 360, b = (a + 40) % 360;
  return `linear-gradient(150deg, hsl(${a} 52% 46%), hsl(${b} 44% 26%))`;
};
// per-book accent for the corner brackets + focus glow (drafts read cooler/greyer)
const accent = (item) => {
  if (item?.status && item.status !== 'ready' && item.status !== 'rendering') return '#64748B';
  return `hsl(${hash(item?.title || 'x') % 360} 68% 63%)`;
};
const STYLE_LABEL = { stylized_real: 'Realistic', realistic: 'Realistic', photoreal: 'Photoreal', anime: 'Anime', cartoon: 'Cartoon', comic_book: 'Comic' };
const styleLabel = (s) => STYLE_LABEL[s] || String(s || '').replace('_', ' ');
const stKey  = (s) => (s === 'ready' ? 'ready' : s === 'rendering' ? 'render' : 'draft');
const stText = (s) => (s === 'ready' ? 'Ready' : s === 'rendering' ? 'Rendering' : s === 'awaiting_review' ? 'Review' : 'Draft');
// One episode's state for tiles/rows: a completed PREVIEW (can_finish) reads "Preview"
// wherever an episode appears — not only on the shelf books (2026-10-12).
export const epState = (ep) => (ep?.can_finish ? 'preview'
  : ep?.status === 'ready' ? 'finished'
  : (ep?.status === 'rendering' || ep?.render_status === 'processing') ? 'rendering'
  : ep?.status === 'awaiting_review' ? 'review' : 'draft');
const EP_LABEL = { preview: 'Preview', finished: 'Finished', rendering: 'Rendering', review: 'Cast review', draft: 'Draft' };
const EP_TIP = {
  preview: 'A short preview is made — open it to finish the full episode',
  finished: 'Finished — open to watch or edit',
  rendering: 'Rendering now — open to watch it fill in',
  review: 'Waiting for you to check the cast',
  draft: 'Being written — open the writers\' room',
};

/* ── EpisodeTile — the Netflix-style poster tile (2026-10-12). The episode's own
   thumbnail, a big outlined episode number, the title stamped across the foot, and
   a status chip. Used by My Series and the season board, so an episode looks the
   same everywhere it appears. ── */
export function EpisodeTile({ ep, onOpen, onWatch, onDelete, size = 'md' }) {
  const st = epState(ep);
  const art = posterOf(ep);
  const hue = hash(ep?.title || 'x') % 360;
  const stop = (fn) => (e) => { e.stopPropagation(); if (fn) fn(); };
  const openLabel = st === 'preview' ? 'Finish' : st === 'finished' ? 'Open' : 'Continue';
  return (
    <div className={`fs-tile fs-tile--${size} is-${st}`} role="button" tabIndex={0}
         style={{ '--h': hue, ...(art ? { '--art': `url(${art})` } : {}) }}
         onClick={() => onOpen && onOpen(ep)} title={EP_TIP[st]}
         onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onOpen) { e.preventDefault(); onOpen(ep); } }}>
      <div className={`fs-tile-art${art ? '' : ' is-blank'}`} />
      <span className="fs-tile-num">{ep?.episode_ordinal ?? ''}</span>
      <span className={`fs-tile-st is-${st}`}>{EP_LABEL[st]}</span>
      {onDelete && (
        <button type="button" className="fs-tile-x" onClick={stop(() => onDelete(ep))}
                aria-label={`Delete episode ${ep?.episode_ordinal}`} title="Delete this episode (asks first)">×</button>
      )}
      <div className="fs-tile-foot">
        <span className="fs-tile-ep">Episode {ep?.episode_ordinal}</span>
        <span className="fs-tile-title">{ep?.title || 'Untitled'}</span>
        <span className="fs-tile-acts">
          {st === 'finished' && ep?.output_url && onWatch && (
            <button type="button" className="fs-tile-btn play" onClick={stop(() => onWatch(ep))}
                    title="Watch this episode"><IconPlay s={12} /> Play</button>
          )}
          <button type="button" className={`fs-tile-btn${st === 'preview' ? ' cta' : ''}`}
                  onClick={stop(() => onOpen && onOpen(ep))}
                  title={st === 'preview' ? 'Open the preview — finish the full episode from there'
                         : st === 'finished' ? 'Open the episode in the storyboard' : 'Carry on writing this episode'}>
            {openLabel}
          </button>
        </span>
      </div>
    </div>
  );
}

/* a glass rail with the scroll spotlight — the spine nearest the centre gets .is-focus
   (lifts + bobs), matching the hover affordance for touch/scroll. */
function GlassRail({ openId, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const rail = ref.current;
    if (!rail) return undefined;
    let raf = 0;
    const spot = () => {
      const mid = rail.scrollLeft + rail.clientWidth / 2;
      rail.querySelectorAll('.fs-book').forEach((b) => {
        if (b.classList.contains('is-open')) { b.classList.remove('is-focus'); return; }
        const c = b.offsetLeft + b.offsetWidth / 2;
        b.classList.toggle('is-focus', Math.abs(c - mid) < 42);
      });
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(spot); };
    rail.addEventListener('scroll', onScroll, { passive: true });
    spot();
    return () => { rail.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [openId]);
  return <div className="fs-rail" ref={ref}>{children}</div>;
}

function Book({ item, ordinal, isOpen, onToggle, onOpen, onWatch, onPromote, onDelete }) {
  const id = item.project_id || item.id;
  const ready = item.status === 'ready';
  const stop = (fn) => (e) => { e.stopPropagation(); if (fn) fn(); };
  return (
    <div className={`fs-book${isOpen ? ' is-open' : ''}${posterOf(item) ? ' has-art' : ''}`}
         style={{ '--c': accent(item), ...(posterOf(item) ? { '--art': `url(${posterOf(item)})` } : {}) }}
         title={isOpen ? undefined : `${ordinal ? `Episode ${ordinal}: ` : ''}${item.title || 'Untitled'} — click to open`}
         onClick={isOpen ? undefined : () => onToggle(id)} role="button" tabIndex={0}
         onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isOpen) { e.preventDefault(); onToggle(id); } }}>
      <div className="fs-spine">
        {ordinal ? <span className="fs-num">{ordinal}</span> : null}
        <span className="fs-cbl" /><span className="fs-cbr" />
        <span className="fs-vt">{item.title || 'Untitled'}</span>
        {item.status === 'rendering' && <span className="fs-dot" style={{ color: '#F59E0B', background: '#F59E0B' }} />}
      </div>
      <div className="fs-card" onClick={() => onOpen(item)}>
        <div className="fs-cover" style={{ '--cv': cover(item) }}>
          {/* A completed PREVIEW reads as 'ready' server-side; can_finish marks it
              as a teaser so the shelf shows "Preview" and routes into the workspace
              (where "Finish your film" renders the full 720p film). */}
          <span className={`fs-chip ${item.can_finish ? 'preview' : stKey(item.status)}`}>
            {item.can_finish ? 'Preview' : stText(item.status)}
          </span>
          {/* the title stamped on the poster, Netflix-style */}
          <span className="fs-cover-stamp">
            {ordinal ? <b>{ordinal}</b> : null}{item.title || 'Untitled'}
          </span>
          <span className="fs-rowbtns">
            {onDelete && (
              <button type="button" className="fs-mini" onClick={stop(() => onDelete(item))} aria-label="Delete film" title="Delete this film (asks first)"><IconTrash s={12} /></button>
            )}
            <button type="button" className="fs-mini" onClick={stop(() => onToggle(null))} aria-label="Back to shelf" title="Close this card"><IconChevron s={13} dir="left" /></button>
          </span>
          {ready && item.output_url && (
            <button type="button" className="fs-play" onClick={stop(() => onWatch(item))} aria-label="Play" title="Watch the film"><IconPlay s={15} /></button>
          )}
        </div>
        <div className="fs-ctitle">{ordinal ? `Ep ${ordinal} · ` : ''}{item.title || 'Untitled'}</div>
        <div className="fs-cmeta" title={item.isAd && item.duration_seconds ? adLengthTip(item.duration_seconds) : undefined}>{ordinal ? `Episode ${ordinal}`
          : item.isAd ? `Ad · ${item.duration_seconds ? `${item.duration_seconds}s · ` : ''}${item.aspect_ratio || '9:16'}`
          : `${styleLabel(item.video_style)} · ${item.aspect_ratio || '9:16'}`}</div>
        <div className="fs-cta">
          <button type="button" className="fs-cbtn play" onClick={stop(() => onOpen(item))}
                  title={item.can_finish ? 'Open the preview — finish the full film from there'
                         : ready ? 'Open in the storyboard'
                         : item.isAd ? 'Carry on in the Ad studio' : 'Carry on in the writers\' room'}>{item.can_finish ? 'Finish film' : ready ? 'Open' : 'Continue'}</button>
          {ready && item.standalone && (
            <button type="button" className="fs-cbtn ghost" onClick={stop(() => onPromote(item))}
                    title="Make this film Episode 1 of a new series — its cast is kept for every episode"><IconPlus s={12} /> Series</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Shelf({ s, onOpen, onWatch, onNewEpisode, onManage }) {
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId((prev) => (id === null || prev === id ? null : id));
  return (
    <div className="fs-shelf">
      <div className="fs-slbl">
        <span className="fs-badge"><IconSeries s={12} /> Series</span>
        <h3>{s.title}</h3>
        <span className="fs-info">
          <span>{styleLabel(s.video_style)}</span><span>{s.aspect_ratio}</span>
          <span>{s.episode_count} episode{s.episode_count === 1 ? '' : 's'}</span>
        </span>
        <button className="fs-manage" onClick={() => onManage(s)} title="See this series' episodes, cast and locations">Manage series <IconChevron s={13} dir="right" /></button>
      </div>
      <GlassRail openId={openId}>
        {(s.episodes || []).map((ep) => (
          <Book key={ep.project_id} item={ep} ordinal={ep.episode_ordinal}
                isOpen={openId === ep.project_id} onToggle={toggle}
                onOpen={onOpen} onWatch={onWatch} onPromote={() => {}} />
        ))}
        <button className="fs-addep" onClick={() => onNewEpisode(s)} aria-label="New episode" title="Start the next episode — the cast comes with it"><IconPlus s={22} /></button>
      </GlassRail>
      <div className="fs-ledge" />
    </div>
  );
}

function SinglesShelf({ films, onOpen, onWatch, onPromote, onDelete }) {
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId((prev) => (id === null || prev === id ? null : id));
  if (!films.length) return null;
  return (
    <div className="fs-shelf">
      <div className="fs-slbl">
        <span className="fs-badge singles"><IconBook s={12} /> Singles</span>
        <h3>Standalone films</h3>
        <span className="fs-count">{films.length} film{films.length === 1 ? '' : 's'}</span>
      </div>
      <GlassRail openId={openId}>
        {films.map((f) => (
          <Book key={f.id || f.project_id} item={{ ...f, standalone: true }}
                isOpen={openId === (f.id || f.project_id)} onToggle={toggle}
                onOpen={onOpen} onWatch={onWatch} onPromote={onPromote} onDelete={onDelete} />
        ))}
      </GlassRail>
      <div className="fs-ledge" />
    </div>
  );
}

/* ADVERTISING MODE (2026-10-18) — ads get their own shelf. Marked by the server
   (genre 'advertise', only while AD_MODE is on), so with the switch off every ad sits
   on Singles exactly as before. No "+ Series" here: an ad is never a series in v1. */
const IconAd = ({ s = 12 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M19 6a8 8 0 0 1 0 12" />
  </svg>
);

function AdsShelf({ ads, onOpen, onWatch, onDelete, onNewAd }) {
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId((prev) => (id === null || prev === id ? null : id));
  if (!ads.length) return null;
  return (
    <div className="fs-shelf fs-shelf--ads">
      <div className="fs-slbl">
        <span className="fs-badge fs-badge--ads"><IconAd s={12} /> Ads</span>
        <h3>Your ads</h3>
        <span className="fs-count">{ads.length} ad{ads.length === 1 ? '' : 's'}</span>
      </div>
      <GlassRail openId={openId}>
        {ads.map((f) => (
          <Book key={f.id || f.project_id} item={{ ...f, isAd: true }}
                isOpen={openId === (f.id || f.project_id)} onToggle={toggle}
                onOpen={onOpen} onWatch={onWatch} onPromote={() => {}} onDelete={onDelete} />
        ))}
        {onNewAd && (
          <button className="fs-addep" onClick={onNewAd} aria-label="New ad"
                  title="Start a new ad in the Ad studio"><IconPlus s={22} /></button>
        )}
      </GlassRail>
      <div className="fs-ledge" />
    </div>
  );
}

/* My Series — glass management panel (bible · locked cast · locked locations · episodes) */
function MySeries({ series, onNewEpisode, onOpen, onWatch, onRefreshPlate,
                    onDeleteEpisode = () => {}, onDeleteSeries = () => {} }) {
  const [sel, setSel] = useState(series[0]?.series_id ?? null);
  // Detail tabs (2026-10-12): the episodes come first, the reference material (bible,
  // cast, locations) sits behind its own tabs instead of pushing everything down.
  const [tab, setTab] = useState('season');
  // The Season tab exists only while the season-plan routes answer (SEASON_PLAN=1);
  // the board reports a 404 and the tab steps aside to Episodes.
  const [planOn, setPlanOn] = useState(true);
  // Two-step inline confirms (no window.confirm): arming state holds WHICH
  // thing is pending. Deletes are irreversible server-side, so nothing fires
  // on the first click of either affordance.
  const [confirmEp, setConfirmEp] = useState(null);        // episode object or null
  const [confirmSeries, setConfirmSeries] = useState(false);
  const cur = series.find((x) => x.series_id === sel) || series[0];
  if (!series.length) return (
    <div className="fs-empty fs-glass">
      <h3>No series yet</h3>
      <p>Turn a finished film into a series from its storyboard, or start a fresh one with ＋ New Series.</p>
    </div>
  );
  const eps = cur.episodes || [];
  const castN = (cur.cast || []).length, locN = (cur.locations || []).length;
  const TABS = [
    ...(planOn ? [{ k: 'season', l: 'Season', tip: 'The season plan — one card per episode, with how each one ends and pulls into the next' }] : []),
    { k: 'episodes', l: `Episodes · ${eps.length}`, tip: 'Every episode, with its poster' },
    { k: 'cast', l: `Bible & cast · ${castN}`, tip: 'The series bible and the locked cast every episode reuses' },
    { k: 'locations', l: `Locations · ${locN}`, tip: 'Places the series keeps the same in every episode' },
  ];
  return (
    <div className="fs-series-wrap">
      <div className="fs-slist">
        {series.map((s) => (
          <button key={s.series_id} className={`fs-scard fs-glass${s.series_id === cur.series_id ? ' is-sel' : ''}`}
                  onClick={() => { setSel(s.series_id); setTab(planOn ? 'season' : 'episodes'); }} title={`Show ${s.title}`}>
            <div className="fs-stack">
              {(s.episodes || []).slice(-3).map((e) => <span key={e.project_id} style={{ background: cover(e), backgroundSize: 'cover', backgroundPosition: 'center' }} />)}
            </div>
            <h4>{s.title}</h4>
            <div className="fs-sub">
              {s.cast_count} character{s.cast_count === 1 ? '' : 's'}
              {s.location_count ? ` · ${s.location_count} location${s.location_count === 1 ? '' : 's'}` : ''}
              {' · '}{s.episode_count} episode{s.episode_count === 1 ? '' : 's'}
            </div>
          </button>
        ))}
      </div>

      <div className="fs-detail fs-glass">
        <div className="fs-detail-head">
          <div>
            <h2>{cur.title}</h2>
            <span className="fs-info"><span>{styleLabel(cur.video_style)}</span><span>{cur.aspect_ratio}</span><span>{cur.episode_count} episodes</span>{genreLabel(cur.genre) ? <span>{genreLabel(cur.genre)}</span> : null}</span>
          </div>
          <button className="fs-newep" onClick={() => onNewEpisode(cur)} title="Start the next episode — the cast and bible come with it"><IconPlus s={15} /> New Episode</button>
        </div>

        <div className="fs-dtabs" role="tablist" aria-label="Series sections">
          {TABS.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k}
                    className={tab === t.k ? 'is-on' : ''} onClick={() => setTab(t.k)} title={t.tip}>{t.l}</button>
          ))}
        </div>

        {tab === 'season' && planOn && (
          <SeasonBoard key={cur.series_id} series={cur}
                       onStartEpisode={(card) => onNewEpisode(cur, { planCard: card.n })}
                       onOpen={onOpen} onWatch={onWatch}
                       onAvailability={(ok) => { setPlanOn(ok); if (!ok) setTab('episodes'); }} />
        )}

        {tab === 'episodes' && (
          <>
            {confirmEp && (
              <div className="fs-ep fs-ep--confirm">
                <span className="fs-ord">{confirmEp.episode_ordinal}</span>
                <span className="fs-et">Delete "{confirmEp.title || `Episode ${confirmEp.episode_ordinal}`}"? Its chat goes with it; rendered videos stay in My Videos.</span>
                <button type="button" className="fs-ep-yes" title="Delete this episode for good"
                        onClick={() => { const e = confirmEp; setConfirmEp(null); onDeleteEpisode(cur.series_id, e.project_id); }}>
                  Delete
                </button>
                <button type="button" className="fs-ep-no" onClick={() => setConfirmEp(null)} title="Keep the episode">Keep</button>
              </div>
            )}
            {eps.length ? (
              <div className="fs-tilerow">
                {eps.map((ep) => (
                  <EpisodeTile key={ep.project_id} ep={ep} onOpen={onOpen} onWatch={onWatch}
                               onDelete={(e) => setConfirmEp(e)} />
                ))}
                <button type="button" className="fs-tile fs-tile--add" onClick={() => onNewEpisode(cur)}
                        title="Start the next episode — the cast and bible come with it">
                  <IconPlus s={22} /><span>Episode {eps.length + 1}</span>
                </button>
              </div>
            ) : (
              <div className="fs-empty fs-glass">
                <h3>No episodes yet</h3>
                <p>Start Episode 1 — its cast is saved and reused from then on.</p>
              </div>
            )}
          </>
        )}

        {tab === 'cast' && (
          <>
            {(cur.has_bible || cur.canonical_bible) ? (
              <>
                <p className="fs-seclabel">Series bible</p>
                <div className="fs-bible">
                  {cur.canonical_bible
                    ? cur.canonical_bible.split('\n').map((l) => l.trim()).filter(Boolean).map((ln, i) => {
                        const ci = ln.indexOf(':');
                        const label = ci > 0 ? ln.slice(0, ci).trim() : '';
                        // only treat as a "Label: value" row when the label is short (a real
                        // field like Premise/Tone), otherwise it's free-form prose.
                        const labeled = ci > 0 && label.length <= 20 && label.split(/\s+/).length <= 3;
                        return labeled
                          ? <div className="fs-row" key={i}><span className="fs-k">{label}</span><span className="fs-v">{ln.slice(ci + 1).trim()}</span></div>
                          : <p className="fs-bible-p" key={i}>{ln}</p>;
                      })
                    : <p className="fs-bible-p" style={{ color: 'var(--muted)' }}>Bible saved.</p>}
                </div>
              </>
            ) : <p className="fs-bible-p" style={{ color: 'var(--muted)' }}>No bible yet — one is drafted after Episode 1.</p>}

            {castN ? (
              <>
                <p className="fs-seclabel">Recurring cast · locked looks</p>
                <div className="fs-roster">
                  {cur.cast.map((c) => (
                    <div className="fs-cast" key={c.name}>
                      <div className="fs-plate" style={{ background: cover({ title: c.name }) }}>
                        {c.plate_url && (
                          <img src={c.plate_url} alt={c.name} className="fs-plate-img"
                               onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        )}
                        {c.plate_url && <span className="fs-lock" title="This look is locked — every episode uses it"><IconLock s={11} /> Locked</span>}
                      </div>
                      <div className="fs-cbody">
                        <div className="fs-cn">{c.name}</div>
                        {c.description && <div className="fs-cd" title={c.description}>{c.description}</div>}
                        <button className="fs-refresh" onClick={() => onRefreshPlate(cur, c)}
                                title={`Redraw ${c.name}'s look for future episodes — finished episodes keep theirs`}><IconRefreshLook s={13} /> Refresh look</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}

        {tab === 'locations' && (
          locN ? (
            <div className="fs-locgrid">
              {cur.locations.map((l) => (
                <div className="fs-locard" key={l.name} title={l.plate_url ? `${l.name} — locked for every episode` : l.name}
                     style={{ '--art': l.plate_url ? `url(${l.plate_url})` : cover({ title: l.name }) }}>
                  <span className="fs-locard-name">{l.name.replace(/_/g, ' ')}</span>
                  {l.plate_url && <span className="fs-lock"><IconLock s={10} /> Locked</span>}
                </div>
              ))}
            </div>
          ) : <p className="fs-bible-p" style={{ color: 'var(--muted)' }}>No locations saved yet.</p>
        )}

        {confirmSeries ? (
          <div className="fs-delseries fs-delseries--confirm">
            <span>Delete the whole series "{cur.title}" — all {eps.length} episode(s) and its locked cast &amp; locations? This can't be undone. Rendered videos stay in My Videos.</span>
            <button type="button" className="fs-ep-yes" title="Delete the series for good"
                    onClick={() => { setConfirmSeries(false); onDeleteSeries(cur.series_id); }}>
              Delete series
            </button>
            <button type="button" className="fs-ep-no" onClick={() => setConfirmSeries(false)} title="Keep the series">Keep</button>
          </div>
        ) : (
          <button type="button" className="fs-delseries" onClick={() => setConfirmSeries(true)}
                  title="Delete this series, its episodes and its locked cast (asks first)">
            Delete series…
          </button>
        )}
      </div>
    </div>
  );
}

function PlayerOverlay({ item, onClose }) {
  // THE SEEP-THROUGH BUG (2026-08-24): this scrim is position:fixed/z-70, but
  // it rendered INSIDE the library column — and any ancestor with a transform,
  // filter, or backdrop-filter (the shelf hovers, the ambient video wall) turns
  // position:fixed into position:absolute-within-that-ancestor AND caps its
  // z-index to the ancestor's own stacking context. Result: the right feature
  // grid, a LATER SIBLING, painted over the "takeover" player and clipped it.
  // The structural fix is a PORTAL to document.body: no ancestor can ever trap
  // or out-stack it, regardless of what CSS the library grows next. Escape on
  // Esc rides along since the player is now the top layer by construction.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';          // no library scroll behind
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return createPortal(
    <div className="fs-player-scrim" onClick={onClose}>
      <div className="fs-player-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fs-player-close" onClick={onClose} aria-label="Close" title="Close the player (Esc)">×</button>
        <video src={item.output_url} controls autoPlay playsInline className="fs-player-vid" />
      </div>
    </div>,
    document.body
  );
}

export default function FilmLibrary({
  series = [], films = [], filmCount = 0,
  onOpenFilm = () => {}, onNewFilm = () => {}, onNewSeries = () => {},
  onNewEpisode = () => {}, onPromote = () => {}, onRefreshPlate = () => {},
  onDelete = () => {}, onManageSeries,
  onDeleteEpisode = () => {}, onDeleteSeries = () => {},
  onNewAd = null,              // optional — the Ads shelf's ＋ (opens New Film on Advertise)
  // Optional CONTROLLED tab (2026-10-12): MyFilmsView owns it so the page can give My
  // Series the full width. Uncontrolled (own state) when not passed — unchanged.
  view: viewProp, onViewChange,
}) {
  const [viewOwn, setViewOwn] = useState('films');
  const view = viewProp || viewOwn;
  const setView = (v) => { setViewOwn(v); if (onViewChange) onViewChange(v); };
  const [watching, setWatching] = useState(null);
  const singles = films.filter((f) => !f.series_id && !isAdGenre(f.genre));
  const ads = films.filter((f) => !f.series_id && isAdGenre(f.genre));
  const goManage = (s) => { setView('series'); if (onManageSeries) onManageSeries(s); };
  // EXISTING items open via the resume path — projectId only, NO session_id.
  const open = (item) => onOpenFilm(item.project_id || item.id);
  const watch = (item) => { if (item.output_url) setWatching(item); else open(item); };

  return (
    <div className="fs">
      <div className="fs-pillrow">
        <div className="fs-pill" role="tablist" aria-label="Library">
          <button className={`fs-tab${view === 'films' ? ' is-on' : ''}`} onClick={() => setView('films')} role="tab" aria-selected={view === 'films'}
                  title="Your films and series shelves">
            My Films <span className="fs-ct">· {filmCount || films.length}</span>
          </button>
          <button className="fs-new" onClick={onNewFilm} title="Start a new standalone film — writing is free"><IconPlus s={14} /> New Film</button>
          <span className="fs-div" />
          <button className={`fs-tab${view === 'series' ? ' is-on' : ''}`} onClick={() => setView('series')} role="tab" aria-selected={view === 'series'}
                  title="Manage your series — episodes, cast and locations">
            My Series <span className="fs-ct">· {series.length}</span>
          </button>
          <button className="fs-new fs-new--ghost" onClick={onNewSeries} title="Start a series — a recurring cast across episodes"><IconPlus s={14} /> New Series</button>
        </div>
      </div>

      <div className="fs-scroll">
        {view === 'films' ? (
          <div>
            <div className="fs-lead">
              <h2>My Films</h2>
              <p>Glass spines — scroll a shelf for the spotlight, or hover. Tap a spine to open it.</p>
            </div>
            {series.map((s) => (
              <Shelf key={s.series_id} s={s} onOpen={open} onWatch={watch} onNewEpisode={onNewEpisode} onManage={goManage} />
            ))}
            <SinglesShelf films={singles} onOpen={open} onWatch={watch} onPromote={onPromote} onDelete={onDelete} />
            <AdsShelf ads={ads} onOpen={open} onWatch={watch} onDelete={onDelete} onNewAd={onNewAd} />
            {!series.length && !singles.length && !ads.length && (
              <div className="fs-empty fs-glass">
                <h3>Your shelf is empty</h3>
                <p>Start with ＋ New Film, or ＋ New Series to build something with a recurring cast.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="fs-lead">
              <h2>My Series</h2>
              <p>The cast, locations and bible each series carries forward — and where the next episode begins.</p>
            </div>
            <MySeries series={series} onNewEpisode={onNewEpisode} onOpen={open} onWatch={watch} onRefreshPlate={onRefreshPlate}
                      onDeleteEpisode={onDeleteEpisode} onDeleteSeries={onDeleteSeries} />
          </div>
        )}
      </div>

      {watching && <PlayerOverlay item={watching} onClose={() => setWatching(null)} />}
    </div>
  );
}