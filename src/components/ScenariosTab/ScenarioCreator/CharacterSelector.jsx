// src/components/ScenariosTab/ScenarioCreator/CharacterSelector.jsx - FINAL FIX WITH DISPLAY NAMES
import React, { useState, useMemo, useEffect } from 'react';
import { characterCategories } from '../../../data/characterCategories';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters';
import { getDisplayNameFromKey, getCharacterThumbnailUrl } from '../../../utils/characterUtils';
import './CharacterSelector.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export default function CharacterSelector({ 
  selectedCharacters = [], 
  onCharacterToggle,
  maxCharacters = 4 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Get custom characters from hook - FIXED: Proper destructuring
  const { 
    userCharacters = [], 
    loading: customCharsLoading,
    fetchUserCharacters 
  } = usePremiumCharacters();

  // Force refresh on mount to ensure fresh data
  useEffect(() => {
    if (fetchUserCharacters) {
      console.log('🔄 Forcing character refresh on mount');
      fetchUserCharacters();
    }
  }, [fetchUserCharacters]);

  // Debug logging with proper checks
  useEffect(() => {
    console.log('🎭 CharacterSelector State:', {
      userCharacters: userCharacters,
      isArray: Array.isArray(userCharacters),
      length: userCharacters?.length || 0,
      loading: customCharsLoading,
      sample: userCharacters?.[0] || 'none'
    });
  }, [userCharacters, customCharsLoading]);

  // Combine static and custom characters - FIXED: Don't build if still loading
  const allCharacters = useMemo(() => {
    // Wait for custom characters to finish loading
    if (customCharsLoading) {
      console.log('⏳ Still loading custom characters...');
      // Return only static characters for now
      const chars = [];
      const seenKeys = new Set();
      
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
      
      return chars;
    }
    
    // Custom characters finished loading - build full list
    const chars = [];
    const seenKeys = new Set();

    // Add static characters
    characterCategories.forEach(category => {
      if (category.key === 'my_characters') {
        return; // Skip - we populate this separately
      }

      if (Array.isArray(category.characters)) {
        category.characters.forEach(char => {
          // FIXED: Deduplicate by key
          if (!seenKeys.has(char.key)) {
            seenKeys.add(char.key);
            chars.push({
              key: char.key,
              name: char.name, // Already has proper display name
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

    // Add custom characters - FIXED: Proper display names and thumbnails
    if (Array.isArray(userCharacters) && userCharacters.length > 0) {
      const approvedCustomChars = userCharacters.filter(char => {
        // Defensive checks
        if (!char) return false;
        if (!char.character_key) {
          console.warn('⚠️ Character missing character_key:', char);
          return false;
        }
        if (!char.status) {
          console.warn('⚠️ Character missing status:', char);
          return false;
        }
        return char.status === 'approved';
      });

      console.log('✅ Processing custom characters:', {
        total: userCharacters.length,
        approved: approvedCustomChars.length,
        details: approvedCustomChars.map(c => ({
          key: c.character_key,
          rawName: c.display_name,
          extractedName: getDisplayNameFromKey(c.character_key),
          status: c.status
        }))
      });

      approvedCustomChars.forEach(char => {
        // FIXED: Prevent duplicate custom characters too
        if (!seenKeys.has(char.character_key)) {
          seenKeys.add(char.character_key);
          
          // FIXED: Use avatar_url from API response (already includes /images/ path)
          const displayName = char.display_name || getDisplayNameFromKey(char.character_key);
          const thumbnailUrl = char.avatar_url || char.thumbnail_url || `/images/${char.character_key}.jpg`;
          
          console.log('✅ Adding custom character:', {
            key: char.character_key,
            displayName: displayName,
            thumbnailUrl: thumbnailUrl,
            hasAvatarUrl: !!char.avatar_url
          });
          
          chars.push({
            key: char.character_key,
            name: displayName, // "Dorothy Gale"
            description: char.short_description || 'Custom character',
            category: 'my_characters',
            categoryTitle: 'My Characters',
            type: 'custom',
            thumbnailUrl: thumbnailUrl // Use avatar_url from API
          });
        }
      });
    } else {
      console.log('ℹ️ No custom characters to add:', {
        isArray: Array.isArray(userCharacters),
        length: userCharacters?.length,
        loading: customCharsLoading
      });
    }

    console.log('📚 Final character list:', {
      total: chars.length,
      static: chars.filter(c => c.type === 'static').length,
      custom: chars.filter(c => c.type === 'custom').length,
      customDetails: chars.filter(c => c.type === 'custom').map(c => ({
        key: c.key,
        name: c.name,
        thumbnail: c.thumbnailUrl
      }))
    });

    return chars;
  }, [userCharacters, customCharsLoading]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(allCharacters.map(char => char.category));
    const catArray = Array.from(cats);
    
    // Sort: my_characters first, then alphabetical
    const sortedCats = catArray.sort((a, b) => {
      if (a === 'my_characters') return -1;
      if (b === 'my_characters') return 1;
      return a.localeCompare(b);
    });
    
    return ['all', ...sortedCats];
  }, [allCharacters]);

  // Get category display name
  const getCategoryDisplayName = (categoryKey) => {
    if (categoryKey === 'all') return 'All Categories';
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
    const isSelected = selectedCharacters.includes(characterKey);
    const atMaxCapacity = selectedCharacters.length >= maxCharacters;

    if (!isSelected && atMaxCapacity) {
      return;
    }

    onCharacterToggle(characterKey);
  };

  const isSelected = (characterKey) => selectedCharacters.includes(characterKey);
  const selectionFull = selectedCharacters.length >= maxCharacters;

  return (
    <div className="character-selector">
      {/* Debug Panel - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          padding: '0.75rem', 
          background: 'rgba(52, 152, 219, 0.1)', 
          border: '1px solid rgba(52, 152, 219, 0.3)',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          color: 'var(--scenarios-text-primary)'
        }}>
          <div><strong>🔍 Debug Info:</strong></div>
          <div>Hook Characters: {userCharacters?.length || 0}</div>
          <div>Custom in List: {allCharacters.filter(c => c.type === 'custom').length}</div>
          <div>Loading: {customCharsLoading ? 'Yes' : 'No'}</div>
          {userCharacters?.length > 0 && (
            <div>Sample: {userCharacters[0]?.display_name || 'N/A'} ({userCharacters[0]?.status})</div>
          )}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="selector-controls">
        <input
          type="text"
          placeholder="Search characters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="character-search"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {getCategoryDisplayName(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* Selection Status */}
      <div className="selection-status">
        <span className="status-text">
          {selectedCharacters.length} / {maxCharacters} characters selected
        </span>
        {selectionFull && (
          <span className="status-warning">
            Maximum reached
          </span>
        )}
      </div>

      {/* Character Grid */}
      <div className="characters-grid">
        {filteredCharacters.length === 0 ? (
          <div className="empty-results">
            <p>No characters found</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="clear-search-button"
              >
                Clear search
              </button>
            )}
            {selectedCategory === 'my_characters' && !customCharsLoading && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--scenarios-text-secondary)' }}>
                No custom characters yet. Create one in the Creator Hub!
              </p>
            )}
          </div>
        ) : (
          filteredCharacters.map(character => {
            const selected = isSelected(character.key);
            const disabled = !selected && selectionFull;

            return (
              <div
                key={character.key}
                className={`character-option ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && handleCharacterClick(character.key)}
                title={character.name}
              >
                {/* Character Avatar - FIXED: Shows image or fallback */}
                <div className="character-avatar">
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
                    className="character-avatar-fallback"
                    style={{ display: character.thumbnailUrl ? 'none' : 'flex' }}
                  >
                    {character.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {character.type === 'custom' && (
                    <span className="custom-badge">⭐</span>
                  )}
                </div>

                {/* Character Info */}
                <div className="character-info">
                  <div className="character-name">{character.name}</div>
                  <div className="character-description">
                    {character.description}
                  </div>
                </div>

                {/* Selection Indicator */}
                {selected && (
                  <div className="selected-indicator">✓</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Helper Text */}
      <div className="selector-hint">
        <span className="hint-icon">💡</span>
        Click characters to add or remove them from your scenario. 
        You need at least 2 characters to create a debate.
      </div>
    </div>
  );
}