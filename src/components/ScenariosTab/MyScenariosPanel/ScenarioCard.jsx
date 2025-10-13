// src/components/ScenariosTab/MyScenariosPanel/ScenarioCard.jsx - SIMPLE IMG APPROACH
import React from 'react';
import { characterCategories } from '../../../data/characterCategories';
import { getDisplayNameFromKey, isCustomCharacterKey } from '../../../utils/characterUtils';
import './ScenarioCard.css';

export default function ScenarioCard({ 
  scenario, 
  onStartDebate, 
  onDelete, 
  onEdit,
  isDeleting = false,
  userCharacters = []
}) {
  // ADD THE CONSOLE.LOG RIGHT HERE ↓
  console.log('🎭 ScenarioCard Debug:', {
    scenarioTitle: scenario.title,
    characterKeys: scenario.character_keys,
    userCharactersCount: userCharacters.length,
    userCharactersSample: userCharacters[0]
  });
  const handleStartDebate = () => {
    onStartDebate(scenario.id);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      onDelete(scenario.id);
    }
  };

  const handleEdit = () => {
    onEdit(scenario);
  };

  // Helper to get character info
  const getCharacterInfo = (charKey) => {
    const isCustom = isCustomCharacterKey(charKey);
    
    if (isCustom) {
      const customChar = userCharacters.find(c => c.character_key === charKey);
      
      if (customChar) {
        console.log('⭐ Custom character:', {
          key: charKey,
          name: customChar.display_name,
          avatar: customChar.avatar_url
        });
        
        return {
          name: customChar.display_name,
          thumbnailUrl: customChar.avatar_url,
          isCustom: true
        };
      }
      
      // Fallback
      return {
        name: getDisplayNameFromKey(charKey),
        thumbnailUrl: `/images/${charKey}.jpg`,
        isCustom: true
      };
    } else {
      // Static character
      for (const category of characterCategories) {
        if (category.characters) {
          const found = category.characters.find(c => c.key === charKey);
          if (found) {
            console.log('📚 Static character:', {
              key: charKey,
              name: found.name,
              thumbnail: found.thumbnailUrl
            });
            
            return {
              name: found.name,
              thumbnailUrl: found.thumbnailUrl,
              isCustom: false
            };
          }
        }
      }
      
      return {
        name: charKey,
        thumbnailUrl: `/images/${charKey}.jpg`,
        isCustom: false
      };
    }
  };

  const characterKeys = scenario.character_keys || scenario.characters || [];
  
  // Generate thumbnails with IMG tags (simpler, easier to debug)
  const characterThumbnails = characterKeys.slice(0, 4).map((charKey, index) => {
    const charInfo = getCharacterInfo(charKey);
    const initial = charInfo.name.charAt(0).toUpperCase();
    
    console.log(`🖼️  Rendering thumbnail ${index}:`, {
      charKey,
      name: charInfo.name,
      thumbnailUrl: charInfo.thumbnailUrl
    });
    
    return (
      <div 
        key={index} 
        className="character-thumbnail"
        title={charInfo.name}
      >
        {charInfo.thumbnailUrl ? (
          <img 
            src={charInfo.thumbnailUrl}
            alt={charInfo.name}
            className="thumbnail-img"
            onLoad={() => console.log(`✅ Loaded: ${charInfo.thumbnailUrl}`)}
            onError={(e) => {
              console.error(`❌ Failed to load: ${charInfo.thumbnailUrl}`);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span className="thumbnail-fallback" style={{ display: charInfo.thumbnailUrl ? 'none' : 'flex' }}>
          {initial}
        </span>
      </div>
    );
  });

  const questionCount = scenario.starter_questions?.length || 0;

  return (
    <div className={`scenario-card ${isDeleting ? 'deleting' : ''}`}>
      <div className="scenario-header">
        <h4 className="scenario-title">{scenario.title}</h4>
        <div className="scenario-actions">
          <button 
            className="action-button edit" 
            onClick={handleEdit}
            disabled={isDeleting}
          >
            ✏️
          </button>
          <button 
            className="action-button delete" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>
      
      <p className="scenario-description">{scenario.description}</p>
      
      <div className="scenario-meta">
        <div className="character-thumbnails">
          {characterThumbnails}
          {characterKeys.length > 4 && (
            <div className="character-thumbnail more">
              +{characterKeys.length - 4}
            </div>
          )}
        </div>
        
        <div className="question-count">
          💬 {questionCount} question{questionCount !== 1 ? 's' : ''}
        </div>
      </div>

      {scenario.category && (
        <div className="scenario-category">
          📂 {scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
        </div>
      )}
      
      <button 
        className="start-debate-button" 
        onClick={handleStartDebate}
        disabled={isDeleting}
      >
        🎭 Start Debate
      </button>
    </div>
  );
}