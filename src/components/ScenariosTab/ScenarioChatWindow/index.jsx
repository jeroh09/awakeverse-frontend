// src/components/ScenariosTab/ScenarioChatWindow/index.jsx
// PHASE 2: Two-Panel Layout Refactor
// Steps 3-4: New layout structure with panel collapse state
// VIDEO GENERATION INTEGRATED

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters';
import useScenarioChat from '../../../hooks/useScenarioChat';
import useContentGeneration from '../../../hooks/useContentGeneration';
import { useUser } from '../../../contexts/UserContext';
import SubscriptionService from '../../../services/SubscriptionService';
import DebateModeToggle from '../DebateModeToggle';
import { ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ScriptViewerModal from './ScriptViewerModal';

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

  // ✅ NEW: Scroll-to-bottom button
  const messagesContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

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
    continueConversation, 
    nextSpeaker,
    sendMessage,
    resetScenario,
     // ── Auto-debate ──────────────────
    debateMode,
    turnCap,
    autoTurnCount,
    autoStopped,
    setDebateMode,
    stopDebate,
    runAutoDebate,
  } = useScenarioChat();

  // ===== VIDEO GENERATION HOOK =====
  const contentGen = useContentGeneration(scenario.id); 
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState(null); 

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
    infoPanelCollapsed,
    videoStatus: videoGen.state.status,
    videoProgress: videoGen.state.progress
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

  // ✅ NEW: Scroll-to-bottom button logic
  // Shows when user has scrolled more than 100px up from the bottom
  const handleMessagesScroll = useCallback((e) => {
    const el = e.target;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distanceFromBottom > 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

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
      const seedSpeaker = await sendMessage(messageText);

      // ── Auto-debate: kick off loop after seed message ────────────────
      if (debateMode === 'auto' && seedSpeaker) {
        // Small gap to ensure isSending state has cleared before nextSpeaker checks it
        await new Promise(resolve => setTimeout(resolve, 500));
        await runAutoDebate(seedSpeaker, turnCap);
      }

    } catch (error) {
      console.error('❌ Failed to send message:', error);

      // Check if error was due to limit
      if (error.message === 'MESSAGE_LIMIT_REACHED') {
        setShowUpgradeModal(true);
      }
    }
  };

  // ✅ NEW: Handle stop message generation
  //const handleStop = () => {
    //console.log('🛑 Stop button clicked - stopping message generation');

    // OPTION A: If useScenarioChat has a stopGeneration method
    // stopGeneration(); // Uncomment if available

    // OPTION B: If using AbortController pattern (check useScenarioChat hook)
    // The hook should expose a stop/cancel method
    // For now, log a warning
    //console.warn('⚠️ handleStop called but no stop method available in useScenarioChat');
    //console.warn('⚠️ You may need to add AbortController pattern to useScenarioChat hook');
  //};
  const handleStop = () => {
    if (debateMode === 'auto') {
      stopDebate();
    }
    console.log('🛑 handleStop called');
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

  // ===== VIDEO GENERATION HANDLERS =====
    // ===== CONTENT CREATION HANDLERS =====
 
  // ✨ Create button in MessageBubble opens the Create panel in InfoPanel.
  // It does NOT trigger generation directly — the user picks type/duration first.
  const handleOpenCreate = useCallback(() => {
    console.log('✨ Opening Create panel');
    setIsCreatePanelOpen(true);
    // Auto-expand InfoPanel if it was collapsed
    if (infoPanelCollapsed) {
      setInfoPanelCollapsed(false);
    }
  }, [infoPanelCollapsed]);
 
  // Called by InfoPanel's close/back button
  const handleCloseCreate = useCallback(() => {
    setIsCreatePanelOpen(false);
    contentGen.resetContent();
  }, [contentGen]);
 
  // Minimum non-user messages required to enable Create button
  const canCreateContent = useMemo(() => {
    const aiMessages = messages.filter(m => !m.user && m.speaker !== 'user');
    return aiMessages.length >= 5;
  }, [messages]);
 


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
     // Find the scenario in the list
    const newScenario = scenarios.find(s => s.id === scenarioId);

    if (!newScenario) {
      console.error('❌ Scenario not found:', scenarioId);
      return;
    }
    
    // Defensive: Navigate back to let parent component handle the switch
    // This prevents complex state management within chat window
    resetScenario();
    onBack(); // Let parent component handle the actual scenario switch
    
    // TODO: If parent needs to know which scenario to switch to,
    // you might need to add onScenarioSwitch prop and call it here
  };

  // Handle initialization errors
  if (initError) {
    return (
      <div className={`${styles.container}`}>
        <div className={styles.chatPanel}>
          <div className="error-state">
            <span className="error-icon">❌</span>
            <h3>Failed to Initialize Scenario</h3>
            <p>{initError}</p>
            <button onClick={handleBack} className="back-button">
              Return to My Scenarios
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state during initialization
  if (!isInitialized) {
    return (
      <div className={`${styles.container}`}>
        <div className={styles.chatPanel}>
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Initializing scenario...</p>
          </div>
        </div>
      </div>
    );
  }

  // Circuit breaker state
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
              {/* Mobile back button - icon only */}
              {isMobile && (
                <button 
                  onClick={handleBack}
                  className={styles.headerBackButton}
                  aria-label="Go back"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className={styles.headerTitleRow}>
                <h1 className="scenario-title">{scenario.title}</h1>
                <DebateModeToggle
                  mode={debateMode}
                  isSending={isSending}
                  autoTurnCount={autoTurnCount}
                  turnCap={turnCap}
                  autoStopped={autoStopped}
                  onToggle={() =>
                    setDebateMode(debateMode === 'auto' ? 'user_driven' : 'auto')
                  }
                  onStop={stopDebate}
                />
              </div>
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
                    Keyboard: {isKeyboardVisible ? `${keyboardHeight}px` : 'hidden'} |
                    Content: {contentGen.state.status} | CreatePanel: {isCreatePanelOpen ? 'open' : 'closed'}
                  </small>
                </div>
              )}
            </header>

            <ChatMessages
              messages={messages}
              userCharacters={userCharacters}
              isSending={isSending}
              onContinue={continueConversation}
              onNextSpeaker={nextSpeaker}
              onOpenCreate={handleOpenCreate}
              isCreating={contentGen.state.status === 'creating'}
              canCreateContent={canCreateContent}
              theme={theme}
              containerRef={messagesContainerRef}
              onScroll={handleMessagesScroll}
            />

            {/* ✅ NEW: Scroll-to-bottom button — shown when user scrolls up */}
            {showScrollButton && (
              <button
                className={styles.scrollToBottomButton}
                onClick={scrollToBottom}
                aria-label="Scroll to latest message"
                title="Jump to latest"
              >
                <ChevronDown size={18} />
              </button>
            )}
  
            <FloatingChatInput
              starterQuestions={scenario.starter_questions || []}
              onSend={handleSend}
              onStop={handleStop}
              isSending={
                isSending ||
                (debateMode === 'auto' && autoTurnCount > 0 && !autoStopped) ||
                (!isUnlimited && usageData.limitReached)
              }
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
          contentState={contentGen.state}
          contentJobs={contentGen.jobs}
          contentJobsLoading={contentGen.jobsLoading}
          isCreatePanelOpen={isCreatePanelOpen}
          onOpenCreate={handleOpenCreate}
          onCloseCreate={handleCloseCreate}
          onCreateContent={contentGen.createContent}
          onViewJob={(job) => setViewingJob(job)} 
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
      {/* Script Viewer Modal — overlays full chat window */}
      {viewingJob && (
        <ScriptViewerModal
          job={viewingJob}
          scenarioTitle={scenario.title}
          onClose={() => setViewingJob(null)}
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