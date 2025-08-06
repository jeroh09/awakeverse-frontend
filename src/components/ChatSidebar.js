// src/components/ChatSidebar.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useInteractedCharacters from '../hooks/useInteractedCharacters';
import { characterCategories } from '../data/characterCategories';
import './ChatSidebar.css';

export default function ChatSidebar({
  current,
  onSelect,
  isOpen,
  toggleSidebar
}) {
  const { interactedCharacters, loading } = useInteractedCharacters();
  const sidebarRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Debug logging to track what we're receiving
  useEffect(() => {
    console.log('🔍 Interacted characters received:', interactedCharacters);
    console.log('🔍 Current character:', current);
  }, [interactedCharacters, current]);

  // ✅ Fixed: safely resolves undefined/invalid character keys
  const getCharacterDisplayName = (characterKey) => {
    if (!characterKey || typeof characterKey !== 'string') {
      console.warn('⚠️ Invalid character key:', characterKey);
      return 'Select character';
    }
    
    const normalizedKey = characterKey.toLowerCase().trim();
    
    for (const category of characterCategories) {
      const character = category.characters.find(c => 
        c.key && c.key.toLowerCase().trim() === normalizedKey
      );
      if (character) {
        console.log('✅ Found character:', character.name, 'for key:', normalizedKey);
        return character.name;
      }
    }
    
    console.warn('⚠️ No character found for key:', normalizedKey);
    return 'Unknown Character';
  };

  // ✅ Fixed: Improved character filtering with better logging
  const categorizedCharacters = useMemo(() => {
    console.log('🔄 Recalculating categorized characters...');
    console.log('📊 Available categories:', characterCategories.length);
    console.log('👥 Interacted characters:', interactedCharacters);
    
    const result = {};
    let totalFound = 0;

    characterCategories.forEach(category => {
      console.log(`🏷️ Processing category: ${category.name || category.title}`);
      
      const charsInCategory = category.characters.filter((char, index) => {
        if (!char.key) {
          console.warn(`⚠️ Character at index ${index} has no key:`, char);
          return false;
        }

        const charKeyNormalized = char.key.toLowerCase().trim();
        const isInteracted = interactedCharacters.some(interactedKey => {
          const interactedKeyNormalized = String(interactedKey).toLowerCase().trim();
          const matches = interactedKeyNormalized === charKeyNormalized;
          
          if (matches) {
            console.log(`✅ Match found: "${charKeyNormalized}" === "${interactedKeyNormalized}"`);
          }
          
          return matches;
        });

        console.log(`🔍 Character "${char.name}" (${charKeyNormalized}): ${isInteracted ? 'INCLUDED' : 'excluded'}`);
        return isInteracted;
      });

      if (charsInCategory.length > 0) {
        // Use consistent category naming
        const categoryName = category.name || category.title;
        result[categoryName] = charsInCategory;
        totalFound += charsInCategory.length;
        console.log(`📁 Category "${categoryName}": ${charsInCategory.length} characters`);
      }
    });

    console.log(`🎯 Total categorized characters: ${totalFound}`);
    console.log('📋 Final result:', result);
    
    return result;
  }, [interactedCharacters]);

  // ✅ Keep existing click outside logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('.sidebar-pin')
      ) {
        toggleSidebar();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, toggleSidebar]);

  // ✅ Keep existing body overflow logic
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ✅ Improved loading/empty state handling
  if (loading) {
    return (
      <>
        <button
          className={`sidebar-pin ${isOpen ? 'open' : 'closed'}`}
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
        <div className={`chat-sidebar ${isOpen ? 'open' : 'closed'}`}>
          {isOpen && <div className="sidebar-loading">Loading characters...</div>}
        </div>
      </>
    );
  }

  // Check if we have any categorized characters after processing
  const hasCharacters = Object.keys(categorizedCharacters).length > 0;

  if (!hasCharacters) {
    return (
      <>
        <button
          className={`sidebar-pin ${isOpen ? 'open' : 'closed'}`}
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
        <div className={`chat-sidebar ${isOpen ? 'open' : 'closed'}`}>
          {isOpen && (
            <div className="sidebar-content">
              <div className="empty-state">
                <p>No conversations yet</p>
                <p>Start chatting with a character to see them here!</p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <button
        className={`sidebar-pin ${isOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <ChevronLeft /> : <ChevronRight />}
      </button>

      <div className={`chat-sidebar ${isOpen ? 'open' : 'closed'}`} ref={sidebarRef}>
        {isOpen && (
          <div className="sidebar-content">
            <div className="character-dropdown">
              <button
                className="dropdown-toggle"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {getCharacterDisplayName(current)}
                <span className="chevron">{dropdownOpen ? '▲' : '▼'}</span>
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  {Object.entries(categorizedCharacters).map(([categoryName, chars]) => (
                    <div key={categoryName} className="dropdown-category">
                      <div className="category-header">{categoryName}</div>
                      {chars.map(char => (
                        <div
                          key={char.key}
                          className={`dropdown-item ${current === char.key ? 'active' : ''}`}
                          onClick={() => {
                            console.log('🖱️ Selecting character:', char.key);
                            onSelect(char.key);
                            setDropdownOpen(false);
                          }}
                        >
                          <img
                            src={`/images/${char.key}.jpg`}
                            alt={char.name}
                            className="character-avatar"
                            onError={(e) => {
                              console.warn(`⚠️ Image failed to load: /images/${char.key}.jpg`);
                              e.target.style.display = 'none';
                            }}
                          />
                          {char.name}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="conversation-list">
              {Object.entries(categorizedCharacters).map(([categoryName, chars]) => (
                <div key={categoryName} className="conversation-category">
                  <h3 className="category-title">{categoryName}</h3>
                  {chars.map(char => (
                    <div
                      key={char.key}
                      className={`conversation-item ${current === char.key ? 'active' : ''}`}
                      onClick={() => {
                        console.log('🖱️ Selecting character from list:', char.key);
                        onSelect(char.key);
                        toggleSidebar();
                      }}
                    >
                      <img
                        src={`/images/${char.key}.jpg`}
                        alt={char.name}
                        className="character-avatar"
                        onError={(e) => {
                          console.warn(`⚠️ Image failed to load: /images/${char.key}.jpg`);
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="character-info">
                        <span className="character-name">{char.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}