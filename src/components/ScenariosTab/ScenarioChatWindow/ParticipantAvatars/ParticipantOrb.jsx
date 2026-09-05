// src/components/ScenariosTab/ScenarioChatWindow/ParticipantAvatars/ParticipantOrb.jsx - WITH QUEUED
import React, { useState } from 'react';
import EmotionRing from './EmotionRing';
import { characterCategories } from '../../../../data/characterCategories';
import { getDisplayNameFromKey, isCustomCharacterKey } from '../../../../utils/characterUtils';

export default function ParticipantOrb({
  characterKey,
  userCharacters = [],
  isActive = false,
  isQueued = false,
  index = 0,
  theme = 'light'
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
    'participant-orb',
    isActive && 'active',
    isQueued && 'queued'
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
      <div className="orb-ring-wrapper">
        <EmotionRing
          color={isActive || isQueued ? '#FFD700' : '#3498db'}
          intensity={isActive ? 0.9 : isQueued ? 0.75 : 0.6}
          breathingSpeed={isActive ? 2 : isQueued ? 1.5 : 1}
          breathingScale={isActive ? 1.08 : isQueued ? 1.05 : 1.03}
          isActive={isActive}
          isQueued={isQueued}
          onClick={() => {}}
        />
        
        <div className="orb-avatar">
          {charInfo.thumbnailUrl && !imageError ? (
            <img
              src={charInfo.thumbnailUrl}
              alt={charInfo.name}
              className="orb-image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="orb-initial">{initial}</div>
          )}
        </div>

        {/* Speaking indicator dot - ONLY for active, not queued */}
        {isActive && (
          <div 
            className="speaking-indicator"
            role="status"
            aria-label="Speaking"
          />
        )}
      </div>

      <div className="orb-label">{charInfo.name}</div>
    </div>
  );
}