// src/hooks/useSimplifiedPremiumFlow.js - Clean implementation without hook violations
import React, { useState, useContext, createContext, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import usePremiumCharacters from './usePremiumCharacters';

const FLOW_STATES = {
  LAUNCHER: 'launcher',
  TEMPLATES: 'templates',
  BUILDER: 'builder'
};

const SimplifiedPremiumContext = createContext();

// Minimal Error Boundary - only for critical errors
class SimplifiedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Only catch actual JavaScript errors, not React state issues
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return { hasError: true };
    }
    return { hasError: false };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Critical Error:', error);
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
          <h3>Something went wrong</h3>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const SimplifiedPremiumProvider = ({ children }) => {
  const { token } = useAuth();
  const { user } = useUser();
  
  // Core flow state - NO useCallback dependencies
  const [currentView, setCurrentView] = useState(FLOW_STATES.LAUNCHER);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [error, setError] = useState(null);
  
  // Creation state
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [creationError, setCreationError] = useState(null);
  
  // Success state - simple boolean + data
  const [successData, setSuccessData] = useState(null);
  
  // Refs for cleanup
  const creationAbortController = useRef(null);
  const isMountedRef = useRef(true);
  
  // Get character data without refresh dependencies
  const { userCharacters, isPremium } = usePremiumCharacters();
  const hasExistingCharacter = Array.isArray(userCharacters) && userCharacters.length > 0;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (creationAbortController.current) {
        creationAbortController.current.abort();
      }
    };
  }, []);

  // Navigation actions - regular functions, no useCallback
  const showTemplateGallery = () => {
    if (!isMountedRef.current || isCreatingCharacter) return;
    setCurrentView(FLOW_STATES.TEMPLATES);
    setError(null);
    setCreationError(null);
  };

  const selectTemplate = (template) => {
    if (!isMountedRef.current || isCreatingCharacter) return;
    setSelectedTemplate(template);
    setCurrentView(FLOW_STATES.BUILDER);
    setError(null);
    setCreationError(null);
  };

  const backToLauncher = () => {
    if (!isMountedRef.current) return;
    setCurrentView(FLOW_STATES.LAUNCHER);
    setSelectedTemplate(null);
    setError(null);
    setCreationError(null);
    setSuccessData(null);
  };

  const backToTemplates = () => {
    if (!isMountedRef.current || isCreatingCharacter) return;
    setCurrentView(FLOW_STATES.TEMPLATES);
    setError(null);
    setCreationError(null);
  };

  // Character creation - regular async function
  const createCharacter = async (characterData) => {
    // Basic guards
    if (isCreatingCharacter || !isMountedRef.current) {
      console.warn('Character creation already in progress or component unmounted');
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

    // Set up cancellation
    creationAbortController.current = new AbortController();
    const { signal } = creationAbortController.current;

    setIsCreatingCharacter(true);
    setCreationError(null);
    setError(null);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // STEP 1: Grant trial
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

      if (!isMountedRef.current) return;

      if (!trialResponse.ok && trialResponse.status !== 409 && trialResponse.status !== 400) {
        const trialError = await trialResponse.json().catch(() => ({}));
        throw new Error(trialError.message || `Trial failed: ${trialResponse.status}`);
      }

      // STEP 2: Create character
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

      if (!isMountedRef.current) return;

      if (!characterResponse.ok) {
        const errorData = await characterResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Character creation failed: ${characterResponse.status}`);
      }

      const result = await characterResponse.json();

      // SUCCESS: Set simple success state
      if (isMountedRef.current) {
        setSuccessData({
          characterName: characterData.display_name,
          timestamp: Date.now()
        });
        setIsCreatingCharacter(false);
        setCurrentView(FLOW_STATES.LAUNCHER); 
      }

      return result;

    } catch (error) {
      if (isMountedRef.current && error.name !== 'AbortError') {
        console.error('Character creation failed:', error);
        
        let errorMessage = 'Failed to create character';
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setCreationError(errorMessage);
        setIsCreatingCharacter(false);
      }
      
      throw error;
    } finally {
      creationAbortController.current = null;
    }
  };

  // Safe error setters
  const safeSetError = (error) => {
    if (isMountedRef.current) {
      setError(error);
    }
  };

  const safeSetCreationError = (error) => {
    if (isMountedRef.current) {
      setCreationError(error);
    }
  };

  // Computed flags
  const showTemplateGallery_flag = currentView === FLOW_STATES.TEMPLATES;
  const showCharacterBuilder = currentView === FLOW_STATES.BUILDER;

  const contextValue = {
    // State
    currentView,
    selectedTemplate,
    error,
    
    // Creation state
    isCreatingCharacter,
    creationError,
    
    // Success state
    successData,
    setSuccessData,

    // Computed flags
    showTemplateGallery: showTemplateGallery_flag,
    showCharacterBuilder,

    // Navigation actions
    startTemplateFlow: showTemplateGallery,
    selectTemplate,
    createCharacter,
    backToLauncher,
    backToTemplates,
    setError: safeSetError,
    setCreationError: safeSetCreationError,

    // Validation flags
    hasExistingCharacter,
    isPremium,
    canCreate: !isCreatingCharacter && !hasExistingCharacter,

    // Debug info
    FLOW_STATES
  };

  return (
    <SimplifiedErrorBoundary>
      <SimplifiedPremiumContext.Provider value={contextValue}>
        {children}
      </SimplifiedPremiumContext.Provider>
    </SimplifiedErrorBoundary>
  );
};

export const useSimplifiedPremiumFlow = () => {
  const context = useContext(SimplifiedPremiumContext);
  if (!context) {
    throw new Error('useSimplifiedPremiumFlow must be used within SimplifiedPremiumProvider');
  }
  return context;
};

export { FLOW_STATES };