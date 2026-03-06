// src/components/NetflixRightPanel.jsx
// Netflix-style right panel — vertical scroll, horizontal rows per category
// Sticky header updates as user scrolls through categories
// Design: AwakeVerse tokens (Night Blue / Indigo / Ivory), no Lucide icons

import React, { useState, useRef, useCallback, useEffect } from 'react';
import theme from '../design-system/tokens';
import PublishToHubButton from './CreatorHub/PublishToHubButton';
import DefensiveCharacterCreationWrapper from './DefensiveCharacterCreationWrapper';

// ─── Avatar helper (mirrors renderSafeAvatar pattern) ────────
function Avatar({ src, name, size = 56 }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || 'C').charAt(0).toUpperCase();

  if (failed || !src) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(20,27,46,0.9))',
        border: `1.5px solid ${theme.colors.accent.primary}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: theme.colors.brand.ivory, fontWeight: 700,
        fontSize: size * 0.38, fontFamily: theme.typography.fonts.display
      }}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', flexShrink: 0,
        border: `1.5px solid ${theme.colors.accent.primary}44`
      }}
    />
  );
}

// ─── Compact character card — regular categories ──────────────
// Fixed 128px wide so rows stay tight and uniform
function CompactCharacterCard({ character, onClick, isSelected }) {
  const [hovered, setHovered] = useState(false);
  const active = isSelected || hovered;

  return (
    <div
      onClick={() => onClick?.(character)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '128px',
        flexShrink: 0,
        background: active
          ? 'rgba(99,102,241,0.1)'
          : theme.colors.background.surface,
        border: `1.5px solid ${active ? theme.colors.accent.primary : theme.colors.border.medium}`,
        borderRadius: theme.borderRadius.md,
        padding: '0.85rem 0.6rem 0.7rem',
        cursor: 'pointer',
        transition: theme.transitions.normal,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.55rem',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: active
          ? `0 8px 24px ${theme.colors.accent.primary}30`
          : theme.shadows.elevation01
      }}
    >
      <Avatar src={character.thumbnailUrl} name={character.name} size={54} />

      <span style={{
        fontFamily: theme.typography.fonts.body,
        fontSize: '0.72rem',
        fontWeight: theme.typography.weights.semibold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        lineHeight: 1.25,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        width: '100%'
      }}>
        {character.name}
      </span>
    </div>
  );
}

// ─── My Character card — wider, has status + publish button ───
// Fixed 176px wide to fit publish button comfortably
function MyCharacterCard({ character, onClick, onPublishToggle }) {
  const [hovered, setHovered] = useState(false);

  const statusColors = {
    pending:  { bg: 'rgba(255,165,0,0.15)', text: '#FFA500', label: '⏳ Pending' },
    rejected: { bg: 'rgba(255,107,107,0.15)', text: '#ff6b6b', label: '❌ Rejected' },
    approved: { bg: 'rgba(0,200,100,0.12)', text: '#00C864', label: '✓ Ready' }
  };
  const statusCfg = statusColors[character.status] || statusColors.approved;
  const showStatus = character.status && character.status !== 'approved';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '176px',
        flexShrink: 0,
        background: hovered
          ? 'rgba(99,102,241,0.08)'
          : theme.colors.background.surface,
        border: `1.5px solid ${hovered ? theme.colors.accent.primary : theme.colors.border.medium}`,
        borderRadius: theme.borderRadius.md,
        padding: '0.85rem 0.7rem 0.7rem',
        cursor: 'pointer',
        transition: theme.transitions.normal,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.5rem',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 24px ${theme.colors.accent.primary}25` : theme.shadows.elevation01,
        position: 'relative'
      }}
    >
      {/* Status badge — top right corner */}
      {showStatus && (
        <div style={{
          position: 'absolute', top: '6px', right: '6px',
          background: statusCfg.bg, color: statusCfg.text,
          fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px',
          borderRadius: '5px', border: `1px solid ${statusCfg.text}44`,
          fontFamily: theme.typography.fonts.body,
          letterSpacing: '0.04em', whiteSpace: 'nowrap'
        }}>
          {statusCfg.label}
        </div>
      )}

      {/* Avatar — click → handleCharacterSelect */}
      <div onClick={() => onClick?.(character)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
        <Avatar src={character.thumbnailUrl} name={character.name} size={54} />
        <span style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: '0.72rem',
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text.primary,
          textAlign: 'center',
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          width: '100%'
        }}>
          {character.name}
        </span>
      </div>

      {/* Publish button — stopPropagation so card click doesn't fire */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', marginTop: '0.25rem', pointerEvents: 'auto' }}
      >
        <PublishToHubButton
          character={{
            id: character.id,
            character_key: character.key,
            display_name: character.name,
            status: character.status,
            is_market_featured: character.is_market_featured
          }}
          onPublishSuccess={(updated) => onPublishToggle?.(updated)}
          onPublishError={(err) => console.error('Publish error:', err)}
        />
      </div>
    </div>
  );
}

// ─── Empty My Characters state ────────────────────────────────
function MyCharactersEmpty({ onCreateCharacter, user_id, onShowUpgradeModal }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1.25rem',
      padding: '0.5rem 0'
    }}>
      {/* Placeholder card silhouette */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '128px', flexShrink: 0,
          height: '148px',
          background: 'rgba(99,102,241,0.04)',
          border: `1.5px dashed ${theme.colors.border.medium}`,
          borderRadius: theme.borderRadius.md,
          opacity: 1 - i * 0.25
        }} />
      ))}

      {/* CTA */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: theme.typography.sizes.bodySmall,
          color: theme.colors.text.secondary,
          margin: 0, maxWidth: '160px', lineHeight: 1.4
        }}>
          You haven't created a character yet.
        </p>
        <DefensiveCharacterCreationWrapper
          user_id={user_id}
          onUpgradePrompt={() => onShowUpgradeModal?.('character_limit')}
        >
          <button
            onClick={onCreateCharacter}
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent.primary}, #4f46e5)`,
              border: 'none', borderRadius: theme.borderRadius.sm,
              color: '#fff', fontSize: '0.75rem',
              fontWeight: theme.typography.weights.semibold,
              fontFamily: theme.typography.fonts.body,
              padding: '0.5rem 1rem', cursor: 'pointer',
              boxShadow: `0 4px 14px ${theme.colors.accent.primary}40`,
              transition: theme.transitions.normal,
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${theme.colors.accent.primary}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 14px ${theme.colors.accent.primary}40`;
            }}
          >
            + Create Character
          </button>
        </DefensiveCharacterCreationWrapper>
      </div>
    </div>
  );
}

// ─── Category row ─────────────────────────────────────────────
const CategoryRow = React.forwardRef(function CategoryRow(
  { category, onCharacterSelect, selectedChar, onCreateCharacter,
    onCharacterPublishToggle, user_id, onShowUpgradeModal,
    charactersLoading, charactersError },
  ref
) {
  const isMyChars = category.key === 'my_characters';
  const chars = category.characters || [];
  const scrollRef = useRef(null);

  // Drag-to-scroll on the horizontal strip
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = (e) => {
    dragState.current = {
      dragging: true,
      startX: e.pageX - scrollRef.current.offsetLeft,
      scrollLeft: scrollRef.current.scrollLeft
    };
    scrollRef.current.style.cursor = 'grabbing';
  };
  const onMouseUp = () => {
    dragState.current.dragging = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  };
  const onMouseMove = (e) => {
    if (!dragState.current.dragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.2;
    scrollRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  };

  return (
    <div ref={ref} style={{ marginBottom: '1.75rem' }}>

      {/* Row label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: '0.65rem', paddingLeft: '0.1rem'
      }}>
        {category.icon && (
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>{category.icon}</span>
        )}
        <h3 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: theme.typography.sizes.body,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          margin: 0, letterSpacing: '0.3px'
        }}>
          {category.title}
        </h3>
        {/* Character count pill */}
        <span style={{
          background: `${theme.colors.accent.primary}18`,
          border: `1px solid ${theme.colors.accent.primary}33`,
          borderRadius: '999px',
          color: theme.colors.accent.primary,
          fontSize: '0.65rem', fontWeight: 600,
          padding: '0.1rem 0.5rem',
          fontFamily: theme.typography.fonts.body
        }}>
          {chars.length}
        </span>

        {/* My characters: add create button inline */}
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
                border: `1px solid ${theme.colors.accent.primary}55`,
                borderRadius: theme.borderRadius.sm,
                color: theme.colors.accent.primary,
                fontSize: '0.68rem', fontWeight: 600,
                fontFamily: theme.typography.fonts.body,
                padding: '0.2rem 0.65rem', cursor: 'pointer',
                transition: theme.transitions.normal
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${theme.colors.accent.primary}15`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              + New
            </button>
          </DefensiveCharacterCreationWrapper>
        )}
      </div>

      {/* My Characters loading/error states */}
      {isMyChars && charactersLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
          <div style={{
            width: '20px', height: '20px', flexShrink: 0,
            border: `2px solid ${theme.colors.border.medium}`,
            borderTop: `2px solid ${theme.colors.accent.primary}`,
            borderRadius: '50%', animation: 'nrp-spin 0.8s linear infinite'
          }} />
          <span style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.bodySmall,
            color: theme.colors.text.secondary
          }}>
            Loading your characters...
          </span>
        </div>
      )}

      {isMyChars && !charactersLoading && charactersError && (
        <div style={{
          padding: '0.6rem 0.85rem',
          background: 'rgba(255,107,107,0.08)',
          border: '1px solid rgba(255,107,107,0.2)',
          borderRadius: theme.borderRadius.sm,
          color: '#ff6b6b',
          fontSize: theme.typography.sizes.bodySmall,
          fontFamily: theme.typography.fonts.body
        }}>
          {charactersError}
        </div>
      )}

      {/* Empty state for My Characters */}
      {isMyChars && !charactersLoading && !charactersError && chars.length === 0 && (
        <MyCharactersEmpty
          onCreateCharacter={onCreateCharacter}
          user_id={user_id}
          onShowUpgradeModal={onShowUpgradeModal}
        />
      )}

      {/* Horizontal scroll strip */}
      {(!isMyChars || (!charactersLoading && !charactersError && chars.length > 0)) && (
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onMouseMove={onMouseMove}
          style={{
            display: 'flex', gap: '0.65rem',
            overflowX: 'auto', overflowY: 'visible',
            paddingBottom: '0.5rem',
            paddingTop: '0.15rem',
            cursor: 'grab',
            // Hide scrollbar cross-browser
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
              />
            ) : (
              <CompactCharacterCard
                key={character.key || idx}
                character={character}
                onClick={onCharacterSelect}
                isSelected={selectedChar?.key === character.key}
              />
            )
          )}

          {/* Empty category placeholder */}
          {chars.length === 0 && !isMyChars && (
            <div style={{
              width: '128px', height: '148px', flexShrink: 0,
              background: 'rgba(99,102,241,0.04)',
              border: `1.5px dashed ${theme.colors.border.medium}`,
              borderRadius: theme.borderRadius.md,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: theme.colors.text.secondary, fontSize: '0.7rem' }}>
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
  categories = [],
  onCharacterSelect,
  onCreateCharacter,
  selectedChar,
  userCharacters = [],
  charactersLoading = false,
  charactersError = null,
  onCharacterPublishToggle,
  user_id,
  onShowUpgradeModal
}) => {
  const containerRef  = useRef(null);
  const rowRefs       = useRef([]);
  const [activeCategory, setActiveCategory] = useState(null);

  // Sort: My Characters always first, rest in original order
  const sortedCategories = React.useMemo(() => {
    const myChars = categories.find(c => c.key === 'my_characters');
    const rest    = categories.filter(c => c.key !== 'my_characters');
    return myChars ? [myChars, ...rest] : categories;
  }, [categories]);

  // Set initial active category
  useEffect(() => {
    if (sortedCategories.length > 0 && !activeCategory) {
      setActiveCategory(sortedCategories[0]);
    }
  }, [sortedCategories]);

  // Update sticky header as user scrolls
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    let closestIdx  = 0;
    let closestDist = Infinity;

    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      const dist = Math.abs(el.offsetTop - scrollTop - 8);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx  = i;
      }
    });

    setActiveCategory(sortedCategories[closestIdx] || null);
  }, [sortedCategories]);

  // Attach scroll listener
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
      position: 'relative', overflow: 'hidden'
    }}>

      {/* ── Sticky category header ─────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
        background: `${theme.colors.background.canvas}f0`,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.colors.border.medium}`,
        padding: '0.55rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        minHeight: '40px'
      }}>
        {activeCategory?.icon && (
          <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>
            {activeCategory.icon}
          </span>
        )}
        <span style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: theme.typography.sizes.body,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          letterSpacing: '0.3px',
          transition: 'opacity 0.2s ease'
        }}>
          {activeCategory?.title || ''}
        </span>
        {activeCategory && (
          <span style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: theme.typography.sizes.caption,
            color: theme.colors.text.secondary,
            marginLeft: '0.25rem'
          }}>
            {(activeCategory.characters || []).length} characters
          </span>
        )}
      </div>

      {/* ── Scrollable rows ─────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1.25rem 1.5rem 2rem',
          // Hide scrollbar
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
            charactersLoading={category.key === 'my_characters' ? charactersLoading : false}
            charactersError={category.key === 'my_characters' ? charactersError : null}
          />
        ))}
      </div>

      {/* Hide webkit scrollbar on horizontal strips */}
      <style>{`
        .nrp-hscroll::-webkit-scrollbar { display: none; }
        @keyframes nrp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default NetflixRightPanel;