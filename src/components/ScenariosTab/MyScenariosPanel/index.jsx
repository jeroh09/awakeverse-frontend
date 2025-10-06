// src/components/ScenariosTab/MyScenariosPanel/index.jsx - UPDATED
import React, { useState, useEffect } from 'react';
import { getMyScenarios } from '../../../api';
import ScenarioCard from './ScenarioCard';
import CreateButton from './CreateButton';
import './MyScenariosPanel.css';

export default function MyScenariosPanel({ token, userId, onCreateNew }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMyScenarios();
  }, [token]);

  const loadMyScenarios = async () => {
    try {
      setLoading(true);
      const data = await getMyScenarios();
      setScenarios(data.scenarios || []);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      setError('Failed to load your scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDebate = async (scenarioId) => {
    try {
      console.log('Starting debate for scenario:', scenarioId);
      // TODO: Implement debate creation and navigation
    } catch (error) {
      console.error('Failed to start debate:', error);
    }
  };

  const handleDeleteScenario = async (scenarioId) => {
    try {
      // TODO: Implement delete API call
      console.log('Deleting scenario:', scenarioId);
      // Refresh list after deletion
      await loadMyScenarios();
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    }
  };

  const handleEditScenario = (scenario) => {
    // TODO: Navigate to scenario editor
    console.log('Editing scenario:', scenario.id);
  };

  if (loading) {
    return (
      <div className="my-scenarios-panel">
        <div className="panel-loading">
          <div className="loading-spinner"></div>
          <p>Loading your scenarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-scenarios-panel">
        <div className="panel-error">
          <p>{error}</p>
          <button onClick={loadMyScenarios} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-scenarios-panel">
      <div className="panel-header">
        <h3>My Scenarios</h3>
        <div className="scenario-counter">{scenarios.length}/5 scenarios</div>
      </div>
      
      <div className="scenarios-list">
        {scenarios.length === 0 ? (
          <div className="empty-scenarios">
            <p>No scenarios created yet</p>
            <p className="hint">Create your first scenario to start multi-character debates</p>
            <CreateButton 
              onClick={onCreateNew}
              variant="primary"
            />
          </div>
        ) : (
          scenarios.map(scenario => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onStartDebate={handleStartDebate}
              onDelete={handleDeleteScenario}
              onEdit={handleEditScenario}
            />
          ))
        )}
      </div>
    </div>
  );
}