// src/components/PodcastStudio/StudioIcons.jsx
//
// The studio's own icon set (2026-10-18) — replaces the Feather/Lucide-style `Ic`
// set and the emoji/glyph icons (🪝 ⚖️ 👗 🔈 ▣ ✂ ✋ ▤ ✨ ↻ ✕ …) across the studio.
//
// One family: 24-unit grid, round line caps, a soft duotone fill, and ONE accent
// stroke that marks the meaningful part of each picture (the first seconds of the
// hook, the word being said in captions, the highlighted bar, the record dot).
//
//   • Colour comes from `currentColor`, so an icon takes the text colour around it.
//   • The accent uses the CSS variable --si-accent (falls back to currentColor),
//     so a parent can tint it:  .myWell { --si-accent: #A5B4FC; }
//   • The record dot uses --si-rec (falls back to a soft red).
//   • size: number (px) or any CSS length; default 16. Small sizes get a slightly
//     heavier stroke so they stay crisp.
//   • Decorative by default (aria-hidden). Pass `title` to make one meaningful.

import React from 'react';

const ACCENT = { stroke: 'var(--si-accent, currentColor)' };
const ACCENT_FILL = { fill: 'var(--si-accent, currentColor)' };
const REC_FILL = { fill: 'var(--si-rec, #F87171)' };

function Svg({ size = 16, strokeWidth, className, style, title, children }) {
  const px = typeof size === 'number' ? size : null;
  const sw = strokeWidth ?? (px !== null && px <= 14 ? 2 : 1.6);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

const make = (name, body) => {
  const C = (props) => <Svg {...props}>{body}</Svg>;
  C.displayName = name;
  return C;
};

// ── Visual types ────────────────────────────────────────────────────────────
// Glass card — the speaker with a frosted panel beside them
export const IconGlassCard = make('IconGlassCard', <>
  <circle cx="6" cy="9.5" r="2.2" />
  <path d="M2.5 19.5c.3-2.8 1.7-4.5 3.5-4.5s3.2 1.7 3.5 4.5" />
  <path d="M12 6.2 21 4.8v13.6l-9-1z" fill="currentColor" fillOpacity=".16" />
  <path d="M14.2 8.8 17.6 8.3" strokeOpacity=".7" style={ACCENT} />
</>);

// Cutout — an object lifted off its background, with a contact shadow
export const IconCutout = make('IconCutout', <>
  <path d="M10 4.5h4V7c1.8.8 2.8 2.1 2.8 4v6c0 .9-.7 1.6-1.6 1.6H8.8c-.9 0-1.6-.7-1.6-1.6v-6c0-1.9 1-3.2 2.8-4z" fill="currentColor" fillOpacity=".16" />
  <path d="M9.6 12.5h4.8" strokeOpacity=".6" />
  <ellipse cx="12" cy="21.2" rx="5.5" ry="1" fill="currentColor" fillOpacity=".35" stroke="none" />
  <path d="M3.5 7V4.5a1 1 0 0 1 1-1H7" style={ACCENT} />
  <path d="M17 3.5h2.5a1 1 0 0 1 1 1V7" style={ACCENT} />
</>);

// In hand — an open hand presenting a product
export const IconInHand = make('IconInHand', <>
  <rect x="9" y="3.5" width="7.5" height="7" rx="1.3" fill="currentColor" fillOpacity=".16" />
  <path d="M9 6.3h7.5" strokeOpacity=".6" style={ACCENT} />
  <path d="M2.5 13.5h3l3.3 1.3h4.4a1.6 1.6 0 0 1 0 3.2H9.5" />
  <path d="M13.2 18l5.3-2.6a1.7 1.7 0 0 1 2 2.6L16.4 21H8.6l-6.1-1.8" />
</>);

// Data card · stat — a big number with a ring filling to its value
export const IconDataCard = make('IconDataCard', <>
  <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" fill="currentColor" fillOpacity=".1" />
  <path d="M6 9.5h5.5" strokeWidth="2.4" />
  <path d="M6 13.8h3.5" strokeOpacity=".6" />
  <circle cx="16.5" cy="12" r="3" strokeOpacity=".3" />
  <path d="M16.5 9a3 3 0 0 1 2.6 4.5" style={ACCENT} />
</>);

// Data card · chart — bars with the one you're talking about highlighted
export const IconChart = make('IconChart', <>
  <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" fill="currentColor" fillOpacity=".1" />
  <path d="M7 16v-3M10.5 16V9.5M14 16v-5" strokeWidth="2" />
  <path d="M17.5 16V7.5" strokeWidth="2.2" style={ACCENT} />
</>);

// Comparison — two rails, A vs B, with the VS node between them
export const IconCompare = make('IconCompare', <>
  <rect x="2.5" y="4.5" width="6.5" height="15" rx="1.6" fill="currentColor" fillOpacity=".12" />
  <rect x="15" y="4.5" width="6.5" height="15" rx="1.6" fill="currentColor" fillOpacity=".12" />
  <path d="M4.6 9h2.3M4.6 12h2.3M4.6 15h1.4M17.1 9h2.3M17.1 12h1.4M17.1 15h2.3" strokeOpacity=".7" />
  <circle cx="12" cy="12" r="1.9" stroke="none" style={ACCENT_FILL} />
</>);

// Opening hook — a headline card over a timeline, the first seconds marked
export const IconHook = make('IconHook', <>
  <rect x="2.5" y="3.5" width="19" height="12.5" rx="2.2" fill="currentColor" fillOpacity=".1" />
  <path d="M6 8.2h8.5" strokeWidth="2.2" />
  <path d="M6 11.6h5" strokeOpacity=".6" />
  <path d="M2.5 20.5h19" strokeOpacity=".3" />
  <path d="M2.5 20.5h6" strokeWidth="2.4" style={ACCENT} />
  <path d="M8.5 18.6v3.8" strokeOpacity=".8" />
</>);

// ── Voice panel rows ────────────────────────────────────────────────────────
// Sound effects — a waveform, the hit marked
export const IconSound = make('IconSound', <>
  <path d="M3.5 11v2M6.5 9v6M9.5 6.5v11M15.5 8v8M18.5 10v4" strokeWidth="1.8" />
  <path d="M12.5 4v16" strokeWidth="1.8" style={ACCENT} />
</>);

// Captions — a caption pill with the word being said lit
export const IconCaptions = make('IconCaptions', <>
  <rect x="2.5" y="4" width="19" height="16" rx="2.5" strokeOpacity=".45" />
  <rect x="5" y="13.2" width="14" height="3.8" rx="1.9" fill="currentColor" fillOpacity=".14" />
  <rect x="9.2" y="13.2" width="5" height="3.8" rx="1.9" stroke="none" style={ACCENT_FILL} />
</>);

// Outfit — a hanger
export const IconOutfit = make('IconOutfit', <>
  <path d="M12 9V7.8c0-.6.4-1 .9-1.3A2.1 2.1 0 1 0 9.9 4.7" />
  <path d="M12 9 3.4 14.8a1.3 1.3 0 0 0 .7 2.4h15.8a1.3 1.3 0 0 0 .7-2.4z" fill="currentColor" fillOpacity=".12" />
</>);

// Voice — a microphone
export const IconVoice = make('IconVoice', <>
  <rect x="8.5" y="3" width="7" height="11" rx="3.5" fill="currentColor" fillOpacity=".14" />
  <path d="M5 11.5a7 7 0 0 0 14 0" />
  <path d="M12 18.5V21M9 21h6" />
</>);

// Position — a frame with the card's spot marked beside the speaker
export const IconPosition = make('IconPosition', <>
  <rect x="2.5" y="4.5" width="19" height="15" rx="2.2" strokeOpacity=".5" />
  <rect x="13.5" y="7" width="5.5" height="4.5" rx="1" stroke="none" style={ACCENT_FILL} />
  <circle cx="9" cy="12.6" r="1.6" strokeOpacity=".7" />
  <path d="M6 19.5c.3-2 1.5-3.4 3-3.4s2.7 1.4 3 3.4" strokeOpacity=".7" />
</>);

// ── Image + AI actions ──────────────────────────────────────────────────────
export const IconUpload = make('IconUpload', <>
  <rect x="2.5" y="8" width="13" height="11.5" rx="2" fill="currentColor" fillOpacity=".1" />
  <circle cx="7" cy="11.6" r="1.2" />
  <path d="M3 17.3l3.4-3.4 2.8 2.8 1.8-1.8 4.2 4.2" />
  <path d="M19.5 10.5V3.5M16.8 6.2l2.7-2.7 2.7 2.7" style={ACCENT} />
</>);

// Generate with AI — a four-point spark
export const IconGenerate = make('IconGenerate', <>
  <path d="M10 3.5l1.6 4.4a3 3 0 0 0 1.9 1.9L18 11.5l-4.5 1.6a3 3 0 0 0-1.9 1.9L10 19.5l-1.6-4.5a3 3 0 0 0-1.9-1.9L2 11.5l4.5-1.7a3 3 0 0 0 1.9-1.9z" fill="currentColor" fillOpacity=".16" />
  <path d="M18.5 3v3.5M16.75 4.75h3.5M19 16.5v3M17.5 18h3" style={ACCENT} />
</>);

// Fill from this line — the line's words flowing into a card
export const IconFill = make('IconFill', <>
  <path d="M3 6.5h9M3 10h6M3 13.5h7.5" strokeOpacity=".7" />
  <rect x="13" y="12" width="8.5" height="7.5" rx="1.6" fill="currentColor" fillOpacity=".14" />
  <path d="M15.2 15.8h4" strokeWidth="2" />
  <path d="M17 3.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" stroke="none" style={ACCENT_FILL} />
</>);

// Remove visual from line — the picture lifting off its line
export const IconDetach = make('IconDetach', <>
  <rect x="3" y="5" width="13" height="10" rx="2" fill="currentColor" fillOpacity=".1" />
  <path d="M6 12l2.5-2.5 2 2 1.5-1.5 2 2" strokeOpacity=".6" />
  <path d="M15 18.5h6" />
</>);

export const IconAiPortrait = make('IconAiPortrait', <>
  <rect x="2.5" y="4.5" width="14" height="16" rx="2.5" fill="currentColor" fillOpacity=".1" />
  <circle cx="9.5" cy="10.5" r="2.6" />
  <path d="M5 18.5c.6-2.4 2.3-3.8 4.5-3.8s3.9 1.4 4.5 3.8" />
  <path d="M19.5 2.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" stroke="none" style={ACCENT_FILL} />
</>);

export const IconAiScene = make('IconAiScene', <>
  <rect x="2.5" y="6" width="16" height="13" rx="2.2" fill="currentColor" fillOpacity=".1" />
  <path d="M3 16.5l4-4 3 3 2-2 5.5 5.5" />
  <circle cx="13.5" cy="10" r="1.3" />
  <path d="M20 2.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" stroke="none" style={ACCENT_FILL} />
</>);

export const IconRegenerate = make('IconRegenerate', <>
  <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
  <path d="M19.5 4.5V8H16" />
  <path d="M12 9.3l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" stroke="none" style={ACCENT_FILL} />
</>);

// ── Script lines ────────────────────────────────────────────────────────────
export const IconGrip = make('IconGrip', <>
  <path d="M8 9h8M8 12h8M8 15h8" strokeOpacity=".75" />
  <path d="M10 5.6l2-1.8 2 1.8M10 18.4l2 1.8 2-1.8" />
</>);

export const IconAddVisual = make('IconAddVisual', <>
  <rect x="2.5" y="6.5" width="13" height="11" rx="2" fill="currentColor" fillOpacity=".12" />
  <path d="M5.5 14.5l2.5-2.5 2.5 2.5 1.5-1.5 1.5 1.5" strokeOpacity=".6" />
  <path d="M19 3.5v6M16 6.5h6" style={ACCENT} />
</>);

export const IconAddLine = make('IconAddLine', <>
  <path d="M4 7h10M4 11h7" strokeOpacity=".7" />
  <path d="M17 13v7M13.5 16.5h7" style={ACCENT} />
</>);

export const IconRecord = make('IconRecord', <>
  <rect x="6" y="3.5" width="6" height="10" rx="3" fill="currentColor" fillOpacity=".14" />
  <path d="M3.5 11a5.5 5.5 0 0 0 11 0M9 16.5V20" />
  <circle cx="18.5" cy="7" r="2.5" stroke="none" style={REC_FILL} />
</>);

export const IconDeleteLine = make('IconDeleteLine', <>
  <path d="M3 7.5h10M3 11.5h7M3 15.5h8" strokeOpacity=".65" />
  <path d="M15.5 13.5l5 5M20.5 13.5l-5 5" />
</>);

// A recorded take — waveform with a tick
export const IconRecorded = make('IconRecorded', <>
  <path d="M3 11v2M6 8.5v7M9 10v4M12 7v10" strokeWidth="1.8" />
  <path d="M15 15.5l2.2 2.2 4.3-4.7" style={ACCENT} />
</>);

export const IconImportChat = make('IconImportChat', <>
  <path d="M4 4.5h16A1.5 1.5 0 0 1 21.5 6v8.5A1.5 1.5 0 0 1 20 16h-9.5l-5 4v-4H4A1.5 1.5 0 0 1 2.5 14.5V6A1.5 1.5 0 0 1 4 4.5z" fill="currentColor" fillOpacity=".12" />
  <path d="M12 7.5v5M9.8 10.5l2.2 2.2 2.2-2.2" style={ACCENT} />
</>);

// Script modes — AI write · Edit lines · Sources
export const IconAiWrite = make('IconAiWrite', <>
  <path d="M4 20l1-4.2L15.6 5.2a1.8 1.8 0 0 1 2.5 0l.7.7a1.8 1.8 0 0 1 0 2.5L8.2 19 4 20z" fill="currentColor" fillOpacity=".12" />
  <path d="M13.8 7l3.2 3.2" strokeOpacity=".7" />
  <path d="M19.5 14.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" stroke="none" style={ACCENT_FILL} />
</>);

export const IconLines = make('IconLines', <>
  <circle cx="4.5" cy="7" r="1.3" fill="currentColor" stroke="none" />
  <circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" fillOpacity=".55" />
  <circle cx="4.5" cy="17" r="1.3" fill="currentColor" stroke="none" />
  <path d="M8.5 7h11M8.5 12h8M8.5 17h10" />
  <path d="M8.5 12h4" style={ACCENT} />
</>);

export const IconSources = make('IconSources', <>
  <path d="M7 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z" fill="currentColor" fillOpacity=".1" />
  <path d="M15 3.5V7.5h4" strokeOpacity=".6" />
  <path d="M8.5 11h7M8.5 14h5" strokeOpacity=".7" />
  <path d="M8.5 17h3" strokeWidth="2.2" style={ACCENT} />
</>);

// ── Studio-wide ─────────────────────────────────────────────────────────────
export const IconPodMic = make('IconPodMic', <>
  <rect x="8.5" y="3" width="7" height="10" rx="3.5" fill="currentColor" fillOpacity=".14" />
  <path d="M10.8 6.5h2.4M10.8 9h2.4" strokeOpacity=".6" />
  <path d="M6 10.5a6 6 0 0 0 12 0M12 16.5V20M8 20.5h8" />
</>);

// Open conversation — two speakers trading lines
export const IconConversation = make('IconConversation', <>
  <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h9A1.5 1.5 0 0 1 15 5.5v5a1.5 1.5 0 0 1-1.5 1.5H8l-3.5 3v-3A1.5 1.5 0 0 1 3 10.5z" fill="currentColor" fillOpacity=".12" />
  <path d="M18 9h1.5A1.5 1.5 0 0 1 21 10.5v5a1.5 1.5 0 0 1-1.5 1.5V20l-3.5-3h-4.5A1.5 1.5 0 0 1 10 15.5V15" style={ACCENT} />
</>);

export const IconEpisode = make('IconEpisode', <>
  <rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="currentColor" fillOpacity=".1" />
  <path d="M2.5 9h3M2.5 15h3M18.5 9h3M18.5 15h3" strokeOpacity=".5" />
  <path d="M10.5 9.5v5l4-2.5z" fill="currentColor" />
</>);

export const IconPerson = make('IconPerson', <>
  <circle cx="12" cy="8" r="3.5" fill="currentColor" fillOpacity=".14" />
  <path d="M5 20.5c.8-3.8 3.6-6 7-6s6.2 2.2 7 6" />
</>);

export const IconBin = make('IconBin', <>
  <path d="M6.5 7l.8 11.6a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" fill="currentColor" fillOpacity=".12" />
  <path d="M4.5 7h15M9.5 7V5.2c0-.4.3-.7.7-.7h3.6c.4 0 .7.3.7.7V7" />
  <path d="M10.3 11v5M13.7 11v5" strokeOpacity=".6" />
</>);

export const IconDownload = make('IconDownload', <>
  <path d="M4 14.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  <path d="M12 4v10.5M8.2 10.8 12 14.5l3.8-3.7" style={ACCENT} />
</>);

export const IconAlert = make('IconAlert', <>
  <path d="M10.3 4.2 2.6 17.5a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" fill="currentColor" fillOpacity=".12" />
  <path d="M12 9.5v4.2" />
  <path d="M12 17h.01" strokeWidth="2.6" />
</>);

export const IconEdited = make('IconEdited', <>
  <path d="M4 20l1-4.2L15.6 5.2a1.8 1.8 0 0 1 2.5 0l.7.7a1.8 1.8 0 0 1 0 2.5L8.2 19 4 20z" />
</>);

export const IconQuote = make('IconQuote', <>
  <path d="M5 17.5c2.5-1 4-3.2 4-6.5V7.5H4.5V12H8" fill="currentColor" fillOpacity=".14" />
  <path d="M14 17.5c2.5-1 4-3.2 4-6.5V7.5h-4.5V12H17" fill="currentColor" fillOpacity=".14" />
</>);

// ── UI primitives ───────────────────────────────────────────────────────────
export const IconCheck = make('IconCheck', <path d="M5 12.5l4.2 4.2L19 7" />);
export const IconClose = make('IconClose', <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />);
export const IconPlus = make('IconPlus', <path d="M12 5v14M5 12h14" />);
export const IconChevronRight = make('IconChevronRight', <path d="M9.5 6l6 6-6 6" />);
export const IconChevronLeft = make('IconChevronLeft', <path d="M14.5 6l-6 6 6 6" />);
export const IconChevronDown = make('IconChevronDown', <path d="M6 9.5l6 6 6-6" />);
export const IconArrowRight = make('IconArrowRight', <path d="M4.5 12h15M13.5 6l6 6-6 6" />);
export const IconPlay = make('IconPlay', <path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.8-6.2a.8.8 0 0 0 0-1.4L9.2 5.1a.8.8 0 0 0-1.2.7z" fill="currentColor" />);
export const IconStop = make('IconStop', <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />);
export const IconReplay = make('IconReplay', <>
  <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
  <path d="M4.5 4.5V8H8" />
</>);
export const IconLoader = make('IconLoader', <>
  <circle cx="12" cy="12" r="8.5" strokeOpacity=".22" />
  <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" />
</>);
