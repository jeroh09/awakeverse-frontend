// src/components/StoryMode/TemplatesGallery/StoryTemplateCard.jsx
import React from 'react';
import { characterCategories } from '../../../data/characterCategories';
import styles from './TemplatesGallery.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';



const getCharacterInfo = (charKey) => {
  for (const category of characterCategories) {
    const found = category.characters?.find(c => c.key === charKey);
    if (found) return { name: found.name, thumbnailUrl: found.thumbnailUrl };
  }
  // graceful fallback
  return { name: (charKey || '').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), thumbnailUrl: null };
};

export default function StoryTemplateCard({ template, onSelect }) {
  const handleClick = () => {
    onSelect(template);
  };

  // Get era badge color based on era
  const getEraBadgeColor = (era) => {
    const eraColors = {
      'ancient': '#8B4513',
      'medieval': '#2C3E50',
      'renaissance': '#E67E22',
      '1800s': '#7D3C98',
      '1890s': '#884EA0',
      '1900s': '#1F618D',
      '1950s': '#117A65',
      'modern': '#2874A6',
      '2050s': '#1ABC9C',
      'far_future': '#8E44AD'
    };
    
    const normalizedEra = (era || '').toLowerCase().trim();
    return eraColors[normalizedEra] || '#3498DB';
  };

  // Format era display name
  const formatEraName = (era) => {
    if (!era) return 'Modern';
    
    const eraMap = {
      'ancient': 'Ancient Times',
      'medieval': 'Medieval Era',
      'renaissance': 'Renaissance',
      '1800s': '1800s',
      '1890s': 'Victorian Era',
      '1900s': 'Early 1900s',
      '1950s': '1950s',
      'modern': 'Modern Day',
      '2050s': 'Near Future',
      'far_future': 'Far Future'
    };
    
    const normalizedEra = era.toLowerCase().trim();
    return eraMap[normalizedEra] || era;
  };

  const characterKey = template.preset_character_key || null;
  const { name: characterName, thumbnailUrl } = characterKey ? getCharacterInfo(characterKey) : { name: 'Featured Character', thumbnailUrl: null };
  const eraBadgeColor = getEraBadgeColor(template.preset_era);

  return (
    <div className={styles.templateCard} onClick={handleClick}>
      {/* Era Badge */}
      <span 
        className={styles.eraBadge}
        style={{ backgroundColor: eraBadgeColor }}
      >
        {formatEraName(template.preset_era)}
      </span>
      
      {/* Category Badge */}
      <span className={styles.categoryBadge}>
        {template.category?.charAt(0).toUpperCase() + template.category?.slice(1) || 'Story'}
      </span>
      
      {/* Title */}
      <h3 className={styles.templateTitle}>{template.title}</h3>
      
      {/* Description */}
      <p className={styles.templateDescription}>{template.description}</p>
      
      {/* Character Preview */}
      <div className={styles.characterPreview}>
        <div className={styles.characterAvatar}
             style={thumbnailUrl ? {
               backgroundImage: `url(${thumbnailUrl})`,
               backgroundSize: 'cover',
               backgroundPosition: 'center'
             } : {}}>
          {!thumbnailUrl && (
            <span className={styles.avatarFallback}>
              {characterName.charAt(0)}
            </span>
          )}
        </div>
        <div className={styles.characterInfo}>
          <span className={styles.characterLabel}>Featured Character</span>
          <span className={styles.characterName}>{characterName}</span>
        </div>
      </div>
      
      {/* Use Button */}
      <button className={styles.useButton}>
        Use Template
      </button>
    </div>
  );
}