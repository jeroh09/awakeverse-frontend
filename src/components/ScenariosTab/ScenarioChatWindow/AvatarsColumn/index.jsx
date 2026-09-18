// src/components/ScenariosTab/ScenarioChatWindow/AvatarsColumn/index.jsx
// PHASE 3: Avatars Column - Vertical layout on left side of chat panel

import React from 'react';
import ParticipantOrb from './ParticipantOrb';
import styles from './AvatarsColumn.module.css';

/**
 * AvatarsColumn - Vertical column of participant avatars on LEFT side of chat panel
 * 
 * @param {Array} participants - Array of character keys
 * @param {Array} userCharacters - Array of user's custom characters
 * @param {string} activeSpeaker - Character key of currently speaking participant
 * @param {Array} queuedSpeakers - Array of character keys for queued speakers
 * @param {boolean} isMobile - Mobile view flag
 * @param {string} theme - Theme (not used in new design, kept for compatibility)
 */
export default function AvatarsColumn({
  participants = [],
  userCharacters = [],
  activeSpeaker = null,
  queuedSpeakers = [],
  isMobile = false,
  theme = 'light'
}) {
  // Defensive: Validate participants array
  if (!Array.isArray(participants)) {
    console.error('⚠️ AvatarsColumn: participants must be an array');
    return null;
  }

  // Defensive: Limit to 4 participants max
  const validParticipants = participants.slice(0, 4);
  
  if (validParticipants.length < 2) {
    console.warn('⚠️ AvatarsColumn: Need at least 2 participants');
    return null;
  }

  // Observable logging
  console.log('👥 AvatarsColumn rendering:', {
    participants: validParticipants,
    activeSpeaker,
    queuedSpeakers,
    isMobile
  });

  return (
    <div 
      className={`${styles.avatarsColumn} ${isMobile ? styles.mobile : styles.desktop}`}
      role="list"
      aria-label="Debate participants"
    >
      {validParticipants.map((characterKey, index) => (
        <ParticipantOrb
          key={characterKey}
          characterKey={characterKey}
          userCharacters={userCharacters}
          isActive={characterKey === activeSpeaker}
          isQueued={queuedSpeakers.includes(characterKey)}
          index={index}
        />
      ))}
    </div>
  );
}