import React from 'react';
import './EmotionRing.css';

export default function EmotionRing({
  color = '#FFD700',
  intensity = 0.8,
  breathingSpeed = 1,
  breathingScale = 1.03,
  isActive = false,
  onClick = () => {},
  showPrestigeRing = false,
  prestigeActive = false,
  onPrestigeToggle = () => {}, 
  prestigeDiscoveryCount = 0    
}) {
  const ringStyle = {
    '--ring-color': color,
    '--ring-intensity': intensity,
    '--breathing-speed': `${6 / breathingSpeed}s`,
    '--breathing-scale': breathingScale,
    '--ring-opacity': isActive ? 0.9 : 0.6,
    '--prestige-color': prestigeActive ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'
  };

  // ✅ FIX 1: Separate the ring click from prestige click
  const handleRingClick = (e) => {
    // Only trigger ring click if it's not the prestige button
    if (!e.target.closest('.prestige-toggle-ring')) {
      onClick();
    }
  };

  // ✅ FIX 2: Ensure prestige click is properly isolated
  const handlePrestigeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // ✅ FIX: stopImmediatePropagation doesn't exist on React synthetic events
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }
    
    console.log('🎯 PrestigeHub toggle clicked!'); // Debug log
    console.log('onPrestigeToggle function:', typeof onPrestigeToggle); // Debug
    
    // Call the toggle function
    if (typeof onPrestigeToggle === 'function') {
      onPrestigeToggle();
    } else {
      console.error('❌ onPrestigeToggle is not a function:', onPrestigeToggle);
    }
  };

  return (
    <div 
      className={`emotion-ring ${isActive ? 'active' : ''} ${prestigeActive ? 'prestige-active' : ''}`}
      style={ringStyle}
      onClick={handleRingClick} // ✅ FIX 3: Use separate handler
    >
      <div className="ring-primary"></div>
      <div className="ring-secondary"></div>
      {showPrestigeRing && <div className="ring-prestige"></div>}
      
      {/* ✅ FIX 4: Enhanced PrestigeHub Toggle with better event handling */}
      {showPrestigeRing && (
        <button 
          className={`prestige-toggle-ring ${prestigeActive ? 'active' : ''}`}
          onClick={handlePrestigeClick}
          onMouseDown={(e) => e.stopPropagation()} // ✅ FIX 5: Stop mouse events too
          onTouchStart={(e) => e.stopPropagation()}
          title={prestigeActive ? 'Close Intellectual Network' : 'Open Intellectual Network'}
          aria-label={prestigeActive ? 'Close Intellectual Network' : 'Open Intellectual Network'}
          style={{ 
            // ✅ FIX 6: Force high z-index and ensure it's clickable
            zIndex: 1000,
            pointerEvents: 'all',
            position: 'relative'
          }}
        >
          <div className="prestige-crown-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 6L9 9l3-8 3 8-3-3zM6 9l-4 6h20l-4-6-3 4-3-4-3 4-3-4z"/>
            </svg>
          </div>
          
          {/* Hover Tooltip */}
          <div className="prestige-toggle-tooltip">
            Interaction History
          </div>
          
          {/* Discovery Count Badge */}
          {prestigeDiscoveryCount > 0 && (
            <div className="discovery-count-badge">
              {prestigeDiscoveryCount}
            </div>
          )}
        </button>
      )}
      
      {intensity > 0.7 && (
        <div className="ring-particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
        </div>
      )}
    </div>
  );
};