// src/components/Film/FilmLibrary.jsx
// The LEFT column of My Films. A segmented pill switches between two windows —
// the bookshelf (My Films: series on shelves, standalone films on Singles) and
// My Series (management). Presentational: data + callbacks come from the parent
// (MyFilmsView wires useFilmSeries + useFilmProjects). The RIGHT marketing column
// is untouched — this drops into the existing left split without breaking it.
//
// Episodes reuse the existing workspace, so opening one is just onOpenFilm(
// project_id, session_id) — credits and rendering are unchanged.

import React, { useState } from 'react';
import './FilmSeries.css';
import {
  IconSeries, IconBook, IconPlus, IconLock, IconRefreshLook, IconPlay, IconChevron,
} from './filmIcons';

/* deterministic gradient/binding from a string, so covers look intentional even
   before we enrich list_series with real per-episode thumbnails */
const hash = (s = '') => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const cover = (item) => {
  if (item?.thumbnail_url || item?.key_art_url) return `url(${item.thumbnail_url || item.key_art_url})`;
  const h = hash(item?.title || 'x'); const a = h % 360, b = (a + 40) % 360;
  return `linear-gradient(150deg, hsl(${a} 55% 55%), hsl(${b} 45% 30%))`;
};
const bind = (item) => { const h = hash((item?.title || 'x') + 'b') % 360; return `linear-gradient(hsl(${h} 40% 32%), hsl(${h} 45% 16%))`; };
const dot  = (item) => `hsl(${hash(item?.title || 'x') % 360} 60% 60%)`;
const stKey = (s) => (s === 'ready' ? 'ready' : s === 'rendering' ? 'rendering' : s === 'awaiting_review' ? 'review' : 'draft');
const stText = (s) => (s === 'ready' ? 'Ready' : s === 'rendering' ? 'Rendering' : s === 'awaiting_review' ? 'Awaiting review' : 'Draft');

/* one book: a spine that opens into its cover */
function Book({ item, ordinal, openId, setOpenId, onOpen, onPromote }) {
  const id = item.project_id || item.id;
  const isOpen = openId === id;
  const ready = item.status === 'ready';
  return (
    <div className={`fs-book${isOpen ? ' is-open' : ''}`}
         style={{ '--bind': bind(item), '--cover': cover(item) }}>
      <button className="fs-spine" onClick={() => setOpenId(isOpen ? null : id)}
              aria-label={`${item.title || 'Untitled'} — open`} style={{ '--bind': bind(item) }}>
        {ordinal ? <span className="fs-num">{ordinal}</span> : <span className="fs-num" aria-hidden />}
        <span className="fs-vt">{item.title || 'Untitled'}</span>
        <span className="fs-dot" style={{ background: dot(item) }} />
      </button>
      <div className="fs-cover">
        <span className={`fs-st ${stKey(item.status)}`}>{stText(item.status)}</span>
        <button className="fs-cx" onClick={() => setOpenId(null)} aria-label="Close">
          <IconChevron s={13} dir="left" />
        </button>
        <div className="fs-cov-in">
          <h4>{ordinal ? `Ep ${ordinal} · ` : ''}{item.title || 'Untitled'}</h4>
          <div className="fs-cacts">
            {ready
              ? <button className="fs-cbtn play" onClick={() => onOpen(item)}><IconPlay s={13} /> Play</button>
              : <button className="fs-cbtn" onClick={() => onOpen(item)}>Open</button>}
            {ready && item.standalone
              ? <button className="fs-cbtn promote" onClick={() => onPromote(item)}><IconPlus s={12} /> Series</button>
              : ready && <button className="fs-cbtn" onClick={() => onOpen(item)}>Edit</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Shelf({ s, onOpen, onNewEpisode, onManage }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div className="fs-shelf">
      <div className="fs-shelf-head">
        <span className="fs-badge"><IconSeries s={12} /> Series</span>
        <h3>{s.title}</h3>
        <span className="fs-info">
          <span>{s.video_style}</span><span>{s.aspect_ratio}</span>
          <span>{s.episode_count} episode{s.episode_count === 1 ? '' : 's'}</span>
        </span>
        <button className="fs-manage" onClick={() => onManage(s)}>Manage series <IconChevron s={13} dir="right" /></button>
      </div>
      <div className="fs-books">
        {(s.episodes || []).map((ep) => (
          <Book key={ep.project_id} item={ep} ordinal={ep.episode_ordinal}
                openId={openId} setOpenId={setOpenId} onOpen={onOpen} onPromote={() => {}} />
        ))}
        <button className="fs-addep" onClick={() => onNewEpisode(s)} aria-label="New episode"><IconPlus s={20} /></button>
      </div>
      <div className="fs-ledge" />
    </div>
  );
}

function SinglesShelf({ films, onOpen, onPromote }) {
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
                openId={openId} setOpenId={setOpenId} onOpen={onOpen} onPromote={onPromote} />
        ))}
      </div>
      <div className="fs-ledge" />
    </div>
  );
}

/* ── My Series management panel ── */
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
            <span className="fs-info"><span>{cur.video_style}</span><span>{cur.aspect_ratio}</span><span>{cur.episode_count} episodes</span></span>
          </div>
          <button className="fs-newep" onClick={() => onNewEpisode(cur)}><IconPlus s={15} /> New Episode</button>
        </div>

        {cur.bible_present || cur.has_bible ? (
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

export default function FilmLibrary({
  series = [], films = [], filmCount = 0,
  onOpenFilm = () => {}, onNewFilm = () => {}, onNewSeries = () => {},
  onNewEpisode = () => {}, onPromote = () => {}, onRefreshPlate = () => {}, onManageSeries,
}) {
  const [view, setView] = useState('films');
  const singles = films.filter((f) => !f.series_id);
  const goManage = (s) => { setView('series'); if (onManageSeries) onManageSeries(s); };

  return (
    <div className="fs">
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

      {view === 'films' ? (
        <div style={{ marginTop: 20 }}>
          <div className="fs-lead">
            <h2>My Films</h2>
            <p>Series sit on their own shelf in episode order. Standalone films live on Singles. Tap a spine to open it.</p>
          </div>
          {series.map((s) => (
            <Shelf key={s.series_id} s={s} onOpen={onOpenFilm} onNewEpisode={onNewEpisode} onManage={goManage} />
          ))}
          <SinglesShelf films={singles} onOpen={onOpenFilm} onPromote={onPromote} />
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
          <MySeries series={series} onNewEpisode={onNewEpisode} onOpen={onOpenFilm} onRefreshPlate={onRefreshPlate} />
        </div>
      )}
    </div>
  );
}