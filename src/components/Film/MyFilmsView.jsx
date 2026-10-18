// src/components/Film/MyFilmsView.jsx
// The Film mode's landing. Split 60/40: LEFT is the user's generated-film space
// (now the series-aware library — bookshelf + My Series, via FilmLibrary), RIGHT
// is the static feature/marketing grid (unchanged). The left split keeps its
// pattern; only its contents changed. The New-Film picker (style/duration/frame)
// stays here and is opened by FilmLibrary's "＋ New Film".

import React, { useState, useEffect } from 'react';
import { IconCheck } from './filmIcons';
import { friendlyError } from './filmApi';
import FilmLibrary from './FilmLibrary';
import FilmVideoWall from './FilmVideoWall';
import FilmSeriesModals from './FilmSeriesModals';
import NewFilmModal, { AD_SEED_KEY } from './NewFilmModal';
import { AD_GENRE, isAdGenre } from './filmGenres';

const STYLES = [
  { key: 'anime',       label: 'Anime' },
  { key: 'cartoon',     label: 'Cartoon' },
  { key: 'comic_book',  label: 'Comic' },
  // Display labels only — the KEYS below are what the backend sees and are
  // unchanged. Per product decision the two are shown as "Realistic" /
  // "Photoreal". NOTE: the `realistic` key still renders the painterly/
  // stylized_real look server-side (backend remap), so "Realistic" currently
  // produces the stylized output; only the label changed here.
  { key: 'realistic',   label: 'Realistic' },
  // Veo tier — true photographic realism. Kept LAST until pricing lands.
  { key: 'photoreal',   label: 'Photoreal' },
];
const DURATIONS = [
  { key: 60,  label: '60s' },
  { key: 120, label: '2 min' },
  { key: 180, label: '3 min' },
];

// Frame shape — fixed for the film's whole life (set once here, shown as a
// read-only tag in the workspace, never editable after). Vertical is default.
const ASPECTS = [
  { key: '9:16', label: 'Vertical',   w: 9,  h: 15 },
  { key: '1:1',  label: 'Square',     w: 13, h: 13 },
  { key: '16:9', label: 'Widescreen', w: 18, h: 10 },
];
const AspectGlyph = ({ w, h }) => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true"
       style={{ flex: '0 0 auto' }}>
    <rect x={(20 - w) / 2} y={(16 - h) / 2} width={w} height={h} rx="2"
          stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

// Static asset paths — served from public/assets/film/, referenced as plain
// strings (not bundler imports) so a missing file just fails to paint.
const IMG = {
  placeholder1: '/assets/film/feat-placeholder-1.webp',
  placeholder2: '/assets/film/feat-placeholder-2.webp',
  placeholder3: '/assets/film/feat-placeholder-3.webp',
  placeholder4: '/assets/film/feat-placeholder-4.webp',
};
const hideOnError = (e) => { e.currentTarget.style.display = 'none'; };

export default function MyFilmsView({
  films = [], loading = false, busy = false, error = null,
  onOpen = () => {}, onOpenFilm = () => {}, onNew = () => {}, onDelete = () => {},
  series = [], seriesActions = {},
}) {
  const [picking, setPicking] = useState(false);
  const [style, setStyle] = useState('anime');
  const [duration, setDuration] = useState(60);
  const [aspect, setAspect] = useState('9:16');   // frame shape — fixed at creation
  const [genre, setGenre] = useState(null);        // optional (GENRE_ROOM) — helps the writer only
  const [modal, setModal] = useState(null);        // series pop-outs
  const [actionError, setActionError] = useState(null);  // delete failures (incl. 409 still-rendering)
  const [actionNote, setActionNote] = useState(null);    // delete-series casualty report
  // Which library tab is showing. My Series takes the whole page (2026-10-12, owner):
  // the promo grid on the right stays for My Films only.
  const [libView, setLibView] = useState('films');

  // ADVERTISING MODE (2026-10-18). "Start an ad" in the writers' room leaves its request
  // in sessionStorage and comes back here — open New Film on Advertise so it carries on.
  // The seed stays put: the workspace sends it as the first message of the new ad.
  useEffect(() => {
    let seeded = false;
    try { seeded = !!window.sessionStorage.getItem(AD_SEED_KEY); } catch (_) { /* private mode */ }
    if (seeded) { setGenre(AD_GENRE.key); setPicking(true); }
  }, []);
  const newAd = () => { setGenre(AD_GENRE.key); setDuration(15); setPicking(true); };
  // ＋ New Film after an ad picker starts from a film again (genre off, a film length).
  const newFilm = () => {
    if (isAdGenre(genre)) { setGenre(null); setDuration(60); }
    setPicking(true);
  };
  // Closing the picker without starting drops a pending ad request.
  const closePicker = () => {
    setPicking(false);
    try { window.sessionStorage.removeItem(AD_SEED_KEY); } catch (_) { /* private mode */ }
  };

  // Deletion wiring (2026-08-24): FilmLibrary's confirms are the consent step;
  // these just call the hook (via seriesActions) and surface the outcome in
  // the existing error strip. The 409 "still rendering — cancel first" refusal
  // arrives here as a thrown error and reads as-is.
  const delEpisode = async (seriesId, projectId) => {
    setActionError(null); setActionNote(null);
    try {
      await seriesActions.deleteEpisode?.(seriesId, projectId);
    } catch (e) {
      setActionError(friendlyError(e, "Couldn't delete the episode."));
    }
  };
  const delSeries = async (seriesId) => {
    setActionError(null); setActionNote(null);
    try {
      const res = await seriesActions.deleteSeries?.(seriesId);
      if (res && typeof res.episodes_deleted === 'number') {
        setActionNote(`Series deleted — ${res.episodes_deleted} episode(s), `
          + `${res.characters_deleted} character(s), ${res.locations_deleted} location(s) removed. `
          + 'Rendered videos remain in My Videos.');
      }
    } catch (e) {
      setActionError(friendlyError(e, "Couldn't delete the series."));
    }
  };

  const startNew = () => {
    setPicking(false);
    onNew({ video_style: style, duration_seconds: duration, aspect_ratio: aspect, ...(genre ? { genre } : {}) });
  };

  return (
    <div className={`film-lib${libView === 'series' ? ' is-series' : ''}`}>
      {/* ── LEFT 60% — the user's films (series-aware library) ── */}
      <div className="film-lib-left">
        {/* Ambient looping film reel behind the shelf (see film-video-wall.css) */}
        <FilmVideoWall />

        {/* New Film picker — a dedicated popout (live preview + controls). Reads
            and sets the same style/duration/aspect state the inline bar used and
            calls the unchanged startNew(), so the create payload is untouched. */}
        {picking && (
          <NewFilmModal
            styles={STYLES}
            durations={DURATIONS}
            aspects={ASPECTS}
            AspectGlyph={AspectGlyph}
            style={style}
            duration={duration}
            aspect={aspect}
            onStyle={setStyle}
            onDuration={setDuration}
            onAspect={setAspect}
            genre={genre}
            onGenre={setGenre}
            busy={busy}
            onStart={startNew}
            onClose={closePicker}
          />
        )}

        {(error || actionError) && <div className="film-lib-error">{error || actionError}</div>}
        {actionNote && <div className="film-lib-note">{actionNote}</div>}

        {loading ? (
          <div className="film-lib-empty"><div className="film-spin" /><p>Loading your films…</p></div>
        ) : (
          <FilmLibrary
            view={libView}
            onViewChange={setLibView}
            series={series}
            films={films}
            filmCount={films.length}
            onOpenFilm={onOpenFilm}
            onNewFilm={newFilm}
            onNewSeries={() => setModal({ type: 'newSeries' })}
            onNewEpisode={(s, opts) => setModal({ type: 'chain', series: s, planCard: opts?.planCard ?? null })}
            onPromote={(film) => setModal({ type: 'promote', film })}
            onRefreshPlate={(s, c) => setModal({ type: 'refresh', series: s, character: c })}
            onDelete={onDelete}
            onDeleteEpisode={delEpisode}
            onDeleteSeries={delSeries}
            onNewAd={newAd}
          />
        )}
      </div>

      {/* ── RIGHT 40% — 2x3 feature grid, fills exactly, no scroll. My Films only. ── */}
      {libView !== 'series' && <div className="film-lib-right">
        <div className="film-feat-grid">

          <div className="film-feat-card film-feat-card--hero">
            <div className="film-feat-copy">
              <h3>Start with a <i>conversation</i></h3>
              <p>Pitch your idea to the <i>AI writer</i> and watch the storyboard fill in as you talk.</p>
            </div>
          </div>

          {[IMG.placeholder1, IMG.placeholder2, IMG.placeholder3, IMG.placeholder4].map((src, i) => (
            <div className="film-feat-card film-feat-card--ph" key={i}>
              <img className="film-feat-photo" src={src} alt="" onError={hideOnError} />
            </div>
          ))}

          <div className="film-feat-card film-feat-card--list">
            <div className="film-feat-copy">
              <h3>Full Control Shot by Shot</h3>
              <ul className="film-feat-steps">
                <li><span className="film-feat-step-check"><IconCheck s={9} /></span>Select a film style</li>
                <li><span className="film-feat-step-check"><IconCheck s={9} /></span>Select a duration 60/120/180s</li>
                <li><span className="film-feat-step-check"><IconCheck s={9} /></span>Click Start.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>}

      {/* series pop-outs (New Series / New Episode / Promote / Refresh) */}
      <FilmSeriesModals
        modal={modal}
        onClose={() => setModal(null)}
        actions={seriesActions}
        onOpenFilm={onOpenFilm}
      />
    </div>
  );
}