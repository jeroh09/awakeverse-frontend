// src/components/MobileCharacterView.jsx - INDEPENDENT MOBILE UPGRADE SYSTEM
import React, { useState } from 'react';
import MobileCharacterGrid from './MobileCharacterGrid';
import DefensiveCharacterCreationWrapper from './DefensiveCharacterCreationWrapper';
import DualPathUpgradeSystem from './DualPathUpgradeSystem'; // NEW: Import the upgrade system
import theme from '../design-system/tokens';

// AwakeVerse "Your IP." wordmark used in mobile empty-state CTA.
// Uses Caveat (already imported globally by you).
const YourIPWordmark = ({ isMobile = true }) => (
  <div
    style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }}
  >
    <span
      aria-hidden="true"
      style={{
        fontFamily: "'Caveat', cursive",
        fontStyle: 'italic',
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '0.4px',
        fontSize: isMobile ? '40px' : '44px',
        userSelect: 'none',
        whiteSpace: 'nowrap'
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
        height: '4px',
        width: isMobile ? '170px' : '190px',
        borderRadius: theme.borderRadius.full,
        background: `linear-gradient(90deg, ${theme.colors.accent.primary} 0%, ${theme.colors.brand.ivory} 85%)`,
        opacity: 0.95,
        // Taper effect
        clipPath: 'polygon(0 0, 100% 35%, 100% 65%, 0 100%)'
      }}
    />
  </div>
);

const MobileCharacterView = ({
  selectedCategory,
  userCharacters,
  charactersLoading,
  charactersError,
  onCreateCharacter,
  onCharacterSelect,
  // REMOVED: onShowUpgradeModal - no longer needed
  user_id
}) => {
  // Mobile manages its own upgrade modal state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('general');

  // Mobile upgrade handlers
  const handleShowUpgradeModal = (reason = 'general') => {
    setUpgradeReason(reason);
    setUpgradeModalOpen(true);
  };

  const handleCloseUpgradeModal = () => {
    setUpgradeModalOpen(false);
    setUpgradeReason('general');
  };

  if (!selectedCategory) return null;

  // Loading state
  if (charactersLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          textAlign: 'center',
          width: '100%'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: `3px solid ${theme.colors.accent.glow}`,
            borderTop: `3px solid ${theme.colors.accent.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}
        />
        <p
          style={{
            color: theme.colors.brand.ivoryDim,
            fontSize: '0.9rem',
            margin: 0,
            fontFamily: theme.typography.fonts.body
          }}
        >
          Loading characters...
        </p>
      </div>
    );
  }

  // Error state
  if (charactersError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          textAlign: 'center',
          padding: '1rem',
          width: '100%'
        }}
      >
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.10)',
            border: `1px solid rgba(239, 68, 68, 0.30)`,
            borderRadius: theme.borderRadius.md,
            padding: '1rem',
            marginBottom: '1rem'
          }}
        >
          <p
            style={{
              color: theme.colors.semantic.error,
              fontSize: '0.9rem',
              margin: '0 0 0.5rem 0',
              fontFamily: theme.typography.fonts.body
            }}
          >
            {charactersError}
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              background: theme.colors.accent.glow,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.borderRadius.sm,
              color: theme.colors.brand.ivory,
              fontSize: '0.8rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontFamily: theme.typography.fonts.body,
              boxShadow: theme.shadows.elevation02
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // My Characters empty state
  if (selectedCategory.key === 'my_characters' && userCharacters.length === 0) {
    return (
      <>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            textAlign: 'center',
            padding: '1rem',
            width: '100%'
          }}
        >
          <div
            style={{
              maxWidth: '300px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem'
            }}
          >
            {/* Replace ✨ with the mobile "Your IP." mark (no circle to prevent wrapping) */}
            <YourIPWordmark isMobile />

            <div>
              <h3
                style={{
                  color: theme.colors.brand.ivory,
                  fontSize: '1.3rem',
                  fontFamily: theme.typography.fonts.display,
                  margin: '0 0 1rem 0',
                  letterSpacing: '1px',
                  textShadow: `0 0 18px ${theme.colors.accent.glowStrong}`
                }}
              >
                Create Your Own Character
              </h3>

              <p
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  margin: '0 0 2rem 0',
                  fontFamily: theme.typography.fonts.body
                }}
              >
                Design a custom AI character with unique personality, expertise, and backstory.
                From historical figures to original creations — bring your vision to life.
              </p>
            </div>

            <DefensiveCharacterCreationWrapper
              user_id={user_id}
              onUpgradePrompt={() => handleShowUpgradeModal('character_limit')}
            >
              <button
                onClick={onCreateCharacter}
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.hover})`,
                  border: 'none',
                  borderRadius: theme.borderRadius.xl,
                  color: theme.colors.brand.ivory,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  padding: '0.8rem 1.5rem',
                  cursor: 'pointer',
                  fontFamily: theme.typography.fonts.body,
                  boxShadow: theme.shadows.elevation03
                }}
              >
                Start Creating
              </button>
            </DefensiveCharacterCreationWrapper>
          </div>
        </div>

        {/* Mobile's own upgrade modal */}
        <DualPathUpgradeSystem
          isOpen={upgradeModalOpen}
          onClose={handleCloseUpgradeModal}
          triggerReason={upgradeReason}
          currentUsage={null}
        />
      </>
    );
  }

  // Status summary for My Characters
  const renderStatusSummary = () => {
    if (selectedCategory.key !== 'my_characters') return null;

    const approvedCharacters = userCharacters.filter((c) => c.status === 'approved');
    const pendingCharacters = userCharacters.filter((c) => c.status === 'pending');
    const rejectedCharacters = userCharacters.filter((c) => c.status === 'rejected');

    if (pendingCharacters.length === 0 && rejectedCharacters.length === 0) return null;

    return (
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '0.8rem',
          background: `${theme.colors.background.surface}66`,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors.border.medium}`
        }}
      >
        <h4
          style={{
            color: theme.colors.brand.ivory,
            margin: '0 0 0.5rem 0',
            fontSize: '0.8rem',
            textAlign: 'center',
            fontFamily: theme.typography.fonts.display,
            letterSpacing: '0.06em'
          }}
        >
          Character Status Summary
        </h4>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}
        >
          {approvedCharacters.length > 0 && (
            <span
              style={{
                background: theme.colors.semantic.success,
                color: '#fff',
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border.subtle}`,
                fontFamily: theme.typography.fonts.body
              }}
            >
              {approvedCharacters.length} Ready ✓
            </span>
          )}

          {pendingCharacters.length > 0 && (
            <span
              style={{
                background: theme.colors.semantic.warning,
                color: '#fff',
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border.subtle}`,
                fontFamily: theme.typography.fonts.body
              }}
            >
              {pendingCharacters.length} Pending ⏳
            </span>
          )}

          {rejectedCharacters.length > 0 && (
            <span
              style={{
                background: theme.colors.semantic.error,
                color: '#fff',
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border.subtle}`,
                fontFamily: theme.typography.fonts.body
              }}
            >
              {rejectedCharacters.length} Need Revision ❌
            </span>
          )}
        </div>
      </div>
    );
  };

  // Create button for My Characters
  const renderCreateButton = () => {
    if (selectedCategory.key !== 'my_characters') return null;

    return (
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <DefensiveCharacterCreationWrapper
          user_id={user_id}
          onUpgradePrompt={() => handleShowUpgradeModal('character_limit')}
        >
          <button
            onClick={onCreateCharacter}
            style={{
              background: theme.colors.accent.glow,
              border: `2px dashed ${theme.colors.accent.hover}66`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.brand.ivory,
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.8rem 1.2rem',
              cursor: 'pointer',
              fontFamily: theme.typography.fonts.body,
              boxShadow: theme.shadows.elevation02
            }}
          >
            Create New Character
          </button>
        </DefensiveCharacterCreationWrapper>
      </div>
    );
  };

  // Character data preparation
  const characters =
    selectedCategory.key === 'my_characters'
      ? userCharacters.map((c) => ({
          key: c.character_key || c.key,
          name: c.display_name || c.name,
          description: c.short_description || c.description,
          thumbnailUrl: c.avatar_url || c.thumbnailUrl || null,
          status: c.status,
          rejection_reason: c.rejection_reason
        }))
      : selectedCategory.characters;

  return (
    <>
      <div style={{ width: '100%' }}>
        {renderStatusSummary()}
        <MobileCharacterGrid
          characters={characters}
          onCharacterSelect={onCharacterSelect}
          showStatusIndicator={selectedCategory.key === 'my_characters'}
        />
        {renderCreateButton()}
      </div>

      {/* Mobile's own upgrade modal - always rendered */}
      <DualPathUpgradeSystem
        isOpen={upgradeModalOpen}
        onClose={handleCloseUpgradeModal}
        triggerReason={upgradeReason}
        currentUsage={null}
      />
    </>
  );
};

export default MobileCharacterView;
