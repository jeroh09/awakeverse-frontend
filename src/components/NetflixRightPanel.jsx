// src/components/NetflixRightPanel.jsx
// Netflix-style panel — vertical scroll, one horizontal row per category
// isMobile prop: same layout on mobile and desktop, different card sizes
// Design: AwakeVerse tokens (Night Blue / Indigo / Ivory), no Lucide icons

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import theme from '../design-system/tokens';
import PublishToHubButton from './CreatorHub/PublishToHubButton';
import DefensiveCharacterCreationWrapper from './DefensiveCharacterCreationWrapper';

// ─── Card dimensions ──────────────────────────────────────────
// One size for ALL categories — My Characters set the bar
const CARD_W  = (isMobile) => isMobile ? 148 : 172;
const CARD_H  = (isMobile) => isMobile ? 216 : 252; // extra height for description
const GAP     = '0.75rem';

// ─── Poster Card ──────────────────────────────────────────────
// Image fills card background, gradient overlay, name at bottom
// Double border: inner border + outer box-shadow ring
// Used by every category
function PosterCard({ character, onClick, isSelected, isMobile }) {
  const [hovered,   setHovered]   = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const active  = isSelected || hovered;
  const initial = (character.name || 'C').charAt(0).toUpperCase();
  const W = CARD_W(isMobile);
  const H = CARD_H(isMobile);

  return (
    <div
      onClick={() => onClick?.(character)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:     W,
        height:    H,
        flexShrink: 0,
        position:  'relative',
        borderRadius: theme.borderRadius.md,
        overflow:  'hidden',
        cursor:    'pointer',
        transition: theme.transitions.normal,
        transform: hovered
          ? 'translateY(-5px) scale(1.025)'
          : 'translateY(0) scale(1)',
        // ── Double border ─────────────────────────────────
        border: `1.5px solid ${active
          ? theme.colors.accent.primary
          : 'rgba(99,102,241,0.35)'}`,
        boxShadow: active
          ? `0 0 0 3px rgba(99,102,241,0.20), 0 14px 30px rgba(10,15,26,0.75)`
          : `0 0 0 3px rgba(99,102,241,0.07), 0 4px 14px rgba(10,15,26,0.55)`
      }}
    >
      {/* ── Background ── */}
      {character.thumbnailUrl && !imgFailed ? (
        <img
          src={character.thumbnailUrl}
          alt={character.name}
          onError={() => setImgFailed(true)}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            display: 'block', pointerEvents: 'none'
          }}
        />
      ) : (
        /* Gradient fallback with large initial */
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(155deg,
            rgba(99,102,241,0.22) 0%,
            rgba(10,15,26,0.97) 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontFamily: theme.typography.fonts.display,
            fontSize: Math.floor(H * 0.28),
            fontWeight: 800,
            color: `${theme.colors.accent.primary}50`,
            userSelect: 'none', lineHeight: 1
          }}>
            {initial}
          </span>
        </div>
      )}

      {/* ── Bottom gradient overlay — taller to cover name + description ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'linear-gradient(to bottom, transparent 25%, rgba(10,15,26,0.72) 55%, rgba(10,15,26,0.96) 78%, rgba(10,15,26,1) 100%)',
        pointerEvents: 'none'
      }} />

      {/* ── Hover indigo tint ── */}
      {active && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(99,102,241,0.08)',
          pointerEvents: 'none'
        }} />
      )}

      {/* ── Name + description ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '0.5rem 0.6rem 0.45rem' : '0.55rem 0.65rem 0.5rem',
        pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', gap: '0.2rem'
      }}>
        {/* Name — display font (Syne) */}
        <span style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: isMobile ? '0.7rem' : '0.76rem',
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.brand.ivory,
          lineHeight: 1.2,
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          letterSpacing: '0.2px'
        }}>
          {character.name}
        </span>
        {/* Description — body font (Inter) */}
        {character.description && (
          <span style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: isMobile ? '0.58rem' : '0.62rem',
            fontWeight: 400,
            color: `${theme.colors.brand.ivory}99`,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {character.description}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── My Characters card ───────────────────────────────────────
// Poster + status badge overlaid + publish button BELOW (outside overflow:hidden)
function MyCharacterCard({ character, onClick, onPublishToggle, isMobile }) {
  const STATUS = {
    pending:  { color: '#FFA500', label: '⏳ Pending'  },
    rejected: { color: '#ff6b6b', label: '❌ Rejected'  },
    approved: { color: '#00C864', label: '✓ Ready'      }
  };
  const s         = STATUS[character.status] || STATUS.approved;
  const showBadge = character.status && character.status !== 'approved';
  const W         = CARD_W(isMobile);

  return (
    <div style={{
      width: W, flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: '0.35rem'
    }}>
      {/* Poster + badge wrapper */}
      <div style={{ position: 'relative', width: W }}>
        <PosterCard
          character={character}
          onClick={onClick}
          isMobile={isMobile}
        />
        {showBadge && (
          <div style={{
            position: 'absolute', top: 8, right: 8, zIndex: 5,
            background: `${s.color}1c`,
            border: `1px solid ${s.color}99`,
            borderRadius: '5px',
            color: s.color,
            fontSize: '0.57rem', fontWeight: 700,
            padding: '2px 6px',
            fontFamily: theme.typography.fonts.body,
            letterSpacing: '0.03em', whiteSpace: 'nowrap',
            backdropFilter: 'blur(6px)'
          }}>
            {s.label}
          </div>
        )}
      </div>

      {/* Publish button — outside poster so overflow:hidden doesn't clip it */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', pointerEvents: 'auto' }}
      >
        <PublishToHubButton
          character={{
            id:                 character.id,
            character_key:      character.key,
            display_name:       character.name,
            status:             character.status,
            is_market_featured: character.is_market_featured
          }}
          onPublishSuccess={(u) => onPublishToggle?.(u)}
          onPublishError={(err) => console.error('Publish error:', err)}
        />
      </div>
    </div>
  );
}

// ─── Empty My Characters — three-panel design ────────────────
// Card 1: "your IP." mark + title + description
// Card 2: CTA — click to start creating
// Card 3: ghost — awaiting creation
function MyCharactersEmpty({ onCreateCharacter, user_id, onShowUpgradeModal, isMobile }) {
  const [ctaHovered,   setCtaHovered]   = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const W = CARD_W(isMobile);
  const H = CARD_H(isMobile);

  const handleUpgradePrompt = () => {
    setLimitReached(true);
    onShowUpgradeModal?.('character_limit');
  };

  // Shared card shell style — double border, same as PosterCard
  const cardShell = (extra = {}) => ({
    width: W, height: H, flexShrink: 0,
    borderRadius: theme.borderRadius.md,
    border: `1.5px solid rgba(99,102,241,0.35)`,
    boxShadow: `0 0 0 3px rgba(99,102,241,0.07), 0 4px 14px rgba(10,15,26,0.55)`,
    background: theme.colors.background.surface,
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', justifyContent: 'flex-end',
    padding: '1rem 0.85rem 0.85rem',
    position: 'relative', overflow: 'hidden',
    ...extra
  });

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>

      {/* ── Card 1: your IP. + description ───────────────── */}
      <div style={cardShell()}>
        {/* Subtle indigo radial glow top-left */}
        <div style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '130%', height: '70%',
          background: `radial-gradient(ellipse at top left,
            rgba(99,102,241,0.14) 0%,
            transparent 70%)`,
          pointerEvents: 'none'
        }} />

        {/* "your IP." mark */}
        <div style={{
          position: 'absolute', top: '1rem', left: '0.85rem',
          display: 'inline-flex', flexDirection: 'column',
          alignItems: 'flex-start', gap: isMobile ? '6px' : '8px'
        }}>
          <span aria-hidden="true" style={{
            lineHeight: 1, letterSpacing: '0.5px',
            fontSize: isMobile ? '26px' : '32px',
            userSelect: 'none', whiteSpace: 'nowrap',
            fontFamily: theme.typography.fonts.display
          }}>
            <span style={{ color: theme.colors.accent.primary }}>y</span>
            <span style={{ color: theme.colors.brand.ivory }}>our </span>
            <span style={{ color: theme.colors.accent.primary }}>I</span>
            <span style={{ color: theme.colors.brand.ivory }}>P</span>
            <span style={{ color: theme.colors.accent.primary }}>.</span>
          </span>
          {/* Indigo → Ivory taper underline */}
          <span aria-hidden="true" style={{
            height: isMobile ? '2px' : '3px',
            width: isMobile ? '90px' : '112px',
            borderRadius: '999px',
            background: `linear-gradient(90deg,
              ${theme.colors.accent.primary} 0%,
              ${theme.colors.brand.ivory} 85%)`,
            opacity: 0.9,
            clipPath: 'polygon(0 0, 100% 35%, 100% 65%, 0 100%)',
            display: 'block'
          }} />
        </div>

        {/* Text at bottom */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontFamily: theme.typography.fonts.display,
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.text.primary,
            margin: '0 0 0.3rem 0',
            lineHeight: 1.3
          }}>
            Create Your Own Character
          </p>
          <p style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: isMobile ? '0.62rem' : '0.66rem',
            color: theme.colors.text.secondary,
            margin: 0, lineHeight: 1.45
          }}>
            Design a custom AI character with unique personality &amp; expertise.
          </p>
        </div>
      </div>

      {/* ── Card 2: CTA — create or upgrade depending on limit ── */}
      <DefensiveCharacterCreationWrapper
        user_id={user_id}
        onUpgradePrompt={handleUpgradePrompt}
      >
        {limitReached ? (
          /* ── Limit reached state ── */
          <div
            onClick={() => onShowUpgradeModal?.('character_limit')}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            style={{
              ...cardShell(),
              cursor: 'pointer',
              border: `1.5px solid ${ctaHovered ? '#FFA500' : 'rgba(255,165,0,0.45)'}`,
              boxShadow: ctaHovered
                ? `0 0 0 3px rgba(255,165,0,0.18), 0 14px 30px rgba(10,15,26,0.75)`
                : `0 0 0 3px rgba(255,165,0,0.07), 0 4px 14px rgba(10,15,26,0.55)`,
              background: ctaHovered
                ? 'rgba(255,165,0,0.07)'
                : theme.colors.background.surface,
              transform: ctaHovered ? 'translateY(-5px) scale(1.025)' : 'none',
              transition: theme.transitions.normal,
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: '0.65rem', flexDirection: 'column'
            }}
          >
            {/* Lock icon — SVG */}
            <div style={{
              width: isMobile ? 36 : 44, height: isMobile ? 36 : 44,
              borderRadius: '50%',
              background: ctaHovered
                ? 'rgba(255,165,0,0.18)'
                : 'rgba(255,165,0,0.10)',
              border: `1.5px solid ${ctaHovered ? '#FFA500' : 'rgba(255,165,0,0.4)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: theme.transitions.normal, flexShrink: 0
            }}>
              <svg width={isMobile ? 15 : 18} height={isMobile ? 15 : 18} viewBox="0 0 18 18" fill="none">
                <rect x="3" y="8" width="12" height="9" rx="2"
                  stroke="#FFA500" strokeWidth="1.6"/>
                <path d="M6 8V5.5a3 3 0 016 0V8"
                  stroke="#FFA500" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="9" cy="13" r="1.2" fill="#FFA500"/>
              </svg>
            </div>

            <div>
              <p style={{
                fontFamily: theme.typography.fonts.display,
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                fontWeight: theme.typography.weights.bold,
                color: '#FFA500',
                margin: '0 0 0.2rem 0'
              }}>
                Limit Reached
              </p>
              <p style={{
                fontFamily: theme.typography.fonts.body,
                fontSize: isMobile ? '0.6rem' : '0.64rem',
                color: 'rgba(255,165,0,0.7)',
                margin: 0
              }}>
                Tap to upgrade
              </p>
            </div>
          </div>
        ) : (
          /* ── Default: start creating ── */
          <div
            onClick={onCreateCharacter}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            style={{
              ...cardShell(),
              cursor: 'pointer',
              border: `1.5px solid ${ctaHovered
                ? theme.colors.accent.primary
                : 'rgba(99,102,241,0.45)'}`,
              boxShadow: ctaHovered
                ? `0 0 0 3px rgba(99,102,241,0.20), 0 14px 30px rgba(10,15,26,0.75)`
                : `0 0 0 3px rgba(99,102,241,0.07), 0 4px 14px rgba(10,15,26,0.55)`,
              background: ctaHovered
                ? 'rgba(99,102,241,0.09)'
                : theme.colors.background.surface,
              transform: ctaHovered ? 'translateY(-5px) scale(1.025)' : 'none',
              transition: theme.transitions.normal,
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: '0.65rem', flexDirection: 'column'
            }}
          >
            {/* Plus icon — SVG */}
            <div style={{
              width: isMobile ? 36 : 44, height: isMobile ? 36 : 44,
              borderRadius: '50%',
              background: ctaHovered
                ? `linear-gradient(135deg, ${theme.colors.accent.primary}, #4f46e5)`
                : 'rgba(99,102,241,0.14)',
              border: `1.5px solid ${ctaHovered
                ? theme.colors.accent.primary
                : 'rgba(99,102,241,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: theme.transitions.normal, flexShrink: 0
            }}>
              <svg width={isMobile ? 16 : 20} height={isMobile ? 16 : 20} viewBox="0 0 20 20" fill="none">
                <line x1="10" y1="3" x2="10" y2="17"
                  stroke={ctaHovered ? '#fff' : theme.colors.accent.primary}
                  strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="10" x2="17" y2="10"
                  stroke={ctaHovered ? '#fff' : theme.colors.accent.primary}
                  strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>

            <div>
              <p style={{
                fontFamily: theme.typography.fonts.display,
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                fontWeight: theme.typography.weights.bold,
                color: ctaHovered ? theme.colors.text.primary : theme.colors.text.secondary,
                margin: '0 0 0.2rem 0',
                transition: theme.transitions.normal
              }}>
                Start Creating
              </p>
              <p style={{
                fontFamily: theme.typography.fonts.body,
                fontSize: isMobile ? '0.6rem' : '0.64rem',
                color: theme.colors.text.secondary,
                margin: 0
              }}>
                Click to begin
              </p>
            </div>
          </div>
        )}
      </DefensiveCharacterCreationWrapper>

      {/* ── Card 3: ghost — awaiting creation ─────────────── */}
      <div style={{
        ...cardShell(),
        border: '1px dashed rgba(99,102,241,0.2)',
        boxShadow: '0 0 0 3px rgba(99,102,241,0.03)',
        background: 'rgba(99,102,241,0.025)',
        alignItems: 'center', justifyContent: 'center',
        opacity: 0.55
      }}>
        <div style={{ textAlign: 'center' }}>
          {/* Ghost avatar circle */}
          <div style={{
            width: isMobile ? 36 : 44, height: isMobile ? 36 : 44,
            borderRadius: '50%',
            border: '1px dashed rgba(99,102,241,0.35)',
            margin: '0 auto 0.6rem',
            background: 'rgba(99,102,241,0.06)'
          }} />
          <p style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: isMobile ? '0.6rem' : '0.64rem',
            color: theme.colors.text.secondary,
            margin: 0, lineHeight: 1.4
          }}>
            Awaiting<br />creation
          </p>
        </div>
      </div>

    </div>
  );
}

// ─── Category Row ─────────────────────────────────────────────
const CategoryRow = React.forwardRef(function CategoryRow(
  { category, onCharacterSelect, selectedChar, onCreateCharacter,
    onCharacterPublishToggle, user_id, onShowUpgradeModal,
    charactersLoading, charactersError, isMobile },
  ref
) {
  const isMyChars = category.key === 'my_characters';
  const chars     = category.characters || [];
  const stripRef  = useRef(null);
  const [limitReached, setLimitReached] = useState(false);

  // ── Drag-to-scroll ──────────────────────────────────────────
  const drag = useRef({ on: false, startX: 0, sl: 0 });
  const startDrag = (e) => {
    if (!stripRef.current) return;
    drag.current = {
      on: true,
      startX: e.pageX - stripRef.current.offsetLeft,
      sl: stripRef.current.scrollLeft
    };
    stripRef.current.style.cursor = 'grabbing';
  };
  const endDrag = () => {
    drag.current.on = false;
    if (stripRef.current) stripRef.current.style.cursor = 'grab';
  };
  const moveDrag = (e) => {
    if (!drag.current.on || !stripRef.current) return;
    e.preventDefault();
    const x = e.pageX - stripRef.current.offsetLeft;
    stripRef.current.scrollLeft = drag.current.sl - (x - drag.current.startX) * 1.2;
  };

  const showStrip = !isMyChars ||
    (!charactersLoading && !charactersError && chars.length > 0);

  return (
    <div ref={ref} style={{ marginBottom: '2rem' }}>

      {/* ── Row header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: '0.7rem'
      }}>
        {category.icon && (
          <span style={{ fontSize: '0.9rem', lineHeight: 1, flexShrink: 0 }}>
            {category.icon}
          </span>
        )}
        <span style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: theme.typography.sizes.body,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          letterSpacing: '0.2px'
        }}>
          {category.title}
        </span>
        {/* Character count pill */}
        <span style={{
          background: `${theme.colors.accent.primary}18`,
          border: `1px solid ${theme.colors.accent.primary}2e`,
          borderRadius: '999px',
          color: theme.colors.accent.primary,
          fontSize: '0.6rem', fontWeight: 700,
          padding: '0.1rem 0.45rem',
          fontFamily: theme.typography.fonts.body
        }}>
          {chars.length}
        </span>

        {/* + New / Limit Reached — My Characters row header, has chars */}
        {isMyChars && chars.length > 0 && (
          limitReached ? (
            /* Limit badge — inline in header */
            <button
              onClick={() => onShowUpgradeModal?.('character_limit')}
              style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: 'rgba(255,165,0,0.08)',
                border: '1px solid rgba(255,165,0,0.45)',
                borderRadius: theme.borderRadius.sm,
                color: '#FFA500',
                fontSize: '0.68rem', fontWeight: 700,
                fontFamily: theme.typography.fonts.body,
                padding: '0.2rem 0.65rem',
                cursor: 'pointer',
                transition: theme.transitions.normal
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,165,0,0.14)';
                e.currentTarget.style.borderColor = '#FFA500';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,165,0,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,165,0,0.45)';
              }}
            >
              {/* Lock SVG */}
              <svg width="10" height="10" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="8" width="12" height="9" rx="2"
                  stroke="#FFA500" strokeWidth="1.8"/>
                <path d="M6 8V5.5a3 3 0 016 0V8"
                  stroke="#FFA500" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Limit reached · Upgrade ↗
            </button>
          ) : (
            /* + New button */
            <DefensiveCharacterCreationWrapper
              user_id={user_id}
              onUpgradePrompt={() => {
                setLimitReached(true);
                onShowUpgradeModal?.('character_limit');
              }}
            >
              <button
                onClick={onCreateCharacter}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: `1px solid ${theme.colors.accent.primary}50`,
                  borderRadius: theme.borderRadius.sm,
                  color: theme.colors.accent.primary,
                  fontSize: '0.68rem', fontWeight: 600,
                  fontFamily: theme.typography.fonts.body,
                  padding: '0.2rem 0.65rem',
                  cursor: 'pointer',
                  transition: theme.transitions.normal
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${theme.colors.accent.primary}14`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                + New
              </button>
            </DefensiveCharacterCreationWrapper>
          )
        )}
      </div>

      {/* ── Loading (My Characters only) ── */}
      {isMyChars && charactersLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.65rem',
          padding: '0.4rem 0'
        }}>
          <div style={{
            width: 18, height: 18, flexShrink: 0,
            border: `2px solid ${theme.colors.border.medium}`,
            borderTop: `2px solid ${theme.colors.accent.primary}`,
            borderRadius: '50%',
            animation: 'nrp-spin 0.8s linear infinite'
          }} />
          <span style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.bodySmall,
            color: theme.colors.text.secondary
          }}>
            Loading your characters…
          </span>
        </div>
      )}

      {/* ── Error (My Characters only) ── */}
      {isMyChars && !charactersLoading && charactersError && (
        <div style={{
          padding: '0.5rem 0.75rem',
          background: 'rgba(255,107,107,0.07)',
          border: '1px solid rgba(255,107,107,0.2)',
          borderRadius: theme.borderRadius.sm,
          color: '#ff6b6b',
          fontSize: theme.typography.sizes.bodySmall,
          fontFamily: theme.typography.fonts.body
        }}>
          {charactersError}
        </div>
      )}

      {/* ── Empty My Characters — "your IP." design ── */}
      {isMyChars && !charactersLoading && !charactersError && chars.length === 0 && (
        <MyCharactersEmpty
          onCreateCharacter={onCreateCharacter}
          user_id={user_id}
          onShowUpgradeModal={onShowUpgradeModal}
          isMobile={isMobile}
        />
      )}

      {/* ── Horizontal scroll strip ── */}
      {showStrip && (
        <div
          ref={stripRef}
          onMouseDown={startDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onMouseMove={moveDrag}
          style={{
            display: 'flex',
            gap: GAP,
            overflowX: 'auto',
            overflowY: 'visible',    // allow card lift on hover
            paddingBottom: '0.65rem',
            paddingTop: '0.2rem',
            paddingRight: '2rem',    // trailing space — prevents right-edge clip
            cursor: 'grab',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {chars.map((character, idx) =>
            isMyChars ? (
              <MyCharacterCard
                key={character.key || character.id || idx}
                character={character}
                onClick={onCharacterSelect}
                onPublishToggle={onCharacterPublishToggle}
                isMobile={isMobile}
              />
            ) : (
              <PosterCard
                key={character.key || idx}
                character={character}
                onClick={onCharacterSelect}
                isSelected={selectedChar?.key === character.key}
                isMobile={isMobile}
              />
            )
          )}

          {/* Empty category placeholder */}
          {chars.length === 0 && !isMyChars && (
            <div style={{
              width: CARD_W(isMobile),
              height: CARD_H(isMobile),
              flexShrink: 0,
              background: 'rgba(99,102,241,0.04)',
              border: '1px dashed rgba(99,102,241,0.2)',
              boxShadow: '0 0 0 3px rgba(99,102,241,0.03)',
              borderRadius: theme.borderRadius.md,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{
                color: theme.colors.text.secondary, fontSize: '0.7rem',
                fontFamily: theme.typography.fonts.body
              }}>
                Coming soon
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Main panel ───────────────────────────────────────────────
const NetflixRightPanel = ({
  categories            = [],
  onCharacterSelect,
  onCreateCharacter,
  selectedChar,
  userCharacters        = [],
  charactersLoading     = false,
  charactersError       = null,
  onCharacterPublishToggle,
  user_id,
  onShowUpgradeModal,
  isMobile              = false
}) => {
  const containerRef = useRef(null);
  const rowRefs      = useRef([]);
  // null = at top (show only static title), object = scrolled (show category sub-label)
  const [activeCategory, setActiveCategory] = useState(null);

  // My Characters pinned first, rest in original order
  const sortedCategories = useMemo(() => {
    const myChars = categories.find(c => c.key === 'my_characters');
    const rest    = categories.filter(c => c.key !== 'my_characters');
    return myChars ? [myChars, ...rest] : categories;
  }, [categories]);

  // Update sticky sub-label as user scrolls
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const top = el.scrollTop;

    if (top < 12) { setActiveCategory(null); return; }

    let best = 0, bestDist = Infinity;
    rowRefs.current.forEach((rowEl, i) => {
      if (!rowEl) return;
      const dist = Math.abs(rowEl.offsetTop - top - 4);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setActiveCategory(sortedCategories[best] || null);
  }, [sortedCategories]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      position: 'relative'
      // No overflow:hidden — strips own their horizontal scroll
    }}>

      {/* ── Header ──────────────────────────────────────────── */}
      {/* Centered title so it doesn't collide with left-side header/breadcrumb */}
      <div style={{
        flexShrink: 0, zIndex: 10,
        background: `${theme.colors.background.canvas}ee`,
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${theme.colors.border.medium}`,
        padding: isMobile
          ? '0.5rem 1rem 0.35rem'
          : '0.5rem 1.5rem 0.35rem',
        textAlign: 'center'            // ← centred so it doesn't block left header
      }}>
        {/* Static title */}
        <span style={{
          display: 'block',
          fontFamily: theme.typography.fonts.display,
          fontSize: isMobile ? '0.88rem' : '0.95rem',
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          letterSpacing: '0.15px',
          lineHeight: 1.3
        }}>
          Create or Explore Characters
        </span>

        {/* Category sub-label — fades in once user scrolls */}
        <div style={{
          height: '1rem',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '0.3rem',
          opacity: activeCategory ? 1 : 0,
          transition: 'opacity 0.18s ease',
          pointerEvents: 'none',
          marginTop: '0.1rem'
        }}>
          {activeCategory?.icon && (
            <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>
              {activeCategory.icon}
            </span>
          )}
          <span style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.caption,
            color: theme.colors.accent.primary,
            fontWeight: theme.typography.weights.semibold
          }}>
            {activeCategory?.title}
          </span>
          <span style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.caption,
            color: theme.colors.text.secondary
          }}>
            · {(activeCategory?.characters || []).length}
          </span>
        </div>
      </div>

      {/* ── Scrollable rows ─────────────────────────────────── */}
      {/* Left-pad here, NO right-pad — each strip provides its own paddingRight */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isMobile
            ? '1rem 0 2rem 1rem'
            : '1.25rem 0 2.5rem 1.5rem',
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.colors.border.medium} transparent`
        }}
      >
        {sortedCategories.map((category, idx) => (
          <CategoryRow
            key={category.key}
            ref={el => rowRefs.current[idx] = el}
            category={category}
            onCharacterSelect={onCharacterSelect}
            selectedChar={selectedChar}
            onCreateCharacter={onCreateCharacter}
            onCharacterPublishToggle={onCharacterPublishToggle}
            user_id={user_id}
            onShowUpgradeModal={onShowUpgradeModal}
            charactersLoading={
              category.key === 'my_characters' ? charactersLoading : false
            }
            charactersError={
              category.key === 'my_characters' ? charactersError : null
            }
            isMobile={isMobile}
          />
        ))}
      </div>

      <style>{`
        @keyframes nrp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default NetflixRightPanel;