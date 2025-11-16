// src/components/StoryMode/TemplatesGallery/StoryTemplateCard.jsx
import React from 'react';
import { characterCategories } from '../../../data/characterCategories';
import styles from './TemplatesGallery.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const getCharacterInfo = (charKey) => {
  for (const category of characterCategories) {
    const found = category.characters?.find((c) => c.key === charKey);
    if (found) return { name: found.name, thumbnailUrl: found.thumbnailUrl };
  }
  // graceful fallback
  return {
    name: (charKey || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    thumbnailUrl: null,
  };
};

export default function StoryTemplateCard({ template, onSelect }) {
  const handleClick = () => {
    onSelect(template);
  };

  // Get era badge color based on era
  const getEraBadgeColor = (era) => {
    const eraColors = {
      ancient: '#8B4513',
      medieval: '#2C3E50',
      renaissance: '#E67E22',
      '1800s': '#7D3C98',
      '1890s': '#884EA0',
      '1900s': '#2E86C1',
      '1950s': '#16A085',
      modern: '#1F618D',
      '2050s': '#27AE60',
      far_future: '#6C3483',
    };

    const normalizedEra = (era || '').toLowerCase().trim();
    return eraColors[normalizedEra] || '#3498DB';
  };

  // Format era display name
  const formatEraName = (era) => {
    if (!era) return 'Modern';

    const eraMap = {
      ancient: 'Ancient Times',
      medieval: 'Medieval Era',
      renaissance: 'Renaissance',
      '1800s': '1800s',
      '1890s': 'Victorian Era',
      '1900s': 'Early 1900s',
      '1950s': '1950s',
      modern: 'Modern Day',
      '2050s': 'Near Future',
      far_future: 'Far Future',
    };

    const normalizedEra = era.toLowerCase().trim();
    return eraMap[normalizedEra] || era;
  };

  const characterKey = template.preset_character_key || null;
  const { name: characterName, thumbnailUrl } = characterKey
    ? getCharacterInfo(characterKey)
    : { name: 'Featured Character', thumbnailUrl: null };

  const eraBadgeColor = getEraBadgeColor(template.preset_era);

  // Prefer an explicit template image, otherwise fall back gracefully
  const cardImageUrl =
    template.image_url ||
    template.preview_image_url ||
    thumbnailUrl ||
    null;

  const categoryLabel =
    template.category?.charAt(0).toUpperCase() + template.category?.slice(1) ||
    'Story';

  return (
    <div className={styles.templateCard} onClick={handleClick}>
      {/* Full background image + gradient overlay */}
      <div
        className={styles.cardBackground}
        style={cardImageUrl ? { backgroundImage: `url(${cardImageUrl})` } : {}}
      >
        <div className={styles.cardGradient} />
      </div>

      {/* Floating badges */}
      <div className={styles.cardBadges}>
        <span
          className={styles.eraBadge}
          style={{ backgroundColor: eraBadgeColor }}
        >
          {formatEraName(template.preset_era)}
        </span>
        <span className={styles.categoryBadge}>{categoryLabel}</span>
      </div>

      {/* Content overlay at bottom */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{template.title}</h3>
        <p className={styles.cardDescription}>{template.description}</p>

        {/* Character preview */}
        <div className={styles.characterPreview}>
          <div
            className={styles.characterAvatar}
            style={
              thumbnailUrl
                ? {
                    backgroundImage: `url(${thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {}
            }
          >
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

        {/* CTA Button */}
        <button
          className={styles.useButton}
          type="button"
        >
          Use Template
        </button>
      </div>
    </div>
  );
}
