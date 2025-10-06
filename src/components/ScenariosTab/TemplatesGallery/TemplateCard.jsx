// src/components/ScenariosTab/TemplatesGallery/TemplateCard.jsx
import React from 'react';
import './TemplateCard.css';

export default function TemplateCard({ template, isUnlimited, onSelect, onUpgradeRequired }) {
  const handleClick = () => {
    if (!isUnlimited) {
      onUpgradeRequired('template_access');
      return;
    }
    onSelect(template);
  };

  // Generate character avatars (first 4 characters)
  const characterAvatars = template.suggested_characters?.slice(0, 4).map(char => 
    char.charAt(0).toUpperCase()
  ) || ['S', 'A', 'K', 'C']; // Fallback avatars

  return (
    <div className={`template-card ${!isUnlimited ? 'locked' : ''}`}>
      {!isUnlimited && <div className="lock-indicator">🔒</div>}
      
      <span className="category-badge">
        {template.category?.charAt(0).toUpperCase() + template.category?.slice(1) || 'General'}
      </span>
      
      <h3 className="template-title">{template.title}</h3>
      <p className="template-description">{template.description}</p>
      
      <div className="character-avatars">
        {characterAvatars.map((avatar, index) => (
          <div key={index} className="avatar-circle">
            {avatar}
          </div>
        ))}
        {template.suggested_characters?.length > 4 && (
          <div className="avatar-circle more">+{template.suggested_characters.length - 4}</div>
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