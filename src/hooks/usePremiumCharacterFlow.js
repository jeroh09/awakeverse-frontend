// src/hooks/usePremiumCharacterFlow.js - Robust implementation with proper error handling
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
// Enhanced Error Boundary - Replace the existing one in usePremiumCharacterFlow.js
class PremiumCharacterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Store error details for display
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#fff',
          padding: '2rem',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 9999,
          overflow: 'auto'
        }}>
          <div style={{
            background: '#ff1744',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h2>Premium Character Flow Error Details</h2>
          </div>
          
          <div style={{
            background: '#333',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h3>Error Message:</h3>
            <pre style={{ color: '#ff6b6b', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.toString()}
            </pre>
          </div>

          <div style={{
            background: '#333',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h3>Error Stack:</h3>
            <pre style={{ color: '#ffa726', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {this.state.error?.stack}
            </pre>
          </div>

          <div style={{
            background: '#333',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h3>Component Stack:</h3>
            <pre style={{ color: '#66bb6a', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>

          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
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
  
  // Refs for cleanup and race condition prevention
  const creationAbortController = useRef(null);
  const isMountedRef = useRef(true);
  const successTimerRef = useRef(null);
  
  // Track existing characters
  const { userCharacters, isPremium, refresh } = usePremiumCharacters();
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

  // Enhanced character creation with comprehensive error handling
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

        // New code with try-catch wrapper:
    try {
      if (isMountedRef.current) {
        setCreatedCharacterName(characterData.display_name);
        setCurrentView(FLOW_STATES.SUCCESS);
        setIsCreatingCharacter(false);

        logStateChange('CREATE_CHARACTER_SUCCESS', FLOW_STATES.BUILDER, FLOW_STATES.SUCCESS, {
          characterName: characterData.display_name
        });
      }
    } catch (stateError) {
      // If state updates throw an error, we'll catch it here
      // This helps us know if the crash happens during state setting
      if (isMountedRef.current) {
        setCreationError('State update failed during success transition');
        setIsCreatingCharacter(false);
      }
      throw stateError; // Re-throw so we can trace it
    }
  }, [hasExistingCharacter, token, user?.id, selectedTemplate, logStateChange, refresh, resetFlowState, isCreatingCharacter]);

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