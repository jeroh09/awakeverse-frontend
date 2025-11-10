// src/components/StoryMode/StoryWindow/InviteSuggestion.jsx - UPDATED
import React, { useMemo } from 'react';
import { X, Users } from 'lucide-react';
import { characterCategories } from '../../../data/characterCategories'; // SAME IMPORT
import usePremiumCharacters from '../../../hooks/usePremiumCharacters'; // SAME HOOK
import styles from './StoryWindow.module.css';

export default function InviteSuggestion({ 
  story, 
  onInvite, 
  onDismiss 
}) {
  // SAME HOOK as CharacterSelector
  const { userCharacters = [], loading: customCharsLoading } = usePremiumCharacters();

  // SAME LOGIC as CharacterSelector to combine characters
  const allCharacters = useMemo(() => {
    const chars = [];
    const seenKeys = new Set();

    // Add static characters (SAME as CharacterSelector)
    characterCategories.forEach(category => {
      if (category.key === 'my_characters') return;
      if (Array.isArray(category.characters)) {
        category.characters.forEach(char => {
          if (!seenKeys.has(char.key)) {
            seenKeys.add(char.key);
            chars.push({
              key: char.key,
              name: char.name,
              description: char.description || char.tagline || 'Character',
              type: 'static'
            });
          }
        });
      }
    });

    // Add custom characters (SAME as CharacterSelector)
    if (!customCharsLoading && Array.isArray(userCharacters)) {
      const approvedCustomChars = userCharacters.filter(char => 
        char && char.character_key && char.status === 'approved'
      );
      
      approvedCustomChars.forEach(char => {
        if (!seenKeys.has(char.character_key)) {
          seenKeys.add(char.character_key);
          chars.push({
            key: char.character_key,
            name: char.display_name || char.character_key.charAt(0).toUpperCase() + char.character_key.slice(1),
            description: char.short_description || 'Custom character',
            type: 'custom'
          });
        }
      });
    }

    return chars;
  }, [userCharacters, customCharsLoading]);

  // Filter out characters already in story and main character
  const suggestedCharacters = allCharacters
    .filter(char => 
      !story.invited_characters?.includes(char.key) && 
      char.key !== story.main_character_key
    )
    .slice(0, 3); // Show top 3 suggestions

  // Don't show if no characters available or still loading
  if (customCharsLoading || suggestedCharacters.length === 0) {
    return null;
  }

  const handleInvite = (characterKey) => {
    onInvite(characterKey);
  };

  return (
    <div className={styles.inviteSuggestion}>
      <div className={styles.suggestionHeader}>
        <div className={styles.suggestionTitle}>
          <Users size={16} />
          <span>Add another character to the story?</span>
        </div>
        <button 
          className={styles.dismissButton}
          onClick={onDismiss}
          aria-label="Dismiss suggestion"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className={styles.characterSuggestions}>
        {suggestedCharacters.map(character => (
          <div
            key={character.key}
            className={styles.characterSuggestion}
            onClick={() => handleInvite(character.key)}
          >
            <div className={styles.characterAvatar}>
              {character.name.charAt(0)}
            </div>
            <div className={styles.characterInfo}>
              <div className={styles.characterName}>{character.name}</div>
              <div className={styles.characterDescription}>
                {character.description}
              </div>
            </div>
            <button className={styles.inviteButton}>
              Invite
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}