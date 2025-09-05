// src/contexts/CharacterContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  const [selectedCharacterKey, setSelectedCharacterKey] = useState(null);
  const [previewCharacterKey, setPreviewCharacterKey] = useState(null);
  const { token } = useAuth();

  // 1. Add interaction tracking method
  const trackInteraction = useCallback(async (characterKey) => {
    if (!token) {
      console.warn('No token available for interaction tracking');
      return false;
    }

    try {
      const response = await api.post('/interactions/track', {
        character: characterKey.toLowerCase()
      });
      console.log('✅ Interaction tracked:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Failed to track interaction:', error);
      return false;
    }
  }, [token]);

  // 2. Create wrapped version of setSelectedCharacterKey
  const selectCharacter = useCallback(async (key) => {
    await trackInteraction(key);
    setSelectedCharacterKey(key);
  }, [trackInteraction]);

  return (
    <CharacterContext.Provider
      value={{
        selectedCharacterKey,
        setSelectedCharacterKey: selectCharacter, // Use the wrapped version
        previewCharacterKey,
        setPreviewCharacterKey,
        trackInteraction // Expose directly if needed elsewhere
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}

// 3. Optional: Create dedicated hook for interaction tracking
export function useTrackInteraction() {
  const { trackInteraction } = useCharacter();
  return trackInteraction;
}