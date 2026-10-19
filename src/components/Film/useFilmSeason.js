// src/components/Film/useFilmSeason.js
// NOCTURNE GLASS (2026-10-19) — the Halloween season switch for Film.
//
// The season runs 1 October – 2 November (the user's local date). Inside it the look is
// on by default; the user can turn it off, and that choice is remembered in this browser.
// Outside it nothing happens and the switch is not shown.
//
// The look itself is pure CSS (FilmNocturne.css): this hook only sets
// <body data-film-season="halloween">. It lives on <body>, not the workspace, so the
// portalled pop-outs (Ad setup, the end-card picker, New Film) can join the season later
// with no extra wiring. The attribute is removed when the last user of the hook unmounts.
// Purely presentational — it touches no film, chat, credit or render state.

import { useCallback, useEffect, useState } from 'react';

const PREF_KEY = 'awakeverse.filmSeason';   // 'on' | 'off' (absent = on during the season)
const ATTR = 'data-film-season';

export function inHalloweenWindow(d = new Date()) {
  const m = d.getMonth();          // 9 = October, 10 = November
  return m === 9 || (m === 10 && d.getDate() <= 2);
}

const readPref = () => {
  try { return window.localStorage.getItem(PREF_KEY); } catch (_) { return null; }   // private mode
};

export default function useFilmSeason() {
  const inWindow = inHalloweenWindow();
  const [pref, setPref] = useState(readPref);
  const on = inWindow && pref !== 'off';

  useEffect(() => {
    const b = document.body;
    if (on) b.setAttribute(ATTR, 'halloween');
    else b.removeAttribute(ATTR);
    return () => { b.removeAttribute(ATTR); };
  }, [on]);

  const toggle = useCallback(() => {
    setPref((p) => {
      const next = (inWindow && p !== 'off') ? 'off' : 'on';
      try { window.localStorage.setItem(PREF_KEY, next); } catch (_) { /* private mode */ }
      return next;
    });
  }, [inWindow]);

  return { inWindow, on, toggle };
}