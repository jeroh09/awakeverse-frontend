// src/components/ChatLauncherHelpers.jsx - PRODUCTION READY
// Helper components for ChatLauncherPage with SUBSTANTIAL DESIGN
import React from 'react';
import DefensiveCharacterCreationWrapper from './DefensiveCharacterCreationWrapper';
import PublishToHubButton from './CreatorHub/PublishToHubButton';
import PremiumCategoryCard from './PremiumCategoryCard';
import theme from '../design-system/tokens';
import PremiumCharacterCard from './PremiumCharacterCard';
import ScrollShell from './ScrollShell';

import { renderSafeAvatar } from '../utils/imageUtils';

/* =======================
   SUBSTANTIAL DESIGN SYSTEM
   ======================= */
const substantialStyles = {
  // COLORS
  colors: {
    navy: '#0A0A15',
    darkContainer: '#1A1A2E', 
    charcoal: '#2C2C2C',
    ivory: '#F5F5DC',
    silver: '#C0C0C0',
    border: '#444'
  },

  // TYPOGRAPHY
  typography: {
    heading: {
      color: theme.colors.text.primary, // #F1F5F9
      fontFamily: theme.typography.fonts.display, // 'Syne', sans-serif
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
    },
    body: {
      color: theme.colors.text.secondary, // #94A3B8
      fontFamily: theme.typography.fonts.body // 'Inter', sans-serif
    },
    subtle: {
      color: theme.colors.text.tertiary, // #64748B
      fontFamily: theme.typography.fonts.body // 'Inter', sans-serif
    }
  },

  // SHADOWS & BORDERS
  effects: {
    shadowMedium: '0 4px 16px rgba(0, 0, 0, 0.4)',
    shadowHeavy: '0 6px 24px rgba(0, 0, 0, 0.6)',
    borderThick: '2px solid #444',
    borderMedium: '1px solid #444'
  }
};

/* ------------------------------ Assets Map ------------------------------ */
export const categoryRepresentatives = {
  sleuths: '/images/sherlock.jpg',
  stargazers: '/images/nostradamus.jpg',
  truthweavers: '/images/dante.jpg',
  veilwalkers: '/images/rasputin.jpg',
  goldhands: '/images/mansa_musa.jpg',
  heartstrings: '/images/shakespeare.jpg',
  thinkers: '/images/socrates.jpg',
  makers: '/images/da_vinci.jpg',
  warlords: '/images/sun_tzu.jpg',
  pathfinders: '/images/christopher_columbus.jpg',
  performers: '/images/harry_houdini.jpg',
  my_characters: null
};

/* ------------------------------ StatusBadge ----------------------------- */
export const StatusBadge = ({ status, size = 'normal' }) => {
  const statusConfig = {
    pending:  { color: '#FFA500', text: 'Pending',  icon: '⏳' },
    rejected: { color: '#ff6b6b', text: 'Rejected', icon: '❌' },
    approved: { color: '#28a745', text: 'Ready',    icon: '✅' }
  };
  const config = statusConfig[status];
  if (!config) return null;

  const isSmall = size === 'small';
  return (
    <div style={{
      background: config.color,
      color: '#fff',
      fontSize: isSmall ? '0.6rem' : '0.7rem',
      fontWeight: 'bold',
      padding: isSmall ? '1px 4px' : '2px 6px',
      borderRadius: isSmall ? '6px' : '8px',
      display: 'flex',
      alignItems: 'center',
      gap: isSmall ? '2px' : '3px',
      zIndex: 1,
      border: isSmall ? '1px solid #0B1426' : '2px solid #0B1426',
      whiteSpace: 'nowrap'
    }}>
      <span style={{ fontSize: isSmall ? '0.5rem' : '0.6rem' }}>{config.icon}</span>
      {!isSmall && config.text}
    </div>
  );
};

/* ------------------------------ CategoryCard ---------------------------- */
/* ------------------------------ CategoryCard ---------------------------- */
export const CategoryCard = (props) => {
  const { category, isMobile } = props;
  const [isHovered, setIsHovered] = React.useState(false);  // ← ADDED HERE
  
  // Use premium card for regular categories
  if (category.key !== 'my_characters') {
    return <PremiumCategoryCard {...props} />;
  }
  
  // Keep your existing my_characters card logic
  const isMyCharacters = category.key === 'my_characters';
  const handleClick = () => {
    if (isMyCharacters && (category.characterCount || 0) === 0) {
      props.onCreateCharacter?.();
    } else {
      props.onClick?.();
    }
  };

  // Special premium styling for My Characters category
  const hasCharacters = (category.characterCount || 0) > 0;
  
  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      style={{
        height: isMobile ? '200px' : '240px',
        background: theme.colors.background.surface,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: theme.transitions.normal,
        boxShadow: isHovered ? theme.shadows.elevation03 : theme.shadows.elevation02,
        border: `2px solid ${
          isHovered 
            ? theme.colors.brand.ivory
            : theme.colors.brand.ivoryDim
        }`,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative'
      }}
    >
      {/* Background Image */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${category.sceneImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: theme.transitions.normal,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />

      {/* Dark Overlay for Text Readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(10, 15, 26, 0.3) 0%, rgba(10, 15, 26, 0.7) 100%)',
        zIndex: 1
      }} />

      {/* Premium Badge */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: `linear-gradient(135deg, ${theme.colors.brand.ivory}, ${theme.colors.brand.ivoryDim})`,
        color: theme.colors.background.canvas,
        fontSize: '10px',
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: '6px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        zIndex: 3,
        boxShadow: theme.shadows.elevation02
      }}>
        Creator
      </div>

      {/* Status Summary */}
      {hasCharacters && (category.pendingCount || 0) + (category.rejectedCount || 0) + (category.approvedCount || 0) > 0 && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          gap: '4px',
          zIndex: 3
        }}>
          {(category.approvedCount || 0) > 0 && (
            <span style={{
              background: theme.colors.semantic.success,
              color: 'white',
              fontSize: '9px',
              fontWeight: 600,
              padding: '3px 6px',
              borderRadius: '4px',
              boxShadow: theme.shadows.elevation01
            }}>
              {category.approvedCount}✓
            </span>
          )}
          {(category.pendingCount || 0) > 0 && (
            <span style={{
              background: theme.colors.semantic.warning,
              color: 'white',
              fontSize: '9px',
              fontWeight: 600,
              padding: '3px 6px',
              borderRadius: '4px',
              boxShadow: theme.shadows.elevation01
            }}>
              {category.pendingCount}⏳
            </span>
          )}
          {(category.rejectedCount || 0) > 0 && (
            <span style={{
              background: theme.colors.semantic.error,
              color: 'white',
              fontSize: '9px',
              fontWeight: 600,
              padding: '3px 6px',
              borderRadius: '4px',
              boxShadow: theme.shadows.elevation01
            }}>
              {category.rejectedCount}❌
            </span>
          )}
        </div>
      )}

      {/* Text Content - Bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '16px' : '20px',
        zIndex: 2,
        textAlign: 'center'
      }}>
        {/* Category Title */}
        <h3 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: isMobile ? '18px' : '22px',
          fontWeight: 700,
          color: theme.colors.brand.ivory,
          marginBottom: theme.spacing.xs,
          lineHeight: 1.2,
          letterSpacing: '-0.5px',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
        }}>
          {category.title}
        </h3>

        {/* Character Count or CTA */}
        <p style={{
          fontFamily: theme.typography.fonts.body,
          fontSize: isMobile ? '12px' : '14px',
          color: theme.colors.brand.ivoryDim,
          fontWeight: 500,
          margin: 0
        }}>
          {hasCharacters 
            ? `${category.characterCount} character${category.characterCount !== 1 ? 's' : ''}`
            : 'Create your first character'
          }
        </p>
      </div>

      {/* Hover Glow - Ivory */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, ${theme.colors.brand.ivory}20 0%, transparent 70%)`,
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 3
        }} />
      )}
    </div>
  );
};

/* ------------------------------ CharacterCard --------------------------- */
export const CharacterCard = ({
  character,
  onClick,
  index = 0,
  isMobile,
  showStatusIndicator = false,
  onPublishToggle
}) => {
  const getStatusIndicator = () => {
    if (!showStatusIndicator || !character?.status || character.status === 'approved') return null;
    const statusConfig = {
      pending:  { color: '#FFA500', text: 'Pending',  icon: '⏳' },
      rejected: { color: '#ff6b6b', text: 'Rejected', icon: '❌' }
    };
    const config = statusConfig[character.status];
    if (!config) return null;

    return (
      <div style={{
        position: 'absolute',
        top: isMobile ? '-6px' : '-8px',
        right: isMobile ? '-6px' : '-8px',
        background: config.color,
        color: '#fff',
        fontSize: isMobile ? '0.6rem' : '0.7rem',
        fontWeight: 'bold',
        padding: isMobile ? '1px 4px' : '2px 6px',
        borderRadius: isMobile ? '6px' : '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        zIndex: 1,
        border: '2px solid #0B1426',
        whiteSpace: 'nowrap'
      }}>
        <span style={{ fontSize: isMobile ? '0.5rem' : '0.6rem' }}>{config.icon}</span>
        {!isMobile && config.text}
      </div>
    );
  };

  return (
    <div
      style={{
        // SUBSTANTIAL STYLES
        background: substantialStyles.colors.darkContainer,
        border: substantialStyles.effects.borderThick,
        borderRadius: '16px',
        boxShadow: substantialStyles.effects.shadowMedium,
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        opacity: 0,
        animation: `characterSlideIn 0.6s ease-out ${index * 0.05}s forwards`,
        minHeight: isMobile ? '180px' : '240px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = '#252545';
          e.currentTarget.style.borderColor = '#666';
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = substantialStyles.effects.shadowHeavy;
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = substantialStyles.colors.darkContainer;
          e.currentTarget.style.borderColor = substantialStyles.colors.border;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = substantialStyles.effects.shadowMedium;
        }
      }}
    >
      {/* Status flag */}
      {getStatusIndicator()}

      {/* Avatar */}
      <div 
        onClick={() => onClick?.(character)}
        style={{
          width: isMobile ? '40px' : '50px',
          height: isMobile ? '40px' : '50px',
          borderRadius: '50%',
          overflow: 'hidden',
          marginBottom: '0.75rem',
          border: substantialStyles.effects.borderThick,
          flexShrink: 0,
          opacity: character.status === 'rejected' ? 0.6 : 1,
          cursor: 'pointer'
        }}
      >
        <img
          src={character.thumbnailUrl || '/images/default-character.jpg'}
          alt={character.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { 
            e.currentTarget.onError = null;
            e.currentTarget.style.display = 'none';

            const parent = e.currentTarget.parentElement;
            if (!parent.querySelector('.text-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'text-fallback';
              fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);color:#F5F5DC;font-size:1.2rem;font-weight:bold;border-radius:50%;';
              fallback.textContent = (character.name || 'C').charAt(0).toUpperCase();
              parent.appendChild(fallback);
            }
          }}
        />
      </div>

      {/* Info */}
      <div 
        onClick={() => onClick?.(character)}
        style={{ 
          textAlign: 'center', 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        <h3 style={{
          ...substantialStyles.typography.heading,
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: 600,
          margin: '0 0 0.5rem 0',
          letterSpacing: '0.5px',
          lineHeight: 1.2
        }}>
          {character.name}
        </h3>

        <p style={{
          ...substantialStyles.typography.body,
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          lineHeight: 1.3,
          margin: 0,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {(character.description || '').slice(0, isMobile ? 60 : 80)}{(character.description || '').length > (isMobile ? 60 : 80) ? '…' : ''}
        </p>
      </div>

      {/* Publish Button */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: '100%', 
          marginTop: '0.75rem',
          pointerEvents: 'auto'
        }}
      >
        <PublishToHubButton
          character={{
            id: character.id,
            character_key: character.key,
            display_name: character.name,
            status: character.status,
            is_market_featured: character.is_market_featured
          }}
          onPublishSuccess={(updatedChar) => {
            console.log('Character publish state changed:', updatedChar);
            onCharacterPublishToggle?.(updatedChar);
          }}
          onPublishError={(error) => {
            console.error('Publish error:', error);
          }}
        />
      </div>
    </div>
  );
};

/* --------------------------- PersonalizedSection ------------------------ */
export const PersonalizedSection = ({
  characters = [],
  onCharacterSelect,
  hasActiveConversations,
  isMobile
}) => {
  const maxCharacters = isMobile ? 3 : 4;
  return (
    <div style={{
      width: '100%',
      maxWidth: isMobile ? '500px' : '400px',
      margin: '1rem 0',
      animation: 'slideInFromLeft 0.6s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', padding: '0 0.5rem'
      }}>
        <h3 style={{
          ...substantialStyles.typography.heading,
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: 600,
          letterSpacing: '0.5px',
          margin: 0,
        }}>
          For You
        </h3>
        <span style={{
          ...substantialStyles.typography.subtle,
          background: 'rgba(255, 255, 255, 0.1)',
          border: substantialStyles.effects.borderMedium,
          borderRadius: '12px',
          padding: '0.2rem 0.6rem',
          fontSize: '0.7rem',
          letterSpacing: '0.3px'
        }}>
          Recent
        </span>
      </div>

      {/* List */}
      <div style={{
        display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: isMobile ? 'none' : 'repeat(2, 1fr)',
        gap: isMobile ? '1rem' : '0.75rem',
        padding: '0.5rem 0',
        justifyContent: isMobile ? 'space-between' : 'normal'
      }}>
        {characters.slice(0, maxCharacters).map((c) => (
          <div
            key={c.character || c.name}
            onClick={() => onCharacterSelect?.(c)}
            style={{
              background: substantialStyles.colors.darkContainer,
              border: substantialStyles.effects.borderMedium,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(5px)',
              position: 'relative',
              padding: isMobile ? '0.75rem 0.5rem' : '0.75rem',
              flex: isMobile ? '1' : 'none',
              maxWidth: isMobile ? '100px' : 'none',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.6rem'
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={c.thumbnailUrl || '/images/default-character.jpg'}
                alt={c.name}
                style={{
                  width: isMobile ? '50px' : '45px',
                  height: isMobile ? '50px' : '45px',
                  borderRadius: '50%',
                  border: substantialStyles.effects.borderMedium,
                  objectFit: 'cover'
                }}
                onError={(e) => { 
                  e.currentTarget.onError = null;
                  e.currentTarget.style.display = 'none';

                  const parent = e.currentTarget.parentElement;
                  if (!parent.querySelector('.text-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'text-fallback';
                    fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);color:#F5F5DC;font-size:0.9rem;font-weight:bold;border-radius:50%;';
                    fallback.textContent = (c.name || 'C').charAt(0).toUpperCase();
                    parent.appendChild(fallback);
                  }
                }}
              />
              {c.hasActiveConversation && (
                <div style={{
                  position: 'absolute',
                  top: '-2px', right: '-2px',
                  width: '12px', height: '12px',
                  background: '#00FF88',
                  border: '2px solid #0B1426',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column',
              textAlign: isMobile ? 'center' : 'left',
              minWidth: 0, flex: 1
            }}>
              <span style={{
                ...substantialStyles.typography.heading,
                fontSize: isMobile ? '0.7rem' : '0.85rem',
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '0.3px'
              }}>
                {(String(c.name || '').split(' ')[0]) || 'Character'}
              </span>
              {!isMobile && hasActiveConversations && c.hasActiveConversation && (
                <span style={{ ...substantialStyles.typography.subtle, fontSize: '0.65rem' }}>
                  Active now
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------------------- MyCharactersPanel ------------------------- */
export const MyCharactersPanel = ({
  userCharacters = [],
  charactersLoading,
  charactersError,
  onCreateCharacter,
  onCharacterSelect,
  onCharacterPublishToggle,
  isMobile,
  user_id,
  onShowUpgradeModal
}) => {
  const approvedCharacters = userCharacters.filter(c => c.status === 'approved');
  const pendingCharacters  = userCharacters.filter(c => c.status === 'pending');
  const rejectedCharacters = userCharacters.filter(c => c.status === 'rejected');

  if (charactersLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: isMobile ? '300px' : '400px', textAlign: 'center'
      }}>
        <div style={{
          width: isMobile ? '32px' : '40px',
          height: isMobile ? '32px' : '40px',
          border: substantialStyles.effects.borderThick,
          borderTop: '3px solid #F5F5DC',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <p style={{ ...substantialStyles.typography.body, fontSize: isMobile ? '0.9rem' : '1rem', margin: 0 }}>
          Loading your characters...
        </p>
      </div>
    );
  }

  if (charactersError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: isMobile ? '300px' : '400px', textAlign: 'center', padding: isMobile ? '1rem' : '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.5rem',
          marginBottom: '1rem'
        }}>
          <p style={{ color: '#ff6b6b', fontSize: isMobile ? '0.9rem' : '1rem', margin: '0 0 0.5rem 0' }}>
            {charactersError}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: substantialStyles.effects.borderMedium,
              borderRadius: '6px',
              ...substantialStyles.typography.body,
              fontSize: '0.8rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (userCharacters.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: isMobile ? '300px' : '400px', textAlign: 'center', padding: isMobile ? '1rem' : '2rem', width: '100%'
      }}>
        <div style={{
          maxWidth: isMobile ? '300px' : '400px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: isMobile ? '1.5rem' : '2rem'
        }}>
          <div style={{
            width: isMobile ? '80px' : '100px',
            height: isMobile ? '80px' : '100px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: substantialStyles.effects.borderThick,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span
              aria-hidden="true"
              style={{
                fontFamily: "'Caveat', cursive",
                fontStyle: 'italic',
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: '0.5px',
                fontSize: isMobile ? '26px' : '30px',
                userSelect: 'none'
              }}
            >
              <span style={{ color: theme.colors.accent.primary }}>y</span>
              <span style={{ color: theme.colors.brand.ivory }}>our IP</span>
            </span>
          </div>


          <div>
            <h3 style={{
              ...substantialStyles.typography.heading,
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              margin: '0 0 1rem 0', letterSpacing: '1px',
            }}>
              Create Your Own Character
            </h3>
            <p style={{
              ...substantialStyles.typography.body,
              fontSize: isMobile ? '0.9rem' : '1rem',
              lineHeight: 1.6, margin: '0 0 2rem 0',
              maxWidth: isMobile ? '300px' : '400px'
            }}>
              Design a custom AI character with unique personality, expertise, and backstory.
              From historical figures to original creations — bring your vision to life.
            </p>
          </div>

          <DefensiveCharacterCreationWrapper 
            user_id={user_id}
            onUpgradePrompt={() => {
              onShowUpgradeModal('character_limit');
            }}
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
              boxShadow: substantialStyles.effects.shadowMedium
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = substantialStyles.effects.shadowHeavy;
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = substantialStyles.effects.shadowMedium;
              }
            }}
          >
            Start Creating
          </button>
        </DefensiveCharacterCreationWrapper>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {(pendingCharacters.length > 0 || rejectedCharacters.length > 0) && (
        <div style={{
          marginBottom: '1.5rem',
          padding: isMobile ? '0.8rem' : '1rem',
          background: substantialStyles.colors.darkContainer,
          borderRadius: '8px',
          border: substantialStyles.effects.borderMedium
        }}>
          <h4 style={{
            ...substantialStyles.typography.heading,
            margin: '0 0 0.5rem 0',
            fontSize: isMobile ? '0.8rem' : '0.9rem', textAlign: 'center'
          }}>
            Character Status Summary
          </h4>
          <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '0.5rem' : '1rem', flexWrap: 'wrap' }}>
            {approvedCharacters.length > 0 && (
              <span style={{
                background: '#28a745', color: '#fff',
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                padding: isMobile ? '0.2rem 0.5rem' : '0.3rem 0.6rem',
                borderRadius: '6px', border: '1px solid #0B1426'
              }}>
                {approvedCharacters.length} Ready ✓
              </span>
            )}
            {pendingCharacters.length > 0 && (
              <span style={{
                background: '#FFA500', color: '#fff',
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                padding: isMobile ? '0.2rem 0.5rem' : '0.3rem 0.6rem',
                borderRadius: '6px', border: '1px solid #0B1426'
              }}>
                {pendingCharacters.length} Pending ⏳
              </span>
            )}
            {rejectedCharacters.length > 0 && (
              <span style={{
                background: '#ff6b6b', color: '#fff',
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                padding: isMobile ? '0.2rem 0.5rem' : '0.3rem 0.6rem',
                borderRadius: '6px', border: '1px solid #0B1426'
              }}>
                {rejectedCharacters.length} Need Revision ❌
              </span>
            )}
          </div>
        </div>
      )}
      <ScrollShell maxHeight="calc(100vh - 300px)">
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: theme.spacing.lg,
          padding: theme.spacing.md,
          paddingRight: theme.spacing.xl
        }}>
          {userCharacters.map((c, idx) => (
            <div key={c.character_key || c.key || `${c.display_name}-${idx}`} style={{ position: 'relative' }}>
              {/* Status Badge - Positioned Absolutely Over Card */}
              {c.status && c.status !== 'approved' && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                  background: c.status === 'pending' ? '#FFA500' : '#ff6b6b',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  boxShadow: theme.shadows.elevation02
                }}>
                  <span style={{ fontSize: '8px' }}>
                    {c.status === 'pending' ? '⏳' : '❌'}
                  </span>
                  {!isMobile && (c.status === 'pending' ? 'Pending' : 'Rejected')}
                </div>
              )}

              {/* Premium Character Card */}
              <PremiumCharacterCard
                character={{
                  name: c.display_name || c.name,
                  display_name: c.display_name || c.name,
                  description: c.short_description || c.description,
                  short_description: c.short_description || c.description,
                  avatar_url: c.avatar_url || c.thumbnailUrl || '/images/default-character.jpg',
                  thumbnailUrl: c.avatar_url || c.thumbnailUrl || '/images/default-character.jpg',
                  category: c.category,
                  status: c.status,
                  is_market_featured: c.is_market_featured
                }}
                onClick={() => onCharacterSelect?.({
                  key: c.character_key || c.key,
                  name: c.display_name || c.name,
                  status: c.status,
                  display_name: c.display_name || c.name,
                  rejection_reason: c.rejection_reason,
                  description: c.short_description || c.description,
                  thumbnailUrl: c.avatar_url || c.thumbnailUrl || '/images/default-character.jpg'
                })}
                isMobile={isMobile}
                showBadge={false}
              />

              {/* Publish Button Below Card */}
              <div 
                onClick={(e) => e.stopPropagation()} 
                style={{ 
                  width: '100%', 
                  marginTop: theme.spacing.sm,
                  pointerEvents: 'auto'
                }}
              >
                <PublishToHubButton
                  character={{
                    id: c.id,
                    character_key: c.character_key || c.key,
                    display_name: c.display_name || c.name,
                    status: c.status,
                    is_market_featured: c.is_market_featured
                  }}
                  onPublishSuccess={(updatedChar) => {
                    console.log('Character publish state changed:', updatedChar);
                    onCharacterPublishToggle?.(updatedChar);
                  }}
                  onPublishError={(error) => {
                    console.error('Publish error:', error);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </ScrollShell>
      <div style={{ textAlign: 'center' }}>
        <DefensiveCharacterCreationWrapper 
          user_id={user_id}
          onUpgradePrompt={() => {
            onShowUpgradeModal('character_limit');
          }}
        >
        <button
          onClick={onCreateCharacter}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: `2px dashed ${substantialStyles.colors.border}`,
            borderRadius: '12px',
            ...substantialStyles.typography.body,
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: 600,
            padding: isMobile ? '0.8rem 1.2rem' : '1rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = '#666';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = substantialStyles.colors.border;
            }
          }}
        >
          Create New Character
        </button>
      </DefensiveCharacterCreationWrapper>
      </div>
    </div>
  );
};