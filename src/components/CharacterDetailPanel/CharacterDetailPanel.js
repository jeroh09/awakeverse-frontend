// src/components/CharacterDetailPanel/CharacterDetailPanel.js - FIXED VERSION
import React, { useState } from 'react';
import floatingGlassStyles from './CharacterDetailPanel.module.css';

const CharacterDetailPanel = ({ 
  character, 
  onClose, 
  onStartChat, 
  onCharacterSelect,
  showDiscoverAction
}) => {
  const [useOrganicBlob, setUseOrganicBlob] = useState(false);
  const styles = floatingGlassStyles;

  if (!character) return null;

  // ✅ FIXED: Handle both data structures with better fallbacks
  const displayName = character.name || character.display_name || character.character_key || 'Character';
  const description = character.description || character.short_description || 'No description available.';
  const imageUrl = character.thumbnailUrl || character.avatar_url || `/images/${character.character_key || character.key}.jpg`;
  const characterKey = character.key || character.character_key;

  // ✅ Debug logging
  console.log('🔍 CharacterDetailPanel - Props:', {
    showDiscoverAction,
    hasOnCharacterSelect: !!onCharacterSelect,
    characterName: displayName
  });

  // ✅ NEW: Helper function to handle both discover + chat
  const handleStartChatWithDiscover = () => {
    // Step 1: Add to discovered (if in view mode)
    if (showDiscoverAction && onCharacterSelect) {
      onCharacterSelect(character);
    }
    
    // Step 2: Start chat
    onStartChat(character);
  };

  // Check if we should show the discover button
  const shouldShowDiscoverButton = showDiscoverAction && onCharacterSelect;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.panel} role="dialog" aria-modal="true">
        {/* Development toggle - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={() => setUseOrganicBlob(!useOrganicBlob)}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '11px',
              cursor: 'pointer',
              zIndex: 999,
              fontWeight: '600'
            }}
          >
            Glass
          </button>
        )}

        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
        
        <div className={styles.header}>
          <img
            src={imageUrl}
            alt={displayName}
            className={styles.panelImage}
            onError={(e) => {
              e.target.src = '/default-avatar.jpg';
            }}
          />
          <h2 className={styles.name}>{displayName}</h2>
        </div>
        
        <div className={styles.content}>
          <p className={styles.description}>{description}</p>
          
          {/* ✅ ALWAYS VISIBLE DEBUG INFO */}
          <div style={{ 
            marginTop: '15px', 
            padding: '10px',
            background: 'rgba(255,215,0,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#FFD700',
            fontFamily: 'monospace',
            border: '1px solid rgba(255,215,0,0.3)'
          }}>
            <div><strong>Debug Info:</strong></div>
            <div>showDiscoverAction: <span style={{color: showDiscoverAction ? '#10b981' : '#ef4444'}}>{String(showDiscoverAction)}</span></div>
            <div>onCharacterSelect: <span style={{color: onCharacterSelect ? '#10b981' : '#ef4444'}}>{onCharacterSelect ? 'EXISTS' : 'MISSING'}</span></div>
            <div>Discover Button: <span style={{color: shouldShowDiscoverButton ? '#10b981' : '#ef4444'}}>{shouldShowDiscoverButton ? 'VISIBLE' : 'HIDDEN'}</span></div>
          </div>
        </div>
        
        <div className={styles.footer}>
          <button 
            className={styles.cta} 
            onClick={handleStartChatWithDiscover}
            title="Add to Discovered & Start Chat"
          >
            Start Chat
          </button>
          
          {/* ✅ FIXED: Only show when conditions are met */}
          {shouldShowDiscoverButton && (
            <button 
              className={`${styles.iconButton} ${styles.tooltip}`}
              onClick={handleStartChatWithDiscover}
              aria-label="Add to Discovered & Chat"
              title="Add to Discovered & Start Chat"
            >
              +
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default CharacterDetailPanel;