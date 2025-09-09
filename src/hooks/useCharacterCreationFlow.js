// src/hooks/useCharacterCreationFlow.js - Complete character creation flow orchestrator
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { usePremiumCapabilitiesContext } from '../contexts/PremiumCapabilitiesContext';
import usePremiumCharacters from './usePremiumCharacters';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Flow step constants
const FLOW_STEPS = {
  CLOSED: 'closed',
  TEMPLATES: 'templates', 
  BUILDER: 'builder',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Error types for better error handling
const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  TRIAL_FAILED: 'trial_failed',
  LIMIT_REACHED: 'limit_reached',
  SERVER_ERROR: 'server_error',
  TIMEOUT: 'timeout'
};

export default function useCharacterCreationFlow() {
  const { token } = useAuth();
  const { user } = useUser();
  
  // Premium capabilities integration
  const {
    subscriptionState,
    canCreateCharacter,
    shouldShowTrial,
    characterCount,
    characterLimit,
    invalidateAndRefresh
  } = usePremiumCapabilitiesContext();
  
  // Character data integration
  const { createCharacter: createCharacterAPI, fetchUserCharacters } = usePremiumCharacters();
  
  // Flow state management
  const [flowStep, setFlowStep] = useState(FLOW_STEPS.CLOSED);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [characterData, setCharacterData] = useState(null);
  const [createdCharacter, setCreatedCharacter] = useState(null);
  
  // Error and loading states
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  
  // Trial management state
  const [isGrantingTrial, setIsGrantingTrial] = useState(false);
  const [trialGranted, setTrialGranted] = useState(false);
  
  // Performance and cleanup
  const abortControllerRef = useRef(null);
  const flowStartTime = useRef(null);
  
  // Analytics and business logic hooks
  const analyticsRef = useRef({
    flowStarted: false,
    templateSelected: false,
    creationAttempted: false,
    flowCompleted: false
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Error classification helper
  const classifyError = useCallback((error) => {
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return ERROR_TYPES.NETWORK;
    }
    if (errorMessage.includes('validation') || errorMessage.includes('required')) {
      return ERROR_TYPES.VALIDATION;
    }
    if (errorMessage.includes('trial')) {
      return ERROR_TYPES.TRIAL_FAILED;
    }
    if (errorMessage.includes('limit') || errorMessage.includes('maximum')) {
      return ERROR_TYPES.LIMIT_REACHED;
    }
    if (errorMessage.includes('timeout')) {
      return ERROR_TYPES.TIMEOUT;
    }
    
    return ERROR_TYPES.SERVER_ERROR;
  }, []);

  // Trial granting function
  const grantTrial = useCallback(async () => {
    if (!user?.id || !token) {
      throw new Error('User not authenticated');
    }

    setIsGrantingTrial(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/premium/trial/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trial_days: 3 })
      });

      if (!response.ok) {
        // 409 or 400 might mean trial already granted - that's ok
        if (response.status === 409 || response.status === 400) {
          console.log('Trial already granted or user already has premium');
          setTrialGranted(true);
          return true;
        }
        throw new Error(`Trial grant failed: ${response.status}`);
      }

      const data = await response.json();
      setTrialGranted(true);
      
      // Refresh capabilities to reflect new trial status
      await invalidateAndRefresh();
      
      console.log('Trial granted successfully:', data);
      return true;
      
    } catch (error) {
      console.error('Trial grant failed:', error);
      throw error;
    } finally {
      setIsGrantingTrial(false);
    }
  }, [user?.id, token, invalidateAndRefresh]);

  // Flow control functions
  const startFlow = useCallback(async () => {
    try {
      setError(null);
      setErrorType(null);
      flowStartTime.current = Date.now();
      analyticsRef.current.flowStarted = true;

      // Check if user can create character
      if (!canCreateCharacter) {
        // If free user, try to grant trial first
        if (subscriptionState === 'free' && shouldShowTrial) {
          console.log('Free user starting flow - granting trial');
          await grantTrial();
          
          // Recheck capabilities after trial grant
          if (!canCreateCharacter) {
            throw new Error('Unable to grant trial access');
          }
        } else if (characterCount >= characterLimit) {
          setErrorType(ERROR_TYPES.LIMIT_REACHED);
          setError(`Character limit reached (${characterCount}/${characterLimit}). Upgrade to create more characters.`);
          return;
        } else {
          throw new Error('Cannot create character - premium access required');
        }
      }

      // Clear previous flow state
      setSelectedTemplate(null);
      setCharacterData(null);
      setCreatedCharacter(null);
      
      // Open templates modal
      setFlowStep(FLOW_STEPS.TEMPLATES);
      
    } catch (error) {
      console.error('Failed to start character creation flow:', error);
      const type = classifyError(error);
      setErrorType(type);
      setError(error.message);
      setFlowStep(FLOW_STEPS.ERROR);
    }
  }, [
    canCreateCharacter, 
    subscriptionState, 
    shouldShowTrial, 
    characterCount, 
    characterLimit, 
    grantTrial, 
    classifyError
  ]);

  const selectTemplate = useCallback((template) => {
    if (!template || !template.id) {
      setError('Invalid template selected');
      return;
    }

    setSelectedTemplate(template);
    setError(null);
    setFlowStep(FLOW_STEPS.BUILDER);
    analyticsRef.current.templateSelected = true;
    
    console.log('Template selected:', template.name);
  }, []);

  const createCharacter = useCallback(async (formData) => {
    if (!selectedTemplate) {
      setError('No template selected');
      return;
    }

    if (!formData || !formData.display_name || !formData.short_description) {
      setError('Required character information missing');
      return;
    }

    // Abort any existing creation request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsCreating(true);
    setError(null);
    analyticsRef.current.creationAttempted = true;

    try {
      // Prepare character data with template integration
      const characterPayload = {
        template_id: selectedTemplate.id,
        display_name: formData.display_name,
        short_description: formData.short_description,
        system_instruction: formData.system_instruction,
        behavior_goals: formData.behavior_goals || [],
        style_tone: formData.style_tone || [],
        constraints: formData.constraints || '',
        keyword_triggers: formData.keyword_triggers || [],
        relationships: formData.relationships || {},
        // Template metadata
        historical_period: selectedTemplate.historical_period,
        personality_archetype: selectedTemplate.personality_archetype,
        expertise_domain: selectedTemplate.expertise_domain
      };

      // Create character using the API hook
      const result = await createCharacterAPI(characterPayload);
      
      if (!result || !result.character) {
        throw new Error('Character creation failed - invalid response');
      }

      // Store created character data
      setCreatedCharacter(result.character);
      setCharacterData(characterPayload);
      
      // Refresh capabilities to show new pending state
      await invalidateAndRefresh();
      
      // Track successful creation
      analyticsRef.current.flowCompleted = true;
      
      // Move to success step
      setFlowStep(FLOW_STEPS.SUCCESS);
      
      console.log('Character created successfully:', result.character.character_key);
      
      return result;
      
    } catch (error) {
      console.error('Character creation failed:', error);
      
      const type = classifyError(error);
      setErrorType(type);
      setError(error.message);
      
      // Don't close the flow on error - let user retry or fix issues
      // setFlowStep(FLOW_STEPS.ERROR);
      
      throw error;
      
    } finally {
      setIsCreating(false);
      abortControllerRef.current = null;
    }
  }, [selectedTemplate, createCharacterAPI, invalidateAndRefresh, classifyError]);

  const retryFlow = useCallback(() => {
    setError(null);
    setErrorType(null);
    
    // Return to appropriate step based on current state
    if (selectedTemplate) {
      setFlowStep(FLOW_STEPS.BUILDER);
    } else {
      setFlowStep(FLOW_STEPS.TEMPLATES);
    }
  }, [selectedTemplate]);

  const closeFlow = useCallback(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset all flow state
    setFlowStep(FLOW_STEPS.CLOSED);
    setSelectedTemplate(null);
    setCharacterData(null);
    setCreatedCharacter(null);
    setError(null);
    setErrorType(null);
    setIsCreating(false);
    setIsGrantingTrial(false);
    setTrialGranted(false);

    // Log flow completion metrics
    if (flowStartTime.current) {
      const duration = Date.now() - flowStartTime.current;
      console.log('Character creation flow closed:', {
        duration: duration / 1000,
        completed: analyticsRef.current.flowCompleted,
        analytics: analyticsRef.current
      });
    }

    // Reset analytics
    analyticsRef.current = {
      flowStarted: false,
      templateSelected: false,
      creationAttempted: false,
      flowCompleted: false
    };
  }, []);

  const goBackToTemplates = useCallback(() => {
    setSelectedTemplate(null);
    setError(null);
    setFlowStep(FLOW_STEPS.TEMPLATES);
  }, []);

  // Navigation helpers
  const canStartFlow = canCreateCharacter || (subscriptionState === 'free' && shouldShowTrial);
  const isFlowOpen = flowStep !== FLOW_STEPS.CLOSED;
  const showTemplates = flowStep === FLOW_STEPS.TEMPLATES;
  const showBuilder = flowStep === FLOW_STEPS.BUILDER;
  const showSuccess = flowStep === FLOW_STEPS.SUCCESS;
  const showError = flowStep === FLOW_STEPS.ERROR;

  // Error recovery helpers
  const getErrorMessage = useCallback(() => {
    if (!error) return null;
    
    switch (errorType) {
      case ERROR_TYPES.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case ERROR_TYPES.VALIDATION:
        return error; // Use the specific validation message
      case ERROR_TYPES.TRIAL_FAILED:
        return 'Unable to activate trial. Please contact support.';
      case ERROR_TYPES.LIMIT_REACHED:
        return error; // Use the specific limit message
      case ERROR_TYPES.TIMEOUT:
        return 'Request timed out. Please try again.';
      case ERROR_TYPES.SERVER_ERROR:
      default:
        return 'Something went wrong. Please try again or contact support.';
    }
  }, [error, errorType]);

  const canRetry = errorType !== ERROR_TYPES.LIMIT_REACHED;

  return {
    // Flow state
    flowStep,
    isFlowOpen,
    showTemplates,
    showBuilder,
    showSuccess,
    showError,
    
    // Data state
    selectedTemplate,
    characterData,
    createdCharacter,
    
    // Loading states
    isCreating,
    isGrantingTrial,
    
    // Error handling
    error,
    errorType,
    errorMessage: getErrorMessage(),
    canRetry,
    
    // Trial state
    trialGranted,
    
    // Navigation actions
    startFlow,
    selectTemplate,
    createCharacter,
    closeFlow,
    goBackToTemplates,
    retryFlow,
    
    // Capability flags
    canStartFlow,
    
    // Analytics data
    flowMetrics: {
      isActive: flowStartTime.current !== null,
      duration: flowStartTime.current ? Date.now() - flowStartTime.current : 0,
      analytics: analyticsRef.current
    }
  };
}