// src/ChatApp.js - Enhanced with Custom Character Display Names
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from './contexts/WebSocketContext';
import { useCharacter } from './contexts/CharacterContext';
import { useAuth } from './contexts/AuthContext';
import { useUser } from './contexts/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import Header from './components/Header/Header';
import ChatLauncherPage from './components/ChatLauncherPage';
import ChatWindow from './components/ChatWindow';
import CharacterDetailPanel from './components/CharacterDetailPanel/CharacterDetailPanel';
import FloatingCharacterHub from './components/FloatingCharacterHub/FloatingCharacterHub';
import { characterCategories } from './data/characterCategories';
import usePremiumCharacters from './hooks/usePremiumCharacters'; // NEW: Import custom character hook
import './styles.css';

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

export default function ChatApp() {
  const {
    selectedCharacterKey,
    setSelectedCharacterKey,
    previewCharacterKey,
    setPreviewCharacterKey
  } = useCharacter();
  const { token } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // NEW: Get custom character data for display names
  const { userCharacters, loading: customCharactersLoading } = usePremiumCharacters();
  window.debugUserChars = userCharacters;

  const [sessionsByCharacter, setSessionsByCharacter] = useState({});
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [targetMessage] = useState(null);
  const [useFloatingHub, setUseFloatingHub] = useState(true);
  const [isHubVisible, setIsHubVisible] = useState(true);
  const [prestigeHubVisible, setPrestigeHubVisible] = useState(false);

  // History-safe back navigation
  const handleBackToLauncher = useCallback(() => {
    setSelectedCharacterKey(null);
    setPreviewCharacterKey(null);
    setPrestigeHubVisible(false);
    
    // Don't use navigate() here - just update internal state
    // This keeps us within the /app route and prevents history pollution
    
    // Optional: Update URL fragment for better UX without affecting history
    if (window.location.hash !== '#launcher') {
      window.history.replaceState(
        { isAppRoot: true, view: 'launcher' }, 
        '', 
        '/app#launcher'
      );
    }
  }, [setSelectedCharacterKey, setPreviewCharacterKey]);

  // History-safe character selection
  const handleCharacterSelection = useCallback((key, source = 'direct') => {
    console.log(`Character selected: ${key} (source: ${source})`);
    
    setSelectedCharacterKey(key);
    setPreviewCharacterKey(null);
    setPrestigeHubVisible(false);
    
    // Update URL fragment without affecting browser history
    window.history.replaceState(
      { isAppRoot: true, view: 'chat', character: key }, 
      '', 
      `/app#chat/${key}`
    );
  }, [setSelectedCharacterKey, setPreviewCharacterKey]);

  // Initialize app state from URL on load
  useEffect(() => {
    if (!token) return;
    
    // Parse initial state from URL hash
    const hash = window.location.hash.slice(1); // Remove #
    
    if (hash.startsWith('chat/')) {
      const characterKey = hash.replace('chat/', '');
      if (characterKey && characterCategories.some(cat => 
        cat.characters.some(char => char.key === characterKey)
      )) {
        setSelectedCharacterKey(characterKey);
      }
    }
    
    // Ensure we have the app root marker
    if (!window.history.state?.isAppRoot) {
      window.history.replaceState({ isAppRoot: true }, '', '/app');
    }
  }, [token, setSelectedCharacterKey]);

  const togglePrestigeHub = useCallback(() => {
    console.log('ChatApp togglePrestigeHub called, current state:', prestigeHubVisible);
    setPrestigeHubVisible(v => {
      console.log('PrestigeHub state changing from', v, 'to', !v);
      return !v;
    });
  }, [prestigeHubVisible]);

  const handleSidebarSelect = useCallback((key) => {
    if (useFloatingHub) {
      setPreviewCharacterKey(key);
    } else {
      setPreviewCharacterKey(key);
    }
  }, [setPreviewCharacterKey, useFloatingHub]);

  const handleDirectCharacterSwitch = useCallback((key) => {
    handleCharacterSelection(key, 'direct_switch');
  }, [handleCharacterSelection]);

  const isMobile = useMediaQuery(600);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log("[ChatApp] WebSocket connected:", socket.id);
    };

    const handleMessage = (msg) => {
      console.log("[ChatApp] Message:", msg);
    };

    socket.on("connect", handleConnect);
    socket.on("message", handleMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("message", handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    const key = selectedCharacterKey;
    if (!key || !token) return;
    (async () => {
      let list = [];
      try {
        const r = await api.get(`/sessions/${key}?thread_id=${currentSessionId || 'main'}`);
        list = r.data || [];
      } catch {}

      let sess = list.length ? list[0] : null;
      if (!sess || !sess.messages || !sess.messages.length) {
        const res2 = await api.post('/sessions', { characterKey: key });
        sess = res2.data;
        console.log("Created session:", sess);
        setCurrentSessionId(sess.id);
      }

      if (sess?.messages) {
        sess.messages.sort((a, b) => a.ts - b.ts);
      }

      setSessionsByCharacter(prev => ({ ...prev, [key]: sess }));
      setCurrentSessionId(sess.id);

      if (Array.isArray(sess.participants)) {
        for (const participant of sess.participants) {
          if (participant === key) continue;

          let inviteList = [];
          try {
            const r = await api.get(`/sessions/${participant}`);
            inviteList = r.data || [];
          } catch {}

          let inviteSess = inviteList.length ? inviteList[0] : null;
          if (!inviteSess) {
            inviteSess = { 
              id: participant, 
              messages: [], 
              participants: [], 
              created_at: null 
            };
          }
          if (inviteSess.messages) {
            inviteSess.messages.sort((a, b) => a.ts - b.ts);
          }
          setSessionsByCharacter(prev => ({ ...prev, [participant]: inviteSess }));
        }
      }
    })();
  }, [selectedCharacterKey, token, currentSessionId]);

  const handleStartChat = useCallback((key) => {
    handleCharacterSelection(key, 'start_chat');
  }, [handleCharacterSelection]);

  const handleClearChat = async (charKey) => {
    const sess = sessionsByCharacter[charKey];
    if (!sess) return;
    await api.post('/session/clear', { character: charKey });
    setSessionsByCharacter(prev => ({
      ...prev,
      [charKey]: { ...prev[charKey], messages: [] }
    }));
  };

  const handleNewChat = async (charKey) => {
    const res = await api.post('/sessions', { characterKey: charKey });
    setSessionsByCharacter(prev => ({
      ...prev,
      [charKey]: res.data
    }));
  };

  const handleNewMessage = async (charKey, text) => {
    const sess = sessionsByCharacter[charKey];
    if (!sess) return;
    setSessionsByCharacter(prev => ({
      ...prev,
      [charKey]: {
        ...prev[charKey],
        messages: [
          ...(prev[charKey].messages || []),
          { user: true, text, ts: Date.now() }
        ]
      }
    }));
    await api.post(`/sessions/${charKey}/${sess.id}`, { text });
  };

  const handleArchive = async (charKey, sid) => {
    await api.delete(`/sessions/${sid}`);
    setSessionsByCharacter(prev => ({
      ...prev,
      [charKey]: prev[charKey].filter(s => s.id !== sid)
    }));
  };

  // ENHANCED: Character display name mapping including custom characters
  const charactersMap = useMemo(() => {
    // Start with static characters from characterCategories
    const map = characterCategories.reduce((acc, cat) => {
      cat.characters.forEach(c => (acc[c.key] = c.name));
      return acc;
    }, {});
    
    // Add custom characters with proper field names and defensive error handling
    try {
      if (userCharacters && Array.isArray(userCharacters)) {
        userCharacters
          .filter(char => char && char.status === 'approved')
          .forEach(char => {
            if (char.character_key && char.display_name) {
              map[char.character_key] = char.display_name;
            }
          });
      }
    } catch (error) {
      console.warn('Failed to load custom character names:', error);
      // Static characters still work, app continues functioning
    }
    
    return map;
  }, [userCharacters]);

  return (
    <div className="app-container">
      <Header />

      {selectedCharacterKey && useFloatingHub && (
        <>
          <FloatingCharacterHub
            current={selectedCharacterKey}
            onSelect={handleSidebarSelect}
            enabled={isHubVisible}
            onPrestigeHubToggle={togglePrestigeHub}
            prestigeHubVisible={prestigeHubVisible}
          />
        </>
      )}

      {/* DEBUG BUTTONS REMOVED - Using inline alerts instead */}

      {!selectedCharacterKey && (
        <ChatLauncherPage onStartChat={handleStartChat} />
      )}
      
      {selectedCharacterKey && (
        <div className="chat-body">
          <div className="chat-window">
            <ChatWindow
              key={currentSessionId}
              character={selectedCharacterKey}
              characterName={charactersMap[selectedCharacterKey]} // Now includes custom characters
              threadId={currentSessionId}
              onBack={handleBackToLauncher}
              session={sessionsByCharacter[selectedCharacterKey]}
              targetMessage={targetMessage}
              onNewMessage={handleNewMessage}
              avatarUrl={user?.avatarUrl ? `${user.avatarUrl}?ts=${Date.now()}` : undefined}
              isHubVisible={isHubVisible}
              onToggleVisibility={() => setIsHubVisible(!isHubVisible)}
              prestigeHubVisible={prestigeHubVisible}
              onPrestigeHubToggle={togglePrestigeHub}
            />
          </div>
        </div>
      )}

      {previewCharacterKey && (
        <CharacterDetailPanel
          character={
            characterCategories.flatMap(c => c.characters).find(c => c.key === previewCharacterKey)
          }
          onClose={() => setPreviewCharacterKey(null)}
          onStartChat={() => handleCharacterSelection(previewCharacterKey, 'preview_start')}
        />
      )}
    </div>
  );
}