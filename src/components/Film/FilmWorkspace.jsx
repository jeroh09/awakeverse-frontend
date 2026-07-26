// src/components/Film/FilmWorkspace.jsx
// The film workspace shell: one indigo-bordered window holding two floating,
// individually-bordered panels with a gap between them — Storyboard (left) and
// WritersRoom (right), each collapsible to a rail. The window never scrolls;
// each panel scrolls inside itself.
//
// Presentational: all data + handlers come in as props (a hook-connected
// container supplies them). Only panel collapse is local UI state.

import React, { useState } from 'react';
import Storyboard from './Storyboard';
import WritersRoom from './WritersRoom';
import { IconChevron } from './filmIcons';
import './FilmWorkspace.css';

export default function FilmWorkspace({
  title = 'Untitled film',
  // stage (left)
  stageState = 'empty',
  beats = [],
  selectedBeat = null,
  progress = null,
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
        <div className="film-brand">AwakeVerse <small>Film</small></div>
        <div className="film-mid">Write your film · <b>{title}</b></div>
        <div className="film-toggles">
          <button className={`film-tg${leftCollapsed ? ' is-off' : ''}`} onClick={() => setLeftCollapsed(v => !v)}>
            <IconChevron s={13} dir={leftCollapsed ? 'right' : 'left'} /> Storyboard
          </button>
          <button className={`film-tg${rightCollapsed ? ' is-off' : ''}`} onClick={() => setRightCollapsed(v => !v)}>
            Assistant <IconChevron s={13} dir={rightCollapsed ? 'left' : 'right'} />
          </button>
        </div>
      </div>

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
    </div>
  );
}