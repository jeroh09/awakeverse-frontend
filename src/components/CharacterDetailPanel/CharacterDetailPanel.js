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
  // Toggle between versions - remove this in production
  const [useOrganicBlob, setUseOrganicBlob] = useState(false);
  const styles = floatingGlassStyles;

  if (!character) return null;

  // ✅ FIXED: Handle both data structures with better fallbacks
  const displayName = character.name || character.display_name || character.character_key || 'Character';
  const description = character.description || character.short_description || 'No description available.';
  const imageUrl = character.thumbnailUrl || character.avatar_url || `/images/${character.character_key || character.key}.jpg`;
  const characterKey = character.key || character.character_key;

  // ✅ Debug logging to see what data we're receiving
  console.log('🔍 CharacterDetailPanel - Raw character data:', character);
  console.log('🔍 CharacterDetailPanel - Processed data:', {
    displayName,
    description,
    imageUrl,
    characterKey,
    showDiscoverAction,
    hasOnCharacterSelect: !!onCharacterSelect
  });

  // ✅ NEW: Helper function to handle both discover + chat
  const handleStartChatWithDiscover = () => {
    console.log('🚀 Starting chat with discover:', { 
      characterKey, 
      displayName,
      willAddToDiscovered: showDiscoverAction && !!onCharacterSelect
    });
    
    // Step 1: Add to discovered (if in view mode)
    if (showDiscoverAction && onCharacterSelect) {
      console.log('📌 Adding to discovered panel');
      onCharacterSelect(character);
    }
    
    // Step 2: Start chat
    console.log('💬 Opening chat window');
    onStartChat(character);
    
    // Optional: Close panel after starting chat
    // onClose();
  };

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
              console.warn('⚠️ Image load failed, using fallback:', imageUrl);
              e.target.src = '/default-avatar.jpg';
            }}
          />
          <h2 className={styles.name}>{displayName}</h2>
        </div>
        
        <div className={styles.content}>
          <p className={styles.description}>{description}</p>
          
          {/* ✅ Optional: Show character key for debugging */}
          {process.env.NODE_ENV === 'development' && characterKey && (
            <div style={{ 
              marginTop: '10px', 
              fontSize: '11px', 
              color: '#888',
              fontFamily: 'monospace'
            }}>
              Key: {characterKey}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          {/* ✅ FIXED: Start Chat button now adds to discovered first */}
          <button 
            className={styles.cta} 
            onClick={handleStartChatWithDiscover}
            title="Add to Discovered & Start Chat"
          >
            Start Chat
          </button>
          
          {/* ✅ FIXED: "+" button also uses same handler */}
          {showDiscoverAction && onCharacterSelect && (
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