// src/components/ScenariosTab/MyScenariosPanel/ScenarioCard.jsx - UPDATED WITH IMAGE BACKGROUNDS
import React from 'react';
import { characterCategories } from '../../../data/characterCategories';
import { getDisplayNameFromKey, isCustomCharacterKey } from '../../../utils/characterUtils';
import './ScenarioCard.css';

export default function ScenarioCard({ 
  scenario, 
  onStartDebate, 
  onDelete, 
  onEdit,
  onPublish,
  isDeleting = false,
  isPublishing = false,
  userCharacters = []
}) {
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

  const handlePublishClick = () => {
    onPublish(scenario);
  };

  // Helper to get character info
  const getCharacterInfo = (charKey) => {
    const isCustom = isCustomCharacterKey(charKey);
    
    if (isCustom) {
      const customChar = userCharacters.find(c => c.character_key === charKey);
      
      if (customChar) {
        return {
          name: customChar.display_name,
          thumbnailUrl: customChar.avatar_url,
          isCustom: true
        };
      }
      
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

  // ✅ NEW: Get card background image
  const getCardBackgroundImage = () => {
    // Option 1: If scenario was created from a template, use template category image
    if (scenario.category) {
      const templateImageMap = {
        'philosophy': '/images/template-philosophy.jpg',
        'business': '/images/template-business.jpg',
        'ethics': '/images/template-ethics.jpg',
        'science': '/images/template-science.jpg',
        'technology': '/images/template-technology.jpg',
        'relationships': '/images/template-relationships.jpg',
        'fiction': '/images/template-fiction.jpg',
        'warfare': '/images/template-warfare.jpg'
      };
      
      if (templateImageMap[scenario.category]) {
        return templateImageMap[scenario.category];
      }
    }
    
    // Option 2: Custom scenario - use first character's image
    const characterKeys = scenario.character_keys || scenario.characters || [];
    if (characterKeys.length > 0) {
      const firstCharInfo = getCharacterInfo(characterKeys[0]);
      if (firstCharInfo.thumbnailUrl) {
        return firstCharInfo.thumbnailUrl;
      }
    }
    
    // Fallback: Default image
    return '/images/template-default.jpg';
  };

  const characterKeys = scenario.character_keys || scenario.characters || [];
  const cardBackgroundImage = getCardBackgroundImage();
  
  // Generate thumbnails
  const characterThumbnails = characterKeys.slice(0, 4).map((charKey, index) => {
    const charInfo = getCharacterInfo(charKey);
    const initial = charInfo.name.charAt(0).toUpperCase();
    
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
            onError={(e) => {
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
  const isPublished = scenario.is_public === true;

  return (
    <div className={`scenario-card ${isDeleting ? 'deleting' : ''}`}>
      {/* ✅ NEW: Card Background Image */}
      <div 
        className="scenario-card-background"
        style={{
          backgroundImage: `url(${cardBackgroundImage})`
        }}
      >
        {/* Dark overlay for readability */}
        <div className="scenario-card-overlay"></div>
      </div>

      {/* Card Content */}
      <div className="scenario-card-content">
        <div className="scenario-header">
          <h4 className="scenario-title">{scenario.title}</h4>
          <div className="scenario-actions">
            {/* Publish/Unpublish Button */}
            <button 
              className={`action-button publish ${isPublished ? 'published' : ''}`}
              onClick={handlePublishClick}
              disabled={isDeleting || isPublishing}
              title={
                isPublishing 
                  ? 'Processing...' 
                  : isPublished 
                    ? 'Published to Market Hub • Click to unpublish' 
                    : 'Publish to Market Hub'
              }
            >
              {isPublishing ? '⏳' : isPublished ? '🌍' : '🌍'}
            </button>
            
            <button 
              className="action-button edit" 
              onClick={handleEdit}
              disabled={isDeleting}
              title="Edit scenario"
            >
              ✏️
            </button>
            <button 
              className="action-button delete" 
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete scenario"
            >
              {isDeleting ? '⏳' : '🗑️'}
            </button>
          </div>
        </div>

        {/* Published Badge */}
        {isPublished && (
          <div className="published-badge">
            <span className="badge-icon">🌍</span>
            <span className="badge-text">Published</span>
          </div>
        )}
        
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
    </div>
  );
}