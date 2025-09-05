// src/components/CharacterDetailPanel/CharacterDetailPanel.js
import React, { useState } from 'react';
import floatingGlassStyles from './CharacterDetailPanel.module.css';

const CharacterDetailPanel = ({ character, onClose, onStartChat }) => {
  // Toggle between versions - remove this in production
  const [useOrganicBlob, setUseOrganicBlob] = useState(false);
  const styles = useOrganicBlob ? organicBlobStyles : floatingGlassStyles;

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
              background: useOrganicBlob ? '#10b981' : '#6366f1',
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
            {useOrganicBlob ? 'Blob' : 'Glass'}
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
        </div>
      </aside>
    </>
  );
};

export default CharacterDetailPanel;