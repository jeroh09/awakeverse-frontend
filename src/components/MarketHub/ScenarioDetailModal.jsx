// ============================================================================
// ScenarioDetailModal.jsx - NEW FILE
// Location: src/components/MarketHub/ScenarioDetailModal.jsx
// Based on CharacterDetailPanel pattern + ScenarioCard's getCharacterInfo
// ============================================================================

import React from 'react';
import { X, Users, MessageCircle, Trophy } from 'lucide-react';
import { characterCategories } from '../../data/characterCategories';
import { isCustomCharacterKey, getDisplayNameFromKey } from '../../utils/characterUtils';
import usePremiumCharacters from '../../hooks/usePremiumCharacters';
import styles from './ScenarioDetailModal.module.css';

const ScenarioDetailModal = ({ 
  scenario, 
  onClose, 
  onStartDebate,
  onScenarioSelect,  // For "Add to Discovered" in view mode
  showDiscoverAction = false  // Show "Add to Discovered" button
}) => {
  
  // Get user's custom characters for avatar lookups
  const { userCharacters = [] } = usePremiumCharacters();

  if (!scenario) return null;

  // ✅ EXACT COPY from ScenarioCard - Get character info (custom or static)
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

  const characterKeys = scenario.character_keys || [];

  const handleStartDebate = () => {
    if (onStartDebate) {
      onStartDebate(scenario);
    }
  };

  const handleAddToDiscovered = () => {
    if (onScenarioSelect) {
      onScenarioSelect(scenario);
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconBadge}>🎭</div>
            <div className={styles.titleSection}>
              <h2 className={styles.title}>{scenario.title}</h2>
              {scenario.category && (
                <span className={styles.category}>{scenario.category}</span>
              )}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Description */}
        <div className={styles.description}>
          <p>{scenario.description}</p>
        </div>

        {/* Participants Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Users size={18} />
            Participants ({characterKeys.length})
          </h3>
          <div className={styles.participants}>
            {characterKeys.map((charKey, index) => {
              const charInfo = getCharacterInfo(charKey);
              return (
                <div key={index} className={styles.participant}>
                  <div className={styles.participantAvatar}>
                    {charInfo.thumbnailUrl ? (
                      <img 
                        src={charInfo.thumbnailUrl}
                        alt={charInfo.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span 
                      className={styles.avatarFallback}
                      style={{ display: charInfo.thumbnailUrl ? 'none' : 'flex' }}
                    >
                      {charInfo.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.participantInfo}>
                    <span className={styles.participantName}>{charInfo.name}</span>
                    {charInfo.isCustom && (
                      <span className={styles.customBadge}>Custom</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement Stats */}
        {scenario.engagement_30d && (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <MessageCircle size={16} />
              <span>{scenario.engagement_30d.total_chats || 0} debates</span>
            </div>
            <div className={styles.stat}>
              <Trophy size={16} />
              <span>{scenario.total_engagement_score || 0} engagement</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {showDiscoverAction && (
            <button 
              className={styles.discoverButton}
              onClick={handleAddToDiscovered}
            >
              Add to My Scenarios
            </button>
          )}
          <button 
            className={styles.startButton}
            onClick={handleStartDebate}
          >
            Start Debate →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioDetailModal;