// src/components/CharacterDetailPanel/CharacterDetailPanel.js
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
            src={character.thumbnailUrl}
            alt={character.name}
            className={styles.panelImage}
          />
          <h2 className={styles.name}>{character.name}</h2>
        </div>
        
        <div className={styles.content}>
          <p className={styles.description}>{character.description}</p>
        </div>
        
        <div className={styles.footer}>
          <button className={styles.cta} onClick={() => onStartChat(character.key)}>
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