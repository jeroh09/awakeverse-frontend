// src/components/MobileCharacterView.jsx - INDEPENDENT MOBILE UPGRADE SYSTEM
import React, { useState } from 'react';
import MobileCharacterGrid from './MobileCharacterGrid';
import DefensiveCharacterCreationWrapper from './DefensiveCharacterCreationWrapper';
import DualPathUpgradeSystem from './DualPathUpgradeSystem'; // NEW: Import the upgrade system

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
  // NEW: Mobile manages its own upgrade modal state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('general');

  // NEW: Mobile upgrade handlers
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
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '300px', 
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{
          width: '32px', 
          height: '32px',
          border: '3px solid rgba(255, 215, 0, 0.3)',
          borderTop: '3px solid #FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <p style={{ 
          color: 'rgba(255, 215, 0, 0.8)', 
          fontSize: '0.9rem', 
          margin: 0 
        }}>
          Loading characters...
        </p>
      </div>
    );
  }

  // Error state
  if (charactersError) {
    return (
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '300px', 
        textAlign: 'center', 
        padding: '1rem',
        width: '100%'
      }}>
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <p style={{ 
            color: '#ff6b6b', 
            fontSize: '0.9rem', 
            margin: '0 0 0.5rem 0' 
          }}>
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

  // My Characters empty state
  if (selectedCategory.key === 'my_characters' && userCharacters.length === 0) {
    return (
      <>
        <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '300px', 
          textAlign: 'center', 
          padding: '1rem', 
          width: '100%'
        }}>
          <div style={{ 
            maxWidth: '300px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1.5rem' 
          }}>
            <div style={{
              width: '80px', 
              height: '80px', 
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
              border: '3px solid rgba(255, 215, 0, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '32px'
            }}>
              ✨
            </div>

            <div>
              <h3 style={{
                color: '#FFD700', 
                fontSize: '1.3rem', 
                fontFamily: "'Playfair Display', serif",
                margin: '0 0 1rem 0', 
                letterSpacing: '1px', 
                textShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
              }}>
                Create Your Own Character
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '0.9rem', 
                lineHeight: 1.6, 
                margin: '0 0 2rem 0' 
              }}>
                Design a custom AI character with unique personality, expertise, and backstory.
                From historical figures to original creations — bring your vision to life.
              </p>
            </div>

            <DefensiveCharacterCreationWrapper 
              user_id={user_id}
              onUpgradePrompt={() => handleShowUpgradeModal('character_limit')} // NEW: Uses local handler
            >
              <button
                onClick={onCreateCharacter}
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '20px',
                  color: '#000',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  padding: '0.8rem 1.5rem',
                  cursor: 'pointer',
                  fontFamily: "'Georgia', serif",
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                }}
              >
                Start Creating
              </button>
            </DefensiveCharacterCreationWrapper>
          </div>
        </div>

        {/* NEW: Mobile's own upgrade modal */}
        <DualPathUpgradeSystem
          isOpen={upgradeModalOpen}
          onClose={handleCloseUpgradeModal}
          triggerReason={upgradeReason}
          currentUsage={null}
        />
      </>
    );
  }

  // Status summary for My Characters - MOVED TO TOP RIGHT
  const renderStatusSummary = () => {
    if (selectedCategory.key !== 'my_characters') return null;
    
    const approvedCharacters = userCharacters.filter(c => c.status === 'approved');
    const pendingCharacters = userCharacters.filter(c => c.status === 'pending');
    const rejectedCharacters = userCharacters.filter(c => c.status === 'rejected');

    if (pendingCharacters.length === 0 && rejectedCharacters.length === 0) return null;

    return (
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(11, 20, 38, 0.9)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '8px',
        padding: '0.5rem',
        zIndex: 10,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '0.25rem', 
          flexDirection: 'column'
        }}>
          {approvedCharacters.length > 0 && (
            <span style={{
              background: '#28a745', 
              color: '#fff',
              fontSize: '0.6rem',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap'
            }}>
              <span>✓</span>
              {approvedCharacters.length} Ready
            </span>
          )}
          {pendingCharacters.length > 0 && (
            <span style={{
              background: '#FFA500', 
              color: '#fff',
              fontSize: '0.6rem',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap'
            }}>
              <span>⏳</span>
              {pendingCharacters.length} Pending
            </span>
          )}
          {rejectedCharacters.length > 0 && (
            <span style={{
              background: '#ff6b6b', 
              color: '#fff',
              fontSize: '0.6rem',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap'
            }}>
              <span>❌</span>
              {rejectedCharacters.length} Fix
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
          onUpgradePrompt={() => handleShowUpgradeModal('character_limit')} // NEW: Uses local handler
        >
          <button
            onClick={onCreateCharacter}
            style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '2px dashed rgba(255, 215, 0, 0.4)',
              borderRadius: '12px',
              color: '#FFD700',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.8rem 1.2rem',
              cursor: 'pointer',
              fontFamily: "'Georgia', serif"
            }}
          >
            Create New Character
          </button>
        </DefensiveCharacterCreationWrapper>
      </div>
    );
  };

  // Character data preparation
  const characters = selectedCategory.key === 'my_characters' 
    ? userCharacters.map(c => ({
        key: c.character_key || c.key,
        name: c.display_name || c.name,
        description: c.short_description || c.description,
        thumbnailUrl: c.avatar_url || c.thumbnailUrl || '/images/default-character.jpg',
        status: c.status,
        rejection_reason: c.rejection_reason
      }))
    : selectedCategory.characters;

  return (
    <>
      <div style={{ width: '100%', position: 'relative' }}>
        {renderStatusSummary()}
        <MobileCharacterGrid
          characters={characters}
          onCharacterSelect={onCharacterSelect}
          showStatusIndicator={selectedCategory.key === 'my_characters'}
        />
        {renderCreateButton()}
      </div>

      {/* NEW: Mobile's own upgrade modal - always rendered */}
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