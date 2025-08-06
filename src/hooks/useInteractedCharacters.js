// src/hooks/useInteractedCharacters.js
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function useInteractedCharacters() {
  const [interactedCharacters, setInteractedCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCharacters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching interacted characters...');
      const response = await api.get('/interacted-characters');
      
      console.log('📡 API Response:', response);
      console.log('📊 Response data:', response.data);
      
      // Ensure we have an array and normalize the data
      const characters = Array.isArray(response.data) ? response.data : [];
      
      // Filter out any null/undefined/empty values and normalize to strings
      const cleanedCharacters = characters
        .filter(char => char != null && char !== '')
        .map(char => String(char).trim())
        .filter(char => char.length > 0);
      
      console.log('✅ Cleaned characters:', cleanedCharacters);
      setInteractedCharacters(cleanedCharacters);
      
    } catch (error) {
      console.error('❌ Failed to fetch interacted characters:', error);
      setError(error.message || 'Failed to load characters');
      setInteractedCharacters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // Provide a manual refresh function
  const refresh = useCallback(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  return { 
    interactedCharacters, 
    loading, 
    error,
    refresh 
  };
}