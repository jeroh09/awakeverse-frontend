// src/components/launcher/CreationModeTiles.jsx
// Desktop ChatLauncher discovery tiles (e.g. Podcast Studio & Film) so new users
// see the platform's creation modes without opening the sidebar.
//
// Format-flexible + defensive:
//   • Each tile takes media = { webp?, png? }. A <picture> prefers webp and falls
//     back to png, so you can ship png now and swap to webp later (or provide both)
//     with zero code changes — just change the file/paths.
//   • If the image is missing/404s, onError hides it and the tile shows its matte
//     `fallbackGradient` instead — never a broken image box.
//   • A matte overlay + grain sit above the image so it stays ingrained and the
//     text stays legible.
//   • onClick defaults to a no-op, so a missing handler can't throw.
import React, { useState } from 'react';
import theme from '../../design-system/tokens';

const noop = () => {};

const BUILTIN_ICONS = {
  studio: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  ),
  film: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <line x1="8" y1="6" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="18" />
      <line x1="3" y1="10" x2="8" y2="10" />
      <line x1="16" y1="10" x2="21" y2="10" />
    </svg>
  )
};

const GRAIN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const OVERLAY = 'linear-gradient(180deg, rgba(10,15,26,0.35) 0%, rgba(10,15,26,0.9) 100%)';
const DEFAULT_FALLBACK = 'radial-gradient(120% 90% at 70% 8%, rgba(99,102,241,0.5), transparent 55%), #0d1424';

function Tile({ tile }) {
  const [imgOk, setImgOk] = useState(true);
  const media = tile?.media || {};
  const hasImg = !!(media.webp || media.png) && imgOk;
  const icon = typeof tile.icon === 'string' ? BUILTIN_ICONS[tile.icon] : tile.icon;

  const hover = (e, on) => {
    e.currentTarget.style.transform = on ? 'translateY(-3px)' : 'translateY(0)';
    e.currentTarget.style.borderColor = on ? theme.colors.accent.primary : theme.colors.border.medium;
    e.currentTarget.style.boxShadow = on ? '0 12px 28px -12px rgba(99,102,241,0.55)' : 'none';
  };

  return (
    <button
      type="button"
      onClick={typeof tile.onClick === 'function' ? tile.onClick : noop}
      aria-label={tile.title}
      onMouseEnter={(e) => hover(e, true)}
      onMouseLeave={(e) => hover(e, false)}
      onFocus={(e) => hover(e, true)}
      onBlur={(e) => hover(e, false)}
      style={{
        position: 'relative',
        textAlign: 'left',
        minHeight: 'clamp(120px, 17vh, 150px)',
        padding: '14px',
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border.medium}`,
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        outline: 'none',
        transition: theme.transitions.fast,
        // fallback gradient lives on the tile itself (z-0). Shows if no/failed image.
        background: tile.fallbackGradient || DEFAULT_FALLBACK,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* image layer (webp preferred, png fallback); hidden on error */}
      {hasImg && (
        <picture>
          {media.webp && <source srcSet={media.webp} type="image/webp" />}
          {media.png && <source srcSet={media.png} type="image/png" />}
          <img
            src={media.png || media.webp}
            alt=""
            aria-hidden="true"
            onError={() => setImgOk(false)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          />
        </picture>
      )}
      {/* matte legibility overlay */}
      <span aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 1, background: OVERLAY }} />
      {/* grain keeps it matte */}
      <span aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        opacity: 0.12, mixBlendMode: 'overlay', backgroundImage: `url("${GRAIN_URI}")`
      }} />

      {tile.badge && (
        <span style={{
          position: 'absolute', top: 10, right: 10, zIndex: 3,
          fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px', color: '#fff',
          background: `linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.hover})`,
          borderRadius: theme.borderRadius.full, padding: '2px 7px',
          boxShadow: '0 2px 8px rgba(99,102,241,0.5)'
        }}>{tile.badge}</span>
      )}

      {icon && (
        <span style={{
          position: 'absolute', top: 12, left: 12, zIndex: 3,
          width: 32, height: 32, borderRadius: theme.borderRadius.sm,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', background: 'rgba(10,15,26,0.55)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.14)'
        }}>{icon}</span>
      )}

      <span style={{
        position: 'relative', zIndex: 2,
        fontFamily: theme.typography.fonts.display, fontWeight: 700, fontSize: '15px',
        color: '#fff', marginBottom: '3px', textShadow: '0 1px 3px rgba(0,0,0,0.8)'
      }}>{tile.title}</span>
      {tile.desc && (
        <span style={{
          position: 'relative', zIndex: 2, fontSize: '11px', lineHeight: 1.4,
          color: 'rgba(241,245,249,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.8)'
        }}>{tile.desc}</span>
      )}
    </button>
  );
}

export default function CreationModeTiles({ tiles = [], heading }) {
  if (!Array.isArray(tiles) || tiles.length === 0) return null;
  return (
    <div style={{ width: '100%', maxWidth: '420px', flexShrink: 0, marginTop: theme.spacing.lg }}>
      {heading && (
        <div style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: theme.colors.text.tertiary,
          paddingBottom: '0.4rem',
          marginBottom: '0.65rem',
          borderBottom: '1px solid rgba(99,102,241,0.15)'
        }}>{heading}</div>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(tiles.length, 2)}, 1fr)`,
        gap: '12px'
      }}>
        {tiles.map((t) => <Tile key={t.key || t.title} tile={t} />)}
      </div>
    </div>
  );
}