// src/components/Film/FilmLibrary.jsx
// The LEFT column of My Films. A segmented pill switches between the bookshelf
// (My Films) and My Series (management). Presentational: data + callbacks come
// from MyFilmsView. Right marketing column is untouched.
//
// Opening an EXISTING film/episode goes through the RESUME path (projectId only,
// no session_id) so the workspace restores chat + render. Only freshly-created
// films/episodes pass a session_id (handled by MyFilmsView/FilmSeriesModals, not
// here). "Play" watches the finished film inline in a takeover player.

import React, { useState } from 'react';
import './FilmSeries.css';
import {
  IconSeries, IconBook, IconPlus, IconLock, IconRefreshLook, IconPlay, IconChevron, IconTrash,
} from './filmIcons';

const hash = (s = '') => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const cover = (item) => {
  if (item?.thumbnail_url || item?.key_art_url) return `url(${item.thumbnail_url || item.key_art_url})`;
  const h = hash(item?.title || 'x'); const a = h % 360, b = (a + 40) % 360;
  return `linear-gradient(150deg, hsl(${a} 55% 55%), hsl(${b} 45% 30%))`;
};
const bind = (item) => { const h = hash((item?.title || 'x') + 'b') % 360; return `linear-gradient(hsl(${h} 40% 32%), hsl(${h} 45% 16%))`; };
const dot  = (item) => `hsl(${hash(item?.title || 'x') % 360} 60% 60%)`;
const stKey  = (s) => (s === 'ready' ? 'ready' : s === 'rendering' ? 'rendering' : s === 'awaiting_review' ? 'review' : 'draft');
const stText = (s) => (s === 'ready' ? 'Ready' : s === 'rendering' ? 'Rendering' : s === 'awaiting_review' ? 'Awaiting review' : 'Draft');
// "stylized_real" and "realistic" are the same thing → both read "Realistic".
const STYLE_LABEL = { stylized_real: 'Realistic', realistic: 'Realistic', anime: 'Anime', cartoon: 'Cartoon', comic_book: 'Comic' };
const styleLabel = (s) => STYLE_LABEL[s] || String(s || '').replace('_', ' ');

/* one book: a spine that opens into its cover */
function Book({ item, ordinal, openId, setOpenId, onOpen, onWatch, onPromote, onDelete }) {
  const id = item.project_id || item.id;
  const isOpen = openId === id;
  const ready = item.status === 'ready';
  const stop = (fn) => (e) => { e.stopPropagation(); if (fn) fn(); };
  return (
    <div className={`fs-book${isOpen ? ' is-open' : ''}`}
         style={{ '--bind': bind(item), '--cover': cover(item) }}
         onClick={isOpen ? undefined : () => setOpenId(id)}
         role="button" tabIndex={0}
         onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isOpen) { e.preventDefault(); setOpenId(id); } }}>
      <div className="fs-spine" aria-hidden={isOpen}>
        {ordinal ? <span className="fs-num">{ordinal}</span> : <span className="fs-num" aria-hidden />}
        <span className="fs-vt">{item.title || 'Untitled'}</span>
        <span className="fs-dot" style={{ background: dot(item) }} />
      </div>
      <div className="fs-cover">
        <span className={`fs-st ${stKey(item.status)}`}>{stText(item.status)}</span>
        <button type="button" className="fs-cx" onClick={stop(() => setOpenId(null))} aria-label="Back to shelf">
          <IconChevron s={14} dir="left" />
        </button>
        <div className="fs-cov-in">
          <h4>{ordinal ? `Ep ${ordinal} · ` : ''}{item.title || 'Untitled'}</h4>
          <div className="fs-cacts">
            {ready && item.output_url && (
              <button type="button" className="fs-cbtn play" onClick={stop(() => onWatch(item))}><IconPlay s={13} /> Play</button>
            )}
            <button type="button" className="fs-cbtn" onClick={stop(() => onOpen(item))}>{ready ? 'Edit' : 'Open'}</button>
            {ready && item.standalone && (
              <button type="button" className="fs-cbtn promote" onClick={stop(() => onPromote(item))}><IconPlus s={12} /> Series</button>
            )}
            {onDelete && (
              <button type="button" className="fs-cbtn fs-cbtn--del" onClick={stop(() => onDelete(item))} aria-label="Delete film"><IconTrash s={13} /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Shelf({ s, onOpen, onWatch, onNewEpisode, onManage }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div className="fs-shelf">
      <div className="fs-shelf-head">
        <span className="fs-badge"><IconSeries s={12} /> Series</span>
        <h3>{s.title}</h3>
        <span className="fs-info">
          <span>{styleLabel(s.video_style)}</span><span>{s.aspect_ratio}</span>
          <span>{s.episode_count} episode{s.episode_count === 1 ? '' : 's'}</span>
        </span>
        <button className="fs-manage" onClick={() => onManage(s)}>Manage series <IconChevron s={13} dir="right" /></button>
      </div>
      <div className="fs-books">
        {(s.episodes || []).map((ep) => (
          <Book key={ep.project_id} item={ep} ordinal={ep.episode_ordinal}
                openId={openId} setOpenId={setOpenId} onOpen={onOpen} onWatch={onWatch} onPromote={() => {}} />
        ))}
        <button className="fs-addep" onClick={() => onNewEpisode(s)} aria-label="New episode"><IconPlus s={20} /></button>
      </div>
      <div className="fs-ledge" />
    </div>
  );
}

function SinglesShelf({ films, onOpen, onWatch, onPromote, onDelete }) {
  const [openId, setOpenId] = useState(null);
  if (!films.length) return null;
  return (
    <div className="fs-shelf">
      <div className="fs-shelf-head">
        <span className="fs-badge singles"><IconBook s={12} /> Singles</span>
        <h3>Standalone films</h3>
        <span className="fs-info"><span>{films.length} film{films.length === 1 ? '' : 's'}</span></span>
      </div>
      <div className="fs-books">
        {films.map((f) => (
          <Book key={f.id || f.project_id} item={{ ...f, standalone: true }}
                openId={openId} setOpenId={setOpenId}
                onOpen={onOpen} onWatch={onWatch} onPromote={onPromote} onDelete={onDelete} />
        ))}
      </div>
      <div className="fs-ledge" />
    </div>
  );
}

function MySeries({ series, onNewEpisode, onOpen, onRefreshPlate }) {
  const [sel, setSel] = useState(series[0]?.series_id ?? null);
  const cur = series.find((x) => x.series_id === sel) || series[0];
  if (!series.length) return (
    <div className="fs-empty fs-dbl">
      <h3>No series yet</h3>
      <p>Turn a finished film into a series from its storyboard, or start a fresh one with ＋ New Series.</p>
    </div>
  );
  return (
    <div className="fs-series-wrap">
      <div className="fs-slist">
        {series.map((s) => (
          <button key={s.series_id} className={`fs-scard fs-dbl${s.series_id === cur.series_id ? ' is-sel' : ''}`}
                  onClick={() => setSel(s.series_id)}>
            <div className="fs-stack">
              {(s.episodes || []).slice(0, 3).map((e) => <span key={e.project_id} style={{ background: cover(e) }} />)}
            </div>
            <h4>{s.title}</h4>
            <div className="fs-sub">{s.cast_count} character{s.cast_count === 1 ? '' : 's'} · {s.episode_count} episode{s.episode_count === 1 ? '' : 's'}</div>
          </button>
        ))}
      </div>

      <div className="fs-detail fs-dbl">
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
                ? cur.canonical_bible.split('\n').filter(Boolean).map((ln, i) => {
                    const [k, ...rest] = ln.split(':');
                    return <div className="fs-row" key={i}><span className="fs-k">{k}</span><span className="fs-v">{rest.join(':').trim()}</span></div>;
                  })
                : <div className="fs-row"><span className="fs-v" style={{ color: 'var(--muted)' }}>Bible saved.</span></div>}
            </div>
          </>
        ) : null}

        {(cur.cast && cur.cast.length) ? (
          <>
            <p className="fs-seclabel">Recurring cast · locked looks</p>
            <div className="fs-roster">
              {cur.cast.map((c) => (
                <div className="fs-cast" key={c.name}>
                  <div className="fs-plate" style={{ '--pc': c.plate_url ? `url(${c.plate_url})` : cover({ title: c.name }) }}>
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
  // EXISTING items open via the resume path — projectId only, NO session_id — so
  // the workspace restores chat + render (passing a session_id would force the
  // empty "fresh room" branch → the blank workspace bug).
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

      {view === 'films' ? (
        <div style={{ marginTop: 20 }}>
          <div className="fs-lead">
            <h2>My Films</h2>
            <p>Series sit on their own shelf in episode order. Standalone films live on Singles. Tap a spine to open it.</p>
          </div>
          {series.map((s) => (
            <Shelf key={s.series_id} s={s} onOpen={open} onWatch={watch} onNewEpisode={onNewEpisode} onManage={goManage} />
          ))}
          <SinglesShelf films={singles} onOpen={open} onWatch={watch} onPromote={onPromote} onDelete={onDelete} />
          {!series.length && !singles.length && (
            <div className="fs-empty fs-dbl">
              <h3>Your shelf is empty</h3>
              <p>Start with ＋ New Film, or ＋ New Series to build something with a recurring cast.</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div className="fs-lead">
            <h2>My Series</h2>
            <p>The cast and bible each series carries forward — and where the next episode begins.</p>
          </div>
          <MySeries series={series} onNewEpisode={onNewEpisode} onOpen={open} onRefreshPlate={onRefreshPlate} />
        </div>
      )}

      {watching && <PlayerOverlay item={watching} onClose={() => setWatching(null)} />}
    </div>
  );
}