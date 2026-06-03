// src/components/ScenariosTab/MyScenariosPanel/index.jsx
// ✅ REDESIGNED: double-border panel, SVG icons, styled header/empty/error/max
// ✅ PRESERVED: useUser, deleteScenario, triggerPublishConfetti, CreateButton,
//               PublishScenarioModal, publish flow, confetti, max-5 limit,
//               onStartDebate delegates to parent — all logic byte-for-byte

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

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const ErrorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 8v5M12 16v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DismissIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BlockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="#f87171" strokeWidth="1.6" opacity="0.7"/>
    <path d="M5.6 5.6l12.8 12.8" stroke="#f87171" strokeWidth="1.6"
      strokeLinecap="round" opacity="0.7"/>
  </svg>
);

const EmptyIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <filter id="msp-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#6366f1" floodOpacity="0.4"/>
      </filter>
    </defs>
    <circle cx="8"  cy="8"  r="3" stroke="#6366f1" strokeWidth="1.6"
      filter="url(#msp-glow)" opacity="0.7"/>
    <circle cx="16" cy="8"  r="3" stroke="#6366f1" strokeWidth="1.6"
      filter="url(#msp-glow)" opacity="0.7"/>
    <path d="M3 20c0-3 2.2-5 5-5M21 20c0-3-2.2-5-5-5M8 15c1-.4 2-.5 4-.5s3 .1 4 .5"
      stroke="#6366f1" strokeWidth="1.6" strokeLinecap="round"
      filter="url(#msp-glow)" opacity="0.7"/>
    <circle cx="12" cy="12" r="9.5" stroke="#6366f1" strokeWidth="1"
      strokeDasharray="3 3" opacity="0.3"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function MyScenariosPanel({
  scenarios = [],
  onRefresh  = () => {},
  onCreateNew = () => {},
  onStartDebate = () => {},
  theme = 'light'
}) {
  const { user } = useUser();
  const [error, setError]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);

  // Publishing state (original, untouched)
  const [publishing, setPublishing]                           = useState(null);
  const [publishModalOpen, setPublishModalOpen]               = useState(false);
  const [selectedScenarioForPublish, setSelectedScenarioForPublish] = useState(null);
  const [publishError, setPublishError]                       = useState(null);

  const { userCharacters = [] } = usePremiumCharacters();

  // ── Start debate — delegates to parent (original, untouched) ──────────────
  const handleStartDebate = async (scenarioId) => {
    onStartDebate(scenarioId);
  };

  const handleCloseChatWindow = () => setActiveScenario(null);

  // ── Delete (original, untouched) ──────────────────────────────────────────
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

  // ── Edit (original, untouched) ────────────────────────────────────────────
  const handleEditScenario = (scenario) => {
    console.log('✏️ Editing scenario:', scenario.id);
    alert(`Edit functionality coming soon!\n\nScenario: ${scenario.title}`);
  };

  // ── Publish flow (original, untouched) ────────────────────────────────────
  const handlePublishClick = (scenario) => {
    setSelectedScenarioForPublish(scenario);
    setPublishError(null);
    setPublishModalOpen(true);
  };

  const handlePublishModalClose = () => {
    if (!publishing) {
      setPublishModalOpen(false);
      setSelectedScenarioForPublish(null);
      setPublishError(null);
    }
  };

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
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({ scenario_id: scenario.id })
      });

      const data = await response.json();

      if (!response.ok) {
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

      if (action === 'publish') {
        triggerPublishConfetti();
      }

      setPublishModalOpen(false);
      setSelectedScenarioForPublish(null);
      onRefresh();

      alert(`Scenario ${action === 'publish' ? 'published to' : 'removed from'} Market Hub successfully!`);

    } catch (error) {
      console.error(`❌ Failed to ${action} scenario:`, error);
      setPublishError(error.message || `Failed to ${action} scenario`);
    } finally {
      setPublishing(null);
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (scenarios.length === 0) {
    return (
      <div className="my-scenarios-panel">
        <div className="panel-header">
          <h3>My Dialogues</h3>
          <div className="scenario-counter">0 / 5 Dialogues</div>
        </div>
        <div className="scenarios-grid">
          <div className="empty-scenarios">
            <EmptyIcon />
            <p className="empty-title">No dialogues yet</p>
            <p className="hint">Create your first dialogue to start multi-character debates</p>
            <CreateButton onClick={onCreateNew} variant="primary" />
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="my-scenarios-panel">

      <div className="panel-header">
        <h3>My Dialogues</h3>
        <div className="scenario-counter">{scenarios.length} / 5 Dialogues</div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="panel-error-banner" role="alert">
          <ErrorIcon />
          <span className="error-message">{error}</span>
          <button
            className="dismiss-error"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            <DismissIcon />
          </button>
        </div>
      )}

      {/* Scenarios grid */}
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

      {/* Create New — only shown when under limit */}
      {scenarios.length < 5 && (
        <div className="create-new-section">
          <CreateButton
            onClick={onCreateNew}
            variant="secondary"
            disabled={scenarios.length >= 5}
          />
        </div>
      )}

      {/* Max reached message */}
      {scenarios.length >= 5 && (
        <div className="max-scenarios-message">
          <BlockIcon />
          <div>
            <p>Maximum of 5 Dialogues reached</p>
            <p className="hint">Delete a Dialogue to create a new one</p>
          </div>
        </div>
      )}

      {/* Publish / Unpublish Modal */}
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