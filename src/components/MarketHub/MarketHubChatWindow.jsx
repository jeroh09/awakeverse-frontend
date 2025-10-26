// src/components/MarketHub/MarketHubChatWindow.jsx
// Simplified chat window for Market Hub - assumes debate already started
import React, { useState, useEffect } from 'react';
import usePremiumCharacters from '../../hooks/usePremiumCharacters';
import useScenarioChat from '../../hooks/useScenarioChat';
import ParticipantAvatars from '../ScenariosTab/ScenarioChatWindow/ParticipantAvatars';
import ChatMessages from '../ScenariosTab/ScenarioChatWindow/ChatMessages';
import ChatInput from '../ScenariosTab/ScenarioChatWindow/ChatInput';
import HomeButton from '../ScenariosTab/ScenarioChatWindow/FloatingControls/HomeButton';
import '../ScenariosTab/ScenarioChatWindow/ScenarioChatWindow.css';

export default function MarketHubChatWindow({
  scenario,
  onBack,
  theme = 'light'
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  const { userCharacters = [] } = usePremiumCharacters();

  // Get scenario chat hook
  const {
    debateId,
    messages,
    isSending,
    activeSpeakers,
    queuedSpeakers,
    circuitBreakerState,
    usageData,
    usageLoading,
    sendMessage,
    resetScenario,
    initializeFromExisting
  } = useScenarioChat();

  // Defensive checks
  if (!scenario || !onBack) {
    console.error('❌ MarketHubChatWindow: scenario and onBack props required');
    return null;
  }

  console.log('🌍 MarketHubChatWindow mounted:', {
    scenarioId: scenario.scenarioId || scenario.id,
    debateId: scenario.debateId,
    title: scenario.title,
    participants: scenario.participants || scenario.character_keys,
    theme,
    initialized: scenario.initialized
  });

  // Responsive handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize from existing debate (Market Hub always has this)
  useEffect(() => {
    const initialize = async () => {
      if (isInitialized) return;

      // Validation
      if (!scenario.debateId || !scenario.scenarioId) {
        setInitError('Invalid scenario data: missing debateId or scenarioId');
        console.error('❌ Market Hub scenario missing required fields:', scenario);
        return;
      }

      try {
        console.log('🚀 Initializing Market Hub chat...');
        setInitError(null);

        await initializeFromExisting({
          debateId: scenario.debateId,
          scenarioId: scenario.scenarioId,
          messages: scenario.messages || []
        });

        setIsInitialized(true);
        console.log('✅ Market Hub chat initialized');

      } catch (error) {
        console.error('❌ Failed to initialize Market Hub chat:', error);
        setInitError(error.message);
      }
    };

    initialize();
  }, []); // Empty deps - only run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up Market Hub chat');
      resetScenario();
    };
  }, [resetScenario]);

  // Determine active speaker
  const currentActiveSpeaker = activeSpeakers.length > 0 ? activeSpeakers[0] : null;

  // Handle send message
  const handleSend = async (messageText) => {
    if (!messageText.trim() || isSending) return;

    // Check circuit breaker
    if (circuitBreakerState.status === 'tripped') {
      alert('Too many errors. Please refresh and try again.');
      return;
    }

    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (isSending) {
      const confirm = window.confirm('A message is being sent. Are you sure you want to leave?');
      if (!confirm) return;
    }
    
    resetScenario();
    onBack();
  };

  // Show initialization error
  if (initError) {
    return (
      <div className={`scenario-chat-window theme-${theme}`}>
        <HomeButton onClick={handleBack} theme={theme} />
        
        <div className="chat-layout-grid">
          <main className="chat-section">
            <div className="init-error-state">
              <span className="error-icon">⚠️</span>
              <h3>Failed to Load Chat</h3>
              <p>{initError}</p>
              <button onClick={handleBack} className="back-button">
                Go Back
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show loading state while initializing
  if (!isInitialized || usageLoading) {
    return (
      <div className={`scenario-chat-window theme-${theme}`}>
        <HomeButton onClick={handleBack} theme={theme} />
        
        <div className="chat-layout-grid">
          <main className="chat-section">
            <div className="init-loading-state">
              <div className="loading-spinner"></div>
              <p>Loading chat...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show circuit breaker tripped state
  if (circuitBreakerState.status === 'tripped') {
    return (
      <div className={`scenario-chat-window theme-${theme}`}>
        <HomeButton onClick={handleBack} theme={theme} />
        
        <div className="chat-layout-grid">
          <main className="chat-section">
            <div className="circuit-breaker-state">
              <span className="error-icon">🔌</span>
              <h3>Chat Paused</h3>
              <p>Too many errors occurred. The chat has been paused for stability.</p>
              <p className="error-detail">{circuitBreakerState.lastError}</p>
              <button onClick={handleBack} className="back-button">
                Return to Market Hub
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`scenario-chat-window theme-${theme}`}>
      <HomeButton onClick={handleBack} theme={theme} />

      <div className="chat-layout-grid">
        {/* LEFT: Participant Avatars */}
        <aside className="avatars-section">
          <ParticipantAvatars
            participants={scenario.participants || scenario.character_keys || []}
            userCharacters={userCharacters}
            activeSpeaker={currentActiveSpeaker}
            queuedSpeakers={queuedSpeakers}
            isMobile={isMobile}
            theme={theme}
          />
        </aside>

        {/* CENTER: Chat Area */}
        <main className="chat-section">
          <header className="chat-header">
            <h1 className="scenario-title">{scenario.title}</h1>
            {scenario.description && (
              <p className="scenario-description">{scenario.description}</p>
            )}
            
            {/* Usage Indicator - if user has limits */}
            {usageData.limit !== null && (
              <div className="usage-indicator">
                <span className="usage-icon">💬</span>
                <span className="usage-text">
                  {usageData.remaining} of {usageData.limit} questions remaining
                </span>
                {usageData.limitReached && (
                  <span className="usage-limit-badge">Limit Reached</span>
                )}
              </div>
            )}
            
            {/* Debug info - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="debug-info">
                <small>
                  Debate ID: {debateId} | Active: {activeSpeakers.join(', ') || 'none'} | 
                  Circuit: {circuitBreakerState.status} | Market Hub: ✅
                </small>
              </div>
            )}
          </header>

          <ChatMessages
            messages={messages}
            userCharacters={userCharacters}
            isSending={isSending}
            theme={theme}
          />

          <ChatInput
            starterQuestions={scenario.starter_questions || []}
            onSend={handleSend}
            isSending={isSending || usageData.limitReached}
            theme={theme}
          />
        </main>
      </div>
    </div>
  );
}