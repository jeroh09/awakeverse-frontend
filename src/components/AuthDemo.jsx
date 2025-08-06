// AuthDemo.jsx - Interactive device frame for auth page
import React, { useState } from 'react';
import './onboarding/Onboarding.css';

const DEMO_CHARACTERS = [
  { id: 'sherlock', name: 'Sherlock Holmes' },
  { id: 'cleopatra', name: 'Cleopatra' },
  { id: 'socrates', name: 'Socrates' },
  { id: 'loki', name: 'Loki' },
  { id: 'mami_wata', name: 'Mami Wata' },
  { id: 'nostradamus', name: 'Nostradamus' },
  { id: 'lilith', name: 'Lilith' },
  { id: 'boudica', name: 'Boudica' },
  { id: 'harriet_tubman', name: 'Harriet Tubman' }
];

const DEMO_MESSAGES = {
  sherlock: "The game is afoot! What mystery shall we unravel?",
  cleopatra: "You stand before royalty. State your purpose clearly.",
  socrates: "Let us question together and find wisdom.",
  loki: "What mischief brings you before the God of Stories?",
  mami_wata: "The waters ripple with your arrival...",
  nostradamus: "I foresaw your coming in the stars.",
  lilith: "You dare summon the first who said no?",
  boudica: "The fire of rebellion burns eternal.",
  harriet_tubman: "Freedom calls to all who have ears to hear."
};

export default function AuthDemo() {
  const [view, setView] = useState('grid');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [demoMessage, setDemoMessage] = useState('');

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setDemoMessage(DEMO_MESSAGES[character.id] || "Welcome to Awakeverse!");
    setView('chat');
    
    // Auto-return to grid after 3 seconds
    setTimeout(() => {
      setView('grid');
      setSelectedCharacter(null);
      setDemoMessage('');
    }, 3000);
  };

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedCharacter(null);
    setDemoMessage('');
  };

  return (
    <div className="device-frame">
      <div className="device-screen">
        <div className="app-header">
          {view === 'grid' ? (
            'Choose Your Guide'
          ) : (
            <>
              <button className="back-button" onClick={handleBackToGrid}>
                &larr;
              </button>
              <span>{selectedCharacter?.name}</span>
            </>
          )}
        </div>

        <div className="app-content">
          {view === 'grid' ? (
            <div className="avatars-grid">
              {DEMO_CHARACTERS.map(character => (
                <div 
                  key={character.id}
                  className="avatar-card"
                  onClick={() => handleCharacterSelect(character)}
                >
                  <div className="avatar-frame">
                    <img
                      src={`/images/${character.id}.jpg`}
                      alt={character.name}
                      className="avatar-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="avatar-glow"></div>
                  </div>
                  <span className="avatar-label">{character.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="chat-view">
              <div className="chat-messages">
                <div className="chat-row">
                  <img
                    className="chat-avatar"
                    src={`/images/${selectedCharacter.id}.jpg`}
                    alt={selectedCharacter.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="chat-bubble ai">
                    <p style={{ textTransform: 'none', margin: 0 }}>
                      {demoMessage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Sign up to start chatting..."
                  disabled
                  style={{ opacity: 0.7 }}
                />
                <button disabled style={{ opacity: 0.7 }}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}