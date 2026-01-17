// src/components/ScenariosTab/TemplatesGallery/TemplateCard.jsx - UPDATED WITH PREVIEW CARD DESIGN
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
          return {
            name: found.name,
            thumbnailUrl: found.thumbnailUrl
          };
        }
      }
    }
    
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

  // Get template image path based on template ID or category
  const getTemplateImagePath = () => {
    // Map template to image file
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

    // Try to get by category first
    if (template.category && templateImageMap[template.category]) {
      return templateImageMap[template.category];
    }

    // Try by template ID if it has a specific mapping
    if (template.id && templateImageMap[template.id]) {
      return templateImageMap[template.id];
    }

    // Default fallback
    return '/images/template-default.jpg';
  };

  const templateImage = getTemplateImagePath();
  const questionCount = template.starter_questions?.length || 7;

  return (
    <div 
      className={`template-preview-card ${!isUnlimited ? 'locked' : ''}`}
      onClick={handleClick}
    >
      {/* Lock indicator for non-unlimited users */}
      {!isUnlimited && <div className="template-lock-indicator">🔒</div>}

      {/* Template Image */}
      <div className="template-preview-image-wrapper">
        <img 
          src={templateImage}
          alt={template.title}
          className="template-preview-image"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="template-preview-image-fallback">
          {template.title}
        </div>
      </div>

      {/* Template Content */}
      <div className="template-preview-content">
        {/* Category Badge */}
        <span className="template-category-badge">
          {template.category?.charAt(0).toUpperCase() + template.category?.slice(1) || 'General'}
        </span>

        <h3 className="template-preview-title">{template.title}</h3>
        <p className="template-preview-description">{template.description}</p>

        {/* Character Avatars Row */}
        <div className="template-character-avatars">
          {characterAvatars.map((char, index) => (
            <div 
              key={index} 
              className="template-avatar-circle"
              title={char.name}
              style={char.thumbnailUrl ? {
                backgroundImage: `url(${char.thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            >
              {/* Show initial as fallback */}
              <span className="template-avatar-initial">{char.initial}</span>
            </div>
          ))}
          {template.suggested_characters?.length > 4 && (
            <div className="template-avatar-circle more" title={`+${template.suggested_characters.length - 4} more`}>
              +{template.suggested_characters.length - 4}
            </div>
          )}
        </div>

        {/* Starter Questions Badge */}
        <div className="template-preview-badge">
          💬 {questionCount} starter question{questionCount !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}