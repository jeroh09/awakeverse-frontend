// src/hooks/useCharacterCreationFlow.js - Decentralized: Remove premium blocking
import { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import usePremiumCharacters from './usePremiumCharacters';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// Flow step constants
const FLOW_STEPS = {
  CLOSED: 'closed',
  TEMPLATES: 'templates', 
  BUILDER: 'builder',
  SUCCESS: 'success',
  ERROR: 'error'
};

export default function useCharacterCreationFlow() {
  const { user } = useUser();
  
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
  
  // Performance and cleanup
  const abortControllerRef = useRef(null);
  const flowStartTime = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // DECENTRALIZED: Always allow flow to start
  const startFlow = useCallback(async () => {
    try {
      setError(null);
      flowStartTime.current = Date.now();

      // Clear previous flow state
      setSelectedTemplate(null);
      setCharacterData(null);
      setCreatedCharacter(null);
      
      // Open templates modal - no premium checks
      setFlowStep(FLOW_STEPS.TEMPLATES);
      
    } catch (error) {
      console.error('Failed to start character creation flow:', error);
      setError(error.message);
      setFlowStep(FLOW_STEPS.ERROR);
    }
  }, []);

  const selectTemplate = useCallback((template) => {
    if (!template || !template.id) {
      setError('Invalid template selected');
      return;
    }

    setSelectedTemplate(template);
    setError(null);
    setFlowStep(FLOW_STEPS.BUILDER);
    
    console.log('Template selected:', template.name);
  }, []);

  // DECENTRALIZED: Character creation always works, limits discovered later
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

      // Create character using the API hook - NO PREMIUM CHECKS
      const result = await createCharacterAPI(characterPayload);
      
      if (!result || !result.character) {
        throw new Error('Character creation failed - invalid response');
      }

      // Store created character data
      setCreatedCharacter(result.character);
      setCharacterData(characterPayload);
      
      // Move to success step
      setFlowStep(FLOW_STEPS.SUCCESS);
      
      console.log('Character created successfully:', result.character.character_key);
      
      return result;
      
    } catch (error) {
      console.error('Character creation failed:', error);
      setError(error.message);
      
      // Don't close the flow on error - let user retry or fix issues
      throw error;
      
    } finally {
      setIsCreating(false);
      abortControllerRef.current = null;
    }
  }, [selectedTemplate, createCharacterAPI]);

  const retryFlow = useCallback(() => {
    setError(null);
    
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
    setIsCreating(false);

    // Log flow completion metrics
    if (flowStartTime.current) {
      const duration = Date.now() - flowStartTime.current;
      console.log('Character creation flow closed:', {
        duration: duration / 1000
      });
    }
  }, []);

  const goBackToTemplates = useCallback(() => {
    setSelectedTemplate(null);
    setError(null);
    setFlowStep(FLOW_STEPS.TEMPLATES);
  }, []);

  // Navigation helpers
  const canStartFlow = true; // DECENTRALIZED: Always true
  const isFlowOpen = flowStep !== FLOW_STEPS.CLOSED;
  const showTemplates = flowStep === FLOW_STEPS.TEMPLATES;
  const showBuilder = flowStep === FLOW_STEPS.BUILDER;
  const showSuccess = flowStep === FLOW_STEPS.SUCCESS;
  const showError = flowStep === FLOW_STEPS.ERROR;

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
    
    // Error handling
    error,
    
    // Navigation actions
    startFlow,
    selectTemplate,
    createCharacter,
    closeFlow,
    goBackToTemplates,
    retryFlow,
    
    // Capability flags
    canStartFlow: true, // DECENTRALIZED: Always true
    
    // Flow metrics
    flowMetrics: {
      isActive: flowStartTime.current !== null,
      duration: flowStartTime.current ? Date.now() - flowStartTime.current : 0
    }
  };
}