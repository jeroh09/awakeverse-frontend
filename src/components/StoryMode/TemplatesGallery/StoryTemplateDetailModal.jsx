// src/components/StoryMode/TemplatesGallery/StoryTemplateDetailModal.jsx
import React, { useState } from 'react';
import StoryCreationForm from '../StoryCreationForm';
import styles from './TemplatesGallery.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export default function StoryTemplateDetailModal({ 
  template, 
  onClose, 
  onStoryCreated = () => {},
  onUpgradeRequired = () => {}
}) {
  const [showCreator, setShowCreator] = useState(false);

  if (!template) {
    return null;
  }

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
    
    const normalizedEra = (era || '').toLowerCase().trim();
    return eraMap[normalizedEra] || era;
  };

  // Get character thumbnail
  const getCharacterThumbnail = (characterKey) => {
    return `${API_BASE}/character_images/${characterKey}.jpg`;
  };

  const handleUseTemplate = () => {
    console.log('📖 Using template:', template.id);
    setShowCreator(true);
  };

  const handleCreatorClose = () => {
    setShowCreator(false);
  };

  const handleCreatorSuccess = (newStory) => {
    setShowCreator(false);
    onStoryCreated(newStory);
  };

  const characterKey = template.preset_character_key || 'sherlock';
  const characterName = characterKey.charAt(0).toUpperCase() + characterKey.slice(1);

  return (
    <>
      {/* Template Detail Modal */}
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.templateDetailModal} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <h2>{template.title}</h2>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
          
          {/* Content */}
          <div className={styles.modalContent}>
            {/* Meta Info */}
            <div className={styles.templateSpecs}>
              <div className={styles.specMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.icon}>📅</span>
                  <span>{formatEraName(template.preset_era)}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.icon}>📚</span>
                  <span>{template.category?.charAt(0).toUpperCase() + template.category?.slice(1) || 'Story'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.icon}>⚙️</span>
                  <span>Tech Level {template.preset_tech_level || 3}</span>
                </div>
              </div>

              {/* Description */}
              <div className={styles.specDescription}>
                <h3>About This Story</h3>
                <p>{template.description}</p>
              </div>

              {/* Preset Situation */}
              {template.preset_situation && (
                <div className={styles.specSituation}>
                  <h3>Starting Situation</h3>
                  <p className={styles.situationText}>{template.preset_situation}</p>
                </div>
              )}

              {/* Featured Character */}
              <div className={styles.specCharacter}>
                <h3>Featured Character</h3>
                <div className={styles.characterDisplay}>
                  <div 
                    className={styles.characterAvatarLarge}
                    style={{
                      backgroundImage: `url(${getCharacterThumbnail(characterKey)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <span className={styles.avatarFallback}>
                      {characterName.charAt(0)}
                    </span>
                  </div>
                  <div className={styles.characterDetails}>
                    <span className={styles.characterNameLarge}>{characterName}</span>
                    <span className={styles.characterNote}>
                      You can customize or change this in the next step
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Count */}
              {template.usage_count > 0 && (
                <div className={styles.usageStats}>
                  <span className={styles.icon}>🔥</span>
                  <span>Used {template.usage_count} times by other users</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className={styles.modalActions}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button 
              className={styles.useTemplateButton}
              onClick={handleUseTemplate}
            >
              Create Story
            </button>
          </div>
        </div>
      </div>

      {/* Story Creator Modal */}
      {showCreator && (
        <StoryCreationForm
          template={template}
          isOpen={showCreator}
          onClose={handleCreatorClose}
          onSuccess={handleCreatorSuccess}
        />
      )}
    </>
  );
}