// src/components/Film/FilmWorkspace.jsx
// The film workspace shell: one indigo-bordered window with two floating,
// individually-bordered panels — Storyboard (left) and WritersRoom (right).
// Its own top-level mode now, so no product brand chrome — a slim bar with a
// "My Films" return, the film's title (read from the script's own title), and
// the collapse toggles. Presentational; data + handlers come from the container.

import React, { useState, useEffect } from 'react';
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
  beats = [],
  aspectRatio = '9:16',
  credits = null,
  onShowCredits = () => {},
  cost = null,
  costAffordable = null,
  cast = null,
  planningCast = false,
  onRedrawCast, onUploadCastPhoto, onApproveCast, onAcceptUploadConsent,
  selectedBeat = null,
  progress = null,
  finalUrl = null,
  editBusy = null,
  onSelectBeat, onGenerate, onExport, onStop,
  onRegenerate, onDuplicate, onCut,
  // chat (right)
  messages = [],
  chatSub = '',
  editingBeat = null,
  onCloseEdit, onChangeEditVisual, onPickSpeaker, onChangeLine, onRegenerateFromEdit, onSaveEdit,
  onSend, scriptReady = false, onBuildFilm, onReviewCast, onSaveScript,
}) {
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

  return (
    <div className="film-workspace theme-awakeverse">
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
              <button className="film-tg film-tg--back" onClick={onBackToFilms}>
                <IconBack s={13} /> My Films
              </button>
              <span className="film-tg-div" />
            </>
          )}
          <button className={`film-tg${leftCollapsed ? ' is-off' : ''}`} onClick={toggleLeft}>
            <IconChevron s={13} dir={leftCollapsed ? 'right' : 'left'} /> Storyboard
          </button>
          <button className={`film-tg${rightCollapsed ? ' is-off' : ''}`} onClick={toggleRight}>
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
              <button className="film-rail-btn" onClick={toggleLeft} aria-label="Expand storyboard">
                <IconChevron s={15} dir="right" />
              </button>
              <span className="film-rail-label">Storyboard</span>
            </div>
            <Storyboard
              stageState={stageState}
              beats={beats}
              aspectRatio={aspectRatio}
              cost={cost}
              costAffordable={costAffordable}
              cast={cast}
              planningCast={planningCast}
              onRedrawCast={onRedrawCast}
              onUploadCastPhoto={onUploadCastPhoto}
              onAcceptUploadConsent={onAcceptUploadConsent}
              onApproveCast={onApproveCast}
              selectedBeat={selectedBeat}
              progress={progress}
              finalUrl={finalUrl}
              editBusy={editBusy}
              onSelectBeat={onSelectBeat}
              onGenerate={onGenerate}
              onExport={onExport}
              onStop={onStop}
              onRegenerate={onRegenerate}
              onDuplicate={onDuplicate}
              onCut={onCut}
            />
          </section>

          {/* RIGHT — Writers' room */}
          <section className={`film-panel film-panel--chat${rightCollapsed ? ' is-collapsed' : ''}`}>
            <div className="film-rail">
              <button className="film-rail-btn" onClick={toggleRight} aria-label="Expand assistant">
                <IconChevron s={15} dir="left" />
              </button>
              <span className="film-rail-label">Assistant</span>
            </div>
            <WritersRoom
              messages={messages}
              sub={chatSub}
              editingBeat={editingBeat}
              onCloseEdit={onCloseEdit}
              onChangeEditVisual={onChangeEditVisual}
              onPickSpeaker={onPickSpeaker}
              onChangeLine={onChangeLine}
              onRegenerateFromEdit={onRegenerateFromEdit}
              onSaveEdit={onSaveEdit}
              onSend={onSend}
              scriptReady={scriptReady}
              showBuildBar={scriptReady}
              onBuildFilm={onBuildFilm}
              onReviewCast={onReviewCast}
              onSaveScript={onSaveScript}
            />
          </section>
        </div>
      )}
    </div>
  );
}