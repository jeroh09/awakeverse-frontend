// src/components/ScenariosTab/ScenarioChatWindow/index.jsx
// PHASE 2: Two-Panel Layout Refactor
// Steps 3-4: New layout structure with panel collapse state

import React, { useState, useEffect } from 'react';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters';
import useScenarioChat from '../../../hooks/useScenarioChat';
import { useUser } from '../../../contexts/UserContext';
import SubscriptionService from '../../../services/SubscriptionService';

// Existing components - keeping for now
// import ChatInput from './ChatInput'; // OLD - deprecated
import ChatMessages from './ChatMessages';
import HomeButton from './FloatingControls/HomeButton'; // Keep for compatibility if needed

// NEW: AvatarsColumn (Phase 3)
import AvatarsColumn from './AvatarsColumn';

// NEW: InfoPanel (Phase 4)
import InfoPanel from './InfoPanel';

// NEW: FloatingChatInput (Phase 5)
import FloatingChatInput from './FloatingChatInput';

// NEW: MobileBackButton (Phase 7)
import MobileBackButton from './MobileBackButton';

// Hooks
import useKeyboardHeight from '../../../hooks/useKeyboardHeight'; // NEW: Mobile keyboard handling

// Styles
import styles from './ScenarioChatWindow.module.css'; // New layout styles

export default function ScenarioChatWindow({
  scenario,
  scenarios = [], // NEW: List of all user scenarios for info panel
  onBack,
  theme = 'light'
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userTier, setUserTier] = useState('free');
  
  // ✅ NEW: Info panel collapse state
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false);

  // ✅ NEW: Mobile keyboard handling
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  const { user } = useUser();
  const { userCharacters = [] } = usePremiumCharacters();

  // Get scenario chat hook with usage tracking
  const {
    debateId,
    messages,
    isSending,
    activeSpeakers,
    queuedSpeakers,
    circuitBreakerState,
    usageData,
    usageLoading,
    startScenario,
    sendMessage,
    resetScenario
  } = useScenarioChat();

  // Defensive checks
  if (!scenario || !onBack) {
    console.error('❌ ScenarioChatWindow: scenario and onBack props required');
    return null;
  }

  console.log('🎭 ScenarioChatWindow mounted:', {
    scenarioId: scenario.id,
    title: scenario.title,
    participants: scenario.character_keys,
    theme,
    debateId,
    initialized: isInitialized,
    usageData,
    infoPanelCollapsed // ✅ NEW
  });

  // Fetch user's tier on mount
  useEffect(() => {
    const fetchUserTier = async () => {
      if (!user?.id) return;

      try {
        const data = await SubscriptionService.getUserSubscriptionStatus(user.id);
        
        if (data.status === 'success' && data.subscription) {
          const tier = data.subscription.tier || data.subscription.tier_name || 'free';
          setUserTier(tier);
          console.log('📊 User tier:', tier);
        }
      } catch (error) {
        console.error('⚠️ Failed to fetch user tier:', error);
        setUserTier('free');
      }
    };

    fetchUserTier();
  }, [user?.id]);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
      
      // ✅ DEFENSIVE: Auto-collapse info panel on mobile
      if (newIsMobile && !infoPanelCollapsed) {
        setInfoPanelCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [infoPanelCollapsed]);

  // Auto-start scenario on mount
  useEffect(() => {
    const initializeScenario = async () => {
      if (isInitialized || !scenario) return;

      try {
        console.log('🚀 Initializing scenario...');
        setInitError(null);

        const newDebateId = await startScenario(scenario);

        if (newDebateId) {
          setIsInitialized(true);
          console.log('✅ Scenario initialized successfully');
        }
      } catch (error) {
        console.error('❌ Failed to initialize scenario:', error);
        setInitError(error.message);
      }
    };

    initializeScenario();
  }, [scenario, isInitialized, startScenario]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up scenario');
      resetScenario();
    };
  }, [resetScenario]);

  // ✅ NEW: Toggle info panel
  const handleToggleInfoPanel = () => {
    setInfoPanelCollapsed(prev => !prev);
    console.log('🔄 Info panel toggled:', !infoPanelCollapsed);
  };

  // Determine active speaker
  const currentActiveSpeaker = activeSpeakers.length > 0 ? activeSpeakers[0] : null;

  // Check if user is unlimited
  const isUnlimited = userTier === 'unlimited';

  // Handle send message
  const handleSend = async (messageText) => {
    if (!messageText.trim() || isSending) return;

    // Check circuit breaker
    if (circuitBreakerState.status === 'tripped') {
      alert('Too many errors. Please refresh and try again.');
      return;
    }

    // Check usage limit (freemium enforcement)
    if (usageData.limitReached) {
      console.log('❌ Message limit reached, showing upgrade modal');
      setShowUpgradeModal(true);
      return;
    }

    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('❌ Failed to send message:', error);

      // Check if error was due to limit
      if (error.message === 'MESSAGE_LIMIT_REACHED') {
        setShowUpgradeModal(true);
      }
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

  // ✅ NEW: Handle scenario switch
  // Defensive: Just navigate back and let parent handle scenario selection
  const handleScenarioSwitch = (scenarioId) => {
    if (scenarioId === scenario.id) {
      console.log('📋 Already viewing this scenario');
      return; // Already on this scenario
    }

    if (isSending) {
      const confirm = window.confirm('A message is being sent. Switch scenarios anyway?');
      if (!confirm) return;
    }

    console.log('📋 Switching scenario:', scenarioId);
    
    // Defensive: Navigate back to let parent component handle the switch
    // This prevents complex state management within chat window
    resetScenario();
    onBack();
  };

  // Show initialization error
  if (initError) {
    return (
      <div className={`${styles.container}`}>
        <div className={styles.chatPanel}>
          <div className="init-error-state">
            <span className="error-icon">⚠️</span>
            <h3>Failed to Start Scenario</h3>
            <p>{initError}</p>
            <button onClick={handleBack} className="back-button">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while initializing
  if (!isInitialized || usageLoading) {
    return (
      <div className={`${styles.container}`}>
        <div className={styles.chatPanel}>
          <div className="init-loading-state">
            <div className="loading-spinner"></div>
            <p>Preparing scenario...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show circuit breaker tripped state
  if (circuitBreakerState.status === 'tripped') {
    return (
      <div className={`${styles.container}`}>
        <div className={styles.chatPanel}>
          <div className="circuit-breaker-state">
            <span className="error-icon">🔌</span>
            <h3>Scenario Paused</h3>
            <p>Too many errors occurred. The scenario has been paused for stability.</p>
            <p className="error-detail">{circuitBreakerState.lastError}</p>
            <button onClick={handleBack} className="back-button">
              Return to My Scenarios
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER: TWO-PANEL LAYOUT =====
  return (
    <div className={`${styles.container}`}>
      {/* Breadcrumb Toggle (Desktop Only) */}
      {!isMobile && (
        <div 
          className={`${styles.breadcrumb} ${infoPanelCollapsed ? styles.collapsed : ''}`}
          onClick={handleToggleInfoPanel}
          data-tooltip={infoPanelCollapsed ? 'Show Info Panel' : 'Hide Info Panel'}
          role="button"
          aria-label={infoPanelCollapsed ? 'Show Info Panel' : 'Hide Info Panel'}
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleToggleInfoPanel();
            }
          }}
        >
          <span className={styles.breadcrumbIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={infoPanelCollapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
            </svg>
          </span>
        </div>
      )}

      {/* LEFT PANEL: Chat Panel */}
      <div className={`${styles.chatPanel} ${infoPanelCollapsed ? styles.expanded : ''}`}>
        <div className={styles.chatPanelInner}>
          {/* LEFT: Avatars Column */}
          <AvatarsColumn
            participants={scenario.character_keys || []}
            userCharacters={userCharacters}
            activeSpeaker={currentActiveSpeaker}
            queuedSpeakers={queuedSpeakers}
            isMobile={isMobile}
            theme={theme}
          />

          {/* RIGHT: Chat Content */}
          <div 
            className={styles.chatContent}
            style={isMobile && isKeyboardVisible ? {
              transform: `translateY(-${keyboardHeight}px)`,
              transition: 'transform 0.2s ease-out'
            } : {}}
          >
            {/* Mobile Back Button */}
            {isMobile && (
              <MobileBackButton onClick={handleBack} />
            )}

            {/* Chat Header */}
            <header className="chat-header">
              <h1 className="scenario-title">{scenario.title}</h1>
              {scenario.description && (
                <p className="scenario-description">{scenario.description}</p>
              )}
              
              {/* Usage Indicator - ONLY for non-unlimited users */}
              {!isUnlimited && usageData.limit !== null && (
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
                    Queued: {queuedSpeakers.join(', ') || 'none'} | 
                    Circuit: {circuitBreakerState.status} |
                    Tier: {userTier} | Usage: {usageData.questionsAsked}/{usageData.limit} |
                    Panel: {infoPanelCollapsed ? 'collapsed' : 'expanded'} |
                    Keyboard: {isKeyboardVisible ? `${keyboardHeight}px` : 'hidden'}
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

            <FloatingChatInput
              starterQuestions={scenario.starter_questions || []}
              onSend={handleSend}
              isSending={isSending || (!isUnlimited && usageData.limitReached)}
            />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Info Panel */}
      <div className={`${styles.infoPanel} ${infoPanelCollapsed ? styles.collapsed : ''}`}>
        <InfoPanel
          scenarios={scenarios}
          currentScenarioId={scenario.id}
          onScenarioSelect={handleScenarioSwitch}
          onHomeClick={handleBack}
        />
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          theme={theme}
          questionsUsed={usageData.questionsAsked}
          limit={usageData.limit}
        />
      )}
    </div>
  );
}

// Upgrade Modal Component (unchanged)
function UpgradeModal({ onClose, theme, questionsUsed, limit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content upgrade-modal theme-${theme}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="upgrade-modal-header">
          <span className="upgrade-modal-icon">🎭</span>
          <h2>Question Limit Reached</h2>
          <p className="upgrade-modal-subtitle">
            You've used {questionsUsed} of {limit} free questions in this scenario
          </p>
        </div>

        <div className="upgrade-modal-content">
          <div className="upgrade-benefit-list">
            <div className="upgrade-benefit">
              <span className="benefit-icon">💬</span>
              <div className="benefit-text">
                <h4>Unlimited Questions</h4>
                <p>Ask as many questions as you want in every scenario</p>
              </div>
            </div>
            
            <div className="upgrade-benefit">
              <span className="benefit-icon">🎨</span>
              <div className="benefit-text">
                <h4>Custom Scenarios</h4>
                <p>Create up to 5 custom multi-character debates</p>
              </div>
            </div>
            
            <div className="upgrade-benefit">
              <span className="benefit-icon">👥</span>
              <div className="benefit-text">
                <h4>Multi-Character Debates</h4>
                <p>Full access to 2-4 character conversations</p>
              </div>
            </div>
            
            <div className="upgrade-benefit">
              <span className="benefit-icon">💎</span>
              <div className="benefit-text">
                <h4>All Premium Features</h4>
                <p>Creator Hub, custom characters, and priority support</p>
              </div>
            </div>
          </div>

          <div className="upgrade-pricing">
            <div className="pricing-amount">
              <span className="price">£11.99</span>
              <span className="period">/month</span>
            </div>
            <p className="pricing-guarantee">
              ⭐Cancel anytime
            </p>
          </div>

          <div className="upgrade-modal-actions">
            <button 
              className="upgrade-cta-button"
              onClick={() => window.location.href = '/profile-settings?tab=subscription'}
            >
              Upgrade to Professional
            </button>
            <button 
              className="maybe-later-button"
              onClick={onClose}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}