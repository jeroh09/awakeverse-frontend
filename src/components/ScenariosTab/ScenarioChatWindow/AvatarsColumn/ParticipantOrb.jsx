// src/components/ScenariosTab/ScenarioChatWindow/AvatarsColumn/ParticipantOrb.jsx
// Individual participant orb with avatar, ring, and label

import React, { useState } from 'react';
import EmotionRing from './EmotionRing';
import { characterCategories } from '../../../../data/characterCategories';
import { getDisplayNameFromKey, isCustomCharacterKey } from '../../../../utils/characterUtils';
import styles from './AvatarsColumn.module.css';

export default function ParticipantOrb({
  characterKey,
  userCharacters = [],
  isActive = false,
  isQueued = false,
  index = 0
}) {
  const [imageError, setImageError] = useState(false);

  if (!characterKey) return null;

  // DUAL LOOKUP: Custom first, then static
  const getCharacterInfo = () => {
    const isCustom = isCustomCharacterKey(characterKey);
    
    if (isCustom) {
      const customChar = userCharacters.find(c => c.character_key === characterKey);
      
      if (customChar) {
        return {
          name: customChar.display_name,
          thumbnailUrl: customChar.avatar_url,
          isCustom: true
        };
      }
      
      return {
        name: getDisplayNameFromKey(characterKey),
        thumbnailUrl: `/images/${characterKey}.jpg`,
        isCustom: true
      };
    } else {
      // Static character - loop through characterCategories
      for (const category of characterCategories) {
        if (category.characters) {
          const found = category.characters.find(c => c.key === characterKey);
          if (found) {
            return {
              name: found.name,
              thumbnailUrl: found.thumbnailUrl,
              isCustom: false
            };
          }
        }
      }
      
      return {
        name: characterKey,
        thumbnailUrl: `/images/${characterKey}.jpg`,
        isCustom: false
      };
    }
  };

  const charInfo = getCharacterInfo();
  const initial = charInfo.name.charAt(0).toUpperCase();
  const animationDelay = `${index * 0.1}s`;

  // Build className with state
  const orbClassName = [
    styles.participantOrb,
    isActive && styles.active,
    isQueued && styles.queued
  ].filter(Boolean).join(' ');

  // Determine aria-label
  let ariaLabel = charInfo.name;
  if (isActive) ariaLabel += ' - currently speaking';
  else if (isQueued) ariaLabel += ' - will speak next';

  return (
    <div 
      className={orbClassName}
      style={{ animationDelay }}
      role="listitem"
      aria-label={ariaLabel}
    >
      <div className={styles.orbRingWrapper}>
        <EmotionRing
          isActive={isActive}
          isQueued={isQueued}
        />
        
        <div className={styles.orbAvatar}>
          {charInfo.thumbnailUrl && !imageError ? (
            <img
              src={charInfo.thumbnailUrl}
              alt={charInfo.name}
              className={styles.orbImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.orbInitial}>{initial}</div>
          )}
        </div>

        {/* Speaking indicator dot - ONLY for active, not queued */}
        {isActive && (
          <div 
            className={styles.speakingIndicator}
            role="status"
            aria-label="Speaking"
          />
        )}
      </div>

      <div className={styles.orbLabel}>{charInfo.name}</div>
    </div>
  );
}