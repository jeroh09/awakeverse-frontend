// src/components/Film/useFilmSeason.js
// NOCTURNE GLASS (2026-10-19) — the Film look switches.
//
// Two attributes on <body>, both pure CSS hooks (nothing reads them in JS):
//   data-film-ui="nocturne"       while any Film screen using this hook is open — lets the
//                                 portalled pop-ups (New film, Ad setup, the end-card picker,
//                                 the series pop-ups, the credits card) take the glass look
//                                 without any change to those components.
//   data-film-season="halloween"  1 October – 2 November (the user's local date), unless
//                                 the user switched it off; that choice is remembered in
//                                 this browser. Outside the season nothing happens.
// Both are removed when the last screen using the hook closes, so no other page is touched.
// Purely presentational — no film, chat, credit or render state is read or written.

import { useCallback, useEffect, useState } from 'react';
// The pop-ups' glass (New film, Ad setup, the end-card picker, the series pop-ups, the
// credits card). Loaded here because every Film screen that can open a pop-up uses this
// hook; its rules only apply while <body data-film-ui="nocturne"> is set.
import './FilmNocturnePopups.css';

const PREF_KEY = 'awakeverse.filmSeason';   // 'on' | 'off' (absent = on during the season)
const SEASON_ATTR = 'data-film-season';
const UI_ATTR = 'data-film-ui';

// How many open screens want each attribute (My Films and the workspace each use the hook;
// counting means one closing never strips the look from another that is still open).
let uiUsers = 0;
let seasonUsers = 0;

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
    uiUsers += 1;
    document.body.setAttribute(UI_ATTR, 'nocturne');
    return () => {
      uiUsers = Math.max(0, uiUsers - 1);
      if (!uiUsers) document.body.removeAttribute(UI_ATTR);
    };
  }, []);

  useEffect(() => {
    if (!on) return undefined;
    seasonUsers += 1;
    document.body.setAttribute(SEASON_ATTR, 'halloween');
    return () => {
      seasonUsers = Math.max(0, seasonUsers - 1);
      if (!seasonUsers) document.body.removeAttribute(SEASON_ATTR);
    };
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