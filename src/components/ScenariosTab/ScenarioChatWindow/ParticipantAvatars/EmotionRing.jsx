// src/components/ScenariosTab/ScenarioChatWindow/ParticipantAvatars/EmotionRing.jsx
import React from 'react';

/**
 * EmotionRing - Animated ring with multiple states
 * 
 * States:
 * - idle: Default breathing animation (blue, no dot)
 * - queued: Next speaker, glowing ring (gold, no dot)
 * - active: Currently speaking (gold ring + green dot)
 */
export default function EmotionRing({
  color = '#3498db',
  intensity = 0.6,
  breathingSpeed = 1,
  breathingScale = 1.03,
  isActive = false,
  isQueued = false,
  onClick = () => {}
}) {
  // Determine color based on state
  const ringColor = isActive || isQueued ? '#FFD700' : color;
  const ringIntensity = isActive ? 0.9 : isQueued ? 0.75 : intensity;
  
  const ringStyle = {
    '--ring-color': ringColor,
    '--ring-intensity': ringIntensity,
    '--breathing-speed': `${6 / breathingSpeed}s`,
    '--breathing-scale': breathingScale,
    '--ring-opacity': isActive ? 0.9 : isQueued ? 0.75 : 0.6
  };

  const className = `emotion-ring-scenarios ${isActive ? 'active' : ''} ${isQueued ? 'queued' : ''}`;

  return (
    <div 
      className={className}
      style={ringStyle}
      onClick={onClick}
      role="presentation"
      aria-hidden="true"
    >
      <div className="ring-primary" />
      <div className="ring-secondary" />
      {isActive && <div className="ring-active" />}
      {isQueued && <div className="ring-queued" />}
    </div>
  );
}