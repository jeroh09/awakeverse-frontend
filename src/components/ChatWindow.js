// Updated ChatWindow.js - ChatSidebar COMPLETELY REMOVED
import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useSocket } from '../contexts/WebSocketContext';
import { ArrowLeft, Pen, RotateCw, Crown, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { useConversation } from '../hooks/useConversation';
import { CHARACTERS } from '../data/characters';
import ContextPanel from './ContextPanel';
import InputArea from './InputArea';
import FloatingAvatar from './FloatingAvatar/FloatingAvatar';
import PrestigeHub from './PrestigeHub/PrestigeHub';
import '../styles.css';
import '../style/InviteStyles.css';

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
    retry, character, userAvatar, participants
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

  // Helper function to get character display name
  const getCharacterDisplayName = (characterKey) => {
    const char = CHARACTERS[characterKey];
    if (char) {
      return char.display_name || char.name || characterKey.replace(/_/g, ' ');
    }
    return characterKey.replace(/_/g, ' ');
  };

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
    : `/images/${msg.speaker || character}.jpg`;

  // Character label fallback
  const getCharacterInfo = (characterKey) => {
    const char = CHARACTERS[characterKey];
    if (!char) {
      console.warn(`Character "${characterKey}" not found in CHARACTERS`);
      return {
        display_name: characterKey?.replace(/_/g, ' ') || 'Unknown'
      };
    }
    return char;
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
        <img
          src={avatarSrc}
          alt={msg.user
            ? 'You'
            : characterInfo?.display_name || 'AI'}
          className="message-icon"
          onError={(e) => {
            e.target.src = msg.user 
              ? '/images/user-icon.jpg' 
              : '/images/default-character.jpg';
          }}
        />
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
  onPrestigeHubToggle
}) {
  const { token } = useAuth();
  const { user } = useUser();
  const socket = useSocket();
  const isMobile = useMediaQuery(600);

  const localThreadId = useRef(threadId);
  const { sendConversationMessage } = useConversation();
  const userAvatar = avatarUrl || user?.avatarUrl;
  
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
    }, 30000);
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
      }, 30000);
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
    console.log('🎯 Character selected from PrestigeHub:', characterKey);
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
  const controllerRef = useRef(null);
  const sizeMap = useRef({});
  const displayName = characterName || character;
  
  // Row height calculation with invite spacing
  const ROW_GAP = 20;

  const setSize = useCallback((idx, h) => {
    sizeMap.current[idx] = h;
    if (listRef.current) {
      listRef.current.resetAfterIndex(idx);
    }
  }, []);
  
  const getSize = useCallback(idx => (sizeMap.current[idx] || 120) + ROW_GAP, []);

  // Auto-scroll function
  const scrollToBottom = useCallback(() => {
    if (listRef.current && chatHistory.length > 0) {
      requestAnimationFrame(() => {
        listRef.current.resetAfterIndex(0);
        const lastIndex = chatHistory.length - 1;
        listRef.current.scrollToItem(lastIndex, 'end');
        
        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollToItem(lastIndex, 'end');
          }
        }, 100);
      });
    }
  }, [chatHistory.length]);

  // Auto-scroll when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory.length, scrollToBottom]);

  const onInvite = async (invitee) => {
    if (isSending) return;

    const aiIndex = chatHistory.length;

    try {
      // Add invitee to participants immediately
      setParticipants(prev => {
        const newParticipants = prev.includes(invitee) ? prev : [...prev, invitee];
        return newParticipants;
      });

      // Get last user message
      const lastUserMsg = [...chatHistory].reverse().find(m => m.user)?.text;
      if (!lastUserMsg) {
        console.warn('No user message found for invite');
        return;
      }

      setIsSending(true);
      
      // Reserve placeholder bubble
      setChatHistory(prev => [
        ...prev,
        { 
          user: false, 
          speaker: invitee, 
          text: '', 
          error: null, 
          has_invite_suggestion: false 
        }
      ]);

      // Make invite request
      const API = process.env.REACT_APP_API_BASE_URL || '';
      const res = await fetch(`${API}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: character,
          to: invitee,
          message: lastUserMsg,
          thread_id: localThreadId.current
        })
      });
      
      if (!res.ok) {
        throw new Error(`Invite failed (${res.status}): ${res.statusText}`);
      }

      // Stream tokens into the bubble
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n').filter(Boolean)) {
          try {
            const data = JSON.parse(line);
            const token = data.response || '';
            full += token;

            setChatHistory(prev => {
              const copy = [...prev];
              if (copy[aiIndex]) {
                copy[aiIndex] = {
                  ...copy[aiIndex],
                  text: full,
                  speaker: data.speaker || invitee
                };
              }
              return copy;
            });
          } catch (parseError) {
            console.warn('Failed to parse invite response line:', parseError);
          }
        }
      }

    } catch (e) {
      console.error('Invite error:', e);
      setChatHistory(prev => {
        const copy = [...prev];
        if (copy[aiIndex]) {
          copy[aiIndex] = {
            ...copy[aiIndex],
            error: `Failed to load ${invitee} response: ${e.message}`
          };
        }
        return copy;
      });
    } finally {
      setIsSending(false);
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
      if (window.visualViewspot) {
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

  const sendAI = async (userText, aiIndex) => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsSending(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const token = data.response || '';
            fullReply += token;

            if (data.has_invite_suggestion) {
              hasInviteSuggestion = true;
              inviteCandidates = data.invite_candidates || [];
            }

            setChatHistory(prev => {
              const copy = [...prev];
              copy[aiIndex] = {
                ...copy[aiIndex],
                speaker: data.speaker || character,
                text: fullReply,
                has_invite_suggestion: hasInviteSuggestion,
                invite_candidates: inviteCandidates
              };
              return copy;
            });

          } catch (err) {
            console.warn('JSON parse error:', err);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Chat request aborted');
      } else {
        console.error('LLM error:', err);
        setChatHistory(prev => {
          const copy = [...prev];
          if (copy[aiIndex]) {
            copy[aiIndex] = { ...copy[aiIndex], error: `Something went wrong: ${err.message}` };
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
    if (!message.trim() || isSending) return;
    const userText = message;
    setMessage('');
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
          onCharacterSelect={handleCharacterSelect}
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
            onClick={() => onInvite(character, lastUserMsg.thread_id)}
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
          <InputArea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onSend={isSending ? stopStream : sendMessage}
            onStop={stopStream}
            isSending={isSending}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </footer>

        <div className="chat-footer-note">
          AI-generated characters, for reference only
        </div>

        <ContextPanel />
      </div>
    </div>
  );
}