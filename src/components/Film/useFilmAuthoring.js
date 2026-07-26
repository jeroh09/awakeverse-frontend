// src/components/Film/useFilmAuthoring.js
// Writers'-room chat state. Uses filmApi (shared axios instance → CSRF/creds/refresh
// handled for us). start → message → finalize. The pill (scriptReady) turns on once
// a draft script exists; reads an explicit script_ready flag if the backend sends
// one, else a light heuristic until that flag is added.

import { useState, useCallback, useRef } from 'react';
import { filmStart, filmMessage, filmFinalize, friendlyError } from './filmApi';

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
  const sidRef = useRef(null);

  const _send = useCallback(async (text, sid) => {
    setError(null);
    setMessages(m => [...m, { role: 'me', text }]);
    setBusy(true);
    try {
      const data = await filmMessage(sid, text);
      const reply = data.response || '';
      setMessages(m => [...m, { role: 'ai', text: reply }]);
      setScriptReady(prev =>
        (typeof data.script_ready === 'boolean' ? data.script_ready : (prev || looksLikeScript(reply))));
      if (data.title) setTitle(data.title);
    } catch (e) {
      const msg = friendlyError(e, 'Something went wrong drafting that. Try again.');
      setError(msg);
      setMessages(m => [...m, { role: 'ai', text: msg }]);
    } finally { setBusy(false); }
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

  const send = useCallback((text) => {
    const sid = sidRef.current;
    if (!sid) { setError('Start a film first.'); return; }
    return _send(text, sid);
  }, [_send]);

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
    sidRef.current = null;
    setSessionId(null); setMessages([]); setScriptReady(false);
    setScript(null); setShots(null); setError(null); setBusy(false);
  }, []);

  return { sessionId, messages, scriptReady, script, shots, title, busy, error, start, send, finalize, reset };
}