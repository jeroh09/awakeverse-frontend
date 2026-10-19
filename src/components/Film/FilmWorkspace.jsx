// src/components/Film/FilmWorkspace.jsx
// The film workspace shell: one indigo-bordered window with two floating,
// individually-bordered panels — Storyboard (left) and WritersRoom (right).
// Its own top-level mode now, so no product brand chrome — a slim bar with a
// "My Films" return, the film's title (read from the script's own title), and
// the collapse toggles. Presentational; data + handlers come from the container.

import React, { useState, useEffect, useMemo } from 'react';
import Storyboard from './Storyboard';
import WritersRoom from './WritersRoom';
import { IconChevron, IconBack } from './filmIcons';
import { CreditsChip } from './CreditsUI';
import './CreditsUI.css';
import './FilmWorkspace.css';
// NOCTURNE GLASS (2026-10-19): the glass look + the Halloween season layer. Imported LAST so
// it sits on top; every rule is scoped under .fw-nocturne, so removing that class (or this
// import) returns the workspace to exactly how it looked before. Presentational only.
import './FilmNocturne.css';
import useFilmSeason from './useFilmSeason';

// Season embers — fixed positions (no randomness in render, so nothing re-lays out).
// --x across the window, --d seconds to rise, --dl start offset, --dx sideways drift, --s size.
const EMBERS = [
  ['4%', 13, -2, 26, 1], ['11%', 9, -7, -18, .7], ['19%', 15, -4, 34, 1.2], ['27%', 11, -9, -22, .8],
  ['35%', 14, -1, 18, 1], ['44%', 10, -6, -30, .6], ['52%', 16, -11, 24, 1.1], ['60%', 12, -3, -16, .9],
  ['68%', 9, -8, 30, .7], ['75%', 14, -5, -26, 1.2], ['83%', 11, -10, 20, .8], ['91%', 15, -2, -20, 1],
  ['23%', 18, -13, 40, .6], ['71%', 17, -14, -36, .6],
];

// A small pumpkin for the season switch (custom glyph, currentColor).
const IconPumpkin = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 7c-4.6 0-8 2.9-8 6.6S7.4 20 12 20s8-2.7 8-6.4S16.6 7 12 7z" />
    <path d="M12 7c-1.8 0-3 2.9-3 6.6S10.2 20 12 20s3-2.7 3-6.4S13.8 7 12 7z" />
    <path d="M12 7V4.5c0-.6.4-1 1-1h1.5" />
  </svg>
);

export default function FilmWorkspace({
  title = 'Untitled film',
  loading = false,
  onBackToFilms,
  // stage (left)
  stageState = 'empty',
  contentBlock = null,
  beats = [],
  aspectRatio = '9:16',
  videoStyle = null,
  credits = null,
  onShowCredits = () => {},
  cost = null,
  costAffordable = null,
  cast = null,
  planningCast = false,
  onRedrawCast, onUploadCastPhoto, onApproveCast, onAcceptUploadConsent,
  places = null, placesStatus = null, onRedrawPlace, onRevertPlace,
  selectedBeat = null,
  progress = null,
  finalUrl = null,
  editBusy = null,
  // SEVERED LINKS (2026-10-12): the container has always passed these three, but this
  // shell never forwarded them — so the storyboard's length picker and the per-shot
  // "Regenerating…" spinner never appeared. Forwarded now.
  durationSeconds = null,
  onDurationChange = null,
  regenBusyIndex = null,
  // "Edit not applied: …" — an edit that failed on a film that is still fine.
  notice = null,
  onDismissNotice = () => {},
  // series episodes (2026-10-12): "Previously on", per-line edits, Where we left off, Review
  recap = null, onRecap = null, onEditLine = null,
  carryProjectId = null, canReview = false, onReview = () => {}, review = null, onDismissReview = () => {},
  onSelectBeat, onGenerate, onExport, onStop, onFinish,
  onRegenerate, onDuplicate, onCut,
  canPromote = false, onPromote = () => {},
  // chat (right)
  messages = [],
  chatSub = '',
  thinking = false,
  streamingActive = false,
  streamingText = '',
  editingBeat = null,
  onCloseEdit, onChangeEditVisual, onPickSpeaker, onRemovePresent, onChangeLine, onRegenerateFromEdit, onSaveEdit,
  onSend, scriptReady = false, onBuildFilm, onReviewCast, castPhase = 'idle', busyLabel = null, onSaveScript,
  // Editor's Room (2026-08-25): the shell is presentational and forwards
  // explicitly — these MUST be threaded here or they die between the
  // container and WritersRoom (the severed-link bug: the tab never showed
  // because this file silently dropped the props).
  editorAvailable = false,
  editorMode = { active: false, filmTitle: '' },
  editProposal = null,
  chatMode = 'auto',
  onSetChatMode = () => {},
  onApplyEditIntent = () => {},
  onDismissProposal = () => {},
  // Advertising Mode: an ad is set up in the Ad setup popup (2026-10-19, rendered by the
  // container); the storyboard panel is the storyboard for ads too (plan from the script,
  // the ad strip with Edit setup, the end card). `adScript` = the latest script draft.
  ad = null, onStartAd = null, onEditAdSetup = null, adScript = null,
  onSaveAdFinish = null,   // step 4 part 1 (AD_COMPOSE): the end-card picker saves through this
  // step 4 part 3: the made advert's finishing state (manifest.ad_finish), its film, and
  // "Try again" — all null for films and while AD_COMPOSE is off.
  adFinish = null, adFilmUrl = null, onFinishAgain = null,
  logoApi = null,          // brand assets (AD_BRAND_ASSETS): {upload(file), remove()} for the logo
}) {
  const adInfo = useMemo(() => {
    if (!ad) return null;
    const b = ad.brief || {};
    const c = Number.isInteger(ad.chosen) && ad.concepts ? ad.concepts[ad.chosen] : null;
    return { title: c ? c.title : (b.name || ''), hook: c ? c.hook : '', brand: b.name || '', audience: b.audience || '',
             offer: b.offer || '', cta: b.cta || '', length: Number(b.length) || null, ratio: b.ratio || null,
             filmSeconds: ad.film_seconds || null, endCard: ad.end_card_seconds || null, locked: !!ad.locked,
             url: b.url || '', composeOpen: !!ad.compose_open, finish: ad.finish || null,
             logo: (ad.brand_assets && ad.brand_assets.logo) || null };
  }, [ad]);
  // The server says whether an ad may start paid work yet (AD_RENDER); until then the
  // Review cast buttons are greyed with the reason instead of failing on click.
  // Photoreal adverts describe people in words (no faces to check — G73), so they skip the
  // cast review: the button makes the advert straight away (owner 2026-10-19).
  const adSkipReview = !!(ad && String(videoStyle || '').toLowerCase() === 'photoreal');
  const adRenderLocked = ad && ad.render_open === false
    ? 'Ad renders open when the finishing stage is ready. Your script is saved.' : null;
  // Below 820px the two panels stack (see FilmWorkspace.css's accordion
  // media query) — starting BOTH expanded there would just reproduce the old
  // 50/50 squeeze, so on narrow viewports we default straight into Writers'
  // Room at full height (Storyboard collapsed to its rail) since that's
  // where a film actually starts. Desktop keeps the old default: both open,
  // side by side. SSR-safe guard for `window` even though this app is
  // client-only today.
  const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 820;
  const [leftCollapsed, setLeftCollapsed] = useState(isNarrow);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Toggling a panel open on a narrow viewport collapses its sibling —
  // turns the two independent desktop toggles into a de facto tab pair
  // without needing separate mobile-only state. Desktop behavior (both can
  // be open, or both closed... though we still guard against that below)
  // is unchanged.
  const toggleLeft = () => setLeftCollapsed(prev => {
    const next = !prev;
    if (next && rightCollapsed) setRightCollapsed(false);          // don't collapse both
    else if (!next && window.innerWidth <= 820) setRightCollapsed(true); // mobile: expanding one collapses the other
    return next;
  });
  const toggleRight = () => setRightCollapsed(prev => {
    const next = !prev;
    if (next && leftCollapsed) setLeftCollapsed(false);
    else if (!next && window.innerWidth <= 820) setLeftCollapsed(true);
    return next;
  });

  // Hide the (globally-mounted) support widget entirely while Film is open —
  // repositioning it turned out not to be worth the trouble it caused, and
  // this page has its own help/edit affordances anyway. Scoped via a body
  // class so SupportWidget.jsx itself never needs to know Film exists;
  // removed on unmount so every other page is unaffected.
  useEffect(() => {
    document.body.classList.add('film-mode-active');
    return () => { document.body.classList.remove('film-mode-active'); };
  }, []);

  // Load the room's reading fonts (Newsreader for director prose, Courier Prime
  // for the screenplay) via an injected <link>. A CSS @import inside a bundled
  // component stylesheet is unreliable — once concatenated it can fall after
  // other rules and the browser drops it — so we add the stylesheet link once,
  // idempotently, here. Additive only; left in <head> so remounts don't refetch.
  useEffect(() => {
    const id = 'fw-room-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap';
    document.head.appendChild(link);
  }, []);

  // THE STRAY-SPACE BUG (2026-08-24): native <button>s KEEP FOCUS after a
  // mouse click, and a focused button re-activates on Space/Enter — so
  // "click Make the film, later press space" built the film again, and Space
  // after clicking Send re-sent. Almost no button in this workspace blurs or
  // opts out, so instead of touching dozens of call sites, one delegated
  // capture here blurs whichever button was MOUSE/TOUCH-activated (e.detail>0;
  // keyboard activations arrive with detail===0 and keep focus, so keyboard
  // users' position is preserved — no a11y regression). rAF defers the blur
  // until after the click handler has run.
  const blurAfterPointerClick = (e) => {
    if (e.detail > 0) {
      const b = e.target.closest && e.target.closest('button');
      if (b) requestAnimationFrame(() => b.blur());
    }
  };

  // NOCTURNE GLASS — the Halloween season (1 Oct – 2 Nov, user can switch it off) and the
  // soft highlight that follows the cursor across a shot card. Both are presentational:
  // the highlight only writes two CSS variables on the hovered card's own style.
  const season = useFilmSeason();
  const lightFollow = (e) => {
    const c = e.target && e.target.closest ? e.target.closest('.film-cell') : null;
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--fw-mx', `${Math.round(e.clientX - r.left)}px`);
    c.style.setProperty('--fw-my', `${Math.round(e.clientY - r.top)}px`);
  };

  return (
    <div className="film-workspace theme-awakeverse fw-nocturne" onClickCapture={blurAfterPointerClick}
         onPointerMove={lightFollow}>
      {/* Atmosphere: projector beam (all year) + fog and embers (season only). Behind
          everything, never clickable, hidden from screen readers. */}
      <div className="fw-atmos" aria-hidden="true">
        <i className="fw-beam" />
        <i className="fw-fog" /><i className="fw-fog fw-fog--b" />
        <span className="fw-embers">
          {EMBERS.map(([x, d, dl, dx, s]) => (
            <i key={`${x}-${d}`} style={{ '--x': x, '--d': `${d}s`, '--dl': `${dl}s`, '--dx': `${dx}px`, '--s': s }} />
          ))}
        </span>
      </div>
      <div className="film-topbar">
        <span className="film-title" title={title}>{title || 'Untitled film'}</span>
        {season.inWindow && (
          <button type="button" className={`fw-season-tg${season.on ? ' is-on' : ''}`} onClick={season.toggle}
                  aria-pressed={season.on}
                  title={season.on ? 'Turn the Halloween look off. It switches itself off after 2 November'
                                   : 'Turn the Halloween look back on'}>
            <IconPumpkin s={14} /><span className="fw-season-lbl">Halloween</span>
          </button>
        )}
        {credits && (
          <CreditsChip
            balance={credits.balance}
            expiringSoon={credits.expiringSoon}
            onClick={onShowCredits}
          />
        )}
        <div className="film-toggles">
          {onBackToFilms && (
            <>
              <button className="film-tg film-tg--back" onClick={onBackToFilms}
                  title="Back to your library — this film keeps rendering if it's running">
                <IconBack s={13} /> My Films
              </button>
              <span className="film-tg-div" />
            </>
          )}
          <button className={`film-tg${leftCollapsed ? ' is-off' : ''}`} onClick={toggleLeft}
                  title={leftCollapsed ? 'Show the storyboard' : 'Hide the storyboard'}>
            <IconChevron s={13} dir={leftCollapsed ? 'right' : 'left'} /> Storyboard
          </button>
          <button className={`film-tg${rightCollapsed ? ' is-off' : ''}`} onClick={toggleRight}
                  title={rightCollapsed ? 'Show the assistant' : 'Hide the assistant'}>
            Assistant <IconChevron s={13} dir={rightCollapsed ? 'left' : 'right'} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="film-window film-window--loading">
          <div className="film-spin" /><span>Opening your film…</span>
        </div>
      ) : (
        <div className="film-window">
          {/* LEFT — Storyboard */}
          <section className={`film-panel film-panel--stage${leftCollapsed ? ' is-collapsed' : ''}`}>
            <div className="film-rail">
              <button className="film-rail-btn" onClick={toggleLeft} aria-label="Expand storyboard" title="Show the storyboard">
                <IconChevron s={15} dir="right" />
              </button>
              <span className="film-rail-label">Storyboard</span>
            </div>
            <Storyboard
              stageState={stageState}
              contentBlock={contentBlock}
              castPhase={castPhase}
              beats={beats}
              aspectRatio={aspectRatio}
              videoStyle={videoStyle}
              cost={cost}
              costAffordable={costAffordable}
              balance={credits ? credits.balance : null}
              cast={cast}
              planningCast={planningCast}
              onRedrawCast={onRedrawCast}
              onUploadCastPhoto={onUploadCastPhoto}
              places={places}
              placesStatus={placesStatus}
              onRedrawPlace={onRedrawPlace}
              onRevertPlace={onRevertPlace}
              onAcceptUploadConsent={onAcceptUploadConsent}
              onApproveCast={onApproveCast}
              selectedBeat={selectedBeat}
              progress={progress}
              finalUrl={finalUrl}
              editBusy={editBusy}
              durationSeconds={durationSeconds}
              onDurationChange={onDurationChange}
              regenBusyIndex={regenBusyIndex}
              notice={notice}
              onDismissNotice={onDismissNotice}
              recap={recap}
              onRecap={onRecap}
              onEditLine={onEditLine}
              onSelectBeat={onSelectBeat}
              onGenerate={onGenerate}
              onExport={onExport}
              onStop={onStop}
              onFinish={onFinish}
              onRegenerate={onRegenerate}
              onDuplicate={onDuplicate}
              onCut={onCut}
              canPromote={canPromote}
              onPromote={onPromote}
              ad={adInfo}
              adScript={adScript}
              onEditAdSetup={onEditAdSetup}
              onSaveAdFinish={onSaveAdFinish}
              adFinish={adFinish}
              adFilmUrl={adFilmUrl}
              onFinishAgain={onFinishAgain}
              logoApi={logoApi}
              onReviewCast={adInfo ? (adSkipReview ? onBuildFilm : onReviewCast) : null}
              adSkipReview={adSkipReview}
              adRenderLocked={adRenderLocked}
            />
          </section>

          {/* RIGHT — Writers' room */}
          <section className={`film-panel film-panel--chat${rightCollapsed ? ' is-collapsed' : ''}`}>
            <div className="film-rail">
              <button className="film-rail-btn" onClick={toggleRight} aria-label="Expand assistant" title="Show the assistant">
                <IconChevron s={15} dir="left" />
              </button>
              <span className="film-rail-label">Assistant</span>
            </div>
            <WritersRoom
              messages={messages}
              sub={chatSub}
              thinking={thinking}
              streamingActive={streamingActive}
              streamingText={streamingText}
              editingBeat={editingBeat}
              onCloseEdit={onCloseEdit}
              onChangeEditVisual={onChangeEditVisual}
              onPickSpeaker={onPickSpeaker}
              onRemovePresent={onRemovePresent}
              onChangeLine={onChangeLine}
              onRegenerateFromEdit={onRegenerateFromEdit}
              onSaveEdit={onSaveEdit}
              regenBusy={!!editBusy}
              carryProjectId={carryProjectId}
              canReview={canReview}
              onReview={onReview}
              review={review}
              onDismissReview={onDismissReview}
              onSend={onSend}
              editorAvailable={editorAvailable}
              filmBeats={beats}
              editorMode={editorMode}
              editProposal={editProposal}
              chatMode={chatMode}
              onSetChatMode={onSetChatMode}
              onApplyEditIntent={onApplyEditIntent}
              onDismissProposal={onDismissProposal}
              scriptReady={scriptReady}
              showBuildBar={scriptReady}
              onBuildFilm={onBuildFilm}
              onReviewCast={adSkipReview ? onBuildFilm : onReviewCast}
              skipReview={adSkipReview}
              renderLocked={adRenderLocked}
              onApproveCast={onApproveCast}
              castPhase={castPhase}
              busyLabel={busyLabel}
              onSaveScript={onSaveScript}
              isAd={!!ad}
              onStartAd={onStartAd}
            />
          </section>
        </div>
      )}
    </div>
  );
}