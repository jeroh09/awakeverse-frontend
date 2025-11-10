import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getStoryContext, getStoryHistory, streamStoryMessage } from '../../../api';
import css from './StoryChat.module.css';

export default function StoryChat({ storyId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [meta, setMeta] = useState(null); // { story, constraints, indicators:{emotion,momentum,act}, era_label }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);

  const listRef = useRef(null);
  const abortRef = useRef(null);

  const emotionPct = Math.round((meta?.indicators?.emotion ?? 0.5) * 100);
  const momentumPct = Math.round((meta?.indicators?.momentum ?? 0.5) * 100);
  const actLabel = useMemo(() => {
    const n = meta?.indicators?.act ?? 1;
    return n === 1 ? 'Act I' : (n === 2 ? 'Act II' : 'Act III');
  }, [meta?.indicators?.act]);

  const scrollBottom = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  const load = async () => {
    setLoading(true); setErr(null);
    const ctx = await getStoryContext(storyId);
    if (ctx.status !== 'success') { setErr(ctx.error || 'Failed to load'); setLoading(false); return; }
    setMeta(ctx);
    const hist = await getStoryHistory(storyId, { limit: 50 });
    if (hist.status === 'success') setMessages(hist.messages || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [storyId]);
  useEffect(() => { scrollBottom(); }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    setMessages(prev => [...prev, { role:'user', content: text, ts: Date.now() }]);

    setStreaming(true);
    const aiIndex = messages.length + 1; // next index
    let aiText = '';

    abortRef.current = new AbortController();
    await streamStoryMessage({
      storyId,
      text,
      signal: abortRef.current.signal,
      onToken: (chunk) => {
        aiText += chunk;
        // append or update last assistant bubble
        setMessages(prev => {
          const next = [...prev];
          if (next[next.length - 1]?.role === 'assistant_pending') {
            next[next.length - 1] = { role:'assistant_pending', content: aiText, ts: Date.now() };
          } else {
            next.push({ role:'assistant_pending', content: aiText, ts: Date.now() });
          }
          return next;
        });
      },
      onDone: () => {
        setMessages(prev => {
          const next = [...prev];
          // finalize last pending assistant message
          if (next[next.length - 1]?.role === 'assistant_pending') {
            next[next.length - 1].role = 'assistant';
          }
          return next;
        });
        setStreaming(false);
      },
      onError: (e) => {
        setStreaming(false);
        alert(e.message || 'Failed to stream message');
      }
    });
  };

  const cancelStream = () => {
    try { abortRef.current?.abort(); } catch {}
    setStreaming(false);
  };

  if (loading) return <div className={css.loading}>Loading story…</div>;
  if (err) return <div className={css.error}>⚠ {err}</div>;

  const constraints = meta?.constraints?.tech_alternatives || {};
  const constraintBadges = Object.entries(constraints).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);

  return (
    <div className={css.shell}>
      <header className={css.hd}>
        <div className={`${css.chip} ${css.era}`}>{meta?.era_label || meta?.story?.era || '—'}</div>
        <div className={`${css.chip} ${css.act}`}>{actLabel}</div>
        <div className={css.kpi}>
          <div className={css.meter}><span>Emotion</span><span className={css.bar}><span style={{width:`${emotionPct}%`}}></span></span></div>
          <div className={css.meter}><span>Momentum</span><span className={css.bar}><span style={{width:`${momentumPct}%`}}></span></span></div>
        </div>
        <button className={css.close} onClick={onClose}>×</button>
      </header>

      <div className={css.constraints}>
        <strong>Era Constraints</strong>
        <div className={css.badges}>
          {constraintBadges.length ? constraintBadges.map((b, i) => <span key={i} className={css.badge}>{b}</span>) : <span className={css.dim}>No hints</span>}
        </div>
      </div>

      <main className={css.msgs} ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={m.role.startsWith('assistant') ? css.aiRow : css.meRow}>
            <div className={`${css.bubble} ${m.role.startsWith('assistant') ? css.ai : css.me}`}>
              {m.content}
            </div>
          </div>
        ))}
      </main>

      <footer className={css.composer}>
        <input
          className={css.input}
          placeholder="Type your next move…"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=> (e.key==='Enter' && !e.shiftKey) ? handleSend() : null}
        />
        {!streaming ? (
          <button className={css.btnGold} onClick={handleSend}>Send</button>
        ) : (
          <button className={css.btn} onClick={cancelStream}>Stop</button>
        )}
      </footer>
    </div>
  );
}
