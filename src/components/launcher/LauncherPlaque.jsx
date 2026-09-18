// src/components/launcher/LauncherPlaque.jsx
// Engraved "oracle plaque" wrapper for the desktop ChatLauncher left column.
// Presentational only — it renders the matte colour burst, grain, vignette,
// etched inner frame and corner ticks, then drops its `children` on top.
//
// Defensive by design:
//   • overflow is VISIBLE so an absolutely-positioned search dropdown inside
//     `children` is never clipped by the plaque.
//   • decorative layers self-clip via matching border-radius.
//   • if the grain data-URI ever fails to paint, that layer is simply invisible
//     and the plaque falls back to its flat matte gradient — no broken box.
import React from 'react';
import theme from '../../design-system/tokens';

// Matte grain (feTurbulence noise) as an inline data-URI — no network, no asset.
const GRAIN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

// Aurora core + Nebula corner pools, over a flat matte base.
const BURST_BG = [
  'radial-gradient(72% 62% at 22% 14%, rgba(99,102,241,0.30), transparent 55%)',   // indigo core (aurora)
  'radial-gradient(58% 54% at 88% 30%, rgba(59,130,246,0.20), transparent 55%)',   // blue
  'radial-gradient(64% 60% at 60% 90%, rgba(129,140,248,0.20), transparent 55%)',  // violet
  'radial-gradient(46% 44% at 92% 86%, rgba(245,158,11,0.10), transparent 60%)',   // faint ember (nebula corner)
  'radial-gradient(44% 42% at 8% 90%, rgba(16,185,129,0.10), transparent 55%)',    // faint emerald (nebula corner)
  'linear-gradient(180deg,#121a2e,#0e1524)'                                        // matte base
].join(',');

const TICK_POS = {
  tl: { top: 14, left: 14, borderWidth: '1px 0 0 1px' },
  tr: { top: 14, right: 14, borderWidth: '1px 1px 0 0' },
  bl: { bottom: 14, left: 14, borderWidth: '0 0 1px 1px' },
  br: { bottom: 14, right: 14, borderWidth: '0 1px 1px 0' }
};

const Tick = ({ pos }) => (
  <span
    aria-hidden
    style={{
      position: 'absolute',
      width: '10px',
      height: '10px',
      zIndex: 3,
      pointerEvents: 'none',
      borderColor: theme.colors.accent.primary,
      borderStyle: 'solid',
      opacity: 0.5,
      ...TICK_POS[pos]
    }}
  />
);

export default function LauncherPlaque({ children, style }) {
  const radius = theme.borderRadius.md;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        borderRadius: radius,
        overflow: 'visible', // keep an inner search dropdown from being clipped
        padding: '34px 30px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: BURST_BG,
        boxShadow:
          'inset 0 0 0 1px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(148,163,184,0.05), 0 1px 0 rgba(148,163,184,0.05)',
        ...style
      }}
    >
      {/* readability vignette (self-clips via radius) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          borderRadius: radius,
          background:
            'radial-gradient(75% 60% at 50% 42%, transparent 40%, rgba(8,12,22,0.45))'
        }}
      />
      {/* matte grain over the colour (self-clips; invisible if the URI fails) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          borderRadius: radius,
          opacity: 0.1,
          mixBlendMode: 'overlay',
          backgroundImage: `url("${GRAIN_URI}")`
        }}
      />
      {/* etched inner frame (sits in the padding zone, under content) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: '10px',
          zIndex: 1,
          pointerEvents: 'none',
          borderRadius: '8px',
          border: '1px solid rgba(148,163,184,0.10)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.4)'
        }}
      />
      <Tick pos="tl" />
      <Tick pos="tr" />
      <Tick pos="bl" />
      <Tick pos="br" />

      {/* content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {children}
      </div>
    </div>
  );
}