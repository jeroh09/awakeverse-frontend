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
      const response = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Characters API failed: ${response.status}`);
      }

      const data = await response.json();
      const characters = data.characters || [];
      setUserCharacters(characters);
      return characters;
      
    } catch (error) {
      console.error('Failed to fetch characters:', error);
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  // Fetch character templates with pagination
  const fetchCharacterTemplates = useCallback(async () => {
    if (!token) return [];

    try {
      // Load all templates in one request
      const response = await fetch(`${API_BASE}/api/premium/templates?per_page=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Templates API failed: ${response.status}`);
      }

      const data = await response.json();
      alert(`RAW API RESPONSE: ${JSON.stringify(data, null, 2)}`);
      setCharacterTemplates(data.template_groups || {});

      return data;

    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setError(error.message);
      return {};
    }
  }, [token]);

  // Create character with optimistic updates
  const createCharacter = useCallback(async (characterData) => {
    if (!user?.id || !token) {
      throw new Error('User not authenticated');
    }
    alert(`DEBUG 1: About to create character
      URL: ${API_BASE}/api/premium/characters
      User: ${user.id}
      Token: ${token ? 'Present' : 'Missing'}`);

    try {
      const response = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(characterData)
      });
      alert(`DEBUG 2: Response received
        Status: ${response.status}
        OK: ${response.ok}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(`DEBUG 3: Error response: ${JSON.stringify(errorData)}`);

        throw new Error(errorData.error || `Character creation failed: ${response.status}`);
      }

      const data = await response.json();
      alert(`DEBUG 4: Success response: ${JSON.stringify(data)}`);
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
      alert(`DEBUG 5: Exception caught: ${error.message}`);
      console.error('Character creation failed:', error);
      throw error;
    }
  }, [user?.id, token]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const [characters, templates] = await Promise.all([
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
    isPremium // For components that still check this
  };
}
