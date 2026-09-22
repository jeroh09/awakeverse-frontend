// src/components/ScenariosTab/ScenarioChatWindow/ParticipantAvatars/index.jsx - WITH QUEUED
import React from 'react';
import ParticipantOrb from './ParticipantOrb';
import './ParticipantAvatars.css';

export default function ParticipantAvatars({
  participants = [],
  userCharacters = [],
  activeSpeaker = null,
  queuedSpeakers = [],
  isMobile = false,
  theme = 'light'
}) {
  if (!Array.isArray(participants)) {
    console.error('⚠️ ParticipantAvatars: participants must be an array');
    return null;
  }

  const validParticipants = participants.slice(0, 4);
  
  if (validParticipants.length < 2) {
    console.warn('⚠️ Need at least 2 participants');
    return null;
  }

  // Observable logging
  console.log('👥 ParticipantAvatars rendering:', {
    participants: validParticipants,
    activeSpeaker,
    queuedSpeakers,
    isMobile
  });

  return (
    <div 
      className={`participant-avatars-container ${isMobile ? 'mobile' : 'desktop'} theme-${theme}`}
      role="list"
      aria-label="Debate participants"
    >
      {validParticipants.map((charKey, index) => (
        <ParticipantOrb
          key={charKey}
          characterKey={charKey}
          userCharacters={userCharacters}
          isActive={charKey === activeSpeaker}
          isQueued={queuedSpeakers.includes(charKey)}
          index={index}
          theme={theme}
        />
      ))}
    </div>
  );
}