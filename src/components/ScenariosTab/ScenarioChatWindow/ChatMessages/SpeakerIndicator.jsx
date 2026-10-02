// src/components/ScenariosTab/ScenarioChatWindow/ChatMessages/SpeakerIndicator.jsx
import React, { useState } from 'react';
import { characterCategories } from '../../../../data/characterCategories';
import { getDisplayNameFromKey, isCustomCharacterKey } from '../../../../utils/characterUtils';

export default function SpeakerIndicator({
  characterKey,
  displayName,        // ✅ NEW: Prop from message.display_name (from backend)
  userCharacters = [],
  theme = 'light'
}) {
  const [imageError, setImageError] = useState(false);

  if (!characterKey) return null;

  // DUAL LOOKUP: Custom first, then static
  const getCharacterInfo = () => {
    // ✅ PRIORITY 1: Use displayName from backend if available
    if (displayName) {
      const isCustom = isCustomCharacterKey(characterKey);
      
      // Still try to get thumbnail from lookup
      if (isCustom) {
        const customChar = userCharacters.find(c => c.character_key === characterKey);
        return {
          name: displayName,  // ✅ Use backend name
          thumbnailUrl: customChar?.avatar_url || `/images/${characterKey}.jpg`,
          isCustom: true
        };
      } else {
        // Try to find thumbnail for static character
        for (const category of characterCategories) {
          if (category.characters) {
            const found = category.characters.find(c => c.key === characterKey);
            if (found) {
              return {
                name: displayName,  // ✅ Use backend name
                thumbnailUrl: found.thumbnailUrl,
                isCustom: false
              };
            }
          }
        }
        
        return {
          name: displayName,  // ✅ Use backend name
          thumbnailUrl: `/images/${characterKey}.jpg`,
          isCustom: false
        };
      }
    }
    
    // ✅ FALLBACK: Original lookup logic (if no displayName provided)
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
      // Static character
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

  return (
    <div className="speaker-indicator" title={charInfo.name}>
      <div className="speaker-avatar">
        {charInfo.thumbnailUrl && !imageError ? (
          <img
            src={charInfo.thumbnailUrl}
            alt={charInfo.name}
            className="speaker-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="speaker-initial">{initial}</div>
        )}
      </div>
      
      <div className="speaker-name">{charInfo.name}</div>
    </div>
  );
}