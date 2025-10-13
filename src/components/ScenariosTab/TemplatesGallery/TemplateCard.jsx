// src/components/ScenariosTab/TemplatesGallery/TemplateCard.jsx - WITH characterCategories
import React from 'react';
import { characterCategories } from '../../../data/characterCategories';
import './TemplateCard.css';

export default function TemplateCard({ template, isUnlimited, onSelect, onUpgradeRequired }) {
  const handleClick = () => {
    if (!isUnlimited) {
      onUpgradeRequired('template_access');
      return;
    }
    onSelect(template);
  };

  // Helper function to get character info from characterCategories
  const getCharacterInfo = (charKey) => {
    // Search through all categories to find the character
    for (const category of characterCategories) {
      if (category.characters && Array.isArray(category.characters)) {
        const found = category.characters.find(c => c.key === charKey);
        if (found) {
          console.log('🎭 TemplateCard - Found character:', {
            key: charKey,
            name: found.name,
            thumbnail: found.thumbnailUrl
          });
          return {
            name: found.name,
            thumbnailUrl: found.thumbnailUrl
          };
        }
      }
    }
    
    console.warn('⚠️ TemplateCard - Character not found:', charKey);
    // Fallback
    return {
      name: charKey.charAt(0).toUpperCase() + charKey.slice(1),
      thumbnailUrl: null
    };
  };

  // Generate character avatars (first 4 characters) with actual thumbnails
  const characterAvatars = (template.suggested_characters || [])
    .slice(0, 4)
    .map((charKey, index) => {
      const charInfo = getCharacterInfo(charKey);
      const initial = charInfo.name.charAt(0).toUpperCase();
      
      console.log('🖼️ TemplateCard - Rendering avatar:', {
        index,
        charKey,
        name: charInfo.name,
        thumbnail: charInfo.thumbnailUrl,
        hasThumbnail: !!charInfo.thumbnailUrl
      });
      
      return {
        key: charKey,
        name: charInfo.name,
        initial: initial,
        thumbnailUrl: charInfo.thumbnailUrl
      };
    });

  // Fallback if no characters
  if (characterAvatars.length === 0) {
    characterAvatars.push(
      { key: 's', name: 'Socrates', initial: 'S', thumbnailUrl: null },
      { key: 'a', name: 'Aristotle', initial: 'A', thumbnailUrl: null },
      { key: 'k', name: 'Kant', initial: 'K', thumbnailUrl: null },
      { key: 'c', name: 'Confucius', initial: 'C', thumbnailUrl: null }
    );
  }

  return (
    <div className={`template-card ${!isUnlimited ? 'locked' : ''}`}>
      {!isUnlimited && <div className="lock-indicator">🔒</div>}
      
      <span className="category-badge">
        {template.category?.charAt(0).toUpperCase() + template.category?.slice(1) || 'General'}
      </span>
      
      <h3 className="template-title">{template.title}</h3>
      <p className="template-description">{template.description}</p>
      
      <div className="character-avatars">
        {characterAvatars.map((char, index) => (
          <div 
            key={index} 
            className="avatar-circle"
            title={char.name}
            style={char.thumbnailUrl ? {
              backgroundImage: `url(${char.thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            {/* Show initial as fallback */}
            <span className="avatar-initial">{char.initial}</span>
          </div>
        ))}
        {template.suggested_characters?.length > 4 && (
          <div className="avatar-circle more" title={`+${template.suggested_characters.length - 4} more`}>
            +{template.suggested_characters.length - 4}
          </div>
        )}
      </div>
      
      <div className="starter-questions-preview">
        {template.starter_questions?.length || 7} starter questions included
      </div>
      
      <button 
        className={`use-button ${!isUnlimited ? 'upgrade' : ''}`}
        onClick={handleClick}
      >
        {isUnlimited ? 'Use Template' : 'Upgrade to Use'}
      </button>
    </div>
  );
}