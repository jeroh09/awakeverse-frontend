// src/components/CreatorHub/StickyNotes.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ─── Icons ──────────────────────────────────────────────────── */
const NoteIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="sn-gN" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55"/>
      </filter>
    </defs>
    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" filter="url(#sn-gN)"/>
    <path d="M8 9h8M8 13h5M8 17h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" filter="url(#sn-gN)"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const ExpandIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6-5 6 5M6 15l6 5 6-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

/* ─── Pip colour by tag ──────────────────────────────────────── */
const PIP_COLORS = {
  business:  '#6366F1',
  character: '#10B981',
  default:   '#475569',
};

/* ═══════════════════════════════════════════════════════════════
   StickyNotes
   Props:
     notes        []        — from useSMBIntelligence
     notesLoading bool
     createNote   fn(content, tag) → note | null
     deleteNote   fn(id) → bool
     loadNotes    fn()
═══════════════════════════════════════════════════════════════ */
export default function StickyNotes({
  notes = [],
  notesLoading = false,
  createNote,
  deleteNote,
  loadNotes,
}) {
  const [minimised, setMinimised] = useState(false);
  const [pos, setPos] = useState({ right: 32, bottom: 32 });
  const [inputVal, setInputVal] = useState('');
  const [tagVal, setTagVal] = useState('');
  const [adding, setAdding] = useState(false);

  const widgetRef = useRef(null);
  const dragState = useRef(null);

  /* Load notes on mount */
  useEffect(() => {
    if (loadNotes) loadNotes();
  }, [loadNotes]);

  /* ── Drag ───────────────────────────────────────────────── */
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    const rect = widgetRef.current.getBoundingClientRect();
    dragState.current = {
      startX:     e.clientX,
      startY:     e.clientY,
      origRight:  window.innerWidth  - rect.right,
      origBottom: window.innerHeight - rect.bottom,
    };

    const onMove = (ev) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      setPos({
        right:  Math.max(0, dragState.current.origRight  - dx),
        bottom: Math.max(0, dragState.current.origBottom + dy),
      });
    };

    const onUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  /* ── Add note ───────────────────────────────────────────── */
  const handleAdd = useCallback(async () => {
    const text = inputVal.trim();
    if (!text || !createNote) return;
    setAdding(true);
    await createNote(text, tagVal || null);
    setInputVal('');
    setTagVal('');
    setAdding(false);
  }, [inputVal, tagVal, createNote]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleAdd();
  }, [handleAdd]);

  /* ── Delete note ────────────────────────────────────────── */
  const handleDelete = useCallback(async (id) => {
    if (deleteNote) await deleteNote(id);
  }, [deleteNote]);

  return (
    <div
      ref={widgetRef}
      style={{
        position:      'fixed',
        right:         pos.right,
        bottom:        pos.bottom,
        width:         320,
        background:    '#141B2E',
        /* Double border: inner indigo ring → dark gap → outer glow → depth */
        border:        '1px solid rgba(99,102,241,0.35)',
        boxShadow:     '0 0 0 3px rgba(10,15,26,0.95), 0 0 0 4px rgba(99,102,241,0.18), 0 8px 32px rgba(15,23,42,0.8)',
        borderRadius:  20,
        zIndex:        1000,
        overflow:      'hidden',
        transition:    'height 0.22s cubic-bezier(0.4,0,0.2,1)',
        height:        minimised ? 48 : 360,
        display:       'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Header / drag handle ── */}
      <div
        onMouseDown={onMouseDown}
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 0.85rem',
          height:         48,
          borderBottom:   minimised ? 'none' : '1px solid rgba(148,163,184,0.1)',
          cursor:         'grab',
          background:     'radial-gradient(circle at top left, rgba(99,102,241,0.08), transparent 60%), #141B2E',
          flexShrink:     0,
        }}
      >
        {/* Title */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '0.4rem',
          fontFamily: "'Syne', sans-serif",
          fontSize:   '0.84rem',
          fontWeight: 700,
          color:      '#F1F5F9',
          userSelect: 'none',
        }}>
          <NoteIcon />
          Notes
          {notes.length > 0 && (
            <span style={{
              background:   'rgba(99,102,241,0.18)',
              color:        '#818CF8',
              borderRadius: '9999px',
              fontSize:     '0.67rem',
              fontWeight:   700,
              padding:      '0.05rem 0.45rem',
            }}>
              {notes.length}
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.3rem' }} onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => setMinimised(true)}  title="Minimise" style={ctrlBtnStyle}>
            <MinusIcon />
          </button>
          <button onClick={() => setMinimised(false)} title="Expand"   style={ctrlBtnStyle}>
            <ExpandIcon />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {!minimised && (
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          flex:          1,
          padding:       '0.75rem',
          gap:           '0.5rem',
          overflow:      'hidden',
        }}>
          {/* Input row */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Capture an idea…"
              style={noteInputStyle}
            />
            <select
              value={tagVal}
              onChange={e => setTagVal(e.target.value)}
              style={tagSelectStyle}
            >
              <option value="">—</option>
              <option value="business">Biz</option>
              <option value="character">Char</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={adding || !inputVal.trim()}
              style={{
                ...ctrlBtnStyle,
                width:        32,
                height:       32,
                background:   '#6366F1',
                border:       'none',
                color:        '#fff',
                borderRadius: 8,
                opacity:      (!inputVal.trim() || adding) ? 0.45 : 1,
                cursor:       (!inputVal.trim() || adding) ? 'not-allowed' : 'pointer',
              }}
            >
              <PlusIcon />
            </button>
          </div>

          {/* Notes list */}
          <div
            style={{
              flex:          1,
              overflowY:     'auto',
              display:       'flex',
              flexDirection: 'column',
              gap:           '0.4rem',
            }}
            className="sn-list"
          >
            {notesLoading && (
              <div style={{ fontSize: '0.8rem', color: '#475569', textAlign: 'center', padding: '1rem' }}>
                Loading…
              </div>
            )}

            {!notesLoading && notes.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: '#475569', textAlign: 'center', padding: '1.25rem 0.5rem' }}>
                No notes yet. Add one above.
              </div>
            )}

            {notes.map(note => (
              <div key={note.id} style={noteItemStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                  {/* Tag pip */}
                  <span style={{
                    width:        6,
                    height:       6,
                    borderRadius: '50%',
                    background:   PIP_COLORS[note.tag] || PIP_COLORS.default,
                    flexShrink:   0,
                    marginTop:    '0.4rem',
                  }} />
                  <span style={{
                    fontSize:  '0.81rem',
                    color:     '#94A3B8',
                    lineHeight: 1.45,
                    flex:       1,
                    minWidth:   0,
                    wordBreak:  'break-word',
                  }}>
                    {note.content}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  style={{
                    width:          20,
                    height:         20,
                    borderRadius:   4,
                    border:         'none',
                    background:     'transparent',
                    color:          '#475569',
                    cursor:         'pointer',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    flexShrink:     0,
                    padding:        0,
                    transition:     'all 0.12s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .sn-list::-webkit-scrollbar { width: 3px; }
        .sn-list::-webkit-scrollbar-track { background: transparent; }
        .sn-list::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.22); border-radius: 2px; }
      `}</style>
    </div>
  );
}

/* ─── Shared inline style objects ──────────────────────────── */
const ctrlBtnStyle = {
  width:          26,
  height:         26,
  borderRadius:   7,
  border:         '1px solid rgba(148,163,184,0.15)',
  /* Double border on control buttons */
  boxShadow:      '0 0 0 2px rgba(10,15,26,0.95), 0 0 0 3px rgba(148,163,184,0.07)',
  background:     '#1C2640',
  color:          '#64748B',
  cursor:         'pointer',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  transition:     'all 0.12s ease',
};

const noteInputStyle = {
  flex:         1,
  padding:      '0.52rem 0.75rem',
  borderRadius: 10,
  border:       '1px solid rgba(148,163,184,0.18)',
  /* Double border on input */
  boxShadow:    '0 0 0 3px rgba(10,15,26,0.95), 0 0 0 4px rgba(148,163,184,0.06)',
  background:   '#1C2640',
  color:        '#F1F5F9',
  fontFamily:   "'Inter', sans-serif",
  fontSize:     '0.81rem',
  outline:      'none',
};

const tagSelectStyle = {
  padding:      '0.52rem 0.45rem',
  borderRadius: 10,
  border:       '1px solid rgba(148,163,184,0.18)',
  /* Double border on select */
  boxShadow:    '0 0 0 3px rgba(10,15,26,0.95), 0 0 0 4px rgba(148,163,184,0.06)',
  background:   '#1C2640',
  color:        '#94A3B8',
  fontFamily:   "'Inter', sans-serif",
  fontSize:     '0.76rem',
  outline:      'none',
  cursor:       'pointer',
};

const noteItemStyle = {
  display:        'flex',
  alignItems:     'flex-start',
  justifyContent: 'space-between',
  gap:            '0.38rem',
  padding:        '0.52rem 0.65rem',
  borderRadius:   8,
  background:     '#1C2640',
  /* Double border on each note item */
  border:         '1px solid rgba(148,163,184,0.12)',
  boxShadow:      '0 0 0 3px rgba(10,15,26,0.95), 0 0 0 4px rgba(148,163,184,0.05)',
};