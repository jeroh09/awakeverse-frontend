// src/components/Film/FilmLibrary.jsx
// The LEFT column of My Films — glass shelves. Frosted spines with accent corner
// brackets that lift on hover AND on scroll-spotlight (nearest-to-centre), and open
// into a frosted card. Same data + callbacks as before (nothing downstream changes):
// existing films/episodes open via the RESUME path (projectId only), "Play" watches
// output_url in a takeover, and the right marketing column is untouched.

import React, { useState, useRef, useEffect } from 'react';
import './FilmSeries.css';
import {
  IconSeries, IconBook, IconPlus, IconLock, IconRefreshLook, IconPlay, IconChevron, IconTrash,
} from './filmIcons';

const hash = (s = '') => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const cover = (item) => {
  const art = item?.key_art_url || item?.thumbnail_url;
  if (art) return `url(${art})`;
  const h = hash(item?.title || 'x'); const a = h % 360, b = (a + 40) % 360;
  return `linear-gradient(150deg, hsl(${a} 52% 46%), hsl(${b} 44% 26%))`;
};
// per-book accent for the corner brackets + focus glow (drafts read cooler/greyer)
const accent = (item) => {
  if (item?.status && item.status !== 'ready' && item.status !== 'rendering') return '#64748B';
  return `hsl(${hash(item?.title || 'x') % 360} 68% 63%)`;
};
const STYLE_LABEL = { stylized_real: 'Realistic', realistic: 'Realistic', anime: 'Anime', cartoon: 'Cartoon', comic_book: 'Comic' };
const styleLabel = (s) => STYLE_LABEL[s] || String(s || '').replace('_', ' ');
const stKey  = (s) => (s === 'ready' ? 'ready' : s === 'rendering' ? 'render' : 'draft');
const stText = (s) => (s === 'ready' ? 'Ready' : s === 'rendering' ? 'Rendering' : s === 'awaiting_review' ? 'Review' : 'Draft');

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
    <div className={`fs-book${isOpen ? ' is-open' : ''}`} style={{ '--c': accent(item) }}
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
          <span className={`fs-chip ${stKey(item.status)}`}>{stText(item.status)}</span>
          <span className="fs-rowbtns">
            {onDelete && (
              <button type="button" className="fs-mini" onClick={stop(() => onDelete(item))} aria-label="Delete film"><IconTrash s={12} /></button>
            )}
            <button type="button" className="fs-mini" onClick={stop(() => onToggle(null))} aria-label="Back to shelf"><IconChevron s={13} dir="left" /></button>
          </span>
          {ready && item.output_url && (
            <button type="button" className="fs-play" onClick={stop(() => onWatch(item))} aria-label="Play"><IconPlay s={15} /></button>
          )}
        </div>
        <div className="fs-ctitle">{ordinal ? `Ep ${ordinal} · ` : ''}{item.title || 'Untitled'}</div>
        <div className="fs-cmeta">{ordinal ? `Episode ${ordinal}` : `${styleLabel(item.video_style)} · ${item.aspect_ratio || '9:16'}`}</div>
        <div className="fs-cta">
          <button type="button" className="fs-cbtn play" onClick={stop(() => onOpen(item))}>{ready ? 'Open' : 'Continue'}</button>
          {ready && item.standalone && (
            <button type="button" className="fs-cbtn ghost" onClick={stop(() => onPromote(item))}><IconPlus s={12} /> Series</button>
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
        <button className="fs-manage" onClick={() => onManage(s)}>Manage series <IconChevron s={13} dir="right" /></button>
      </div>
      <GlassRail openId={openId}>
        {(s.episodes || []).map((ep) => (
          <Book key={ep.project_id} item={ep} ordinal={ep.episode_ordinal}
                isOpen={openId === ep.project_id} onToggle={toggle}
                onOpen={onOpen} onWatch={onWatch} onPromote={() => {}} />
        ))}
        <button className="fs-addep" onClick={() => onNewEpisode(s)} aria-label="New episode"><IconPlus s={22} /></button>
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

/* My Series — glass management panel (bible · locked cast · locked locations · episodes) */
function MySeries({ series, onNewEpisode, onOpen, onRefreshPlate }) {
  const [sel, setSel] = useState(series[0]?.series_id ?? null);
  const cur = series.find((x) => x.series_id === sel) || series[0];
  if (!series.length) return (
    <div className="fs-empty fs-glass">
      <h3>No series yet</h3>
      <p>Turn a finished film into a series from its storyboard, or start a fresh one with ＋ New Series.</p>
    </div>
  );
  return (
    <div className="fs-series-wrap">
      <div className="fs-slist">
        {series.map((s) => (
          <button key={s.series_id} className={`fs-scard fs-glass${s.series_id === cur.series_id ? ' is-sel' : ''}`}
                  onClick={() => setSel(s.series_id)}>
            <div className="fs-stack">
              {(s.episodes || []).slice(0, 3).map((e) => <span key={e.project_id} style={{ background: cover(e) }} />)}
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
            <span className="fs-info"><span>{styleLabel(cur.video_style)}</span><span>{cur.aspect_ratio}</span><span>{cur.episode_count} episodes</span></span>
          </div>
          <button className="fs-newep" onClick={() => onNewEpisode(cur)}><IconPlus s={15} /> New Episode</button>
        </div>

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
        ) : null}

        {(cur.cast && cur.cast.length) ? (
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
                    {c.plate_url && <span className="fs-lock"><IconLock s={11} /> Locked</span>}
                  </div>
                  <div className="fs-cbody">
                    <div className="fs-cn">{c.name}</div>
                    {c.description && <div className="fs-cd">{c.description}</div>}
                    <button className="fs-refresh" onClick={() => onRefreshPlate(cur, c)}><IconRefreshLook s={13} /> Refresh look</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {(cur.locations && cur.locations.length) ? (
          <>
            <p className="fs-seclabel">Recurring locations · locked</p>
            <div className="fs-locrow">
              {cur.locations.map((l) => (
                <span className="fs-loc" key={l.name}>
                  <span className="fs-loc-sw" style={{ background: l.plate_url ? `url(${l.plate_url})` : cover({ title: l.name }) }} />
                  {l.name}{l.plate_url && <IconLock s={10} />}
                </span>
              ))}
            </div>
          </>
        ) : null}

        <p className="fs-seclabel">Episodes</p>
        <div className="fs-eplist">
          {(cur.episodes || []).map((ep) => (
            <button className="fs-ep" key={ep.project_id} onClick={() => onOpen(ep)}>
              <span className="fs-ord">{ep.episode_ordinal}</span>
              <span className="fs-et">{ep.title || 'Untitled'}</span>
              <span className={`fs-est ${stKey(ep.status)}`}>{stText(ep.status)}</span>
              <span className="fs-open">Open →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerOverlay({ item, onClose }) {
  return (
    <div className="fs-player-scrim" onClick={onClose}>
      <div className="fs-player-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fs-player-close" onClick={onClose} aria-label="Close">×</button>
        <video src={item.output_url} controls autoPlay playsInline className="fs-player-vid" />
      </div>
    </div>
  );
}

export default function FilmLibrary({
  series = [], films = [], filmCount = 0,
  onOpenFilm = () => {}, onNewFilm = () => {}, onNewSeries = () => {},
  onNewEpisode = () => {}, onPromote = () => {}, onRefreshPlate = () => {},
  onDelete = () => {}, onManageSeries,
}) {
  const [view, setView] = useState('films');
  const [watching, setWatching] = useState(null);
  const singles = films.filter((f) => !f.series_id);
  const goManage = (s) => { setView('series'); if (onManageSeries) onManageSeries(s); };
  // EXISTING items open via the resume path — projectId only, NO session_id.
  const open = (item) => onOpenFilm(item.project_id || item.id);
  const watch = (item) => { if (item.output_url) setWatching(item); else open(item); };

  return (
    <div className="fs">
      <div className="fs-pillrow">
        <div className="fs-pill" role="tablist" aria-label="Library">
          <button className={`fs-tab${view === 'films' ? ' is-on' : ''}`} onClick={() => setView('films')} role="tab" aria-selected={view === 'films'}>
            My Films <span className="fs-ct">· {filmCount || films.length}</span>
          </button>
          <button className="fs-new" onClick={onNewFilm}><IconPlus s={14} /> New Film</button>
          <span className="fs-div" />
          <button className={`fs-tab${view === 'series' ? ' is-on' : ''}`} onClick={() => setView('series')} role="tab" aria-selected={view === 'series'}>
            My Series <span className="fs-ct">· {series.length}</span>
          </button>
          <button className="fs-new fs-new--ghost" onClick={onNewSeries}><IconPlus s={14} /> New Series</button>
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
            {!series.length && !singles.length && (
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
            <MySeries series={series} onNewEpisode={onNewEpisode} onOpen={open} onRefreshPlate={onRefreshPlate} />
          </div>
        )}
      </div>

      {watching && <PlayerOverlay item={watching} onClose={() => setWatching(null)} />}
    </div>
  );
}