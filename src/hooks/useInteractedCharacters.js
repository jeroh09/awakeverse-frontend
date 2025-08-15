// src/hooks/useInteractedCharacters.js - Enhanced version
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function useInteractedCharacters() {
  const [interactedCharacters, setInteractedCharacters] = useState([]);
  const [recentCharacters, setRecentCharacters] = useState([]); // 🆕 NEW: Rich data for "For You"
  const [interactionStats, setInteractionStats] = useState({
    totalCharacters: 0,
    totalInteractions: 0,
    hasRecentActivity: false
  }); // 🆕 NEW: Overall stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCharacters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching enhanced interacted characters...');
      const response = await api.get('/interacted-characters');
      
      console.log('📡 Enhanced API Response:', response);
      console.log('📊 Enhanced Response data:', response.data);
      
      // Ensure we have an array and validate the enhanced structure
      const charactersData = Array.isArray(response.data) ? response.data : [];
      
      // 🆕 NEW: Extract recent characters with rich data for "For You" section
      const validRecentCharacters = charactersData
        .filter(char => 
          char && 
          char.character && 
          char.name && 
          char.interactionCount > 0
        )
        .slice(0, 6); // Limit to 6 for clean UI
      
      // 🔄 MAINTAIN: Backward compatibility - extract just character keys for existing usage
      const characterKeys = charactersData
        .map(char => char.character)
        .filter(char => char != null && char !== '')
        .map(char => String(char).trim())
        .filter(char => char.length > 0);
      
      console.log('✅ Enhanced characters data:', {
        recentCount: validRecentCharacters.length,
        totalKeys: characterKeys.length,
        sampleRecent: validRecentCharacters.slice(0, 2)
      });
      
      // Set both data structures
      setRecentCharacters(validRecentCharacters);
      setInteractedCharacters(characterKeys); // Maintain backward compatibility
      
    } catch (error) {
      console.error('❌ Failed to fetch interacted characters:', error);
      setError(error.message || 'Failed to load characters');
      setRecentCharacters([]);
      setInteractedCharacters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🆕 NEW: Fetch interaction stats separately (optional)
  const fetchInteractionStats = useCallback(async () => {
    try {
      const response = await api.get('/interaction-stats');
      setInteractionStats(response.data);
      console.log('📈 Interaction stats:', response.data);
    } catch (error) {
      console.warn('⚠️ Failed to fetch interaction stats:', error);
      // Non-critical, don't set error state
    }
  }, []);

  // 🆕 NEW: Track interaction (call when user starts chat)
  const trackInteraction = useCallback(async (characterKey) => {
    try {
      await api.post('/interactions/track', { character: characterKey });
      console.log(`📊 Tracked interaction with ${characterKey}`);
      
      // Refresh data after tracking
      setTimeout(() => {
        fetchCharacters();
        fetchInteractionStats();
      }, 100); // Small delay to ensure backend is updated
      
    } catch (error) {
      console.warn('⚠️ Failed to track interaction:', error);
      // Non-critical, don't show error to user
    }
  }, [fetchCharacters, fetchInteractionStats]);

  useEffect(() => {
    fetchCharacters();
    fetchInteractionStats();
  }, [fetchCharacters, fetchInteractionStats]);

  // 🆕 NEW: Computed properties for "For You" section logic
  const shouldShowForYou = recentCharacters.length >= 2; // Show when 2+ interactions
  const hasActiveConversations = recentCharacters.some(char => char.hasActiveConversation);
  const mostRecentCharacter = recentCharacters[0] || null;

  // 🆕 NEW: Helper functions for enhanced features
  const getCharacterByKey = useCallback((characterKey) => {
    return recentCharacters.find(char => char.character === characterKey);
  }, [recentCharacters]);

  const getActiveConversations = useCallback(() => {
    return recentCharacters.filter(char => char.hasActiveConversation);
  }, [recentCharacters]);

  // Provide a manual refresh function
  const refresh = useCallback(() => {
    fetchCharacters();
    fetchInteractionStats();
  }, [fetchCharacters, fetchInteractionStats]);

  return { 
    // 🔄 EXISTING: Maintain backward compatibility
    interactedCharacters, 
    loading, 
    error,
    refresh,
    
    // 🆕 NEW: Enhanced data and functionality
    recentCharacters,        // Rich data for "For You" section
    interactionStats,        // Overall user stats
    shouldShowForYou,        // Boolean: show "For You" section?
    hasActiveConversations,  // Boolean: any ongoing chats?
    mostRecentCharacter,     // Most recent character object
    
    // 🆕 NEW: Helper functions
    trackInteraction,        // Call when starting chat
    getCharacterByKey,       // Get rich data for specific character
    getActiveConversations   // Get all characters with active chats
  };
}