// src/components/FloatingAvatar/RadialMenu.js
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CHARACTERS } from '../../data/characters';
import './RadialMenu.css';

export default function RadialMenu({
  isOpen = false,
  participants = [],
  inviteSuggestions = [],
  onBack,
  onCharacterSelect,
  isMobile = false
}) {
  // Filter out main character, get invited participants
  const invitedParticipants = participants.slice(1); // Remove main character

  // Get character display name helper
  const getCharacterDisplayName = (characterKey) => {
    const char = CHARACTERS[characterKey];
    if (char) {
      return char.display_name || char.name || characterKey.replace(/_/g, ' ');
    }
    return characterKey.replace(/_/g, ' ');
  };

  // Check if character is suggested for invite
  const isSuggested = (characterKey) => {
    return inviteSuggestions.includes(characterKey);
  };

  return (
    <div className={`radial-menu ${isOpen ? 'open' : 'closed'}`}>
      {/* Back Button - Always at 12 o'clock */}
      <div className="radial-item radial-back" onClick={onBack}>
        <div className="radial-button">
          <ArrowLeft size={isMobile ? 16 : 20} />
        </div>
        <span className="radial-label">Back</span>
      </div>

      {/* Invited Participants - Distributed around circle */}
      {invitedParticipants.map((participant, index) => {
        const angle = 120 + (index * 120); // Start at 4 o'clock, distribute evenly
        const isHighlighted = isSuggested(participant);
        
        return (
          <div
            key={participant}
            className={`radial-item radial-participant ${isHighlighted ? 'suggested' : ''}`}
            style={{ '--angle': `${angle}deg` }}
            onClick={() => onCharacterSelect(participant)}
          >
            <div className="radial-button participant-button">
              <img
                src={`/images/${participant}.jpg`}
                alt={getCharacterDisplayName(participant)}
                className="participant-avatar"
                onError={(e) => {
                  e.target.src = '/images/default-character.jpg';
                }}
              />
              {isHighlighted && <div className="suggestion-glow"></div>}
            </div>
            <span className="radial-label">
              {getCharacterDisplayName(participant)}
            </span>
          </div>
        );
      })}

      {/* No participants message */}
      {invitedParticipants.length === 0 && isOpen && (
        <div className="radial-item radial-empty" style={{ '--angle': '180deg' }}>
          <div className="radial-button empty-button">
            <span>•••</span>
          </div>
          <span className="radial-label">No participants</span>
        </div>
      )}
    </div>
  );
}