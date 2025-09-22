import React, { useState, useEffect } from 'react';
import EmotionRing from './EmotionRing';
import RadialMenu from './RadialMenu';
import './FloatingAvatar.css';

const EMOTION_COLORS = {
  'analytical': '#4A90E2',
  'romantic': '#E24A72',
  'anger': '#E24A4A',
  'joy': '#E2A04A',
  'sad': '#6A4AE2',
  'neutral': '#FFD700',
  'mysterious': '#8A4AE2',
  'contemplative': '#4AE290',
  'satisfaction': '#E2D44A'
};

const EMOTION_INTENSITY = {
  'anger': { speed: 2, scale: 1.1 },
  'joy': { speed: 0.8, scale: 1.05 },
  'romantic': { speed: 0.9, scale: 1.08 },
  'analytical': { speed: 1.2, scale: 1.02 },
  'sad': { speed: 1.5, scale: 0.98 },
  'neutral': { speed: 1, scale: 1.03 },
  'mysterious': { speed: 0.7, scale: 1.06 },
  'contemplative': { speed: 1.3, scale: 1.01 },
  'satisfaction': { speed: 0.6, scale: 1.04 }
};

export default function FloatingAvatar({
  character,
  characterName,
  emotionState = 'neutral',
  emotionIntensity = 0.8,
  participants = [],
  onBack,
  onCharacterSelect,
  inviteSuggestions = [],
  isMobile = false,
  enabled = true,
  isHubVisible = true,
  onToggleVisibility,
  // PrestigeHub integration props
  prestigeHubVisible = false,
  onPrestigeHubToggle,
  discoveryCount = 0
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  if (!enabled) return null;

  const emotionColor = EMOTION_COLORS[emotionState] || EMOTION_COLORS.neutral;
  const emotionConfig = EMOTION_INTENSITY[emotionState] || EMOTION_INTENSITY.neutral;

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovering(true);
      setIsMenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovering(false);
      setIsMenuOpen(false);
    }
  };

  const handleTouchStart = () => {
    if (isMobile) {
      setIsMenuOpen(true);
    }
  };

  const handleTouchEnd = () => {
    // Keep menu open until user taps elsewhere
  };

  // PrestigeHub toggle handler
  const handlePrestigeToggle = () => {
    if (typeof onPrestigeHubToggle === 'function') {
      onPrestigeHubToggle();
    }
    
    // Optional: Close radial menu when prestige hub opens
    if (!prestigeHubVisible) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    if (!isMobile) return;

    const handleDocumentClick = (e) => {
      if (!e.target.closest('.floating-avatar-container')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleDocumentClick);
    }

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isMenuOpen, isMobile]);

  return (
    <div 
      className={`floating-avatar-container ${prestigeHubVisible ? 'prestige-active' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="floating-avatar-wrapper">
        {/* Visibility toggle */}
        {(isMenuOpen || isHovering) && onToggleVisibility && (
          <button 
            className="visibility-toggle"
            onClick={onToggleVisibility}
            title={isHubVisible ? 'Hide character hub' : 'Show character hub'}
            aria-label={isHubVisible ? 'Hide character hub' : 'Show character hub'}
          >
            {isHubVisible ? '👁️' : '👁️‍🗨️'}
          </button>
        )}

        {/* EmotionRing with PrestigeHub integration */}
        <EmotionRing
          color={emotionColor}
          intensity={emotionIntensity}
          breathingSpeed={emotionConfig.speed}
          breathingScale={emotionConfig.scale}
          isActive={isHovering || isMenuOpen}
          onClick={() => {}}
          showPrestigeRing={true}
          prestigeActive={prestigeHubVisible}
          onPrestigeToggle={handlePrestigeToggle}
          prestigeDiscoveryCount={discoveryCount}
        />
        
        <div className="floating-avatar-core">
          <img
            src={`/images/${character}.jpg`}
            alt={characterName || character}
            className="floating-avatar-image"
            onError={(e) => {
              e.target.src = '/images/default-character.jpg';
            }}
          />
        </div>

        <RadialMenu
          isOpen={isMenuOpen}
          participants={participants}
          inviteSuggestions={inviteSuggestions}
          onBack={onBack}
          onCharacterSelect={onCharacterSelect}
          isMobile={isMobile}
        />
      </div>

      {/* ❌ REMOVED: All debug info completely removed */}
    </div>
  );
}