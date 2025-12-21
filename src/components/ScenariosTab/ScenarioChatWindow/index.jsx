// src/components/ScenariosTab/ScenarioChatWindow/index.jsx - COMPLETE TWO-PANEL WITH AVATARS
import React, { useState, useEffect, useRef, useCallback } from 'react';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters';
import useScenarioChat from '../../../hooks/useScenarioChat';
import { useUser } from '../../../contexts/UserContext';
import SubscriptionService from '../../../services/SubscriptionService';
import SpeakerIndicator from './ChatMessages/SpeakerIndicator';
import ParticipantAvatars from './ParticipantAvatars'; // KEEP
import HomeButton from '../FloatingControls/HomeButton';
import { Home } from 'lucide-react';
import './ScenarioChatWindow.css';

export default function ScenarioChatWindow({
  scenario,
  scenarios = [], // All user scenarios for the sidebar
  onBack,
  onSwitchScenario,
  onCreateScenario,
  theme = 'awakeverse'
}) {
  const [inputText, setInputText] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userTier, setUserTier] = useState('free');

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

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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
    usageData
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
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${Math.max(newHeight, 48)}px`;
    }
  }, [inputText]);

  // Determine active speaker
  const currentActiveSpeaker = activeSpeakers.length > 0 ? activeSpeakers[0] : null;

  // Check if user is unlimited
  const isUnlimited = userTier === 'unlimited';

  // Handle send message
  const handleSend = useCallback(async (messageText) => {
    if (!messageText.trim() || isSending) return;

    // Check circuit breaker
    if (circuitBreakerState.status === 'tripped') {
      alert('Too many errors. Please refresh and try again.');
      return;
    }

    // ✅ Check usage limit (freemium enforcement)
    if (usageData.limitReached) {
      console.log('❌ Message limit reached, showing upgrade modal');
      setShowUpgradeModal(true);
      return;
    }

    try {
      await sendMessage(messageText);
      setInputText('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '48px';
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);

      // ✅ Check if error was due to limit
      if (error.message === 'MESSAGE_LIMIT_REACHED') {
        setShowUpgradeModal(true);
      }
    }
  }, [isSending, circuitBreakerState, usageData, sendMessage]);

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputText);
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
              <h3>Failed to Start Scenario</h3>
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
              <p>Preparing scenario...</p>
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
              <h3>Scenario Paused</h3>
              <p>Too many errors occurred. The scenario has been paused for stability.</p>
              <p className="error-detail">{circuitBreakerState.lastError}</p>
              <button onClick={handleBack} className="back-button">
                Return to My Scenarios
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { title, description, character_keys = [] } = scenario;

  return (
    <div className={`scenario-chat-window two-panel-layout theme-${theme}`}>
      <HomeButton onClick={handleBack} theme={theme} />

      <div className="chat-layout-grid">
        {/* LEFT PANEL: CHAT AREA */}
        <main className="chat-section">
          {/* Chat Header */}
          <header className="chat-header">
            <h1 className="scenario-title">{title}</h1>
            {description && (
              <p className="scenario-description">{description}</p>
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
                  Tier: {userTier} | Usage: {usageData.questionsAsked}/{usageData.limit}
                </small>
              </div>
            )}
          </header>

          {/* Messages Container */}
          <div className="messages-scroll">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <span className="empty-icon">💭</span>
                <p>Start the debate by asking a question below</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id || `fallback-${Math.random()}`}
                    message={msg}
                    userCharacters={userCharacters}
                    theme={theme}
                  />
                ))}
                
                {isSending && (
                  <div className="typing-indicator" role="status" aria-label="AI is responding">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                )}
              </>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* FLOATING CHAT INPUT (Verse Studio Style) */}
          <div className="composer-overlay">
            <div className="composer-fade" aria-hidden="true" />
            <div className="floating-composer">
              <textarea
                ref={textareaRef}
                className="composer-input"
                placeholder="Ask your next question... (Enter to send, Shift+Enter for new line)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
                disabled={isSending || (!isUnlimited && usageData.limitReached)}
                aria-label="Message input"
              />
              
              <div className="composer-actions">
                <button
                  className="send-button"
                  onClick={() => handleSend(inputText)}
                  disabled={isSending || !inputText.trim() || (!isUnlimited && usageData.limitReached)}
                  aria-label="Send message"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: SCENARIOS & PARTICIPANTS SIDEBAR */}
        <aside className="scenarios-side-panel">
          {/* Enhanced Home Button (Mobile) - hidden on desktop since we have floating HomeButton */}
          {isMobile && (
            <div className="side-panel-header">
              <button
                className="enhanced-home-button"
                onClick={handleBack}
                aria-label="Return to Scenario Hub"
              >
                <Home size={20} className="home-icon" />
                <span>Return to Scenario Hub</span>
              </button>
            </div>
          )}

          {/* PARTICIPANT AVATARS SECTION - ORIGINAL LOCATION */}
          <div className="avatars-section">
            <ParticipantAvatars
              participants={character_keys}
              userCharacters={userCharacters}
              activeSpeaker={currentActiveSpeaker}
              queuedSpeakers={queuedSpeakers}
              isMobile={isMobile}
              theme={theme}
            />
          </div>

          {/* Scenarios List Section */}
          <div className="scenarios-list-section">
            <div className="section-header">
              <h3 className="section-title">Your Scenarios</h3>
              <div className="scenario-counter">
                {scenarios.filter(s => s).length}/5 scenarios
              </div>
            </div>

            <div className="scenarios-list-container">
              {scenarios.length === 0 ? (
                <div className="empty-scenarios-sidebar">
                  <p>No scenarios yet</p>
                  <p className="hint">Create your first scenario</p>
                </div>
              ) : (
                scenarios.map(scenarioItem => (
                  <ScenarioCard
                    key={scenarioItem.id}
                    scenario={scenarioItem}
                    isActive={scenarioItem.id === scenario.id}
                    onClick={() => onSwitchScenario?.(scenarioItem.id)}
                    userCharacters={userCharacters}
                  />
                ))
              )}
            </div>

            {/* Create Scenario Button */}
            {scenarios.length < 5 && (
              <div className="side-panel-create-section">
                <button
                  className="create-scenario-button"
                  onClick={onCreateScenario}
                  aria-label="Create new scenario"
                >
                  <span className="plus-icon">+</span>
                  <span>Create New Scenario</span>
                </button>
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
        </aside>
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

// Chat Message Component with Avatar Integration
function ChatMessage({ message, userCharacters, theme }) {
  const { user, text, speaker, display_name } = message;

  if (user) {
    // User message (right aligned)
    return (
      <div className="message-wrapper user-wrapper">
        <div className="message-bubble user-message">
          <div className="message-text">{text}</div>
        </div>
      </div>
    );
  }

  // Character message (left aligned with avatar)
  return (
    <div className="message-wrapper character-wrapper">
      <SpeakerIndicator
        characterKey={speaker}
        displayName={display_name}
        userCharacters={userCharacters}
        theme={theme}
      />
      
      <div className="message-bubble character-message">
        <div className="message-text">{text}</div>
      </div>
    </div>
  );
}

// Scenario Card for Sidebar
function ScenarioCard({ scenario, isActive, onClick, userCharacters }) {
  const { title, description, character_keys = [] } = scenario;
  
  return (
    <div
      className={`side-panel-scenario-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="scenario-card-header">
        <h4 className="scenario-card-title">{title}</h4>
        <div className="character-avatars">
          {character_keys.slice(0, 3).map(key => (
            <MiniAvatar
              key={key}
              characterKey={key}
              userCharacters={userCharacters}
            />
          ))}
          {character_keys.length > 3 && (
            <span className="more-count">+{character_keys.length - 3}</span>
          )}
        </div>
      </div>
      
      {description && (
        <p className="scenario-card-description">{description}</p>
      )}
      
      <div className="scenario-card-meta">
        <span className="meta-item">
          <span className="meta-icon">👥</span>
          <span>{character_keys.length} characters</span>
        </span>
      </div>
    </div>
  );
}

// Mini Avatar for Scenario Cards
function MiniAvatar({ characterKey, userCharacters }) {
  const [imageError, setImageError] = useState(false);
  
  // Simple avatar lookup
  const getAvatarInfo = () => {
    // Check custom characters first
    const customChar = userCharacters.find(c => c.character_key === characterKey);
    if (customChar) {
      return {
        name: customChar.display_name,
        thumbnailUrl: customChar.avatar_url
      };
    }
    
    // Fallback to static image
    return {
      name: characterKey,
      thumbnailUrl: `/images/${characterKey}.jpg`
    };
  };
  
  const avatarInfo = getAvatarInfo();
  const initial = avatarInfo.name.charAt(0).toUpperCase();
  
  return (
    <div className="mini-avatar" title={avatarInfo.name}>
      {avatarInfo.thumbnailUrl && !imageError ? (
        <img
          src={avatarInfo.thumbnailUrl}
          alt={avatarInfo.name}
          className="mini-avatar-image"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="mini-avatar-initial">{initial}</div>
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