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
const CARD_H  = (isMobile) => isMobile ? 196 : 228;
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

      {/* ── Bottom gradient overlay ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'linear-gradient(to bottom, transparent 35%, rgba(10,15,26,0.82) 68%, rgba(10,15,26,0.98) 100%)',
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

      {/* ── Name ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0.55rem 0.65rem 0.5rem',
        pointerEvents: 'none'
      }}>
        <span style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: isMobile ? '0.68rem' : '0.74rem',
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.brand.ivory,
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {character.name}
        </span>
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

// ─── Empty My Characters — "your IP." design ─────────────────
// Exact markup from ChatLauncherHelpers, inlined with theme tokens
function MyCharactersEmpty({ onCreateCharacter, user_id, onShowUpgradeModal, isMobile }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '1.5rem 1rem' : '2rem 1rem',
      textAlign: 'center', width: '100%', gap: isMobile ? '1.5rem' : '2rem'
    }}>

      {/* "your IP." mark + taper underline */}
      <div style={{
        display: 'inline-flex', flexDirection: 'column',
        alignItems: 'flex-start', gap: isMobile ? '8px' : '10px'
      }}>
        <span
          aria-hidden="true"
          style={{
            lineHeight: 1, letterSpacing: '0.5px',
            fontSize: isMobile ? '34px' : '44px',
            userSelect: 'none', whiteSpace: 'nowrap',
            fontFamily: theme.typography.fonts.display
          }}
        >
          <span style={{ color: theme.colors.accent.primary }}>y</span>
          <span style={{ color: theme.colors.brand.ivory }}>our </span>
          <span style={{ color: theme.colors.accent.primary }}>I</span>
          <span style={{ color: theme.colors.brand.ivory }}>P</span>
          <span style={{ color: theme.colors.accent.primary }}>.</span>
        </span>
        {/* Indigo → Ivory taper underline */}
        <span
          aria-hidden="true"
          style={{
            height: isMobile ? '3px' : '4px',
            width: isMobile ? '140px' : '180px',
            borderRadius: '999px',
            background: `linear-gradient(90deg,
              ${theme.colors.accent.primary} 0%,
              ${theme.colors.brand.ivory} 85%)`,
            opacity: 0.95,
            clipPath: 'polygon(0 0, 100% 35%, 100% 65%, 0 100%)',
            display: 'block'
          }}
        />
      </div>

      {/* Title + body */}
      <div>
        <h3 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: isMobile ? '1.2rem' : '1.4rem',
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          margin: '0 0 0.75rem 0', letterSpacing: '0.5px'
        }}>
          Create Your Own Character
        </h3>
        <p style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: theme.colors.text.secondary,
          lineHeight: 1.6, margin: 0,
          maxWidth: isMobile ? '280px' : '340px'
        }}>
          Design a custom AI character with unique personality & expertise,
        </p>
      </div>

      {/* "Start Creating" — ivory/silver button from original */}
      <DefensiveCharacterCreationWrapper
        user_id={user_id}
        onUpgradePrompt={() => onShowUpgradeModal?.('character_limit')}
      >
        <button
          onClick={onCreateCharacter}
          style={{
            background: 'linear-gradient(135deg, #F5F5DC, #C0C0C0)',
            border: 'none',
            borderRadius: isMobile ? '20px' : '25px',
            color: '#000',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 700,
            padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif",
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
          }}
        >
          Start Creating
        </button>
      </DefensiveCharacterCreationWrapper>
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

        {/* + New button for My Characters when chars exist */}
        {isMyChars && chars.length > 0 && (
          <DefensiveCharacterCreationWrapper
            user_id={user_id}
            onUpgradePrompt={() => onShowUpgradeModal?.('character_limit')}
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