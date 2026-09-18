// src/components/StoryMode/StoryCreationForm/CharacterSelector.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { characterCategories } from '../../../data/characterCategories';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters';
import { getDisplayNameFromKey, getCharacterThumbnailUrl } from '../../../utils/characterUtils';
import styles from './CharacterSelector.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export default function CharacterSelector({ 
  selectedCharacter = null, 
  onCharacterSelect
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Get custom characters from hook
  const { 
    userCharacters = [], 
    loading: customCharsLoading,
    fetchUserCharacters 
  } = usePremiumCharacters();

  // Force refresh on mount
  useEffect(() => {
    if (fetchUserCharacters) {
      console.log('📖 Story Mode: Fetching characters');
      fetchUserCharacters();
    }
  }, [fetchUserCharacters]);

  // Debug logging
  useEffect(() => {
    console.log('📖 Character Selector State:', {
      userCharacters: userCharacters,
      isArray: Array.isArray(userCharacters),
      length: userCharacters?.length || 0,
      loading: customCharsLoading
    });
  }, [userCharacters, customCharsLoading]);

  // Combine static and custom characters
  const allCharacters = useMemo(() => {
    const chars = [];
    const seenKeys = new Set();

    // Add static characters
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
              category: category.key || category.title,
              categoryTitle: category.title,
              type: 'static',
              thumbnailUrl: char.thumbnailUrl || `${API_BASE}/character_images/${char.key}.jpg`
            });
          }
        });
      }
    });

    // Add custom characters
    if (!customCharsLoading && Array.isArray(userCharacters) && userCharacters.length > 0) {
      const approvedCustomChars = userCharacters.filter(char => {
        if (!char || !char.character_key || !char.status) return false;
        return char.status === 'approved';
      });

      approvedCustomChars.forEach(char => {
        if (!seenKeys.has(char.character_key)) {
          seenKeys.add(char.character_key);
          
          const displayName = char.display_name || getDisplayNameFromKey(char.character_key);
          const thumbnailUrl = char.avatar_url || char.thumbnail_url || `/images/${char.character_key}.jpg`;
          
          chars.push({
            key: char.character_key,
            name: displayName,
            description: char.short_description || 'Custom character',
            category: 'my_characters',
            categoryTitle: 'My Characters',
            type: 'custom',
            thumbnailUrl: thumbnailUrl
          });
        }
      });
    }

    console.log('📖 Final character list:', {
      total: chars.length,
      static: chars.filter(c => c.type === 'static').length,
      custom: chars.filter(c => c.type === 'custom').length
    });

    return chars;
  }, [userCharacters, customCharsLoading]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(allCharacters.map(char => char.category));
    const catArray = Array.from(cats);
    
    const sortedCats = catArray.sort((a, b) => {
      if (a === 'my_characters') return -1;
      if (b === 'my_characters') return 1;
      return a.localeCompare(b);
    });
    
    return ['all', ...sortedCats];
  }, [allCharacters]);

  // Get category display name
  const getCategoryDisplayName = (categoryKey) => {
    if (categoryKey === 'all') return 'All Characters';
    if (categoryKey === 'my_characters') return '⭐ My Characters';
    
    const category = characterCategories.find(cat => cat.key === categoryKey);
    return category?.title || categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
  };

  // Filter characters
  const filteredCharacters = useMemo(() => {
    let filtered = allCharacters;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(char => char.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(char => 
        char.name.toLowerCase().includes(query) ||
        char.description.toLowerCase().includes(query) ||
        char.key.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allCharacters, selectedCategory, searchQuery]);

  // Handle character click
  const handleCharacterClick = (characterKey) => {
    onCharacterSelect(characterKey);
  };

  const isSelected = (characterKey) => selectedCharacter === characterKey;

  return (
    <div className={styles.characterSelector}>
      {/* Search and Filter Bar */}
      <div className={styles.selectorControls}>
        <input
          type="text"
          placeholder="Search characters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.characterSearch}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.categoryFilter}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {getCategoryDisplayName(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* Character Grid */}
      <div className={styles.charactersGrid}>
        {filteredCharacters.length === 0 ? (
          <div className={styles.emptyResults}>
            <p>No characters found</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={styles.clearSearchButton}
              >
                Clear search
              </button>
            )}
            {selectedCategory === 'my_characters' && !customCharsLoading && (
              <p className={styles.hint}>
                No custom characters yet. Create one in the Creator Hub!
              </p>
            )}
          </div>
        ) : (
          filteredCharacters.map(character => {
            const selected = isSelected(character.key);

            return (
              <div
                key={character.key}
                className={`${styles.characterOption} ${selected ? styles.selected : ''}`}
                onClick={() => handleCharacterClick(character.key)}
                title={character.name}
              >
                {/* Character Avatar */}
                <div className={styles.characterAvatar}>
                  {character.thumbnailUrl ? (
                    <img 
                      src={character.thumbnailUrl} 
                      alt={character.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={styles.characterAvatarFallback}
                    style={{ display: character.thumbnailUrl ? 'none' : 'flex' }}
                  >
                    {character.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {character.type === 'custom' && (
                    <span className={styles.customBadge}>⭐</span>
                  )}
                </div>

                {/* Character Info */}
                <div className={styles.characterInfo}>
                  <div className={styles.characterName}>{character.name}</div>
                  <div className={styles.characterDescription}>
                    {character.description}
                  </div>
                </div>

                {/* Selection Indicator */}
                {selected && (
                  <div className={styles.selectedIndicator}>✓</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Helper Text */}
      <div className={styles.selectorHint}>
        <span className={styles.hintIcon}>💡</span>
        Select a character to be the protagonist of your story.
      </div>
    </div>
  );
}