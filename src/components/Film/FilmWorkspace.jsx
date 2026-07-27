// src/components/Film/FilmWorkspace.jsx
// The film workspace shell: one indigo-bordered window with two floating,
// individually-bordered panels — Storyboard (left) and WritersRoom (right).
// Its own top-level mode now, so no product brand chrome — a slim bar with a
// "My Films" return, the film's title (read from the script's own title), and
// the collapse toggles. Presentational; data + handlers come from the container.

import React, { useState } from 'react';
import Storyboard from './Storyboard';
import WritersRoom from './WritersRoom';
import { IconChevron, IconBack } from './filmIcons';
import './FilmWorkspace.css';

export default function FilmWorkspace({
  title = 'Untitled film',
  loading = false,
  onBackToFilms,
  // stage (left)
  stageState = 'empty',
  beats = [],
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
  onCloseEdit, onChangeEditText, onRegenerateFromEdit, onSaveEdit,
  onSend, scriptReady = false, onBuildFilm,
}) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="film-workspace theme-awakeverse">
      <div className="film-topbar">
        <div className="film-topbar-left">
          {onBackToFilms && (
            <button className="film-tg film-tg--back" onClick={onBackToFilms}>
              <IconBack s={15} /> My Films
            </button>
          )}
          <span className="film-title" title={title}>{title || 'Untitled film'}</span>
        </div>
        <div className="film-toggles">
          <button className={`film-tg${leftCollapsed ? ' is-off' : ''}`} onClick={() => setLeftCollapsed(v => !v)}>
            <IconChevron s={13} dir={leftCollapsed ? 'right' : 'left'} /> Storyboard
          </button>
          <button className={`film-tg${rightCollapsed ? ' is-off' : ''}`} onClick={() => setRightCollapsed(v => !v)}>
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
              <button className="film-rail-btn" onClick={() => setLeftCollapsed(false)} aria-label="Expand storyboard">
                <IconChevron s={15} dir="right" />
              </button>
              <span className="film-rail-label">Storyboard</span>
            </div>
            <Storyboard
              stageState={stageState}
              beats={beats}
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
              <button className="film-rail-btn" onClick={() => setRightCollapsed(false)} aria-label="Expand assistant">
                <IconChevron s={15} dir="left" />
              </button>
              <span className="film-rail-label">Assistant</span>
            </div>
            <WritersRoom
              messages={messages}
              sub={chatSub}
              editingBeat={editingBeat}
              onCloseEdit={onCloseEdit}
              onChangeEditText={onChangeEditText}
              onRegenerateFromEdit={onRegenerateFromEdit}
              onSaveEdit={onSaveEdit}
              onSend={onSend}
              scriptReady={scriptReady}
              onBuildFilm={onBuildFilm}
            />
          </section>
        </div>
      )}
    </div>
  );
}