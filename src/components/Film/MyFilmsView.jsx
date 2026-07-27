// src/components/Film/MyFilmsView.jsx
// The Film mode's landing: the user's movies as a grid, plus "New film" which
// picks style + duration (as pills) and creates a draft. Titles are NOT chosen
// here — a film is named from its script once the director runs, so new films
// read "Untitled" only until their first storyboard.

import React, { useState } from 'react';
import { IconPlus, IconTrash, IconPlay, IconVisual } from './filmIcons';

const STYLES = [
  { key: 'anime',       label: 'Anime' },
  { key: 'cartoon',     label: 'Cartoon' },
  { key: 'comic_book',  label: 'Comic' },
  { key: 'realistic',   label: 'Realistic' },
];
const DURATIONS = [
  { key: 60,  label: '60s' },
  { key: 120, label: '2 min' },
  { key: 180, label: '3 min' },
];

const STATUS_LABEL = { draft: 'Draft', rendering: 'Rendering', ready: 'Ready', failed: 'Failed' };

function FilmCard({ film, onOpen, onDelete }) {
  const status = film.status || 'draft';
  const ready = status === 'ready' && film.output_url;
  return (
    <article className="film-lib-card" onClick={() => onOpen(film.id)}>
      <div className={`film-lib-thumb${ready ? ' is-ready' : ''}`}>
        {ready
          ? <><video src={film.output_url} muted playsInline preload="metadata" /><span className="film-lib-play"><IconPlay s={18} /></span></>
          : <span className="film-lib-thumb-mark"><IconVisual s={26} /></span>}
        <span className={`film-lib-status film-lib-status--${status}`}>{STATUS_LABEL[status] || status}</span>
      </div>
      <div className="film-lib-meta">
        <div className="film-lib-title">{film.title || 'Untitled film'}</div>
        <div className="film-lib-sub">{(film.video_style || 'anime').replace('_', ' ')} · {film.duration_seconds || 60}s</div>
      </div>
      <button
        className="film-lib-del"
        title="Delete film"
        onClick={(e) => { e.stopPropagation(); onDelete(film); }}
      >
        <IconTrash s={14} />
      </button>
    </article>
  );
}

export default function MyFilmsView({
  films = [], loading = false, busy = false, error = null,
  onOpen = () => {}, onNew = () => {}, onDelete = () => {},
}) {
  const [picking, setPicking] = useState(false);
  const [style, setStyle] = useState('anime');
  const [duration, setDuration] = useState(60);

  const startNew = () => { onNew({ video_style: style, duration_seconds: duration }); };

  return (
    <div className="film-lib">
      <div className="film-lib-head">
        <div className="film-lib-pill">Your films{films.length ? ` · ${films.length}` : ''}</div>
        {!picking ? (
          <button className="film-btn film-btn--primary" onClick={() => setPicking(true)}>
            <IconPlus s={16} /> New film
          </button>
        ) : (
          <div className="film-lib-newbar">
            <div className="film-seg">
              {STYLES.map(s => (
                <button key={s.key}
                  className={`film-seg-btn${style === s.key ? ' is-on' : ''}`}
                  onClick={() => setStyle(s.key)}>{s.label}</button>
              ))}
            </div>
            <div className="film-seg">
              {DURATIONS.map(d => (
                <button key={d.key}
                  className={`film-seg-btn${duration === d.key ? ' is-on' : ''}`}
                  onClick={() => setDuration(d.key)}>{d.label}</button>
              ))}
            </div>
            <button className="film-btn film-btn--primary" disabled={busy} onClick={startNew}>
              {busy ? 'Creating…' : 'Start'}
            </button>
            <button className="film-btn film-btn--ghost" onClick={() => setPicking(false)}>Cancel</button>
          </div>
        )}
      </div>

      {error && <div className="film-lib-error">{error}</div>}

      {loading ? (
        <div className="film-lib-empty"><div className="film-spin" /><p>Loading your films…</p></div>
      ) : films.length === 0 ? (
        <div className="film-lib-empty">
          <div className="film-empty-mark"><IconVisual s={26} /></div>
          <h3>No films yet</h3>
          <p>Start a new film — chat with the writers’ room and it becomes a storyboard you can render.</p>
          {!picking && (
            <button className="film-btn film-btn--primary" onClick={() => setPicking(true)}>
              <IconPlus s={16} /> New film
            </button>
          )}
        </div>
      ) : (
        <div className="film-lib-grid">
          {films.map(f => (
            <FilmCard key={f.id} film={f} onOpen={onOpen} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}