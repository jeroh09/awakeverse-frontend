// src/components/Film/filmIcons.jsx
// Hand-drawn SVG icons for the Film workspace. No icon library — every glyph is
// custom so it stays on-brand and carries no third-party dependency. All use
// currentColor and a 24x24 viewBox; size via the `s` prop (default 18).

import React from 'react';

const svg = (s, children, extra = {}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
       strokeLinejoin="round" aria-hidden="true" {...extra}>
    {children}
  </svg>
);

// panel collapse / expand — chevron pointing a direction
export const IconChevron = ({ s = 16, dir = 'left' }) => {
  const rot = { left: 0, right: 180, up: 90, down: -90 }[dir] || 0;
  return svg(s, <polyline points="15 6 9 12 15 18" />, { style: { transform: `rotate(${rot}deg)` } });
};

// send (message) — upward arrow
export const IconSend = ({ s = 18 }) => svg(s, <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="6 11 12 5 18 11" /></>);

// play — filled triangle (uses fill, not stroke)
export const IconPlay = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l11-6.5-11-6.5z" />
  </svg>
);

// regenerate — circular re-render arrow
export const IconRegenerate = ({ s = 16 }) => svg(s, <><path d="M21 12a9 9 0 1 1-2.64-6.36" /><polyline points="21 3 21 8 16 8" /></>);

// cut — scissors
export const IconCut = ({ s = 16 }) => svg(s, <><circle cx="6" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><line x1="8" y1="7.5" x2="20" y2="17" /><line x1="8" y1="16.5" x2="20" y2="7" /></>);

// duplicate — overlapping frames
export const IconDuplicate = ({ s = 16 }) => svg(s, <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" /></>);

// softened — shield with a soft dot (moderation rewrote this beat)
export const IconSoftened = ({ s = 14 }) => svg(s, <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><circle cx="12" cy="11" r="1.4" fill="currentColor" stroke="none" /></>);

// script pill mark — a quill nib over a line
export const IconQuill = ({ s = 15 }) => svg(s, <><path d="M4 20c6-1 9-4 13-9l-4-4c-5 4-8 7-9 13z" /><line x1="4" y1="20" x2="8" y2="16" /></>);

// drag handle — two-column dots
export const IconGrip = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {[7, 12, 17].map(y => (<React.Fragment key={y}><circle cx="9" cy={y} r="1.3" /><circle cx="15" cy={y} r="1.3" /></React.Fragment>))}
  </svg>
);

// stop — square (cancel render)
export const IconStop = ({ s = 14 }) => svg(s, <rect x="6" y="6" width="12" height="12" rx="2" />);

// plus — new film
export const IconPlus = ({ s = 16 }) => svg(s, <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>);

// upload — use your own photo
export const IconUpload = ({ s = 15 }) => svg(s, <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>);

// trash — delete film
export const IconTrash = ({ s = 15 }) => svg(s, <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>);

// back arrow — return to My Films
export const IconBack = ({ s = 16 }) => svg(s, <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>);

// check — "Script ready" inline bar
export const IconCheck = ({ s = 14 }) => svg(s, <polyline points="20 6 9 17 5 13" />);

// close — × for the inline player
export const IconClose = ({ s = 14 }) => svg(s, <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>);

// player size toggles
export const IconHalf = ({ s = 13 }) => svg(s, <rect x="3" y="7" width="18" height="10" rx="1.5" />);
export const IconFull = ({ s = 13 }) => svg(s, <rect x="3" y="3" width="18" height="18" rx="1.5" />);

// clock — script-meta duration badge
export const IconClock = ({ s = 12 }) => svg(s, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>);

// ── kind glyphs (badges + empty thumbs) ──
export const IconDialogue = ({ s = 18 }) => svg(s, <path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 20l1.8-5.1A7.5 7.5 0 1 1 20 11.5z" />);
export const IconVisual   = ({ s = 18 }) => svg(s, <><rect x="3" y="5" width="18" height="14" rx="2" /><line x1="3" y1="9.5" x2="21" y2="9.5" /><line x1="3" y1="14.5" x2="21" y2="14.5" /><line x1="8" y1="5" x2="8" y2="19" /><line x1="16" y1="5" x2="16" y2="19" /></>);
export const IconCrowd    = ({ s = 18 }) => svg(s, <><circle cx="8" cy="9" r="2.4" /><circle cx="16" cy="9" r="2.4" /><path d="M3.5 19c.6-3 2.4-4.5 4.5-4.5S12 16 12.5 19" /><path d="M11.5 19c.6-3 2.4-4.5 4.5-4.5s3.9 1.5 4.5 4.5" /></>);
export const IconGraphic  = ({ s = 18 }) => svg(s, <><rect x="4" y="4" width="16" height="16" rx="2" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="12" y1="4" x2="12" y2="20" /></>);

export const KIND_ICON = {
  dialogue: IconDialogue,
  pure_visual: IconVisual,
  vo_broll: IconVisual,
  crowd: IconCrowd,
  graphic: IconGraphic,
};
// ── Series icons — append to src/components/Film/filmIcons.jsx ───────────────
// Same `svg(s, children)` helper, 24×24 viewBox, currentColor, stroke 1.8. No
// icon library — hand-drawn to stay on-brand (matches your #4).

// series — stacked spines (a shelf of books, end-on)
export const IconSeries = ({ s = 16 }) => svg(s, <>
  <rect x="4" y="4" width="3.5" height="16" rx="1" />
  <rect x="9" y="4" width="3.5" height="16" rx="1" />
  <path d="M15.2 4.6l3.4.9a1 1 0 0 1 .7 1.2l-3 12" />
</>);

// book — a single spine/cover (an episode)
export const IconBook = ({ s = 16 }) => svg(s, <>
  <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
  <path d="M5 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" />
  <line x1="9" y1="4" x2="9" y2="20" />
</>);

// chain — continuity link (chain earlier episodes)
export const IconChain = ({ s = 16 }) => svg(s, <>
  <path d="M9.5 13.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" />
  <path d="M14.5 10.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
</>);

// lock — a locked/reused character plate
export const IconLock = ({ s = 14 }) => svg(s, <>
  <rect x="5" y="11" width="14" height="9" rx="2" />
  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
</>);

// sparkle — a NEW character introduced this episode
export const IconSparkle = ({ s = 14 }) => svg(s, <>
  <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
</>);

// refresh look — arrows curving around a face dot (a refresh, not a redraw)
export const IconRefreshLook = ({ s = 15 }) => svg(s, <>
  <path d="M20 11a8 8 0 1 0-.5 3" />
  <polyline points="20 5 20 11 14 11" />
  <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
</>);