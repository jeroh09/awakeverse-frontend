// src/components/UnifiedMobileAuth.jsx - Enhanced for Celestial theme
import React, { useState } from 'react';
import './EnhancedMobileAuth.css';


// Sample characters for mobile demo
const MOBILE_CHARACTERS = [
  { id: 'sherlock', name: 'Sherlock Holmes' },
  { id: 'cleopatra', name: 'Cleopatra' },
  { id: 'socrates', name: 'Socrates' },
  { id: 'nostradamus', name: 'Nostradamus' },
  { id: 'loki', name: 'Loki' },
  { id: 'boudica', name: 'Boudica' }
];

export default function UnifiedMobileAuth({ mode, onSubmit, error, loading }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setTimeout(() => setShowForm(true), 300);
  };

  const isLogin = mode === 'login';

  return (
    <div className="unified-mobile-auth">
      <div className="mobile-device-frame">
        <div className="mobile-screen">
          
          {!showForm ? (
            // Character Selection View
            <div className="character-selection-view">
              <div className="mobile-header">
                <h2>{isLogin ? 'Welcome Back' : 'Choose Your Guide'}</h2>
                <p>{isLogin ? 'Select a character to continue' : 'Pick a legendary figure to begin'}</p>
              </div>
              
              <div className="mobile-characters-grid">
                {MOBILE_CHARACTERS.map(character => (
                  <div 
                    key={character.id}
                    className={`mobile-character-card ${selectedCharacter?.id === character.id ? 'selected' : ''}`}
                    onClick={() => handleCharacterSelect(character)}
                  >
                    <div className="mobile-character-avatar">
                      <img
                        src={`/images/${character.id}.jpg`}
                        alt={character.name}
                        onError={(e) => {
                          e.target.src = '/images/default-character.jpg';
                        }}
                      />
                      <div className="character-glow"></div>
                    </div>
                    <span className="mobile-character-name">{character.name}</span>
                  </div>
                ))}
              </div>
              
              <div className="mobile-continue-hint">
                <p>Tap a character to {isLogin ? 'sign in' : 'begin your journey'}</p>
              </div>
            </div>
          ) : (
            // Form View
            <div className="form-view">
              <div className="mobile-header">
                <button 
                  className="back-btn"
                  onClick={() => setShowForm(false)}
                >
                  ← Back
                </button>
                <h2>{isLogin ? 'Welcome Back' : 'Join the Realm'}</h2>
              </div>
              
              {selectedCharacter && (
                <div className="selected-guide">
                  <img
                    src={`/images/${selectedCharacter.id}.jpg`}
                    alt={selectedCharacter.name}
                    className="guide-avatar"
                  />
                  <p>Guided by <strong>{selectedCharacter.name}</strong></p>
                </div>
              )}
              
              <form onSubmit={handleFormSubmit} className="mobile-auth-form">
                {error && <div className="mobile-error">{error}</div>}
                
                {!isLogin && (
                  <div className="form-group">
                    <label>Your Name in the Realm</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      placeholder="Choose your identity"
                      disabled={loading}
                      required
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Email address"
                    disabled={loading}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder={isLogin ? "Enter your password" : "Create your secret key (min 6)"}
                    disabled={loading}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="mobile-submit-btn"
                  disabled={loading}
                >
                  {loading 
                    ? (isLogin ? 'Awakening...' : 'Creating Realm...') 
                    : (isLogin ? 'Enter the Realm' : 'Begin Journey')
                  }
                </button>
              </form>
              
              <div className="mobile-switch-mode">
                <p>
                  {isLogin ? "New to the realm? " : "Already awakened? "}
                  <a href={isLogin ? "/register" : "/login"}>
                    {isLogin ? "Begin your journey" : "Return to your realm"}
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}