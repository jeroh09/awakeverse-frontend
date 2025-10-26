// src/components/CharacterDetailPanel/CharacterDetailPanel.js - UPDATED VERSION
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
  const styles = floatingGlassStyles; // Remove the toggle logic for now

  if (!character) return null;

  // 🆕 ADD: Handle both data structures
  const displayName = character.name || character.display_name || 'Character';
  const description = character.description || character.short_description || 'No description available.';
  const imageUrl = character.thumbnailUrl || character.avatar_url || '/default-avatar.jpg';
  const characterKey = character.key || character.character_key;

  // 🆕 ADD: Debug logging to see what data we're receiving
  console.log('🔍 CharacterDetailPanel - Raw character data:', character);
  console.log('🔍 CharacterDetailPanel - Processed data:', {
    displayName,
    description,
    imageUrl,
    characterKey
  });

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
        </div>
        
        <div className={styles.footer}>
          <button className={styles.cta} onClick={() => onStartChat(character)}>
            Start Chat
          </button>
          
          {showDiscoverAction && onCharacterSelect && (
            <button 
              className={`${styles.iconButton} ${styles.tooltip}`}
              onClick={() => onCharacterSelect(character)}
              aria-label="Add to Discovered"
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