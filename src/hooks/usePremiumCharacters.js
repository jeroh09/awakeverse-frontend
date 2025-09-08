// Update to usePremiumCharacters.js - Add trial-specific state handling

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

  // NEW: Trial-specific states
  const [trialJustStarted, setTrialJustStarted] = useState(false);
  const [lastKnownPremiumStatus, setLastKnownPremiumStatus] = useState(null);

  // Computed properties
  const isPremium = premiumStatus?.is_premium || false;
  const canCreateCharacter = premiumStatus?.can_create_character || false;
  const characterCount = premiumStatus?.custom_character_count || 0;
  const approvedCharacters = userCharacters.filter(char => char.status === 'approved');

  // NEW: Trial-specific computed properties
  const isOnTrial = premiumStatus?.subscription_status === 'trial';
  const trialEndsAt = premiumStatus?.trial_ends_at;
  const daysRemaining = trialEndsAt ? Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  // Real API function: Get premium status (enhanced for trial detection)
  const fetchPremiumStatus = useCallback(async () => {
    if (!user?.id || !token) return null;
    
    try {
      console.log('ðŸ“Š Fetching premium status for user:', user.id);
      
      const response = await fetch(`${API_BASE}/api/premium/status/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
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
      const newStatus = data.premium_status || data;
      
      // NEW: Detect trial start
      if (lastKnownPremiumStatus && !lastKnownPremiumStatus.is_premium && newStatus.is_premium && newStatus.subscription_status === 'trial') {
        console.log('ðŸŽ‰ Trial just started for user!');
        setTrialJustStarted(true);
        
        // Clear the notification after 5 seconds
        setTimeout(() => {
          setTrialJustStarted(false);
        }, 5000);
      }
      
      setLastKnownPremiumStatus(newStatus);
      console.log('âœ… Premium status response:', newStatus);
      
      return newStatus;
      
    } catch (error) {
      console.error('âŒ Premium status fetch failed:', error);
      
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
  }, [user?.id, token, lastKnownPremiumStatus]);

  // Real API function: Get user's characters (enhanced for trial users)
  const fetchUserCharacters = useCallback(async () => {
    if (!user?.id || !token || !isPremium) return [];
    
    try {
      console.log('ðŸ“Š Fetching user characters for user:', user.id);
      
      const response = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Characters API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('âœ… User characters response:', data);
      
      return data.characters || data || [];
      
    } catch (error) {
      console.error('âŒ User characters fetch failed:', error);
      return [];
    }
  }, [user?.id, token, isPremium]);

  // Real API function: Get character templates
  const fetchCharacterTemplates = useCallback(async () => {
    if (!token) return [];
    
    try {
      console.log('ðŸ“Š Fetching character templates');
      
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
      console.log('âœ… Templates response:', data);
      
      if (data.template_groups && typeof data.template_groups === 'object') {
        const flatTemplates = Object.values(data.template_groups).flat();
        if (flatTemplates.length > 0) {
          return flatTemplates;
        }
      }
      
      if (Array.isArray(data.templates)) {
        return data.templates;
      }
      
      if (Array.isArray(data)) {
        return data;
      }
      
      console.warn('âš ï¸ No valid template data found in response structure');
      return [];
      
    } catch (error) {
      console.error('âŒ Templates fetch failed:', error);
      return [];
    }
  }, [token]);

  // Enhanced data loading effect with trial detection
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

        console.log('ðŸš€ Starting premium data load sequence');
        const status = await fetchPremiumStatus();
        if (!isMounted) return;
        
        setPremiumStatus(status);
        console.log('ðŸ“Š Premium status loaded:', status?.subscription_status);

        const templatesPromise = fetchCharacterTemplates();
        
        const promises = [templatesPromise];
        if (status?.is_premium) {
          console.log('ðŸ’Ž User has premium - loading characters');
          promises.push(fetchUserCharacters());
        }

        const [templates, characters = []] = await Promise.all(promises);
        
        if (!isMounted) return;

        setCharacterTemplates(templates);
        setUserCharacters(characters);
        
        console.log('ðŸŽ‰ Premium data load complete', {
          premium: status?.is_premium,
          trial: status?.subscription_status === 'trial',
          templatesCount: templates?.length || 0,
          charactersCount: characters?.length || 0,
          trialEndsAt: status?.trial_ends_at
        });

      } catch (err) {
        if (!isMounted) return;
        console.error('ðŸ’¥ Premium data loading failed:', err);
        setError(err.message || 'Failed to load premium features');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [token, user?.id]); // ONLY depend on primitive values, not functions

  // Real API function: Grant trial (kept for manual testing)
  const grantTrial = useCallback(async () => {
    if (!user?.id || !token) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('ðŸ†“ Granting trial for user:', user.id);
      
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
      console.log('âœ… Trial granted:', data);
      
      // Refresh premium status after granting trial
      const newStatus = await fetchPremiumStatus();
      setPremiumStatus(newStatus);
      
      return data;
      
    } catch (error) {
      console.error('âŒ Trial grant failed:', error);
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
      console.log('ðŸŽ­ Creating character:', characterData.display_name);
      
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
      console.log('âœ… Character created:', data);
      
      // Refresh both characters and premium status
      const [newCharacters, newStatus] = await Promise.all([
        fetchUserCharacters(),
        fetchPremiumStatus()
      ]);
      
      setUserCharacters(newCharacters);
      setPremiumStatus(newStatus);
      
      return data.character || data;
      
    } catch (error) {
      console.error('âŒ Character creation failed:', error);
      throw error;
    }
  }, [user?.id, token, canCreateCharacter, fetchUserCharacters, fetchPremiumStatus]);

  const refresh = useCallback(() => {
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
    
    // NEW: Trial-specific properties
    isOnTrial,
    trialEndsAt,
    daysRemaining,
    trialJustStarted,
    
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