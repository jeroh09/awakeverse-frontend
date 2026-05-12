// Updated ChatWindow.js - ChatSidebar COMPLETELY REMOVED - WITH IMPROVED ERROR HANDLING
import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useSocket } from '../contexts/WebSocketContext';
import { ArrowLeft, Pen, RotateCw, Crown, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useUser } from '../contexts/UserContext';
import { useConversation } from '../hooks/useConversation';
import { CHARACTERS } from '../data/characters';
import ContextPanel from './ContextPanel';
import InputArea from './InputArea';
import FloatingAvatar from './FloatingAvatar/FloatingAvatar';
import PrestigeHub from './PrestigeHub/PrestigeHub';
import { useSmartScroll } from '../hooks/useSmartScroll';
import FloatingScrollButton from './FloatingScrollButton';
import useUsageTracking from '../hooks/useUsageTracking';
import { HeaderUsageIndicator, ChatUsageIndicator } from '../components/UsageIndicator';
import usePremiumCharacters from '../hooks/usePremiumCharacters';
import DefensiveChatInputWrapper from './DefensiveChatInputWrapper';
import DualPathUpgradeSystem from '../components/DualPathUpgradeSystem';
import '../styles.css';
import '../style/InviteStyles.css';
import '../style/ChatWindowStyles.css';  // ✅ ADD THIS LINE
import ChatFeedPanel from './ChatFeedPanel/ChatFeedPanel';


const API = process.env.REACT_APP_API_BASE_URL || 'https://api.awakeverse.com';

function getSafeDisplay(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const lastLine = lines[lines.length - 1];
  // Only hold back if the incomplete last line is a heading marker
  if (lastLine.startsWith('#')) {
    return lines.slice(0, -1).join('\n');
  }
  return text;
}

function useMediaQuery(maxWidth) {
  const query = `(max-width: ${maxWidth}px)`;
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = e => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

const Thinking = () => (
  <span className="typing">
    <span className="dot" />
    <span className="dot" />
    <span className="dot" />
  </span>
);

const ChatItem = memo(({ index, style, data }) => {
  const {
    chatHistory, sizeMap, setSize,
    startEditing, editingIndex, editText,
    onEditChange, cancelInlineEdit, sendEdited,
    retry, character, userAvatar, participants, getCharacterDisplayName
  } = data;

  const msg = chatHistory[index];
  

  // Invite Suggestion Candidates
  const inviteCandidates = (!msg.user && msg.has_invite_suggestion)
    ? msg.invite_candidates
    : null;

  const availableCandidates = inviteCandidates?.filter(candidate =>
    !participants.includes(candidate)
  ) || [];

  // Display Text (cleaned of invite tag markup)
  const displayText = msg.text
    ?.replace(/<!--\s*INVITE(?:_SUGGESTION|_CANDIDATES)?\s*:[\w,]+\s*-->/g, '')
    ?.replace(/<!-- INVITE(?:_CANDIDATES)?:[\w,]+ -->/g, '')
    ?.replace(/INVITE(?:_CANDIDATES)?:[\w,]+/g, '')
    ?.trim();

  const isEditing = index === editingIndex;
  const rowRef = useRef(null);
  const editRef = useRef(null);

  // Track disabled invite buttons
  const [usedInvitees, setUsedInvitees] = useState(() => {
    return new Set(msg.invite_candidates || []);
  });

  // Resize tracking for smooth auto-layout
  useEffect(() => {
    if (rowRef.current) {
      const h = rowRef.current.clientHeight;
      if (sizeMap.current[index] !== h) {
        setSize(index, h);
      }
    }
  }, [index, msg.text, msg.error, isEditing, editText, setSize, sizeMap, availableCandidates.length]);

  // Auto-grow edit textarea
  useEffect(() => {
    if (isEditing && editRef.current) {
      const ta = editRef.current;
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [isEditing, editText]);

  const cls = msg.user ? 'user-message' : 'ai-message';
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';
  const avatarSrc = msg.user
    ? userAvatar || `${API_BASE}/avatars/user_${data.userId || 'unknown'}_default.jpg`
    : (msg.speaker || character) ? `/images/${msg.speaker || character}.jpg` : null;

  // Character label fallback
    // Character label fallback - FIXED to handle custom characters
  const getCharacterInfo = (characterKey) => {
    // First, check static characters
    const staticChar = CHARACTERS[characterKey];
    if (staticChar) {
      return staticChar;
    }

    // Then check custom characters from userCharacters (owner's characters)
    if (data.userCharacters && Array.isArray(data.userCharacters)) {
      const customChar = data.userCharacters.find(char => 
        char && char.character_key === characterKey && char.status === 'approved'
      );
      if (customChar) {
        return {
          display_name: customChar.display_name,
          thumbnailUrl: `/images/${customChar.character_key}.jpg`
        };
      }
    }

    // FIXED: Check discovered characters from Market Hub
    if (data.discoveredCharacters && Array.isArray(data.discoveredCharacters)) {
      const discoveredChar = data.discoveredCharacters.find(char => 
        char && char.character_key === characterKey
      );
      if (discoveredChar) {
        return {
          display_name: discoveredChar.display_name || discoveredChar.name,
          thumbnailUrl: discoveredChar.avatar_url || discoveredChar.thumbnailUrl || `/images/${discoveredChar.character_key}.jpg`
        };
      }
    }

    // Fallback for unknown characters
    console.warn(`Character "${characterKey}" not found in static, custom, or discovered characters`);
    return {
      display_name: characterKey?.replace(/_/g, ' ') || 'Unknown'
    };
  };

  const characterInfo = msg.user 
    ? null 
    : getCharacterInfo(msg.speaker || character);

  const shouldShowInvite = (
    !msg.user &&
    availableCandidates.length > 0 &&
    !data.isSending &&
    !msg.error
  );

  return (
    <div style={style}>
      <div ref={rowRef} className={cls}>
        {msg.user ? (
          <img
            src={avatarSrc}
            alt="You"
            className="message-icon"
            onError={(e) => {
              e.currentTarget.onError = null;
              e.currentTarget.src = '/images/user-icon.jpg';
            }}
          />
        ) : avatarSrc ? (
          <img
            src={avatarSrc}
            alt={characterInfo?.display_name || 'AI'}
            className="message-icon"
            onError={(e) => {
              e.currentTarget.onError = null;
              e.currentTarget.style.display = 'none';
              
              const parent = e.currentTarget.parentElement;
              if (!parent.querySelector('.text-fallback')) {
                const fallback = document.createElement('div');
                fallback.className = 'text-fallback message-icon';
                fallback.style.cssText = 'display:flex;align-items:center;justify-content:center;background:rgba(255,215,0,0.2);color:#FFD700;font-weight:bold;border-radius:50%;width:40px;height:40px;flex-shrink:0;';
                fallback.textContent = (characterInfo?.display_name || 'AI').charAt(0).toUpperCase();
                parent.insertBefore(fallback, e.currentTarget);
              }
            }}
          />
        ) : (
          <div 
            className="message-icon text-fallback"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 215, 0, 0.2)',
              color: '#FFD700',
              fontWeight: 'bold',
              borderRadius: '50%',
              width: '40px',
              height: '40px'
            }}
          >
            {(characterInfo?.display_name || 'AI').charAt(0).toUpperCase()}
          </div>
        )}   
        <div className="message-content">
          <strong>
            {msg.user
              ? 'You:'
              : `${characterInfo?.display_name || 'AI'}:`}
          </strong>

          {msg.error ? (
            <>
              <div className="error-text">{msg.error}</div>
              <button
                onClick={() => retry(index)}
                className="retry-button"
                title="Retry"
              >
                <RotateCw size={16} />
              </button>
            </>
          ) : !msg.text ? (
            <Thinking />
          ) : isEditing && msg.user ? (
            <>
              <textarea
                ref={editRef}
                className="edit-textarea"
                value={editText}
                onChange={(e) => onEditChange(e.target.value)}
                placeholder="Edit message…"
                style={{ width: '100%', overflow: 'hidden', resize: 'none' }}
              />
              <div className="edit-buttons">
                <button
                  onClick={() => sendEdited(editText, index)}
                  className="send-button"
                  disabled={!editText.trim()}
                >
                  Send
                </button>
                <button onClick={cancelInlineEdit} className="cancel-button">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <ReactMarkdown>{displayText}</ReactMarkdown>

              {/* Invite Suggestion UI */}
              {shouldShowInvite && (
                <div className="invite-suggestion new-invite">
                  <div className="invite-prompt">
                    {availableCandidates.length === 1
                      ? `Would you like me to invite ${getCharacterDisplayName(availableCandidates[0])}?`
                      : 'Who would you like me to invite:'}
                  </div>
                  <div className="invite-buttons">
                    {availableCandidates.map((invitee) => (
                      <button
                        key={invitee}
                        className="invite-button invite-button-with-avatar"
                        disabled={usedInvitees.has(invitee) || data.isSending}
                        onClick={() => {
                          setUsedInvitees(prev => new Set([...prev, invitee]));
                          setTimeout(() => data.onInvite(invitee), 100);
                        }}
                      >
                        <img
                          src={`/images/${invitee}.jpg`}
                          alt={getCharacterDisplayName(invitee)}
                          className="invite-button-avatar"
                          onError={(e) => {
                            e.target.src = '/images/default-character.jpg';
                          }}
                        />
                        {getCharacterDisplayName(invitee)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit option for user messages */}
              {msg.user && !data.isSending && (
                <button
                  onClick={() => startEditing(index)}
                  className="edit-button"
                  title="Edit message"
                >
                  <Pen size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default function ChatWindow({
  character,
  characterName,
  threadId,
  onBack,
  session,
  targetMessage,
  avatarUrl,
  isHubVisible,
  onToggleVisibility,
  prestigeHubVisible,
  onPrestigeHubToggle,
  onCharacterSelect,    // ← ADD THI
  discoveredCharacters = []
}) {



  const { user } = useUser();
  const socket = useSocket();
  const isMobile = useMediaQuery(600);
  const { userCharacters } = usePremiumCharacters();

  const localThreadId = useRef(threadId);
  const { sendConversationMessage } = useConversation();
  const userAvatar = avatarUrl || user?.avatarUrl;
  const [newMessageCount, setNewMessageCount] = useState(0);
  const usageTracking = useUsageTracking(character);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('general');
    // Feed panel state
  const [feedOpen, setFeedOpen] = useState(true);

  useEffect(() => {
    const w = isMobile ? '0px' : feedOpen ? '256px' : '42px';
    document.documentElement.style.setProperty('--feed-w', w);
  // Reset on unmount so support widget snaps back
    return () => document.documentElement.style.setProperty('--feed-w', '0px');
  }, [feedOpen, isMobile]);

  const showUpgradeFlow = (reason = 'general') => {
    setUpgradeReason(reason);
    setUpgradeModalOpen(true);
  };

  
  // ✅ USER-FRIENDLY ERROR HANDLING SYSTEM
  const getUserFriendlyError = (error, context = 'general') => {
    const errorMessages = {
      general: "I'm having trouble responding right now. Please try again in a moment.",
      invite: "Unable to invite this character right now. Please try again.",
      network: "Connection issue detected. Please check your internet and try again.",
      timeout: "Request timed out. Please try again.",
      api_failure: "Service temporarily unavailable. Please try again shortly."
    };
    
    // Detect specific error types for better messaging
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      return errorMessages.timeout;
    }
    if (error.message?.includes('Network') || error.message?.includes('502') || error.message?.includes('503') || error.message?.includes('504')) {
      return errorMessages.network;
    }
    if (error.message?.includes('API failed') || error.message?.includes('failed')) {
      return errorMessages.api_failure;
    }
    
    return errorMessages[context] || errorMessages.general;
  };

  const reportError = (error, context) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      character: character,
      userId: user?.id
    };
    
    // Log detailed technical information for debugging
  };

  // Emotion state definition
  const [emotionState, setEmotionState] = useState('neutral');
  const [emotionIntensity, setEmotionIntensity] = useState(0.6);

  // FloatingAvatar feature flag
  const [useFloatingAvatar, setUseFloatingAvatar] = useState(
    process.env.REACT_APP_FLOATING_AVATAR !== 'false'
  );

  const [chatHistory, setChatHistory] = useState(
    (session?.messages || []).map(m => ({ 
      user: m.user, 
      text: m.text, 
      error: null,
      speaker: m.speaker || character,
      thread_id: m.thread_id || 'main',
      has_invite_suggestion: m.has_invite_suggestion || false,
      invite_candidates: m.invite_candidates || []
    }))
  );
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  const [participants, setParticipants] = useState([character]);

  // ✅ BREATHING INTERFACE STATE
  const [interfaceState, setInterfaceState] = useState('active');
  const [useBreathingInterface, setUseBreathingInterface] = useState(true);
  const [isUserTyping, setIsUserTyping] = useState(false);
  
  // Timers for breathing interface
  const typingTimerRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const idleTimerRef = useRef(null);

  // Breathing CSS classes
  const breathingClasses = [
    'breathing-interface',
    `state-${interfaceState}`,
    useBreathingInterface ? 'breathing-enabled' : 'breathing-disabled'
  ].join(' ');

  // ✅ BREATHING HANDLERS
  const handleTypingStart = useCallback(() => {
    setIsUserTyping(true);
    setInterfaceState('active');
    
    // Clear existing timers
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  const handleTypingEnd = useCallback(() => {
    setIsUserTyping(false);
    
    // Set idle timer
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setInterfaceState('idle');
    }, 300000);
  }, []);

  const handleInputFocus = useCallback(() => {
    setInterfaceState('focused');
    
    // Clear timers when focused
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (isUserTyping) {
      setInterfaceState('active');
    } else {
      // Set idle timer when blur and not typing
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setInterfaceState('idle');
      }, 300000);
    }
  }, [isUserTyping]);

  // Typing detection based on message content
  useEffect(() => {
    if (!message.trim()) {
      handleTypingEnd();
      return;
    }

    handleTypingStart();
    
    // Set typing end timer
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      handleTypingEnd();
    }, 1000); // 1 second after last keystroke

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [message, handleTypingStart, handleTypingEnd]);

  // Find the last user-sent message
  const lastUserMsg = React.useMemo(
    () => [...chatHistory].reverse().find(m => m.user),
    [chatHistory]
  );
  const showPaneInvite = !!lastUserMsg?.has_invite_suggestion;

  // Get invite suggestions for FloatingAvatar
  const getInviteSuggestions = useCallback(() => {
    const lastUserMsg = [...chatHistory].reverse().find(m => m.user);
    if (lastUserMsg?.has_invite_suggestion) {
      return lastUserMsg.invite_candidates || [];
    }
    return [];
  }, [chatHistory]);

  // ✅ NEW: Character selection handler for PrestigeHub
  const handleCharacterSelect = useCallback((characterKey) => {
    // You can add navigation logic here or pass it up to parent
    if (onBack) {
      // Close PrestigeHub first
      if (onPrestigeHubToggle) {
        onPrestigeHubToggle();
      }
      // Then navigate - you might want to add character switching logic
      // For now, just log the selection
    }
  }, [onBack, onPrestigeHubToggle]);

  // Helper function to get character display name (needed for error messages)
  const getCharacterDisplayName = useCallback((characterKey) => {
    const char = CHARACTERS[characterKey];
    if (char) {
      return char.display_name || char.name || characterKey.replace(/_/g, ' ');
    }
    return characterKey.replace(/_/g, ' ');
  }, []);
 
  // Initialize participants from session history
  useEffect(() => {
    if (session?.messages) {
      const allParticipants = new Set([character]);
      session.messages.forEach(msg => {
        if (msg.speaker && !msg.user) {
          allParticipants.add(msg.speaker);
        }
      });
      setParticipants(Array.from(allParticipants));
    }
  }, [session, character]);

  // WebSocket emotion handling
  useEffect(() => {
    if (!socket) return;

    const handleEmotion = (data) => {
      if (data.character === character) {
        setEmotionState(data.emotion || 'neutral');
        setEmotionIntensity(data.intensity || 0.8);
      }
    };

    socket.on("emotion", handleEmotion);

    return () => {
      socket.off("emotion", handleEmotion);
    };
  }, [socket, character]);

  const listRef = useRef(null);
  const {
    isNearBottom,
    shouldAutoScroll,
    hasNewMessages,
    scrollToBottom: smartScrollToBottom,
    handleScroll: smartHandleScroll,
    enableAutoScroll
  } = useSmartScroll(listRef, chatHistory);
  const controllerRef = useRef(null);
  const sizeMap = useRef({});
  // AFTER: refs to keep last stream metadata for invite wiring
  const lastSpeakerRef = useRef(character);
  const lastThreadIdRef = useRef(localThreadId.current || 'main');
  const lastUserMessageRef = useRef(null);                     // NEW: tracks last user prompt text
  const lastSuggestionRef = useRef(null); 
// optional: debounce “invite suggestion” once per user message
  const suggestionShownForMessageRef = useRef(null);
  const displayName = characterName || character?.replace(/_/g, ' ') || 'Unknown';
  const lastMessageCountRef = useRef(0);
  
  // Row height calculation with invite spacing
  const ROW_GAP = 20;

  const setSize = useCallback((idx, h) => {
    sizeMap.current[idx] = h;
    if (listRef.current) {
      listRef.current.resetAfterIndex(idx);
    }
  }, []);
  
  const getSize = useCallback(idx => (sizeMap.current[idx] || 120) + ROW_GAP, []);

  // 5. ADD this handler function (add after other function definitions):
  const handleScrollToBottomClick = useCallback(() => {
  // Manual scroll to bottom using direct DOM manipulation
   if (listRef.current?._outerRef) {
      const scrollElement = listRef.current._outerRef;
      const targetScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight;
    
    // Force scroll
      scrollElement.scrollTop = targetScrollTop;
      scrollElement.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }

  // Re-enable autoscroll and reset counts
    enableAutoScroll();
    setNewMessageCount(0);
    lastMessageCountRef.current = chatHistory.length;
  }, [enableAutoScroll, chatHistory.length, isMobile]);

    // ===== /invite HANDLER — AFTER REPLACEMENT START =====

  // Simple helper (optional): getCookie by name
  const getCookie = (name) =>
    document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1] || '';

  const [toast, setToast] = useState(null);           // tiny toast message
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const onInvite = async (inviteeKey) => {
    console.log('🎯 INVITE DEBUG: Function called', { inviteeKey });

    // ============================================================
    // CHECKPOINT 1: Initial State
    // ============================================================
    console.log('📊 INVITE DEBUG: Initial state check', {
      isSending,
      participants: participants?.length,
      character,
      inviteeKey,
      inviteeType: typeof inviteeKey
    });

    // Check if already sending
    if (isSending) {
      console.warn('⚠️ INVITE DEBUG: Already sending, aborting');
      return;
    }

    // ============================================================
    // CHECKPOINT 2: Participant Limit
    // ============================================================
    const activeInvitees = (participants?.length || 1) - 1;
    console.log('🔢 INVITE DEBUG: Checking participant limit', {
      participantsLength: participants?.length,
      activeInvitees,
      limit: 2,
      wouldExceedLimit: activeInvitees >= 2
    });

    if (activeInvitees >= 2) {
      console.warn('⚠️ INVITE DEBUG: Participant limit reached');
      showToast('Invite limit reached (2).');
      return;
    }

    // ============================================================
    // CHECKPOINT 3: Variable Preparation
    // ============================================================
    const toKey = String(inviteeKey);
    console.log('🔑 INVITE DEBUG: Key prepared', {
      original: inviteeKey,
      normalized: toKey
    });

    // ============================================================
    // CHECKPOINT 4: Last User Message Extraction
    // ============================================================
    const lastUserMsg =
      lastUserMessageRef.current ||
      ([...chatHistory].reverse().find(m => m.user)?.text || '');

    console.log('💬 INVITE DEBUG: Last user message', {
      fromRef: lastUserMessageRef.current,
      fromHistory: [...chatHistory].reverse().find(m => m.user)?.text,
      final: lastUserMsg,
      isEmpty: !lastUserMsg
    });

    // ============================================================
    // CHECKPOINT 5: Refs Check
    // ============================================================
    console.log('📌 INVITE DEBUG: Refs state', {
      lastSpeaker: lastSpeakerRef.current,
      character,
      finalFrom: lastSpeakerRef.current || character,
      lastThreadId: lastThreadIdRef.current,
      localThreadId: localThreadId.current,
      finalThreadId: lastThreadIdRef.current || localThreadId.current || 'main'
    });

    // ============================================================
    // CHECKPOINT 6: API Configuration
    // ============================================================
    console.log('🌐 INVITE DEBUG: API configuration', {
      API,
      fullUrl: `${API}/invite`,
      apiType: typeof API,
      apiDefined: API !== undefined
    });

    // ============================================================
    // CHECKPOINT 7: Cookie Check
    // ============================================================
    const csrf = getCookie('av_csrf');
    const sid = getCookie('av_sid');
    const rid = getCookie('av_rid');

    console.log('🍪 INVITE DEBUG: Cookie check', {
      csrf: csrf ? `${csrf.substring(0, 10)}...` : null,
      sid: sid ? `${sid.substring(0, 10)}...` : null,
      rid: rid ? `${rid.substring(0, 10)}...` : null,
      allCookiesPresent: !!(csrf && sid && rid)
    });

    if (!csrf) {
      console.error('❌ INVITE DEBUG: CSRF token missing!');
      showToast('Authentication error. Please refresh the page.');
      return;
    }

    // ============================================================
    // CHECKPOINT 8: Payload Construction
    // ============================================================
    const placeholderIndex = chatHistory.length;
    const payload = {
      from: lastSpeakerRef.current || character,
      to: toKey,
      message: lastUserMsg,
      thread_id: lastThreadIdRef.current || localThreadId.current || 'main'
    };

    console.log('📦 INVITE DEBUG: Payload constructed', {
      placeholderIndex,
      payload,
      payloadJSON: JSON.stringify(payload)
    });

    // ============================================================
    // CHECKPOINT 9: Request Preparation
    // ============================================================
    try {
      console.log('🚀 INVITE DEBUG: Starting invite request');

      // Optimistically add participant
      setParticipants(prev => {
        const newParticipants = prev.includes(toKey) ? prev : [...prev, toKey];
        console.log('👥 INVITE DEBUG: Participants updated', {
          before: prev,
          after: newParticipants
        });
        return newParticipants;
      });

      setIsSending(true);
      console.log('🔒 INVITE DEBUG: isSending set to true');

      // Reserve placeholder bubble
      setChatHistory(prev => {
        const newHistory = [
          ...prev,
          { user: false, speaker: toKey, text: '', error: null, has_invite_suggestion: false }
        ];
        console.log('💭 INVITE DEBUG: Placeholder added', {
          historyLength: newHistory.length,
          placeholder: newHistory[newHistory.length - 1]
        });
        return newHistory;
      });

      // ============================================================
      // CHECKPOINT 10: Fetch Request
      // ============================================================
      console.log('📡 INVITE DEBUG: About to fetch', {
        url: `${API}/invite`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf ? 'present' : 'missing'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const fetchStartTime = Date.now();
      const res = await fetch(`${API}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const fetchEndTime = Date.now();
      console.log('✅ INVITE DEBUG: Fetch completed', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        duration: `${fetchEndTime - fetchStartTime}ms`,
        headers: {
          contentType: res.headers.get('content-type'),
          provider: res.headers.get('X-AI-Provider')
        }
      });

      // ============================================================
      // CHECKPOINT 11: Response Check
      // ============================================================
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error('❌ INVITE DEBUG: Request failed', {
          status: res.status,
          statusText: res.statusText,
          errorText
        });

        if (/not found/i.test(errorText)) {
          showToast(`Invite failed: key '${toKey}' not found.`);
          console.warn('🔍 INVITE DEBUG: Character not found', { toKey });
        }
        throw new Error(`Invite failed (${res.status}): ${res.statusText}`);
      }

      // ============================================================
      // CHECKPOINT 12: Stream Reading
      // ============================================================
      console.log('🌊 INVITE DEBUG: Starting stream read');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let bufferStr = '';
      let accumulatedText = '';
      let chunkCount = 0;
      let tokenCount = 0;

      for (;;) {
        const { done, value } = await reader.read();
        chunkCount++;

        if (done) {
          console.log('✅ INVITE DEBUG: Stream complete', {
            totalChunks: chunkCount,
            totalTokens: tokenCount,
            finalText: accumulatedText
          });
          break;
        }

        bufferStr += decoder.decode(value, { stream: true });

        // Split by newlines
        const lines = bufferStr.split('\n');
        bufferStr = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Parse JSON
          let obj;
          try {
            obj = JSON.parse(trimmed);
            tokenCount++;

            if (tokenCount === 1) {
              console.log('📝 INVITE DEBUG: First token received', { obj });
            }
          } catch (e) {
            console.warn('⚠️ INVITE DEBUG: Failed to parse line', { line: trimmed, error: e.message });
            continue;
          }

          const token = (obj.response ?? '');
          const speakerFromServer = obj.speaker || toKey;
          const threadFromServer = obj.thread_id || 'main';

          // Update refs
          lastSpeakerRef.current = speakerFromServer;
          lastThreadIdRef.current = threadFromServer;

          // Append token
          if (token) {
            accumulatedText += token;

            setChatHistory(prev => {
              const copy = [...prev];
              if (copy[placeholderIndex]) {
                copy[placeholderIndex] = {
                  ...copy[placeholderIndex],
                  text: accumulatedText,
                  speaker: speakerFromServer,
                  thread_id: threadFromServer,
                  has_invite_suggestion: false
                };
              }
              return copy;
            });
          }
        }
      }

      // Flush trailing partial
      if (bufferStr.trim()) {
        try {
          const obj = JSON.parse(bufferStr.trim());
          const token = (obj.response ?? '');
          const speakerFromServer = obj.speaker || toKey;
          const threadFromServer = obj.thread_id || 'main';

          if (token) {
            accumulatedText += token;
            setChatHistory(prev => {
              const copy = [...prev];
              if (copy[placeholderIndex]) {
                copy[placeholderIndex] = {
                  ...copy[placeholderIndex],
                  text: accumulatedText,
                  speaker: speakerFromServer,
                  thread_id: threadFromServer,
                  has_invite_suggestion: false
                };
              }
              return copy;
            });
          }
        } catch (e) {
          console.warn('⚠️ INVITE DEBUG: Failed to parse trailing buffer', { buffer: bufferStr });
        }
      }

      // Final success log
      console.log('🎉 INVITE DEBUG: Invite completed successfully', {
        invitee: toKey,
        tokensReceived: tokenCount,
        finalLength: accumulatedText.length
      });

    } catch (e) {
      // ============================================================
      // CHECKPOINT 13: Error Handling
      // ============================================================
      console.error('💥 INVITE DEBUG: Exception caught', {
        error: e,
        message: e.message,
        stack: e.stack,
        name: e.name
      });

      reportError(e, {
        action: 'invite_request',
        character: character,
        invitee: toKey,
        lastUserMessage: lastUserMsg?.substring(0, 50)
      });

      setChatHistory(prev => {
        const copy = [...prev];
        if (copy[placeholderIndex]) {
          copy[placeholderIndex] = {
            ...copy[placeholderIndex],
            error: `Unable to invite ${getCharacterDisplayName(toKey)} right now. Please try again.`,
            text: ''
          };
        }
        return copy;
      });

      showToast(`Failed to invite ${getCharacterDisplayName(toKey)}`);
    } finally {
      // ============================================================
      // CHECKPOINT 14: Cleanup
      // ============================================================
      setIsSending(false);
      console.log('🔓 INVITE DEBUG: isSending set to false (finally block)');
    }
  };


  // Initialize chat history from session
  useEffect(() => {
    const sorted = [...(session?.messages || [])].sort((a, b) => a.ts - b.ts);
    const initial = sorted.map(m => ({ 
      user: m.user, 
      text: m.text, 
      error: null,
      speaker: m.speaker || character,
      has_invite_suggestion: m.has_invite_suggestion || false,
      invite_candidates: m.invite_candidates || []
    }));
    setChatHistory(initial);
    setEditingIndex(null);
    setEditText('');
  }, [session, character]);

  // Handle viewport adjustments for mobile
  useEffect(() => {
    const input = document.querySelector('.chat-input');
    const updatePadding = () => {
      const viewport = window.visualViewport;
      if (!viewport || !input) return;

      const bottomOffset = viewport.height + viewport.offsetTop - window.innerHeight;
      input.style.paddingBottom = `${Math.max(bottomOffset, 8)}px`;
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updatePadding);
      updatePadding();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updatePadding);
      }
    };
  }, []);

  // Scroll to target message if specified
  useEffect(() => {
    if (targetMessage && listRef.current) {
      const idx = chatHistory.findIndex(m => m.text === targetMessage);
      if (idx >= 0) {
        requestAnimationFrame(() => {
          listRef.current.scrollToItem(idx, 'center');
        });
      }
    }
  }, [targetMessage, chatHistory]);

  useEffect(() => {
  // Count messages since user scrolled away
    if (!shouldAutoScroll && !isNearBottom) {
      const currentCount = chatHistory.length;
      const lastSeenCount = lastMessageCountRef.current || 0;
      const unseenCount = Math.max(0, currentCount - lastSeenCount);
      setNewMessageCount(unseenCount);
    } else {
    // Reset count when user is at bottom or autoscroll is enabled
      setNewMessageCount(0);
    // Update the last seen count when user is at bottom
      lastMessageCountRef.current = chatHistory.length;
    }
  }, [chatHistory.length, shouldAutoScroll, isNearBottom]);

  // Replace your sendAI function in ChatWindow.js with this streaming version
  // Replace your sendAI function in ChatWindow.js with this complete version
  // This fixes the speaker tracking issue

  const sendAI = async (userText, aiIndex) => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsSending(true);

    try {
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify({
          character,
          message: userText,
          thread_id: localThreadId.current
        }),
        signal: controller.signal
      });



      if (!res.ok || !res.body) {
        throw new Error(`Chat API failed: ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let hasInviteSuggestion = false;
      let inviteCandidates = [];
      let actualSpeaker = character; // ✅ Track the ACTUAL speaker from backend

      // ✅ STREAMING: Process each chunk immediately
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            // inside the /chat stream loop
            const data = JSON.parse(line);
            const token = data.response || '';

            // ✅ Track actual speaker and thread for invites
            if (data.speaker) {
              actualSpeaker = data.speaker;
              lastSpeakerRef.current = data.speaker;
            }
            if (data.thread_id) {
              lastThreadIdRef.current = data.thread_id;
            }

            // ✅ Debounce & cache last suggestion for quick-invite
            if (data.has_invite_suggestion && Array.isArray(data.invite_candidates)) {
              const currentUserMsg = lastUserMessageRef.current || '∅';
              if (suggestionShownForMessageRef.current !== currentUserMsg) {
                suggestionShownForMessageRef.current = currentUserMsg;

                // Only store if there’s at least one candidate
                if (data.invite_candidates.length > 0) {
                  lastSuggestionRef.current = {
                    keys: data.invite_candidates,                 // canonical keys (e.g., ["sherlock"])
                    matched: data.matched_trigger || null,        // optional
                    threadId: data.thread_id || lastThreadIdRef.current || 'main',
                    from: data.speaker || lastSpeakerRef.current || character
                  };
                }
              }
            }


            // ✅ STREAMING: Add each token immediately
            if (token) {
              fullReply += token;

              // ✅ Update UI with ACTUAL speaker (not hardcoded)
              setChatHistory(prev => {
                const copy = [...prev];
                if (copy[aiIndex]) {
                  copy[aiIndex] = {
                    ...copy[aiIndex],
                    speaker: actualSpeaker, // ✅ Use actual speaker
                    text: getSafeDisplay(fullReply),
                    has_invite_suggestion: hasInviteSuggestion,
                    invite_candidates: inviteCandidates
                  };
                }
                return copy;
              });

              // ✅ STREAMING: Auto-scroll as content streams in
              setTimeout(() => {
                if (shouldAutoScroll && listRef.current) {
                  smartScrollToBottom();
                }
              }, 10);
            }

            // Handle invite suggestions
            if (data.has_invite_suggestion) {
              hasInviteSuggestion = true;
              inviteCandidates = data.invite_candidates || [];
            }

          } catch (err) {
            console.warn('JSON parse error:', err);
          }
        }
      }

      // ✅ Final update with ACTUAL speaker (not hardcoded character)
      setChatHistory(prev => {
        const copy = [...prev];
        if (copy[aiIndex]) {
          copy[aiIndex] = {
            ...copy[aiIndex],
            speaker: actualSpeaker, // ✅ Use tracked speaker
            text: fullReply,
            has_invite_suggestion: hasInviteSuggestion,
            invite_candidates: inviteCandidates
          };
        }
        return copy;
      });

      console.log('✅ Final message persisted with speaker:', actualSpeaker);

      // ✅ Update participants if speaker is different from primary
      if (actualSpeaker !== character) {
        setParticipants(prev => {
          if (prev.includes(actualSpeaker)) return prev;
          return [...prev, actualSpeaker];
        });
      }

      // ✅ CRITICAL: REFRESH USAGE AFTER SUCCESSFUL MESSAGE COMPLETION
      if (usageTracking.isCustomCharacter) {
        setTimeout(() => {
          usageTracking.refreshUsage().then(success => {
            if (success) {
              console.log('✅ Usage data refreshed successfully');
            }
          });
        }, 500);
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Chat request aborted');

        if (usageTracking.isCustomCharacter) {
          usageTracking.refreshUsage();
        }
      } else {
        reportError(err, {
          action: 'chat_request',
          character: character,
          userMessage: userText?.substring(0, 50)
        });

        console.error('LLM error:', err);
        setChatHistory(prev => {
          const copy = [...prev];
          if (copy[aiIndex]) {
            copy[aiIndex] = { 
              ...copy[aiIndex], 
              error: getUserFriendlyError(err, 'general')
            };
          }
          return copy;
        });
      }
    } finally {
      setIsSending(false);
      controllerRef.current = null;
    }
  };
  const sendMessage = () => {
    // ✅ CRITICAL: Check usage limits for custom characters
    if (usageTracking.isCustomCharacter && !usageTracking.canSendMessage) {
      // Block the message and show upgrade flow
      setShowUpgradeFlow('message_limit');
      return;
    }
    if (!message.trim() || isSending) return;
    const userText = message;

    // ✅ record last user prompt + reset debounce guard
    lastUserMessageRef.current = userText;
    suggestionShownForMessageRef.current = null;

    setMessage('');
    enableAutoScroll();
    const aiIndex = chatHistory.length + 1;
    setChatHistory(prev => [
      ...prev,
      { user: true, text: userText, error: null },
      { user: false, text: '', error: null, speaker: character }
    ]);
    sendAI(userText, aiIndex);
  };

  const stopStream = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsSending(false);
  };

  const startEditing = idx => { setEditingIndex(idx); setEditText(chatHistory[idx].text); };
  const cancelInlineEdit = () => { setEditingIndex(null); setEditText(''); };
  const sendEdited = (newText, idx) => {
    setEditingIndex(null);
    setChatHistory(prev => {
      const upTo = prev.slice(0, idx).concat({ user: true, text: newText, error: null });
      return [...upTo, { user: false, text: '', error: null, speaker: character }];
    });
    sendAI(newText, idx + 1);
  };
  const retry = async idx => {
    const userText = chatHistory[idx - 1]?.text || '';
    setChatHistory(prev => {
      const copy = [...prev];
      copy[idx] = { user: false, text: '', error: null, speaker: character };
      return copy;
    });
    await sendAI(userText, idx);
  };

  // ✅ BREATHING INTERFACE STYLES
  const breathingStyles = {
    opacity: 
      interfaceState === 'idle' ? 0.6 : 
      interfaceState === 'scrolling' ? 0.8 : 
      interfaceState === 'focused' ? 1 : 0.9,
    transform: 
      interfaceState === 'idle' ? 'scale(0.97)' : 
      interfaceState === 'scrolling' ? 'scale(0.99)' : 
      interfaceState === 'focused' ? 'scale(1.01)' : 'scale(1)',
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: 
      interfaceState === 'idle' ? 'blur(0.5px)' : 
      interfaceState === 'scrolling' ? 'blur(0.2px)' : 'blur(0px)'
  };

  return (
    <div 
      className={`chat-panel-container ${breathingClasses} ${prestigeHubVisible ? 'with-prestige-hub' : ''}`}
      style={breathingStyles}
    >
      {/* ✅ INTEGRATED PRESTIGE HUB */}
        <PrestigeHub 
          current={character}
          onSelect={handleCharacterSelect}
          isVisible={prestigeHubVisible}
          position={isMobile ? 'sidebar' : 'sidebar'}
        />

      {/* FloatingAvatar Integration */}
      {useFloatingAvatar && (
        <FloatingAvatar
          character={character}
          characterName={displayName}
          emotionState={emotionState}
          emotionIntensity={emotionIntensity}
          participants={participants}
          onBack={onBack}
          onCharacterSelect={onCharacterSelect}   
          inviteSuggestions={getInviteSuggestions()}
          isMobile={isMobile}
          enabled={true}
          isHubVisible={isHubVisible}
          onToggleVisibility={onToggleVisibility}
          onToggleHubVisibility={onPrestigeHubToggle}
          prestigeHubVisible={prestigeHubVisible}
          onPrestigeHubToggle={onPrestigeHubToggle}
          discoveryCount={0}
        />
      )}

      {showPaneInvite && (
        <div className="pane-invite-bar">
          <button
            className="pane-invite-button"
            disabled={
              // ✅ cap: max 2 invitees (excluding main character)
              (participants?.length || 1) - 1 >= 2 ||
              // no cached suggestion to quick-invite
              !(lastSuggestionRef.current && lastSuggestionRef.current.keys?.length)
            }
            onClick={() => {
              const cached = lastSuggestionRef.current;
              if (cached?.keys?.length) {
                // ✅ quick-invite the first suggestion key
                onInvite(cached.keys[0]);
              } else {
                // fallback: open your existing pane (if you have one)
                setInvitePaneOpen?.(true);
              }
            }}
          >
            Invite Expert
          </button>
        </div>
      )}
      
      
      <div className="chat-window">
        {/* Conditional Header - Only show if FloatingAvatar is disabled */}
        {!useFloatingAvatar && (
          <header className="chat-header">
            <div className="header-title-group">
              <img
                src={`/images/${character}.jpg`}
                alt={displayName}
                className={`header-avatar ${emotionState ? `emotion-${emotionState} emotion-animate` : ''}`}
                onError={(e) => {
                  e.target.src = '/images/default-character.jpg';
                }}
             />
              <h2 className="chat-title">{displayName}</h2>
              {participants.length > 1 && (
                <div className="participants-badge">
                  +{participants.length - 1}
                </div>
              )}
            </div>

            {/* ✅ ADD HEADER USAGE INDICATOR */}
            {usageTracking.isCustomCharacter && (
              <div className="usage-header-container">
                <HeaderUsageIndicator 
                  usage={usageTracking.usage}
                  isCustomCharacter={usageTracking.isCustomCharacter}
                  onUpgradeClick={() => {
                    // TODO: Open upgrade modal
                  }}
                />
              </div>
            )}
            
            <div className="header-controls">
              <button onClick={onBack} className="back-button" title="Back">
                <ArrowLeft size={20} />
              </button>
            </div>
          </header>
        )}

        {/* Chat History - Adjust top padding when FloatingAvatar is active */}
        <div className={`chat-history ${useFloatingAvatar ? 'with-floating-avatar' : ''} ${prestigeHubVisible ? 'with-prestige-overlay' : ''}`}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                ref={listRef}
                height={height}
                width={width}
                itemCount={chatHistory.length}
                itemSize={getSize}
                onScroll={smartHandleScroll}
                itemData={{
                  chatHistory,
                  sizeMap,
                  setSize,
                  startEditing,
                  editingIndex,
                  editText,
                  onEditChange: setEditText,
                  cancelInlineEdit,
                  sendEdited,
                  retry,
                  character,
                  displayName,
                  userAvatar,
                  onInvite,
                  isSending,
                  participants,
                  userCharacters,
                  discoveredCharacters,
                  showToast,
                  getCharacterDisplayName,  // ADD THIS LINE
                  userId: user?.id
                  
                }}
                overscanCount={3}
              >
                {ChatItem}
              </List>
            )}
          </AutoSizer>
        </div>

        <footer className="chat-input">
          {/* ✅ ADD USAGE WARNING ABOVE INPUT */}
          {usageTracking.showWarning && usageTracking.isCustomCharacter && (
            <div className="usage-warning-container">
              <ChatUsageIndicator 
                usage={usageTracking.usage}
                isCustomCharacter={usageTracking.isCustomCharacter}
                showWarning={usageTracking.showWarning}
                warningMessage={usageTracking.warningMessage}
                onUpgradeClick={() => {
                  // TODO: Open upgrade modal
                }}
              />
            </div>
          )}
          {/* WRAP InputArea with defensive wrapper */}
          <DefensiveChatInputWrapper
            character={character}
            user_id={user?.id}
            onUpgradePrompt={() => {
              // Handle upgrade prompt - you can use existing upgrade flow
              setShowUpgradeFlow('message_limit');
            }}
          >
            <InputArea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onSend={isSending ? stopStream : sendMessage}
              onStop={stopStream}
              isSending={isSending}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </DefensiveChatInputWrapper>
        </footer>
        <div className="chat-footer-note">
          AI-generated characters, for reference only
        </div>
        <ContextPanel />
      </div>
      {/* ── Feed panel ── */}
      <ChatFeedPanel
        isOpen={feedOpen}
        onToggle={() => setFeedOpen(prev => !prev)}
        isAuthenticated={!!user}
        onCharacterClick={onCharacterSelect}
      />

      {/* ── Floating Scroll Button — INSIDE .chat-window ── */}
      <FloatingScrollButton
        visible={!isNearBottom && chatHistory.length > 0}
        hasNewMessages={hasNewMessages || newMessageCount > 0}
        messageCount={newMessageCount}
        onClick={handleScrollToBottomClick}
        position="bottom-right"
        isMobile={isMobile}
      />
      {/* Add this near the end of your component, before closing div */}
      <DualPathUpgradeSystem
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        triggerReason={upgradeReason}
        currentUsage={usageTracking.usage}
      />
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 14,
            zIndex: 4000
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}