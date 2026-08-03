// src/components/Film/WritersRoom.jsx
// Right panel: the writers'-room chat. Composer sits pinned to the bottom,
// auto-growing 96px→220px. User turns keep their bubble; assistant replies
// flow directly on the panel background — no box, no border — via
// MarkdownBlocks, real markdown (headers/bullets/bold/italic/code), never
// dangerouslySetInnerHTML. When a message carries `scriptMeta` (set by
// useFilmAuthoring when the backend's script_meta NDJSON event fires — see
// film_routes.py's /assistant/message docstring), three things render right
// after that reply's prose: a duration badge, character chips (name-only,
// tap to reveal the description — keeps the panel usable even squished to
// 34% width), and a collapsible script panel with the actual draft. The
// <<<SCRIPT>>>/<<<END_SCRIPT>>> tags themselves never reach here — the
// backend strips them and ships the script text separately.
// "Script ready" is an inline ruled bar sitting flush above the composer,
// shown only when the script is ready and nothing's been built yet.

import React, { useEffect, useRef, useState } from 'react';
import { IconSend, IconCheck, IconClock, IconChevron } from './filmIcons';
import AttachButton from './AttachButton';
import { filmUploadAttachment } from './filmApi';
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

function DurationBadge({ seconds }) {
  if (seconds == null) return null;
  return <span className="film-dur-badge"><IconClock s={11} /> ~{seconds}s draft</span>;
}

function CharacterChip({ name, desc }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={`film-char-chip${open ? ' is-open' : ''}`} onClick={() => setOpen(o => !o)}>
        {name} <IconChevron s={8} dir={open ? 'down' : 'right'} />
      </button>
      {open && (
        <div className="film-char-detail"><b>{name}</b> — {desc}</div>
      )}
    </>
  );
}

function ScriptMeta({ meta, editable = false, onSaveScript }) {
  const [scriptOpen, setScriptOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(meta && meta.script ? meta.script : '');
  const [localScript, setLocalScript] = useState(null);   // saved edit — wins over meta.script for display
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  // If the underlying message script changes (new director turn), drop the local
  // override so the fresh draft shows; otherwise the saved edit persists on screen.
  useEffect(() => { setDraft(meta && meta.script ? meta.script : ''); setLocalScript(null); }, [meta && meta.script]);
  if (!meta) return null;
  const chars = Object.entries(meta.characters || {});
  const shownScript = localScript != null ? localScript : meta.script;   // edited text wins

  const copy = async () => {
    try { await navigator.clipboard.writeText(shownScript || ''); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch (_) {}
  };
  const save = async () => {
    if (!onSaveScript || !draft.trim()) return;
    setSaving(true); setSaved(false);
    try {
      const ok = await onSaveScript(draft.trim());
      if (ok !== false) { setLocalScript(draft.trim()); setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 1800); }
    } finally { setSaving(false); }
  };

  return (
    <div className="film-scriptmeta">
      <div className="film-meta-row">
        <DurationBadge seconds={meta.durationSeconds} />
        {chars.map(([name, desc]) => <CharacterChip key={name} name={name} desc={desc} />)}
      </div>
      {meta.script && (
        <div className="film-script-panel">
          <div className="film-script-head">
            <span className="t">📄 Script draft</span>
            <div className="film-script-headbtns">
              <button className="film-script-toggle" onClick={copy} title="Copy script">
                {copied ? 'Copied' : 'Copy'}
              </button>
              {editable && !editing && (
                <button className="film-script-toggle" onClick={() => { setDraft(shownScript); setEditing(true); setScriptOpen(true); }}>
                  Edit
                </button>
              )}
              <button className="film-script-toggle" onClick={() => setScriptOpen(o => !o)}>
                <IconChevron s={9} dir={scriptOpen ? 'down' : 'right'} />
                {scriptOpen ? 'Collapse' : 'Expand'}
              </button>
            </div>
          </div>
          {scriptOpen && !editing && <pre className="film-script-body">{shownScript}</pre>}
          {scriptOpen && editing && (
            <div className="film-script-edit">
              <textarea className="film-script-textarea" value={draft} spellCheck={false}
                onChange={e => setDraft(e.target.value)} />
              <div className="film-script-editbar">
                <span className="film-script-hint">Saved edits are used when you make the film. Length is auto-fitted to your chosen duration.</span>
                <div className="film-script-editbtns">
                  <button className="film-btn film-btn--ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                  <button className="film-btn film-btn--primary" onClick={save} disabled={saving || !draft.trim()}>
                    {saving ? 'Saving…' : saved ? 'Saved' : 'Save script'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Turn({ role, text, attachment, scriptMeta, editable = false, onSaveScript }) {
  if (role === 'me') {
    return (
      <div className="film-msgwrap film-msgwrap--me">
        <div className="film-msg film-msg--me">
          <div className="film-who">You</div>
          {attachment && (
            <a className="film-msg-attach" href={attachment.url || undefined}
               target="_blank" rel="noopener noreferrer">
              <span className="film-attach-chip-ico">📄</span>
              <span className="film-attach-chip-name">{attachment.filename}</span>
            </a>
          )}
          {text && <MarkdownBlocks text={text} />}
        </div>
      </div>
    );
  }
  return (
    <div className="film-turn-ai">
      <div className="film-who">Director</div>
      <div className="film-flow"><MarkdownBlocks text={text} /></div>
      <ScriptMeta meta={scriptMeta} editable={editable} onSaveScript={onSaveScript} />
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
  onReviewCast = () => {},
  onSaveScript,
}) {
  const [text, setText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);   // {filename,url,file_type,text,sections,injection_detected}
  const [attachNotice, setAttachNotice] = useState(null);             // flagged-doc / info notice
  const [scriptBarCollapsed, setScriptBarCollapsed] = useState(false);
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
    // Allow sending an attachment with no note (the file is the message).
    if (!t && !pendingAttachment) return;
    onSend(t, pendingAttachment || null);
    setText('');
    setPendingAttachment(null);
    setAttachNotice(null);
    requestAnimationFrame(() => grow(taRef.current));
  };

  // When a script file finishes uploading+extracting, hold it as a pending
  // attachment (chip in the composer) until the user sends. A flagged doc is
  // still attached (user sees their file) but its text is withheld server-side,
  // so we note that it won't be read into the script.
  const onAttachmentReady = (result /*, file */) => {
    if (!result) return;
    setPendingAttachment(result);
    setAttachNotice(result.injection_detected
      ? "This file couldn't be read into your script for safety reasons, but it's attached."
      : null);
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
        {(() => {
          // Only the MOST RECENT script draft is editable — older turns are history.
          let lastScriptIdx = -1;
          messages.forEach((m, i) => { if (m.scriptMeta && m.scriptMeta.script) lastScriptIdx = i; });
          return messages.map((m, i) => (
            <Turn key={i} role={m.role} text={m.text} attachment={m.attachment} scriptMeta={m.scriptMeta}
              editable={i === lastScriptIdx && !!onSaveScript}
              onSaveScript={onSaveScript} />
          ));
        })()}
        {streamingActive && (
          <div className="film-turn-ai">
            <div className="film-who">Director</div>
            <div className="film-flow">
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
        scriptBarCollapsed ? (
          <button className="film-scriptbar-pill" onClick={() => setScriptBarCollapsed(false)}>
            <IconCheck s={12} /> Script ready
          </button>
        ) : (
          <div className="film-scriptbar">
            <span className="film-scriptbar-lbl"><IconCheck s={14} /> Script ready</span>
            <div className="film-scriptbar-actions">
              <button className="film-btn film-btn--ghost" onClick={onReviewCast}>Review cast first</button>
              <button className="film-btn film-btn--primary" onClick={onBuildFilm}>Make the film</button>
              <button
                className="film-scriptbar-x"
                onClick={() => setScriptBarCollapsed(true)}
                aria-label="Collapse"
                title="Collapse"
              >
                ×
              </button>
            </div>
          </div>
        )
      )}

      <div className="film-composer">
        {pendingAttachment && (
          <div className="film-attach-chip">
            <span className="film-attach-chip-ico">📄</span>
            <span className="film-attach-chip-name" title={pendingAttachment.filename}>{pendingAttachment.filename}</span>
            <button className="film-attach-chip-x" onClick={() => { setPendingAttachment(null); setAttachNotice(null); }}
              aria-label="Remove attachment" title="Remove">×</button>
          </div>
        )}
        {attachNotice && <div className="film-attach-notice">{attachNotice}</div>}
        <div className="film-inputwrap">
          <AttachButton
            upload={filmUploadAttachment}
            onDone={onAttachmentReady}
            disabled={!!pendingAttachment}
            title="Attach a script (PDF, Word, or text)"
          />
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