// src/components/ScenariosTab/MyScenariosPanel/index.jsx - UPDATED
import React, { useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { deleteScenario } from '../../../api';
import { triggerPublishConfetti } from '../../../utils/confettiUtils';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters';
import ScenarioCard from './ScenarioCard';
import CreateButton from './CreateButton';
import ScenarioChatWindow from '../ScenarioChatWindow';
import PublishScenarioModal from '../PublishScenarioModal';
import './MyScenariosPanel.css';

export default function MyScenariosPanel({ 
  scenarios = [],
  onRefresh = () => {},
  onCreateNew = () => {},
  onStartDebate = () => {},  // ✅ ADD THIS
  theme = 'light'
}) {
  const { user } = useUser();
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  
  // Publishing state
  const [publishing, setPublishing] = useState(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedScenarioForPublish, setSelectedScenarioForPublish] = useState(null);
  const [publishError, setPublishError] = useState(null);
  
  const { userCharacters = [] } = usePremiumCharacters();

  // Handle starting a debate
// Handle starting a debate - CALL PARENT CALLBACK
  const handleStartDebate = async (scenarioId) => {
    onStartDebate(scenarioId);  // ✅ Just call parent, don't render window here
  };
  // Handle closing chat window
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
    console.log('✏️ Editing scenario:', scenario.id);
    alert(`Edit functionality coming soon!\n\nScenario: ${scenario.title}`);
  };

  // Handle publish button click - opens modal
  const handlePublishClick = (scenario) => {
    setSelectedScenarioForPublish(scenario);
    setPublishError(null);
    setPublishModalOpen(true);
  };

  // Handle modal close
  const handlePublishModalClose = () => {
    if (!publishing) {
      setPublishModalOpen(false);
      setSelectedScenarioForPublish(null);
      setPublishError(null);
    }
  };

  // Handle publish/unpublish confirmation - UPDATED WITH CONFETTI
  const handlePublishConfirm = async (scenario) => {
    const isPublished = scenario.is_public === true;
    const action = isPublished ? 'unpublish' : 'publish';
    
    try {
      setPublishing(scenario.id);
      setPublishError(null);
      
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const endpoint = isPublished 
        ? `${API_BASE}/api/market-hub/unpublish-scenario`
        : `${API_BASE}/api/market-hub/publish-scenario`;

      console.log(`🌐 ${action === 'publish' ? 'Publishing' : 'Unpublishing'} scenario:`, scenario.id);
      
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify({ scenario_id: scenario.id })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          setPublishError('Professional tier required to publish scenarios. Please upgrade your account.');
          return;
        }
        if (response.status === 400 && data.error?.includes('2 characters')) {
          setPublishError('Scenario must have at least 2 characters to publish.');
          return;
        }
        throw new Error(data.error || `Failed to ${action} scenario`);
      }

      console.log(`✅ Scenario ${action}ed successfully:`, data);
      
      // 🎉 TRIGGER CONFETTI WHEN PUBLISHING (not unpublishing)
      if (action === 'publish') {
        triggerPublishConfetti();
      }
      
      // Close modal and refresh scenarios list
      setPublishModalOpen(false);
      setSelectedScenarioForPublish(null);
      onRefresh();
      
      // Show success message
      alert(`Scenario ${action === 'publish' ? 'published to' : 'removed from'} Market Hub successfully!`);
      
    } catch (error) {
      console.error(`❌ Failed to ${action} scenario:`, error);
      setPublishError(error.message || `Failed to ${action} scenario`);
    } finally {
      setPublishing(null);
    }
  };

  // If chat window is active, show it fullscreen
  //if (activeScenario) {
    //return (
      //<ScenarioChatWindow
        //scenario={activeScenario}
        //onBack={handleCloseChatWindow}
        //theme={theme}
      ///>
    //);
 // }

  // Show empty state if no scenarios
  if (scenarios.length === 0) {
    return (
      <div className="my-scenarios-panel">
        <div className="panel-header">
          <h3>My Dialogues</h3>
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
        <h3>My Dialogues</h3>
        <div className="scenario-counter">
          {scenarios.length}/5 Dialogues
        </div>
      </div>

      {error && (
        <div className="panel-error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="dismiss-error">×</button>
        </div>
      )}
      
      <div className="scenarios-grid">
        {scenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onStartDebate={handleStartDebate}
            onDelete={handleDeleteScenario}
            onEdit={handleEditScenario}
            onPublish={handlePublishClick}
            isDeleting={deleting === scenario.id}
            isPublishing={publishing === scenario.id}
            userCharacters={userCharacters}
          />
        ))}
      </div>

      {/* Create New Button */}
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
          <p>🚫 Maximum of 5 Dialogues reached</p>
          <p className="hint">Delete a Dialogue to create a new one</p>
        </div>
      )}

      {/* Publish/Unpublish Modal */}
      <PublishScenarioModal
        isOpen={publishModalOpen}
        onClose={handlePublishModalClose}
        onConfirm={handlePublishConfirm}
        scenario={selectedScenarioForPublish}
        isLoading={publishing !== null}
        error={publishError}
        isUnpublishing={selectedScenarioForPublish?.is_public === true}
      />
    </div>
  );
}