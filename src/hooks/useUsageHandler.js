// hooks/useUsageHandler.js - Defensive usage handling for custom characters only
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useUsageHandler = (character) => {
  const { token } = useAuth();
  const [usageState, setUsageState] = useState({
    isBlocked: false,
    usageData: null,
    upgradeInfo: null,
    showWarning: false,
    warningLevel: null
  });

  // Only track usage for custom characters
  const isCustomCharacter = character && character.startsWith('user_');
  
  // Enhanced sendMessage that replaces sendAI for custom characters
  const sendMessageWithUsageHandling = useCallback(async (userText, aiIndex, setChatHistory) => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          character, 
          message: userText, 
          thread_id: 'main' // or your thread_id logic
        })
      });

      // Handle usage limit reached (429 status)
      if (response.status === 429) {
        const limitData = await response.json();
        
        if (limitData.educational) {
          console.log('🚫 Usage limit reached - activating graceful blocking');
          
          // Update usage state to show blocking UI
          setUsageState({
            isBlocked: true,
            usageData: limitData.usage_data,
            upgradeInfo: limitData.upgrade_info,
            showWarning: true,
            warningLevel: 'blocked'
          });
          
          // Update chat to show limit reached message instead of AI response
          setChatHistory(prev => {
            const copy = [...prev];
            if (copy[aiIndex]) {
              copy[aiIndex] = {
                ...copy[aiIndex],
                text: '', // No AI response
                blocked: true,
                limitData: limitData
              };
            }
            return copy;
          });
          
          return {
            blocked: true,
            reason: 'usage_limit_reached',
            upgradeData: limitData
          };
        }
      }

      if (!response.ok || !response.body) {
        throw new Error(`Chat API failed: ${response.status} ${response.statusText}`);
      }

      // Handle successful streaming response (existing logic)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let hasInviteSuggestion = false;
      let inviteCandidates = [];
      let latestUsageData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const token = data.response || '';
            fullReply += token;

            // Extract usage data from stream (custom characters only)
            if (isCustomCharacter && data.usage_data) {
              latestUsageData = data.usage_data;
            }

            if (data.has_invite_suggestion) {
              hasInviteSuggestion = true;
              inviteCandidates = data.invite_candidates || [];
            }

            setChatHistory(prev => {
              const copy = [...prev];
              copy[aiIndex] = {
                ...copy[aiIndex],
                speaker: data.speaker || character,
                text: fullReply,
                has_invite_suggestion: hasInviteSuggestion,
                invite_candidates: inviteCandidates,
                blocked: false
              };
              return copy;
            });

          } catch (err) {
            console.warn('JSON parse error:', err);
          }
        }
      }

      // Update usage state from successful response
      if (isCustomCharacter && latestUsageData) {
        const { usage_percentage, warning_level } = latestUsageData;
        
        setUsageState(prev => ({
          ...prev,
          isBlocked: false,
          usageData: latestUsageData,
          warningLevel: warning_level,
          showWarning: usage_percentage >= 80 // Show warning at 80%+
        }));
      }

      return { blocked: false, success: true };

    } catch (err) {
      console.error('Enhanced sendMessage error:', err);
      
      // DEFENSIVE: Update chat history with error, don't break app
      setChatHistory(prev => {
        const copy = [...prev];
        if (copy[aiIndex]) {
          copy[aiIndex] = { 
            ...copy[aiIndex], 
            error: `Something went wrong: ${err.message}`,
            blocked: false
          };
        }
        return copy;
      });
      
      return { blocked: false, error: err.message };
    }
  }, [character, token, isCustomCharacter]);

  // Get current usage warning message
  const getUsageWarning = useCallback(() => {
    if (!isCustomCharacter || !usageState.usageData) return null;
    
    const { messages_remaining, usage_percentage, tier } = usageState.usageData;
    
    if (usageState.isBlocked) {
      return {
        type: 'blocked',
        message: `You've reached your ${tier} plan limit for this character. Upgrade to continue chatting.`,
        action: 'upgrade_required'
      };
    }
    
    if (usage_percentage >= 90) {
      return {
        type: 'critical',
        message: `Only ${messages_remaining} messages left this month with custom characters.`,
        action: 'upgrade_suggested'
      };
    }
    
    if (usage_percentage >= 80) {
      return {
        type: 'warning',
        message: `${messages_remaining} messages remaining this month with custom characters.`,
        action: 'info'
      };
    }
    
    return null;
  }, [usageState, isCustomCharacter]);

  // Reset usage state (after upgrade)
  const resetUsageState = useCallback(() => {
    setUsageState({
      isBlocked: false,
      usageData: null,
      upgradeInfo: null,
      showWarning: false,
      warningLevel: null
    });
  }, []);

  return {
    // Core function that replaces sendAI for custom characters
    sendMessageWithUsageHandling,
    
    // State
    usageState,
    isCustomCharacter,
    
    // Computed properties
    isBlocked: usageState.isBlocked,
    shouldShowWarning: usageState.showWarning,
    usageWarning: getUsageWarning(),
    
    // Actions
    resetUsageState
  };
};