// src/components/CharacterDetailPanel/CharacterMetadata.js
import React, { useState } from 'react';
import styles from './CharacterMetadata.module.css';
import { extractCharacterMetadata } from '../../utils/characterExtractor';

const CharacterMetadata = ({ character }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  if (!character) return null;
  
  const metadata = extractCharacterMetadata(character);
  
  if (!metadata.hasExtractedMetadata) return null;
  
  const handleShowTooltip = (type, content) => {
    setActiveTooltip({ type, content });
  };
  
  const handleHideTooltip = () => {
    setActiveTooltip(null);
  };
  
  return (
    <div className={styles.metadataSection}>
      <div className={styles.sectionTitle}>
        <span>🔍</span> Extracted Insights
      </div>
      
      <div className={styles.metadataGrid}>
        {/* Era Card */}
        <div 
          className={styles.metadataCard}
          onClick={() => handleShowTooltip('era', metadata.extractedEra)}
          onMouseLeave={handleHideTooltip}
        >
          <div className={styles.metadataLabel}>Historical Era</div>
          <div className={styles.metadataValue}>{metadata.extractedEra}</div>
          <div className={styles.eraTag}>
            Auto-detected
          </div>
        </div>
        
        {/* Character Type Card */}
        <div 
          className={styles.metadataCard}
          onClick={() => handleShowTooltip('type', metadata.extractedType)}
          onMouseLeave={handleHideTooltip}
        >
          <div className={styles.metadataLabel}>Character Type</div>
          <div className={styles.metadataValue}>{metadata.extractedType}</div>
        </div>
      </div>
      
      {/* Personality Traits */}
      {metadata.extractedTraits.length > 0 && (
        <div className={styles.metadataSection}>
          <div className={styles.sectionTitle}>
            <span>🧠</span> Personality Traits
          </div>
          <div className={styles.traitsContainer}>
            {metadata.extractedTraits.map((trait, index) => (
              <div 
                key={index}
                className={`${styles.traitChip} ${styles.tooltip}`}
                onClick={() => handleShowTooltip('trait', trait)}
                onMouseLeave={handleHideTooltip}
              >
                {trait}
                <div className={styles.tooltipContent}>
                  Extracted from description
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Confidence Indicator */}
      <div className={styles.confidenceBadge}>
        <span>Extraction Confidence:</span>
        <div className={styles.confidenceBar}>
          <div 
            className={styles.confidenceFill}
            style={{ width: `${metadata.extractionConfidence}%` }}
          />
        </div>
        <span>{metadata.extractionConfidence}%</span>
      </div>
      
      {/* Tooltip Display */}
      {activeTooltip && (
        <div className={styles.tooltipContent}>
          {activeTooltip.type === 'era' && (
            <>
              <strong>Era:</strong> {activeTooltip.content}<br/>
              <small>Detected from keywords in description</small>
            </>
          )}
          {activeTooltip.type === 'trait' && (
            <>
              <strong>Trait:</strong> {activeTooltip.content}<br/>
              <small>Based on personality descriptors</small>
            </>
          )}
          {activeTooltip.type === 'type' && (
            <>
              <strong>Type:</strong> {activeTooltip.content}<br/>
              <small>Identified from character role keywords</small>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterMetadata;