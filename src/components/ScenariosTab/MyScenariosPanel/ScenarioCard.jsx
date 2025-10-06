// src/components/ScenariosTab/MyScenariosPanel/ScenarioCard.jsx
import React from 'react';
import './ScenarioCard.css';

export default function ScenarioCard({ scenario, onStartDebate, onDelete, onEdit }) {
  const handleStartDebate = () => {
    onStartDebate(scenario.id);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this scenario?')) {
      onDelete(scenario.id);
    }
  };

  // Generate character thumbnails
  const characterThumbnails = scenario.characters?.slice(0, 4).map((char, index) => (
    <div key={index} className="character-thumbnail">
      {typeof char === 'string' ? char.charAt(0).toUpperCase() : char.name?.charAt(0).toUpperCase()}
    </div>
  )) || [];

  return (
    <div className="scenario-card">
      <div className="scenario-header">
        <h4 className="scenario-title">{scenario.title}</h4>
        <div className="scenario-actions">
          <button className="action-button edit" onClick={() => onEdit(scenario)}>
            Edit
          </button>
          <button className="action-button delete" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
      
      <p className="scenario-description">{scenario.description}</p>
      
      <div className="scenario-meta">
        <div className="character-thumbnails">
          {characterThumbnails}
          {scenario.characters?.length > 4 && (
            <div className="character-thumbnail more">+{scenario.characters.length - 4}</div>
          )}
        </div>
        
        <div className="question-count">
          {scenario.starter_questions?.length || 0} questions
        </div>
      </div>
      
      <button className="start-debate-button" onClick={handleStartDebate}>
        Start Debate
      </button>
    </div>
  );
}