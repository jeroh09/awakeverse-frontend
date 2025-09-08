// src/hooks/usePremiumCharacterFlow.js - Fixed with standalone success handling
import React, { useState, useCallback, useContext, createContext, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import usePremiumCharacters from './usePremiumCharacters';

const FLOW_STATES = {
  LAUNCHER: 'launcher',
  TEMPLATES: 'templates',
  BUILDER: 'builder',
  SUCCESS: 'success'
};

const PremiumCharacterContext = createContext();

// Error Boundary Component
class PremiumCharacterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Premium Character Flow Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#ff6b6b',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '8px',
          margin: '1rem'
        }}>
          <h3>Character Creation Temporarily Unavailable</h3>
          <p>Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const PremiumCharacterProvider = ({ children }) => {
  const { token } = useAuth();
  const { user } = useUser();
  
  // Core flow state
  const [currentView, setCurrentView] = useState(FLOW_STATES.LAUNCHER);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [createdCharacterName, setCreatedCharacterName] = useState('');
  const [error, setError] = useState(null);
  
  // Creation state management
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [creationError, setCreationError] = useState(null);
  
  // ✅ NEW: Success display state - independent of React context
  const [successData, setSuccessData] = useState(null);
  
  // Refs for cleanup and race condition prevention
  const creationAbortController = useRef(null);
  const isMountedRef = useRef(true);
  const successTimerRef = useRef(null);
  
  // Track existing characters
  const { userCharacters, isPremium } = usePremiumCharacters();
  const hasExistingCharacter = Array.isArray(userCharacters) && userCharacters.length > 0;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Cancel any ongoing creation
      if (creationAbortController.current) {
        creationAbortController.current.abort();
      }
      
      // Clear timers
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // State cleanup helper
  const resetFlowState = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setCurrentView(FLOW_STATES.LAUNCHER);
    setSelectedTemplate(null);
    setCreatedCharacterName('');
    setError(null);
    setCreationError(null);
    setIsCreatingCharacter(false);
    setSuccessData(null); // ✅ Clear success data
    
    // Cancel ongoing operations
    if (creationAbortController.current) {
      creationAbortController.current.abort();
      creationAbortController.current = null;
    }
    
    // Clear timers
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  // Debug logging with safety checks
  const logStateChange = useCallback((action, from, to, data = {}) => {
    if (!isMountedRef.current) return;
    
    console.log(`🔄 Premium Flow: ${action}`, {
      from,
      to,
      timestamp: new Date().toISOString(),
      ...data
    });
  }, []);

  // Navigation actions with state validation
  const showTemplateGallery = useCallback(() => {
    if (!isMountedRef.current || isCreatingCharacter) return;
    
    console.log('🎨 Showing template gallery');
    logStateChange('SHOW_TEMPLATE_GALLERY', currentView, FLOW_STATES.TEMPLATES);
    setCurrentView(FLOW_STATES.TEMPLATES);
    setError(null);
    setCreationError(null);
    setSuccessData(null); // Clear any existing success data
  }, [currentView, logStateChange, isCreatingCharacter]);

  const selectTemplate = useCallback((template) => {
    if (!isMountedRef.current || isCreatingCharacter) return;
    
    console.log('🎯 Template selected:', template?.name);
    logStateChange('SELECT_TEMPLATE', FLOW_STATES.TEMPLATES, FLOW_STATES.BUILDER, {
      templateId: template?.id,
      templateName: template?.name
    });
    setSelectedTemplate(template);
    setCurrentView(FLOW_STATES.BUILDER);
    setError(null);
    setCreationError(null);
  }, [logStateChange, isCreatingCharacter]);

  // ✅ FIXED: Enhanced character creation WITHOUT refresh() call
  const createCharacter = useCallback(async (characterData) => {
    // Prevent multiple submissions
    if (isCreatingCharacter || !isMountedRef.current) {
      console.warn('🚫 Character creation already in progress or component unmounted');
      return;
    }

    // Validate prerequisites
    if (hasExistingCharacter) {
      const errorMessage = 'You can only have one character. Please wait for approval or contact support.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    if (!token || !user?.id) {
      const errorMessage = 'Authentication required';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    // Set up abort controller for cancellation
    creationAbortController.current = new AbortController();
    const { signal } = creationAbortController.current;

    setIsCreatingCharacter(true);
    setCreationError(null);
    setError(null);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      console.log('🚀 Starting character creation flow for:', characterData.display_name);

      // STEP 1: Grant trial with timeout and cancellation
      console.log('🔑 Step 1: Granting trial...');
      
      const trialResponse = await Promise.race([
        fetch(`${API_BASE}/api/premium/trial/${user.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trial_days: 3 }),
          signal
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Trial request timeout')), 30000)
        )
      ]);

      // Check if component was unmounted during request
      if (!isMountedRef.current) {
        console.log('🛑 Component unmounted during trial request');
        return;
      }

      // Handle trial response
      if (!trialResponse.ok && trialResponse.status !== 409 && trialResponse.status !== 400) {
        const trialError = await trialResponse.json().catch(() => ({}));
        throw new Error(trialError.message || `Trial failed: ${trialResponse.status}`);
      }

      console.log('✅ Trial step completed');

      // STEP 2: Create character with timeout
      console.log('🔑 Step 2: Creating character...');
      
      const finalCharacterData = {
        ...characterData,
        template_id: selectedTemplate?.id,
        historical_period: selectedTemplate?.historical_period,
        personality_archetype: selectedTemplate?.personality_archetype,
        expertise_domain: selectedTemplate?.expertise_domain
      };

      const characterResponse = await Promise.race([
        fetch(`${API_BASE}/api/premium/characters`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(finalCharacterData),
          signal
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Character creation timeout')), 45000)
        )
      ]);

      // Check if component was unmounted during request
      if (!isMountedRef.current) {
        console.log('🛑 Component unmounted during character creation');
        return;
      }

      if (!characterResponse.ok) {
        const errorData = await characterResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Character creation failed: ${characterResponse.status}`);
      }

      const result = await characterResponse.json();
      console.log('✅ Character created successfully:', result);

      // ✅ CRITICAL FIX: Set success data without triggering refresh
      if (isMountedRef.current) {
        setCreatedCharacterName(characterData.display_name);
        
        // Store success data for standalone component
        setSuccessData({
          characterName: characterData.display_name,
          timestamp: new Date().toISOString()
        });
        
        setCurrentView(FLOW_STATES.SUCCESS);
        setIsCreatingCharacter(false);
        
        // ✅ REMOVED: No refresh() call to prevent race conditions
        // if (refresh) {
        //   refresh().catch(console.warn);
        // }
        
        // Set up auto-redirect timer with cleanup
        successTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            resetFlowState();
          }
        }, 15000); // 15 second auto-redirect for safety
        
        logStateChange('CREATE_CHARACTER_SUCCESS', FLOW_STATES.BUILDER, FLOW_STATES.SUCCESS, {
          characterName: characterData.display_name
        });
      }

      return result;

    } catch (error) {
      // Only update state if component is still mounted and error wasn't from cancellation
      if (isMountedRef.current && error.name !== 'AbortError') {
        console.error('❌ Character creation failed:', error);
        
        let errorMessage = 'Failed to create character';
        
        // Provide specific error messages for common issues
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setCreationError(errorMessage);
        setIsCreatingCharacter(false);
        
        logStateChange('CREATE_CHARACTER_ERROR', FLOW_STATES.BUILDER, FLOW_STATES.BUILDER, {
          error: errorMessage
        });
      }
      
      throw error;
      
    } finally {
      // Clean up abort controller
      creationAbortController.current = null;
    }
  }, [hasExistingCharacter, token, user?.id, selectedTemplate, logStateChange, resetFlowState, isCreatingCharacter]);

  // Navigation with cleanup
  const backToLauncher = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log('🔙 Back to launcher');
    resetFlowState();
    logStateChange('BACK_TO_LAUNCHER', currentView, FLOW_STATES.LAUNCHER);
  }, [currentView, logStateChange, resetFlowState]);

  const backToTemplates = useCallback(() => {
    if (!isMountedRef.current || isCreatingCharacter) return;
    
    console.log('🔙 Back to templates');
    logStateChange('BACK_TO_TEMPLATES', currentView, FLOW_STATES.TEMPLATES);
    setCurrentView(FLOW_STATES.TEMPLATES);
    setError(null);
    setCreationError(null);
  }, [currentView, logStateChange, isCreatingCharacter]);

  // Safe error setters
  const safeSetError = useCallback((error) => {
    if (isMountedRef.current) {
      setError(error);
    }
  }, []);

  const safeSetCreationError = useCallback((error) => {
    if (isMountedRef.current) {
      setCreationError(error);
    }
  }, []);

  // Computed state flags
  const showTemplateGallery_flag = currentView === FLOW_STATES.TEMPLATES;
  const showCharacterBuilder = currentView === FLOW_STATES.BUILDER;
  const showSuccessModal = currentView === FLOW_STATES.SUCCESS;

  const contextValue = {
    // State
    currentView,
    selectedTemplate,
    createdCharacterName,
    error,
    
    // Creation state
    isCreatingCharacter,
    creationError,

    // ✅ NEW: Success data for standalone component
    successData,

    // Computed flags
    showTemplateGallery: showTemplateGallery_flag,
    showCharacterBuilder,
    showSuccessModal,

    // Navigation/actions
    startTemplateFlow: showTemplateGallery,
    selectTemplate,
    createCharacter,
    backToLauncher,
    backToTemplates,
    setError: safeSetError,
    setCreationError: safeSetCreationError,
    resetFlowState,

    // Validation flags
    hasExistingCharacter,
    isPremium,
    canCreate: !isCreatingCharacter && !hasExistingCharacter,

    // Debug info
    FLOW_STATES
  };

  return (
    <PremiumCharacterErrorBoundary>
      <PremiumCharacterContext.Provider value={contextValue}>
        {children}
      </PremiumCharacterContext.Provider>
    </PremiumCharacterErrorBoundary>
  );
};

export const usePremiumCharacterFlow = () => {
  const context = useContext(PremiumCharacterContext);
  if (!context) {
    throw new Error('usePremiumCharacterFlow must be used within PremiumCharacterProvider');
  }
  return context;
};

export { FLOW_STATES };