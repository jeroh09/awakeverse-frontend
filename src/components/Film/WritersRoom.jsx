// src/components/Film/WritersRoom.jsx
// Right panel: the writers'-room chat that authors the script, the beat-editor
// that a clicked storyboard cell drops its text into, and the floating composer.
// The script pill floats just above the composer once a draft script exists.

import React, { useState, useRef, useEffect } from 'react';
import { IconSend, IconQuill, IconRegenerate } from './filmIcons';

const pad = n => String(n).padStart(2, '0');

export default function WritersRoom({
  messages = [],
  sub = '',
  editingBeat = null,           // { index, kind, text } | null
  onCloseEdit = () => {},
  onChangeEditText = () => {},
  onRegenerateFromEdit = () => {},
  onSaveEdit = () => {},
  onSend = () => {},
  scriptReady = false,
  onBuildFilm = () => {},
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, editingBeat]);

  const grow = el => { if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; };

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    onSend(t);
    setDraft('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };
  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="film-pcontent">
      <div className="film-phead">
        <div className="film-phead-ttl">Writers’ room{sub && <span className="film-sub">{sub}</span>}</div>
      </div>

      <div className="film-chatscroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`film-msg film-msg--${m.role === 'me' ? 'me' : 'ai'}`}>
            <div className="film-who">{m.role === 'me' ? 'You' : 'Writers’ room'}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>

      {editingBeat && (
        <div className="film-beatedit">
          <div className="film-beatedit-head">
            <span className="t">Shot {pad(editingBeat.index)} · {editingBeat.kind.replace('_', ' ')}</span>
            <button className="film-x" onClick={onCloseEdit} aria-label="Close">×</button>
          </div>
          <textarea
            value={editingBeat.text}
            onChange={e => onChangeEditText(e.target.value)}
            placeholder="Edit this shot’s wording…"
          />
          <div className="film-beatedit-actions">
            <button className="film-btn film-btn--primary" style={{ fontSize: 12, padding: '8px 13px' }}
                    onClick={() => onRegenerateFromEdit(editingBeat.text)}>
              <IconRegenerate s={14} /> Regenerate with changes
            </button>
            <button className="film-btn film-btn--ghost" style={{ fontSize: 12, padding: '8px 13px' }} onClick={onSaveEdit}>
              Save text
            </button>
          </div>
        </div>
      )}

      <div className="film-composer">
        {scriptReady && (
          <div className="film-pillrow">
            <button className="film-pill" onClick={onBuildFilm}>
              <span className="film-pill-ic"><IconQuill s={14} /></span>
              <span className="film-pill-tx">Script ready — build the film<small>or just tell me it’s done</small></span>
            </button>
          </div>
        )}
        <div className="film-inputwrap">
          <textarea
            ref={taRef}
            rows={1}
            value={draft}
            onChange={e => { setDraft(e.target.value); grow(e.target); }}
            onKeyDown={onKey}
            placeholder="Message the writers’ room…"
          />
          <button className="film-send" onClick={send} aria-label="Send"><IconSend s={18} /></button>
        </div>
      </div>
    </div>
  );
}