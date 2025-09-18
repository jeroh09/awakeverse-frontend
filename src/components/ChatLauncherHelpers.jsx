// src/components/ChatLauncherHelpers.jsx
// Helper components for ChatLauncherPage (decentralized: NO status modal here)
import React from 'react';
import DefensiveCharacterCreationWrapper from './DefensiveCharacterCreationWrapper';
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
  my_characters: '/images/default-character.jpg'
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
export const CategoryCard = ({
  category,           // { key, title, characters?, characterCount?, pendingCount?, rejectedCount?, approvedCount? }
  onClick,
  index = 0,
  isMobile,
  onCreateCharacter
}) => {
  const isMyCharacters = category.key === 'my_characters';

  const handleClick = () => {
    if (isMyCharacters && (category.characterCount || 0) === 0) {
      onCreateCharacter?.();
    } else {
      onClick?.();
    }
  };

  const getStatusSummary = () => {
    if (!isMyCharacters || !category.characterCount) return null;
    const { pendingCount = 0, rejectedCount = 0, approvedCount = 0 } = category;
    return (
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '0.5rem' : '0.75rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.25rem',
        fontSize: '0.6rem',
        zIndex: 1
      }}>
        {approvedCount > 0 && (
          <span style={{
            background: '#28a745', color: '#fff', padding: '1px 4px',
            borderRadius: '4px', border: '1px solid #0B1426'
          }}>
            {approvedCount}✓
          </span>
        )}
        {pendingCount > 0 && (
          <span style={{
            background: '#FFA500', color: '#fff', padding: '1px 4px',
            borderRadius: '4px', border: '1px solid #0B1426'
          }}>
            {pendingCount}⏳
          </span>
        )}
        {rejectedCount > 0 && (
          <span style={{
            background: '#ff6b6b', color: '#fff', padding: '1px 4px',
            borderRadius: '4px', border: '1px solid #0B1426'
          }}>
            {rejectedCount}❌
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={handleClick}
      style={{        position: 'relative',
        height: 'auto',
        overflow: 'hidden',
        alignSelf: 'stretch',

        background: 'rgba(255, 255, 255, 0.05)',
        border: isMyCharacters
          ? '1px solid rgba(255, 215, 0, 0.4)'
          : '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        aspectRatio: '1',
        opacity: 0,
        animation: `categorySlideIn 0.6s ease-out ${index * 0.1}s forwards`,
        minHeight: isMobile ? '120px' : '150px',
        maxHeight: isMobile ? '160px' : '200px',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 215, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = isMyCharacters
            ? 'rgba(255, 215, 0, 0.4)'
            : 'rgba(255, 215, 0, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Avatar */}
      <div style={{
        width: isMobile ? '48px' : '56px',
        height: isMobile ? '48px' : '56px',
        borderRadius: '50%',
        overflow: 'hidden',
        marginBottom: '0.7rem',
        border: isMyCharacters
          ? '3px solid rgba(255, 215, 0, 0.6)'
          : '3px solid rgba(255, 215, 0, 0.4)',
        transition: 'all 0.3s ease',
        background: 'rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {isMyCharacters && (
          <div style={{
            position: 'absolute',
            top: '-8px', right: '-8px',
            width: '16px', height: '16px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            borderRadius: '50%',
            fontSize: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#000', fontWeight: 'bold', zIndex: 1
          }}>
            ⭐
          </div>
        )}
        <img
          src={categoryRepresentatives[category.key]}
          alt={category.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: 'sepia(20%) contrast(1.1)', transition: 'filter 0.3s ease'
          }}
          onError={(e) => { e.currentTarget.src = '/images/default-character.jpg'; }}
        />
      </div>

      {/* Title */}
      <h3 style={{
        color: '#FFD700',
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        fontWeight: 600,
        margin: '0 0 0.3rem 0',
        letterSpacing: '0.5px',
        fontFamily: "'Georgia', serif",
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        lineHeight: 1.1
      }}>
        {category.title}
      </h3>

      {/* Badge */}
      <span style={{
        color: isMyCharacters ? '#FFD700' : 'rgba(255, 215, 0, 0.7)',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        background: isMyCharacters ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.1)',
        padding: '0.15rem 0.4rem',
        borderRadius: '8px',
        border: isMyCharacters
          ? '1px solid rgba(255, 215, 0, 0.4)'
          : '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        {isMyCharacters
          ? ((category.characterCount || 0) > 0
              ? `${category.characterCount} characters`
              : 'Create Character')
          : `${(category.characters || []).length} guides`
        }
      </span>

      {/* Status summary for My Characters */}
      {getStatusSummary()}
    </div>
  );
};

/* ------------------------------ CharacterCard --------------------------- */
export const CharacterCard = ({
  character,          // { key, name, description, thumbnailUrl, status, rejection_reason }
  onClick,            // (character) => void
  index = 0,
  isMobile,
  showStatusIndicator = false
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
      onClick={() => onClick?.(character)}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '16px',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        opacity: 0,
        animation: `characterSlideIn 0.6s ease-out ${index * 0.05}s forwards`,
        minHeight: isMobile ? '140px' : '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = '0 16px 32px rgba(255, 215, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Status flag */}
      {getStatusIndicator()}

      {/* Avatar */}
      <div style={{
        width: isMobile ? '40px' : '50px',
        height: isMobile ? '40px' : '50px',
        borderRadius: '50%',
        overflow: 'hidden',
        marginBottom: '0.75rem',
        border: '3px solid rgba(255, 215, 0, 0.3)',
        flexShrink: 0,
        opacity: character.status === 'rejected' ? 0.6 : 1
      }}>
        <img
          src={character.thumbnailUrl || '/images/default-character.jpg'}
          alt={character.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.src = '/images/default-character.jpg'; }}
        />
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          color: character.status === 'approved' ? '#FFD700' : '#FFA500',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: 600,
          margin: '0 0 0.5rem 0',
          letterSpacing: '0.5px',
          lineHeight: 1.2
        }}>
          {character.name}
        </h3>

        <p style={{
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          lineHeight: 1.3,
          margin: 0,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {(character.description || '').slice(0, isMobile ? 80 : 100)}{(character.description || '').length > (isMobile ? 80 : 100) ? '…' : ''}
        </p>
      </div>
    </div>
  );
};

/* --------------------------- PersonalizedSection ------------------------ */
export const PersonalizedSection = ({
  characters = [],          // [{ character, name, thumbnailUrl, hasActiveConversation }]
  onCharacterSelect,        // (characterObj) => void
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
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#FFD700',
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
          margin: 0,
          fontFamily: "'Georgia', serif"
        }}>
          For You
        </h3>
        <span style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '12px',
          padding: '0.2rem 0.6rem',
          fontSize: '0.7rem',
          color: 'rgba(255, 215, 0, 0.9)',
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
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
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
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  objectFit: 'cover'
                }}
                onError={(e) => { e.currentTarget.src = '/images/default-character.jpg'; }}
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
                fontSize: isMobile ? '0.7rem' : '0.85rem',
                color: '#FFD700',
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '0.3px'
              }}>
                {(String(c.name || '').split(' ')[0]) || 'Character'}
              </span>
              {!isMobile && hasActiveConversations && c.hasActiveConversation && (
                <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.7)' }}>
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
  userCharacters = [],     // array of backend user characters
  charactersLoading,
  charactersError,
  onCreateCharacter,
  onCharacterSelect,       // (characterLite) => void
  isMobile,
  user_id
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
          border: '3px solid rgba(255, 215, 0, 0.3)',
          borderTop: '3px solid #FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <p style={{ color: 'rgba(255, 215, 0, 0.8)', fontSize: isMobile ? '0.9rem' : '1rem', margin: 0 }}>
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
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '6px',
              color: '#FFD700',
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
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
            border: '3px solid rgba(255, 215, 0, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? '32px' : '40px'
          }}>
            ✨
          </div>

          <div>
            <h3 style={{
              color: '#FFD700', fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontFamily: "'Playfair Display', serif",
              margin: '0 0 1rem 0', letterSpacing: '1px',
              textShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
            }}>
              Create Your Own Character
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
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
            window.location.href = '/subscribe';
          }}
        >
          <button
            onClick={onCreateCharacter}
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: isMobile ? '20px' : '25px',
              color: '#000',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: 700,
              padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: "'Georgia', serif",
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
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
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <h4 style={{
            color: '#FFD700', margin: '0 0 0.5rem 0',
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {userCharacters.map((c, idx) => (
          <CharacterCard
            key={c.character_key || c.key || `${c.display_name}-${idx}`}
            character={{
              key: c.character_key || c.key,
              name: c.display_name || c.name,
              description: c.short_description || c.description,
              thumbnailUrl: c.avatar_url || c.thumbnailUrl || '/images/default-character.jpg',
              status: c.status,
              rejection_reason: c.rejection_reason
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
            index={idx}
            isMobile={isMobile}
            showStatusIndicator={true}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <DefensiveCharacterCreationWrapper 
          user_id={user_id}
          onUpgradePrompt={() => {
            window.location.href = '/subscribe';
          }}
        >
        <button
          onClick={onCreateCharacter}
          style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '2px dashed rgba(255, 215, 0, 0.4)',
            borderRadius: '12px',
            color: '#FFD700',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: 600,
            padding: isMobile ? '0.8rem 1.2rem' : '1rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif"
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
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
