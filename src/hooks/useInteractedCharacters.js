// src/hooks/useInteractedCharacters.js - Enhanced version
import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useSocket } from '../contexts/WebSocketContext'; // ← ensure this import exists

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
  
  const socket = useSocket(); // ← Get socket instance

  const fetchCharacters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/interacted-characters');
            
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
    } catch (error) {
      console.warn('⚠️ Failed to fetch interaction stats:', error);
      // Non-critical, don't set error state
    }
  }, []);

  // 🆕 NEW: Track interaction (call when user starts chat)
  const trackInteraction = useCallback(async (characterKey) => {
    try {
      await api.post('/interactions/track', { character: characterKey });      
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

  // 🆕 NEW: WebSocket listener for real-time interaction updates
  useEffect(() => {
    if (!socket) return;

    const onTick = (payload) => {
      // payload: { character, name, interactionCount, last_seen, active_until }
      // Update just the affected entry to avoid full rerenders/refetches
      setRecentCharacters((prev) => {
        if (!Array.isArray(prev)) return prev;
        const idx = prev.findIndex((c) => (c.character || c.key) === payload.character);
        const next = [...prev];

        if (idx >= 0) {
          const prevItem = next[idx] || {};
          next[idx] = {
            ...prevItem,
            character: payload.character,
            name: payload.name || prevItem.name,
            interactionCount: payload.interactionCount ?? prevItem.interactionCount ?? 1,
            last_seen: payload.last_seen ?? prevItem.last_seen ?? Date.now()/1000,
            hasActiveConversation: (payload.active_until && payload.active_until * 1000 > Date.now()) || prevItem.hasActiveConversation || false,
          };
        } else {
          // if the character isn't in the list yet, optionally prepend a lightweight card
          next.unshift({
            character: payload.character,
            name: payload.name || payload.character.replace(/_/g, ' '),
            interactionCount: payload.interactionCount ?? 1,
            last_seen: payload.last_seen ?? Math.floor(Date.now()/1000),
            hasActiveConversation: !!(payload.active_until && payload.active_until * 1000 > Date.now()),
            thumbnailUrl: '/images/default-character.jpg'
          });
        }
        return next;
      });

      // Update interaction stats optimistically
      setInteractionStats(prev => ({
        ...prev,
        totalInteractions: prev.totalInteractions + 1,
        hasRecentActivity: true
      }));
    };

    socket.on('interaction:tick', onTick);
    return () => {
      socket.off('interaction:tick', onTick);
    };
  }, [socket]);

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