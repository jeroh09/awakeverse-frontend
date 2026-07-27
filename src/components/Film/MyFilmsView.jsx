// src/components/Film/MyFilmsView.jsx
// The Film mode's landing. Split 60/40: left is the user's movies (its own
// scroll), right is a static 2x3 feature grid that fills the panel exactly —
// no scroll there. "My Films" has no header text of its own anymore; it's
// folded into a pill (count + New film) pinned to the right edge of the left
// column, clear of the app's own sidebar on the far left.
//
// Play opens an inline player INSIDE the left column (never navigates away —
// see film-lib-player in FilmWorkspace.css); clicking the card body elsewhere
// still opens the workspace. The player itself has its own "Edit" button so
// watching a film doesn't strand you — one click drops you into that film's
// Storyboard/Writers' Room.

import React, { useCallback, useRef, useState } from 'react';
import { IconPlus, IconTrash, IconPlay, IconVisual, IconClose, IconHalf, IconFull, IconQuill } from './filmIcons';

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

// Static asset paths — served from public/assets/film/, referenced as plain
// strings on <img> tags (not bundler imports) so a missing file just fails to
// paint instead of breaking the build. Cards 1 and 6 are pure CSS/design (no
// image); only the four middle placeholders (2-5) are real photos.
const IMG = {
  placeholder1:  '/assets/film/feat-placeholder-1.webp',
  placeholder2:  '/assets/film/feat-placeholder-2.webp',
  placeholder3:  '/assets/film/feat-placeholder-3.webp',
  placeholder4:  '/assets/film/feat-placeholder-4.webp',
};
const hideOnError = (e) => { e.currentTarget.style.display = 'none'; };

function addRipple(e, el) {
  const r = el.getBoundingClientRect();
  const span = document.createElement('span');
  const size = Math.max(r.width, r.height) * 1.4;
  span.className = 'film-lib-ripple';
  span.style.width = span.style.height = size + 'px';
  span.style.left = (e.clientX - r.left - size / 2) + 'px';
  span.style.top = (e.clientY - r.top - size / 2) + 'px';
  el.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

function FilmCard({ film, onOpen, onDelete, onPlay }) {
  const cardRef = useRef(null);
  const status = film.status || 'draft';
  const ready = status === 'ready' && film.output_url;

  const handleClick = (e) => {
    if (cardRef.current) addRipple(e, cardRef.current);
    if (e.target.closest('.film-lib-play')) {
      e.stopPropagation();
      onPlay(film);
      return;
    }
    if (e.target.closest('.film-lib-del')) return;   // its own handler covers this
    onOpen(film.id);
  };

  return (
    <article ref={cardRef} className="film-lib-card" onClick={handleClick}>
      <div
        className={`film-lib-thumb${ready ? ' is-ready' : ''}`}
        style={film.thumbnail_url ? { backgroundImage: `url(${film.thumbnail_url})` } : undefined}
      >
        {!film.thumbnail_url && <span className="film-lib-thumb-mark"><IconVisual s={26} /></span>}
        <span className={`film-lib-status film-lib-status--${status}`}>{STATUS_LABEL[status] || status}</span>
        {ready && <button className="film-lib-play" aria-label="Play"><IconPlay s={14} /></button>}
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

function InlinePlayer({ film, size, onSize, onClose, onEdit }) {
  return (
    <div className={`film-lib-player is-${size}`}>
      <div className="film-lib-player-bar">
        <span className="film-lib-player-title" title={film.title}>{film.title || 'Untitled film'}</span>
        <div className="film-lib-player-actions">
          <button className="film-lib-player-edit" onClick={() => onEdit(film.id)}>
            <IconQuill s={12} /> Edit
          </button>
          <button
            className={`film-lib-player-btn${size === 'half' ? ' is-on' : ''}`}
            title="Half height" onClick={() => onSize('half')}
          >
            <IconHalf />
          </button>
          <button
            className={`film-lib-player-btn${size === 'full' ? ' is-on' : ''}`}
            title="Full length" onClick={() => onSize('full')}
          >
            <IconFull />
          </button>
          <button className="film-lib-player-btn" title="Close" onClick={onClose}>
            <IconClose />
          </button>
        </div>
      </div>
      <video src={film.output_url} controls autoPlay playsInline />
    </div>
  );
}

export default function MyFilmsView({
  films = [], loading = false, busy = false, error = null,
  onOpen = () => {}, onNew = () => {}, onDelete = () => {},
}) {
  const [picking, setPicking] = useState(false);
  const [style, setStyle] = useState('anime');
  const [duration, setDuration] = useState(60);
  const [playing, setPlaying] = useState(null);      // the film object being watched, or null
  const [playerSize, setPlayerSize] = useState('half');

  const startNew = () => { onNew({ video_style: style, duration_seconds: duration }); };

  const handlePlay = useCallback((film) => { setPlaying(film); setPlayerSize('half'); }, []);
  const handleClosePlayer = useCallback(() => setPlaying(null), []);
  const handleEditFromPlayer = useCallback((id) => { setPlaying(null); onOpen(id); }, [onOpen]);

  return (
    <div className="film-lib">
      {/* ── LEFT 60% — the user's films ── */}
      <div className="film-lib-left">
        <div className="film-lib-head">
          <div className="film-lib-pill">
            <span className="film-lib-pill-label">My films{films.length ? <> · <b>{films.length}</b></> : ''}</span>
            {!picking && (
              <button className="film-lib-pill-new" onClick={() => setPicking(true)}>
                <IconPlus s={14} /> New film
              </button>
            )}
          </div>
        </div>

        {picking && (
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

        {error && <div className="film-lib-error">{error}</div>}

        <div className="film-lib-body">
          {playing && (
            <InlinePlayer
              film={playing}
              size={playerSize}
              onSize={setPlayerSize}
              onClose={handleClosePlayer}
              onEdit={handleEditFromPlayer}
            />
          )}

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
                <FilmCard key={f.id} film={f} onOpen={onOpen} onDelete={onDelete} onPlay={handlePlay} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT 40% — 2x3 feature grid, fills exactly, no scroll ── */}
      <div className="film-lib-right">
        <div className="film-feat-grid">

          <div className="film-feat-card film-feat-card--hero">
            <div className="film-feat-copy">
              <h3>Start with a conversation,<br /><i>not a blank page</i></h3>
              <p>Pitch your idea to our <i>AI writer</i> in the Writers' Room — it drafts the script, and the storyboard fills in as you talk.</p>
            </div>
          </div>

          {[IMG.placeholder1, IMG.placeholder2, IMG.placeholder3, IMG.placeholder4].map((src, i) => (
            <div className="film-feat-card film-feat-card--ph" key={i}>
              <img className="film-feat-photo film-feat-photo--dim" src={src} alt="" onError={hideOnError} />
              <div className="film-feat-scrim" />
              <div className="film-feat-copy">
                <div className="film-feat-ph-name">Feature name</div>
                <div className="film-feat-ph-tag">Coming soon</div>
              </div>
            </div>
          ))}

          <div className="film-feat-card film-feat-card--list">
            <div className="film-feat-copy">
              <h3>Full control, <i>shot by shot</i></h3>
              <div className="film-feat-row"><span className="film-feat-dot" /><b>Regenerate</b>&nbsp;a shot that isn't landing</div>
              <div className="film-feat-row"><span className="film-feat-dot" /><b>Cut</b>&nbsp;anything that's not working</div>
              <div className="film-feat-row"><span className="film-feat-dot" /><b>Duplicate</b>&nbsp;a beat to stretch a moment</div>
              <div className="film-feat-row"><span className="film-feat-dot" /><b>Optimise</b>&nbsp;pacing across the whole reel</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}