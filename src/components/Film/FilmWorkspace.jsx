// src/components/Film/FilmWorkspace.jsx
// The film workspace shell: a plain flex row holding two individually-bordered
// panels — Storyboard (left) and WritersRoom (right). No outer window border
// anymore (that's now just panel-level borders). A single combined
// "Storyboard | Assistant" pill drives which panel gets the wide flex-basis
// (both panels always stay mounted and visible — this replaces the old
// collapse/expand toggles). Presentational; data + handlers come from the
// container.

import React, { useState } from 'react';
import Storyboard from './Storyboard';
import WritersRoom from './WritersRoom';
import { IconBack } from './filmIcons';
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
  regenBusyIndex = null,
  onSelectBeat, onGenerate, onExport, onStop,
  onRegenerate, onDuplicate, onCut,
  // chat (right)
  messages = [],
  chatSub = '',
  streamingActive = false,
  streamingText = '',
  editingBeat = null,
  onCloseEdit, onChangeEditText, onRegenerateFromEdit, onSaveEdit,
  onSend, scriptReady = false, onBuildFilm,
}) {
  const [focusPanel, setFocusPanel] = useState('storyboard'); // 'storyboard' | 'assistant'

  return (
    <div className="film-workspace theme-awakeverse">
      <div className="film-topbar">
        <div className="film-topbar-spacer" />
        <span className="film-title" title={title}>{title || 'Untitled film'}</span>
        <div className="film-focuspill">
          {onBackToFilms && (
            <>
              <button className="film-focuspill-back" onClick={onBackToFilms}>
                <IconBack s={13} /> My Films
              </button>
              <span className="film-focuspill-div" />
            </>
          )}
          <button
            className={focusPanel !== 'assistant' ? 'is-on' : ''}
            onClick={() => setFocusPanel('storyboard')}
          >
            Storyboard
          </button>
          <button
            className={focusPanel === 'assistant' ? 'is-on' : ''}
            onClick={() => setFocusPanel('assistant')}
          >
            Assistant
          </button>
        </div>
      </div>

      {loading ? (
        <div className="film-window film-window--loading">
          <div className="film-spin" /><span>Opening your film…</span>
        </div>
      ) : (
        <div className="film-window" data-focus={focusPanel}>
          {/* LEFT — Storyboard */}
          <section className="film-panel film-panel--stage">
            <Storyboard
              stageState={stageState}
              beats={beats}
              selectedBeat={selectedBeat}
              progress={progress}
              finalUrl={finalUrl}
              editBusy={editBusy}
              regenBusyIndex={regenBusyIndex}
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
          <section className="film-panel film-panel--chat">
            <WritersRoom
              messages={messages}
              sub={chatSub}
              streamingActive={streamingActive}
              streamingText={streamingText}
              editingBeat={editingBeat}
              onCloseEdit={onCloseEdit}
              onChangeEditText={onChangeEditText}
              onRegenerateFromEdit={onRegenerateFromEdit}
              onSaveEdit={onSaveEdit}
              regenBusy={editingBeat ? regenBusyIndex === editingBeat.index : false}
              onSend={onSend}
              scriptReady={scriptReady}
              showBuildBar={scriptReady && stageState === 'empty'}
              onBuildFilm={onBuildFilm}
            />
          </section>
        </div>
      )}
    </div>
  );
}