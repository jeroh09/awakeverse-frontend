// src/components/Film/useFilmAuthoring.js
// Writers'-room chat state. Uses filmApi (shared axios instance → CSRF/creds/refresh
// handled for us) for everything EXCEPT the message turn itself, which now
// streams: filmMessageStream() bypasses axios (can't hand back a readable
// stream in the browser) exactly the way api.js's postDebateMessage does for
// /debate/:id/message — raw fetch, CSRF pulled by hand from the av_csrf
// cookie. The pill (scriptReady) turns on once a draft script exists; reads
// an explicit script_ready flag if the backend sends one, else a light
// heuristic until that flag is added.
//
// Streaming (README §3 — now real, not the word-reveal stopgap): film_routes.py's
// /assistant/message returns NDJSON, one JSON object per line:
//   {"type":"token","response":"..."}                    — append to streamingText
//   {"type":"provider_start"}                             — provider fallback
//                                                            boundary, informational only
//   {"type":"reconciliation","note":"..."}                 — informational only
//   {"type":"script_meta","duration_seconds":n,"characters":{...},"script":"..."}
//                                                          — emitted once, after a complete
//                                                            script block streams. Attached to
//                                                            the assistant message as
//                                                            `scriptMeta` once pushed — see
//                                                            WritersRoom's CharacterChips/
//                                                            DurationBadge/ScriptPanel.
//   {"type":"error","error":"..."}                          — terminal, no "done" follows
//   {"type":"done","session_id":"...","response":"<full>"} — terminal, success. Already tag/
//                                                            script-stripped server-side —
//                                                            this is plain flowing commentary.
// `streamingActive` / `streamingText` are the same two fields WritersRoom and
// the container already read — swapping the stopgap for this didn't touch
// anything downstream.

import { useState, useCallback, useRef } from 'react';
import { filmStart, filmMessageStream, filmFinalize, friendlyError } from './filmApi';

const looksLikeScript = (t = '') =>
  /^\s*(VISUAL:|INT\.|EXT\.|TITLE:)/im.test(t) || /\n[A-Z][A-Z '\-/]{1,30}\n/.test(t);

export default function useFilmAuthoring() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [scriptReady, setScriptReady] = useState(false);
  const [script, setScript] = useState(null);
  const [shots, setShots]   = useState(null);   // review storyboard, if finalize dry-compiles
  const [title, setTitle]   = useState('Untitled film');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState(null);
  const [streamingActive, setStreamingActive] = useState(false);
  const [streamingText, setStreamingText]     = useState('');
  // True from the instant a message is sent until its reply begins streaming
  // (or errors). This is what drives the in-chat "Director is thinking" turn.
  // Deliberately narrower than `busy`: `busy` also covers start()/finalize(),
  // where no chat reply is being composed and the indicator shouldn't show.
  const [thinking, setThinking] = useState(false);
  const sidRef = useRef(null);
  const streamTokenRef = useRef(0);   // invalidates a stale read if a new send starts

  const _send = useCallback(async (text, sid, attachment = null) => {
    setError(null);
    // The displayed message shows the user's note + a file chip (attachment),
    // NOT the raw extracted script. The director, however, receives the full
    // script text so it can react — assembled into `directorText` below.
    setMessages(m => [...m, { role: 'me', text, attachment: attachment ? {
      filename: attachment.filename, url: attachment.url, file_type: attachment.file_type,
    } : null }]);
    setBusy(true);
    setThinking(true);
    const myToken = ++streamTokenRef.current;

    // What the DIRECTOR sees: the user's note plus the attached script's text
    // (invisible in the chat). A flagged/injection doc has text===null and is
    // never forwarded — the note goes alone.
    let directorText = text;
    if (attachment && attachment.text) {
      const note = text && text.trim() ? `${text.trim()}\n\n` : '';
      directorText = `${note}[The user attached a script file "${attachment.filename}". Its content:]\n\n${attachment.text}`;
    }

    try {
      const response = await filmMessageStream(sid, directorText);
      setBusy(false);
      setThinking(false);
      setStreamingActive(true);
      setStreamingText('');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let streamError = null;
      let scriptMeta = null;   // {duration_seconds, characters, script} — set if script_meta arrives

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (streamTokenRef.current !== myToken) { reader.cancel(); return; }   // superseded by a newer send
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();   // last element may be a partial line — keep it for next read

        for (const line of lines) {
          if (!line.trim()) continue;
          let chunk;
          try { chunk = JSON.parse(line); } catch (_) { continue; }   // skip a malformed line, don't kill the stream

          if (chunk.type === 'token') {
            fullText += chunk.response || '';
            setStreamingText(prev => prev + (chunk.response || ''));
          } else if (chunk.type === 'script_meta') {
            scriptMeta = {
              durationSeconds: chunk.duration_seconds ?? null,
              characters: chunk.characters || {},
              script: chunk.script || '',
            };
          } else if (chunk.type === 'error') {
            streamError = chunk.error || 'Something went wrong drafting that.';
          } else if (chunk.type === 'done') {
            fullText = chunk.response || fullText;   // backend's assembled text is authoritative
          }
          // provider_start / reconciliation: informational only, no UI action needed
        }
      }

      if (streamTokenRef.current !== myToken) return;   // superseded while we were finishing up

      setStreamingActive(false);
      setStreamingText('');

      if (streamError) {
        setError(streamError);
        setMessages(m => [...m, { role: 'ai', text: streamError }]);
      } else {
        setMessages(m => [...m, { role: 'ai', text: fullText, scriptMeta }]);
        // script_meta only ever arrives after a genuinely complete, tagged
        // script block — a hard signal, so it wins over the text heuristic
        // (which stays as the fallback for adopted/legacy messages that
        // never carried scriptMeta in the first place).
        setScriptReady(prev => prev || !!scriptMeta || looksLikeScript(fullText));
      }
    } catch (e) {
      const msg = friendlyError(e, 'Something went wrong drafting that. Try again.');
      if (streamTokenRef.current === myToken) {
        setError(msg);
        setThinking(false);
        setStreamingActive(false);
        setStreamingText('');
        setMessages(m => [...m, { role: 'ai', text: msg }]);
      }
    } finally {
      if (streamTokenRef.current === myToken) { setBusy(false); setThinking(false); }
    }
  }, []);

  const start = useCallback(async (premise) => {
    setError(null); setBusy(true);
    try {
      const { session_id } = await filmStart();
      sidRef.current = session_id;
      setSessionId(session_id);
      if (premise && premise.trim()) await _send(premise.trim(), session_id);
      return session_id;
    } catch (e) { setError(friendlyError(e)); return null; }
    finally { setBusy(false); }
  }, [_send]);

  const send = useCallback((text, attachment = null) => {
    const sid = sidRef.current;
    if (!sid) { setError('Start a film first.'); return; }
    return _send(text, sid, attachment);
  }, [_send]);

  // Adopt an externally-created/restored session (from POST /projects or GET
  // /projects/:id) instead of calling /assistant/start. Messages arrive as
  // {role:'user'|'assistant', text, scriptMeta?} and map to the workspace's
  // me/ai roles. scriptMeta (if present) is {duration_seconds, characters,
  // script} from the DB — normalized here to the same {durationSeconds,
  // characters, script} shape the live script_meta event produces, so
  // WritersRoom's ScriptMeta renders identically either way.
  const adopt = useCallback(({ session_id, messages = [], title, script, scriptReady }) => {
    sidRef.current = session_id || null;
    setSessionId(session_id || null);
    let sawScriptMeta = false;
    setMessages((messages || []).filter(m => m.role !== 'system').map(m => {
      const sm = m.scriptMeta;
      if (sm) sawScriptMeta = true;
      return {
        role: (m.role === 'assistant' || m.role === 'ai') ? 'ai' : 'me',
        text: m.text != null ? m.text : (m.content || ''),
        attachment: m.attachment || null,
        scriptMeta: sm ? {
          durationSeconds: sm.duration_seconds ?? sm.durationSeconds ?? null,
          characters: sm.characters || {},
          script: sm.script || '',
        } : null,
      };
    }));
    if (title) setTitle(title);
    if (script) setScript(script);
    if (typeof scriptReady === 'boolean') setScriptReady(scriptReady || sawScriptMeta);
    else setScriptReady(!!script || sawScriptMeta);
  }, []);

  const finalize = useCallback(async () => {
    const sid = sidRef.current;
    if (!sid) return null;
    setBusy(true); setError(null);
    try {
      const rec = await filmFinalize(sid);
      const scr = rec.script || rec.condensed_script || rec.text || '';
      setScript(scr);
      if (rec.title) setTitle(rec.title);
      if (rec.shots) setShots(rec.shots);   // review storyboard when the backend dry-compiles
      return { ...rec, script: scr };
    } catch (e) {
      const status = e && e.response && e.response.status;
      setError(status === 400 ? 'Keep writing — there’s no finished draft to build yet.' : friendlyError(e));
      return null;
    } finally { setBusy(false); }
  }, []);

  const reset = useCallback(() => {
    streamTokenRef.current += 1;
    sidRef.current = null;
    setSessionId(null); setMessages([]); setScriptReady(false);
    setScript(null); setShots(null); setError(null); setBusy(false);
    setThinking(false);
    setStreamingActive(false); setStreamingText('');
  }, []);

  return {
    sessionId, messages, scriptReady, script, shots, title, busy, error,
    thinking, streamingActive, streamingText,
    start, send, finalize, adopt, reset,
  };
}