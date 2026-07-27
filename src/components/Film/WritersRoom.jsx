// src/components/Film/WritersRoom.jsx
// Right panel: the writers'-room chat. Composer sits pinned to the bottom,
// auto-growing 96px→220px. Assistant (and user) messages render real markdown
// (headers/bullets/bold/italic/code) via filmMarkdown — never dangerouslySetInnerHTML.
// A transient "Director" bubble with a blinking cursor shows while a reply
// streams in (word-by-word client-side stopgap until the backend streams —
// see useFilmAuthoring). The floating pill is gone: "Script ready" is now an
// inline ruled bar sitting flush above the composer, shown only when the
// script is ready and nothing's been built yet.

import React, { useEffect, useRef, useState } from 'react';
import { IconSend, IconCheck } from './filmIcons';
import { parseMarkdown } from './filmMarkdown';

function Runs({ runs }) {
  return runs.map((r) => {
    if (r.type === 'b') return <b key={r.key}>{r.text}</b>;
    if (r.type === 'i') return <i key={r.key}>{r.text}</i>;
    if (r.type === 'code') return <code key={r.key}>{r.text}</code>;
    return <span key={r.key}>{r.text}</span>;
  });
}

function MarkdownBlocks({ text }) {
  const blocks = parseMarkdown(text);
  return blocks.map((b, i) => {
    if (b.type === 'h1') return <h1 key={i}>{b.text}</h1>;
    if (b.type === 'h2') return <h2 key={i}>{b.text}</h2>;
    if (b.type === 'h3') return <h3 key={i}>{b.text}</h3>;
    if (b.type === 'li') return <li key={i}><Runs runs={b.runs} /></li>;
    return <p key={i}><Runs runs={b.runs} /></p>;
  });
}

function Bubble({ role, text }) {
  const isMe = role === 'me';
  return (
    <div className={`film-msgwrap${isMe ? ' film-msgwrap--me' : ''}`}>
      <div className={`film-msg film-msg--${isMe ? 'me' : 'ai'}`}>
        <div className="film-who">{isMe ? 'You' : 'Director'}</div>
        <MarkdownBlocks text={text} />
      </div>
    </div>
  );
}

export default function WritersRoom({
  messages = [],
  sub = '',
  streamingActive = false,
  streamingText = '',
  editingBeat = null,
  onCloseEdit = () => {},
  onChangeEditText = () => {},
  onRegenerateFromEdit = () => {},
  onSaveEdit = () => {},
  regenBusy = false,
  onSend = () => {},
  scriptReady = false,
  showBuildBar = false,
  onBuildFilm = () => {},
}) {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingActive, streamingText]);

  const grow = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
    requestAnimationFrame(() => grow(taRef.current));
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="film-pcontent">
      <div className="film-phead">
        <div className="film-htabs">
          <span className="film-htab is-on">Writers' Room</span>
          <span className="film-hsub">{sub}</span>
        </div>
      </div>

      <div className="film-chatscroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.text} />
        ))}
        {streamingActive && (
          <div className="film-msgwrap">
            <div className="film-msg film-msg--ai">
              <div className="film-who">Director</div>
              <span className="film-stream-text">{streamingText}</span>
              <span className="film-cursor">▍</span>
            </div>
          </div>
        )}
      </div>

      {editingBeat && (
        <div className="film-beatedit">
          <div className="film-beatedit-head">
            <span className="t">Editing shot {String(editingBeat.index).padStart(2, '0')}</span>
            <button className="film-x" onClick={onCloseEdit} aria-label="Close">×</button>
          </div>
          <textarea
            value={editingBeat.text}
            onChange={(e) => onChangeEditText(e.target.value)}
          />
          <div className="film-beatedit-actions">
            <button
              className="film-btn film-btn--primary"
              disabled={regenBusy}
              onClick={() => onRegenerateFromEdit(editingBeat.text)}
            >
              {regenBusy ? <span className="film-ctrl-spin" /> : null}
              {regenBusy ? 'Regenerating…' : 'Regenerate with changes'}
            </button>
            <button className="film-btn film-btn--ghost" onClick={onSaveEdit}>Save</button>
          </div>
        </div>
      )}

      {showBuildBar && (
        <div className="film-scriptbar">
          <span className="film-scriptbar-lbl"><IconCheck s={14} /> Script ready</span>
          <button className="film-btn film-btn--primary" onClick={onBuildFilm}>Build the film</button>
        </div>
      )}

      <div className="film-composer">
        <div className="film-inputwrap">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => { setText(e.target.value); grow(e.target.value ? e.target : taRef.current); }}
            onKeyDown={onKeyDown}
            placeholder="Write the next beat, or push back on the last one…"
          />
          <button className="film-send" onClick={send} aria-label="Send">
            <IconSend s={17} />
          </button>
        </div>
      </div>
    </div>
  );
}