// src/components/ScenariosTab/MyScenariosPanel/index.jsx - CORRECTED WITH ORIGINAL FUNCTIONALITY
import React, { useState } from 'react';
import { deleteScenario } from '../../../api';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters';
import ScenarioCard from './ScenarioCard';
import CreateButton from './CreateButton';
import ScenarioChatWindow from '../ScenarioChatWindow';
import './MyScenariosPanel.css';

export default function MyScenariosPanel({ 
  scenarios = [],
  onRefresh = () => {},
  onCreateNew = () => {},
  theme = 'light' // Get from parent ScenariosTab
}) {
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  
  // Get user's custom characters for avatar lookups
  const { userCharacters = [] } = usePremiumCharacters();

  console.log('📋 MyScenariosPanel:', {
    scenariosCount: scenarios.length,
    userCharactersCount: userCharacters.length,
    hasUserCharacters: userCharacters.length > 0
  });

  // Handle starting a debate - ORIGINAL LOGIC
  const handleStartDebate = async (scenarioId) => {
    try {
      console.log('🎭 Starting debate for scenario:', scenarioId);
      
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (!scenario) {
        throw new Error('Scenario not found');
      }
      
      setActiveScenario(scenario);
      
    } catch (error) {
      console.error('❌ Failed to start debate:', error);
      alert('Failed to start debate. Please try again.');
    }
  };

  // Handle closing chat window - ORIGINAL LOGIC
  const handleCloseChatWindow = () => {
    setActiveScenario(null);
  };

  // Handle deleting a scenario
  const handleDeleteScenario = async (scenarioId) => {
    if (!window.confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(scenarioId);
      console.log('🗑️ Deleting scenario:', scenarioId);
      
      const result = await deleteScenario(scenarioId);
      
      if (result.status === 'success') {
        console.log('✅ Scenario deleted successfully');
        onRefresh();
      } else {
        throw new Error(result.error || 'Failed to delete scenario');
      }
    } catch (error) {
      console.error('❌ Failed to delete scenario:', error);
      setError(error.message || 'Failed to delete scenario');
      alert('Failed to delete scenario. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Handle editing a scenario
  const handleEditScenario = (scenario) => {
    // TODO: Open ScenarioCreator in edit mode
    console.log('✏️ Editing scenario:', scenario.id);
    alert(`Edit functionality coming soon!\n\nScenario: ${scenario.title}`);
  };

  // IF CHAT WINDOW IS ACTIVE, SHOW IT FULLSCREEN - ORIGINAL LOGIC
  if (activeScenario) {
    return (
      <ScenarioChatWindow
        scenario={activeScenario}
        onBack={handleCloseChatWindow}
        theme={theme}
      />
    );
  }

  // Show empty state if no scenarios
  if (scenarios.length === 0) {
    return (
      <div className="my-scenarios-panel">
        <div className="panel-header">
          <h3>My Scenarios</h3>
          <div className="scenario-counter">0/5 scenarios</div>
        </div>
        
        <div className="scenarios-grid">
          <div className="empty-scenarios">
            <p>No scenarios created yet</p>
            <p className="hint">Create your first scenario to start multi-character debates</p>
            <CreateButton 
              onClick={onCreateNew}
              variant="primary"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-scenarios-panel">
      <div className="panel-header">
        <h3>My Scenarios</h3>
        <div className="scenario-counter">
          {scenarios.length}/5 scenarios
        </div>
      </div>

      {error && (
        <div className="panel-error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="dismiss-error">×</button>
        </div>
      )}
      
      {/* ONLY CHANGE: scenarios-list → scenarios-grid */}
      <div className="scenarios-grid">
        {scenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onStartDebate={handleStartDebate} // This calls the local function that sets activeScenario
            onDelete={handleDeleteScenario}
            onEdit={handleEditScenario}
            isDeleting={deleting === scenario.id}
            userCharacters={userCharacters}
          />
        ))}
      </div>

      {/* Create New Button - Always visible if under 5 scenarios */}
      {scenarios.length < 5 && (
        <div className="create-new-section">
          <CreateButton 
            onClick={onCreateNew}
            variant="secondary"
            disabled={scenarios.length >= 5}
          />
        </div>
      )}

      {/* Max scenarios reached message */}
      {scenarios.length >= 5 && (
        <div className="max-scenarios-message">
          <p>🚫 Maximum of 5 scenarios reached</p>
          <p className="hint">Delete a scenario to create a new one</p>
        </div>
      )}
    </div>
  );
}