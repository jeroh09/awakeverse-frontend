// src/hooks/usePremiumCharacters.js - Simplified character-specific hook
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import usePremiumCapabilities from './usePremiumCapabilities';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export default function usePremiumCharacters() {
  const { token } = useAuth();
  const { user } = useUser();
  const { isPremium, invalidateAndRefresh } = usePremiumCapabilities();
  
  const [userCharacters, setUserCharacters] = useState([]);
  const [characterTemplates, setCharacterTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's characters - NO premium gate
  const fetchUserCharacters = useCallback(async () => {
    if (!user?.id || !token) return [];
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Failed to load characters`);
      }

      const data = await response.json();
      const characters = data.characters || [];
      setUserCharacters(characters);
      return characters;
      
    } catch (error) {
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  // Fetch character templates with pagination
  const fetchCharacterTemplates = useCallback(async () => {
    if (!token) return {};

    try {
      setError(null);
      // Load all templates in one request
      const response = await fetch(`${API_BASE}/api/premium/templates?per_page=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load templates`);
      }

      const data = await response.json();
      setCharacterTemplates(data.template_groups || {});

      return data;

    } catch (error) {
      setError(error.message);
      return {};
    }
  }, [token]);

  // Create character with optimistic updates
  const createCharacter = useCallback(async (characterData) => {
    if (!user?.id || !token) {
      throw new Error('Authentication required');
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(characterData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Character creation failed');
      }

      const data = await response.json();
      // Optimistically add to local state
      const newCharacter = {
        ...data.character,
        status: 'pending',
        short_description: characterData.short_description,
        historical_period: characterData.historical_period,
        personality_archetype: characterData.personality_archetype,
        expertise_domain: characterData.expertise_domain
      };
      
      setUserCharacters(prev => [newCharacter, ...prev]);
      
      // Invalidate capabilities cache since user now has pending character
      await invalidateAndRefresh();
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [user?.id, token, invalidateAndRefresh]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.allSettled([
        fetchUserCharacters(),
        fetchCharacterTemplates()
      ]);
    };
    
    loadData();
  }, [fetchUserCharacters, fetchCharacterTemplates]);

  // Computed properties
  const approvedCharacters = userCharacters.filter(char => char.status === 'approved');
  const pendingCharacters = userCharacters.filter(char => char.status === 'pending');

  return {
    // Data
    userCharacters,
    approvedCharacters,
    pendingCharacters,
    characterTemplates,
    
    // State
    loading,
    error,
    
    // Actions
    createCharacter,
    fetchUserCharacters,
    fetchCharacterTemplates,
    
    // Computed
    hasCharacters: userCharacters.length > 0,
    hasPendingCharacters: pendingCharacters.length > 0,
    
    // Legacy compatibility
    isPremium
  };
}