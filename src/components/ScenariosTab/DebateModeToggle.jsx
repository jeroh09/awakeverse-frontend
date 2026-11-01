// src/components/ScenariosTab/DebateModeToggle.jsx
// ─────────────────────────────────────────────────
// Drops into the .chat-header of ScenarioChatWindow.
// Usage:
//   <DebateModeToggle
//     mode={debateMode}
//     isSending={isSending}
//     autoTurnCount={autoTurnCount}
//     turnCap={turnCap}
//     autoStopped={autoStopped}
//     onToggle={() => setDebateMode(debateMode === 'auto' ? 'user_driven' : 'auto')}
//     onStop={stopDebate}
//   />

import React from 'react';
import './DebateModeToggle.css';

export default function DebateModeToggle({
  mode = 'user_driven',
  isSending = false,
  autoTurnCount = 0,
  turnCap = 8,
  autoStopped = false,
  onToggle,
  onStop,
}) {
  const isAuto = mode === 'auto';
  const isRunning = isAuto && isSending;
  const progress = turnCap > 0 ? Math.min(autoTurnCount / turnCap, 1) : 0;

  return (
    <div className={`debate-mode-toggle ${isAuto ? 'auto' : 'user'}`}>

      {/* ── Toggle pill ────────────────────────────────────────── */}
      <button
        className="mode-pill"
        onClick={onToggle}
        disabled={isSending}
        title={isAuto ? 'Switch to Q&A mode' : 'Switch to Auto-debate mode'}
        aria-label={isAuto ? 'Auto debate active — click to switch to Q&A' : 'Q&A mode — click to enable auto debate'}
      >
        <span className="mode-icon">{isAuto ? '🤖' : '💬'}</span>
        <span className="mode-label">{isAuto ? 'Auto' : 'Q&A'}</span>
        <span className="toggle-track">
          <span className="toggle-thumb" />
        </span>
      </button>

      {/* ── Progress indicator (auto mode only) ───────────────── */}
      {isAuto && (
        <div className="auto-status">
          {isRunning ? (
            <>
              <span className="pulse-dot" />
              <span className="turn-counter">
                {autoTurnCount}/{turnCap}
              </span>
              <div
                className="turn-progress-bar"
                style={{ '--progress': `${progress * 100}%` }}
              />
            </>
          ) : autoStopped ? (
            <span className="stopped-label">Stopped</span>
          ) : (
            <span className="ready-label">Ready</span>
          )}
        </div>
      )}

      {/* ── Stop button (only while auto is running) ──────────── */}
      {isRunning && (
        <button
          className="stop-btn"
          onClick={onStop}
          title="Stop auto debate after current response"
          aria-label="Stop auto debate"
        >
          ■ Stop
        </button>
      )}
    </div>
  );
}


/*
──────────────────────────────────────────────────────────
  HOW TO WIRE INTO ScenarioChatWindow JSX
  Find the .chat-header section and add the toggle.
  The hook values come from useScenarioChat.

  BEFORE (in ScenarioChatWindow):
  ─────────────────────────────────
  const {
    messages, isSending, sendMessage, stopStream, ...
  } = useScenarioChat();

  AFTER:
  ─────────────────────────────────
  const {
    messages, isSending, sendMessage, stopStream,
    debateMode, turnCap, autoTurnCount, autoStopped,
    setDebateMode, stopDebate,
  } = useScenarioChat();

  IN JSX (.chat-header):
  ─────────────────────────────────
  import DebateModeToggle from './DebateModeToggle';

  <header className="chat-header">
    <div className="header-title-row">
      <button className="back-button" onClick={onBack}>←</button>
      <h1 className="scenario-title">{scenario.title}</h1>
    </div>

    // ADD THIS:
    <DebateModeToggle
      mode={debateMode}
      isSending={isSending}
      autoTurnCount={autoTurnCount}
      turnCap={turnCap}
      autoStopped={autoStopped}
      onToggle={() => setDebateMode(debateMode === 'auto' ? 'user_driven' : 'auto')}
      onStop={stopDebate}
    />
  </header>

  ALSO: hide the message input when auto is running:
  <footer className="chat-input" style={{ display: debateMode === 'auto' && isSending ? 'none' : 'flex' }}>
    ...
  </footer>
──────────────────────────────────────────────────────────
*/