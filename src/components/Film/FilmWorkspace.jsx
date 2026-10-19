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
}) {
  const adInfo = useMemo(() => {
    if (!ad) return null;
    const b = ad.brief || {};
    const c = Number.isInteger(ad.chosen) && ad.concepts ? ad.concepts[ad.chosen] : null;
    return { title: c ? c.title : (b.name || ''), hook: c ? c.hook : '', brand: b.name || '', audience: b.audience || '',
             offer: b.offer || '', cta: b.cta || '', length: Number(b.length) || null, ratio: b.ratio || null,
             filmSeconds: ad.film_seconds || null, endCard: ad.end_card_seconds || null, locked: !!ad.locked };
  }, [ad]);
  // The server says whether an ad may start paid work yet (AD_RENDER); until then the
  // Review cast buttons are greyed with the reason instead of failing on click.
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

  return (
    <div className="film-workspace theme-awakeverse" onClickCapture={blurAfterPointerClick}>
      <div className="film-topbar">
        <span className="film-title" title={title}>{title || 'Untitled film'}</span>
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
              onReviewCast={adInfo ? onReviewCast : null}
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
              onReviewCast={onReviewCast}
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