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
// NOCTURNE GLASS (2026-10-19): My Films under the night sky + the Halloween season.
// Presentational only; every rule is scoped under .fw-nocturne on this view's root.
import useFilmSeason from './useFilmSeason';
import './FilmNocturneLibrary.css';

// Season embers — fixed positions (no randomness in render). --x across, --d rise time,
// --dl start offset, --dx drift, --s size. Same set as the workspace.
const EMBERS = [
  ['4%', 13, -2, 26, 1], ['11%', 9, -7, -18, .7], ['19%', 15, -4, 34, 1.2], ['27%', 11, -9, -22, .8],
  ['35%', 14, -1, 18, 1], ['44%', 10, -6, -30, .6], ['52%', 16, -11, 24, 1.1], ['60%', 12, -3, -16, .9],
  ['68%', 9, -8, 30, .7], ['75%', 14, -5, -26, 1.2], ['83%', 11, -10, 20, .8], ['91%', 15, -2, -20, 1],
  ['23%', 18, -13, 40, .6], ['71%', 17, -14, -36, .6],
];
// Halloween tile ideas — inspiration to read, not buttons (owner: "look only").
const SEASON_IDEAS = [
  'A lighthouse keeper hears knocking from below the sea.',
  'The scarecrow who swapped places with the farmer.',
  'A vampire’s first night shift at a 24-hour diner.',
];
const IconPumpkin = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 7c-4.6 0-8 2.9-8 6.6S7.4 20 12 20s8-2.7 8-6.4S16.6 7 12 7z" />
    <path d="M12 7c-1.8 0-3 2.9-3 6.6S10.2 20 12 20s3-2.7 3-6.4S13.8 7 12 7z" />
    <path d="M12 7V4.5c0-.6.4-1 1-1h1.5" />
  </svg>
);

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

  // NOCTURNE GLASS — the Halloween season (1 Oct – 2 Nov; the user can switch it off here or
  // in a film's top bar — one shared choice). Also marks <body> so the pop-ups go glass.
  const season = useFilmSeason();

  return (
    <div className={`film-lib fw-nocturne${libView === 'series' ? ' is-series' : ''}`}>
      {/* Atmosphere: projector beam (all year) + fog and embers (season only). Behind the
          content, never clickable, hidden from screen readers. */}
      <div className="fw-atmos" aria-hidden="true">
        <i className="fw-beam" />
        <i className="fw-fog" /><i className="fw-fog fw-fog--b" />
        <span className="fw-embers">
          {EMBERS.map(([x, d, dl, dx, s]) => (
            <i key={`${x}-${d}`} style={{ '--x': x, '--d': `${d}s`, '--dl': `${dl}s`, '--dx': `${dx}px`, '--s': s }} />
          ))}
        </span>
      </div>

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

          {season.on ? (
            /* NOCTURNE: in the Halloween season this tile shows three story ideas to read
               (look only — no seed, no new logic). The usual tile returns after 2 Nov, or
               as soon as the user switches the season off. */
            <div className="film-feat-card film-feat-card--list fw-season-card">
              <button type="button" className="fw-season-switch" onClick={season.toggle} aria-pressed
                      title="Turn the Halloween look off. It switches itself off after 2 November">
                <IconPumpkin s={12} /> Turn off
              </button>
              <div className="film-feat-copy">
                <h3><IconPumpkin s={16} /> Halloween shorts</h3>
                <ul className="fw-season-ideas">
                  {SEASON_IDEAS.map((idea) => <li key={idea}>{idea}</li>)}
                </ul>
                <p className="fw-season-hint">Pitch one to the writer, or bring your own.</p>
              </div>
            </div>
          ) : (
          <div className="film-feat-card film-feat-card--list">
            {season.inWindow && (
              <button type="button" className="fw-season-switch" onClick={season.toggle} aria-pressed={false}
                      title="Turn the Halloween look back on">
                <IconPumpkin s={12} /> Halloween
              </button>
            )}
            <div className="film-feat-copy">
              <h3>Full Control Shot by Shot</h3>
              <ul className="film-feat-steps">
                <li><span className="film-feat-step-check"><IconCheck s={9} /></span>Select a film style</li>
                <li><span className="film-feat-step-check"><IconCheck s={9} /></span>Select a duration 60/120/180s</li>
                <li><span className="film-feat-step-check"><IconCheck s={9} /></span>Click Start.</li>
              </ul>
            </div>
          </div>
          )}

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