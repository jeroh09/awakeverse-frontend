// src/hooks/usePremiumCharacters.js - Phase 2: Real API integration
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function usePremiumCharacters() {
  const { token } = useAuth();
  const { user } = useUser();
  
  // State management
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [userCharacters, setUserCharacters] = useState([]);
  const [characterTemplates, setCharacterTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Computed properties
  const isPremium = premiumStatus?.is_premium || false;
  const canCreateCharacter = premiumStatus?.can_create_character || false;
  const characterCount = premiumStatus?.custom_character_count || 0;
  const approvedCharacters = userCharacters.filter(char => char.status === 'approved');

  // Real API function: Get premium status
  const fetchPremiumStatus = useCallback(async () => {
    if (!user?.id || !token) return null;
    
    try {
      console.log('🔄 Fetching premium status for user:', user.id);
      
      const response = await fetch(`${API_BASE}/api/premium/status/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // User not found - return default free status
          return {
            is_premium: false,
            is_trial: false,
            subscription_status: 'free',
            custom_character_count: 0,
            can_create_character: false,
            days_remaining: null
          };
        }
        throw new Error(`Premium status API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Premium status response:', data);
      
      return data.premium_status || data; // Handle different response structures
      
    } catch (error) {
      console.error('❌ Premium status fetch failed:', error);
      
      // Fallback to free user status on error
      return {
        is_premium: false,
        is_trial: false,
        subscription_status: 'free',
        custom_character_count: 0,
        can_create_character: false,
        days_remaining: null,
        error: error.message
      };
    }
  }, [user?.id, token]);

  // Real API function: Get user's characters
  const fetchUserCharacters = useCallback(async () => {
    if (!user?.id || !token || !isPremium) return [];
    
    try {
      console.log('🔄 Fetching user characters for user:', user.id);
      
      const response = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No characters found
        }
        throw new Error(`Characters API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ User characters response:', data);
      
      return data.characters || data || [];
      
    } catch (error) {
      console.error('❌ User characters fetch failed:', error);
      return [];
    }
  }, [user?.id, token, isPremium]);

  // Real API function: Get character templates
  const fetchCharacterTemplates = useCallback(async () => {
    if (!token) return [];
    
    try {
      console.log('🔄 Fetching character templates');
      
      const response = await fetch(`${API_BASE}/api/premium/templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Templates API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Templates response:', data);
      
      // Handle grouped template response from backend
      if (data.template_groups) {
  // Flatten grouped templates into single array
        const flatTemplates = Object.values(data.template_groups).flat();
        return flatTemplates;
      }
      return data.templates || data || [];
      
    } catch (error) {
      console.error('❌ Templates fetch failed:', error);
      // Return mock templates as fallback
      return [
        {
          id: 1,
          name: 'Historical Leader',
          description: 'Military commanders and rulers who shaped history',
          historical_period: 'Ancient to Medieval',
          personality_archetype: 'Leader',
          expertise_domain: 'Military Strategy'
        }
      ];
    }
  }, [token]);

  // Main data loading effect
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!token || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load premium status first
        console.log('🚀 Starting premium data load sequence');
        const status = await fetchPremiumStatus();
        if (!isMounted) return;
        
        setPremiumStatus(status);
        console.log('📊 Premium status loaded:', status?.subscription_status);

        // Load templates in parallel (always available)
        const templatesPromise = fetchCharacterTemplates();
        
        // Load characters only if premium
        const promises = [templatesPromise];
        if (status?.is_premium) {
          console.log('💎 User has premium - loading characters');
          promises.push(fetchUserCharacters());
        }

        const [templates, characters = []] = await Promise.all(promises);
        
        if (!isMounted) return;

        setCharacterTemplates(templates);
        setUserCharacters(characters);
        
        console.log('🎉 Premium data load complete', {
          premium: status?.is_premium,
          templatesCount: templates?.length || 0,
          charactersCount: characters?.length || 0
        });

      } catch (err) {
        if (!isMounted) return;
        console.error('💥 Premium data loading failed:', err);
        setError(err.message || 'Failed to load premium features');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [token, user?.id, fetchPremiumStatus, fetchUserCharacters, fetchCharacterTemplates]);

  // Real API function: Grant trial
  const grantTrial = useCallback(async () => {
    if (!user?.id || !token) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('🆓 Granting trial for user:', user.id);
      
      const response = await fetch(`${API_BASE}/api/premium/trial/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trial_days: 3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Trial grant failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Trial granted:', data);
      
      // Refresh premium status after granting trial
      const newStatus = await fetchPremiumStatus();
      setPremiumStatus(newStatus);
      
      return data;
      
    } catch (error) {
      console.error('❌ Trial grant failed:', error);
      throw error;
    }
  }, [user?.id, token, fetchPremiumStatus]);

  // Real API function: Create character
  const createCharacter = useCallback(async (characterData) => {
    if (!user?.id || !token) {
      throw new Error('User not authenticated');
    }
    
    if (!canCreateCharacter) {
      throw new Error('Cannot create character - check premium status and limits');
    }

    try {
      console.log('🎭 Creating character:', characterData.display_name);
      
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
        throw new Error(errorData.error || `Character creation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Character created:', data);
      
      // Refresh both characters and premium status
      const [newCharacters, newStatus] = await Promise.all([
        fetchUserCharacters(),
        fetchPremiumStatus()
      ]);
      
      setUserCharacters(newCharacters);
      setPremiumStatus(newStatus);
      
      return data.character || data;
      
    } catch (error) {
      console.error('❌ Character creation failed:', error);
      throw error;
    }
  }, [user?.id, token, canCreateCharacter, fetchUserCharacters, fetchPremiumStatus]);

  const refresh = useCallback(() => {
    // Force refresh of all data
    if (user?.id && token) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [status, templates, characters] = await Promise.all([
            fetchPremiumStatus(),
            fetchCharacterTemplates(),
            fetchUserCharacters()
          ]);
          
          setPremiumStatus(status);
          setCharacterTemplates(templates);
          setUserCharacters(characters);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user?.id, token, fetchPremiumStatus, fetchCharacterTemplates, fetchUserCharacters]);

  return {
    // Status
    premiumStatus,
    loading,
    error,
    
    // Computed flags
    isPremium,
    canCreateCharacter,
    characterCount,
    
    // Data
    userCharacters,
    approvedCharacters,
    characterTemplates,
    
    // Actions
    grantTrial,
    createCharacter,
    refresh,
    
    // Meta
    isInitialized: !loading && premiumStatus !== null
  };
}