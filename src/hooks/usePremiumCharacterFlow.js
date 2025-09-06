// src/hooks/usePremiumCharacterFlow.js
import { useState, useCallback, useContext, createContext } from 'react';

const FLOW_STATES = {
  LAUNCHER: 'launcher',
  TEMPLATES: 'templates', 
  BUILDER: 'builder',
  SUCCESS: 'success'
};

const PremiumCharacterContext = createContext();

export const PremiumCharacterProvider = ({ children }) => {
  // Core flow state - replaces your existing useState calls in ChatLauncherPage
  const [currentView, setCurrentView] = useState(FLOW_STATES.LAUNCHER);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [createdCharacterName, setCreatedCharacterName] = useState('');
  const [error, setError] = useState(null);
  
  // Debug logging matching your existing console.log patterns
  const logStateChange = useCallback((action, from, to, data = {}) => {
    console.log(`🔄 Premium Flow: ${action}`, {
      from,
      to,
      timestamp: new Date().toISOString(),
      ...data
    });
  }, []);

  // Navigation actions - these replace your handler functions in ChatLauncherPage
  const showTemplateGallery = useCallback(() => {
    console.log('🎨 Showing template gallery');
    logStateChange('SHOW_TEMPLATE_GALLERY', currentView, FLOW_STATES.TEMPLATES);
    setCurrentView(FLOW_STATES.TEMPLATES);
    setError(null);
  }, [currentView, logStateChange]);

  const selectTemplate = useCallback((template) => {
    console.log('🎯 Template selected:', template.name);
    logStateChange('SELECT_TEMPLATE', FLOW_STATES.TEMPLATES, FLOW_STATES.BUILDER, {
      templateId: template?.id,
      templateName: template?.name
    });
    setSelectedTemplate(template);
    setCurrentView(FLOW_STATES.BUILDER);
    setError(null);
  }, [logStateChange]);

  const createCharacter = useCallback((characterData) => {
    console.log('🎭 Character created:', characterData.display_name);
    logStateChange('CREATE_CHARACTER', FLOW_STATES.BUILDER, FLOW_STATES.SUCCESS, {
      characterName: characterData?.display_name
    });
    setCreatedCharacterName(characterData.display_name);
    setCurrentView(FLOW_STATES.SUCCESS);
    setError(null);
  }, [logStateChange]);

  const backToLauncher = useCallback(() => {
    console.log('🔙 Back to launcher');
    logStateChange('BACK_TO_LAUNCHER', currentView, FLOW_STATES.LAUNCHER);
    setCurrentView(FLOW_STATES.LAUNCHER);
    setSelectedTemplate(null);
    setCreatedCharacterName('');
    setError(null);
  }, [currentView, logStateChange]);

  const backToTemplates = useCallback(() => {
    console.log('🔙 Back to templates');
    logStateChange('BACK_TO_TEMPLATES', currentView, FLOW_STATES.TEMPLATES);
    setCurrentView(FLOW_STATES.TEMPLATES);
    setError(null);
    // Keep selectedTemplate for potential re-entry
  }, [currentView, logStateChange]);

  // Computed state - replaces your boolean flags
  const showTemplateGallery_flag = currentView === FLOW_STATES.TEMPLATES;
  const showCharacterBuilder = currentView === FLOW_STATES.BUILDER;
  const showSuccessModal = currentView === FLOW_STATES.SUCCESS;

  const contextValue = {
    // State
    currentView,
    selectedTemplate,
    createdCharacterName,
    error,
    
    // Computed flags (backwards compatibility with your existing code)
    showTemplateGallery: showTemplateGallery_flag,
    showCharacterBuilder,
    showSuccessModal,
    
    // Navigation actions (replaces your existing handlers)
    startTemplateFlow: showTemplateGallery,  // Matches your existing button click
    selectTemplate,                         // Replaces handleTemplateSelect
    createCharacter,                        // Replaces handleCharacterCreate  
    backToLauncher,                         // Replaces handleBackToLauncher
    backToTemplates,                        // Replaces handleBackToTemplates
    setError,
    
    // Debug info
    FLOW_STATES
  };

  return (
    <PremiumCharacterContext.Provider value={contextValue}>
      {children}
    </PremiumCharacterContext.Provider>
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