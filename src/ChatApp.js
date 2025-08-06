// src/ChatApp.js - ChatSidebar COMPLETELY REMOVED
import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from './contexts/WebSocketContext';
import { useCharacter } from './contexts/CharacterContext';
import { useAuth } from './contexts/AuthContext';
import { useUser } from './contexts/UserContext';
import api from './api';
import Header from './components/Header/Header';
import ChatLauncherPage from './components/ChatLauncherPage';
// ❌ REMOVED: import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import CharacterDetailPanel from './components/CharacterDetailPanel/CharacterDetailPanel';
import FloatingCharacterHub from './components/FloatingCharacterHub/FloatingCharacterHub';
import { characterCategories } from './data/characterCategories';
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

  const [sessionsByCharacter, setSessionsByCharacter] = useState({});
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [targetMessage] = useState(null);
  // ❌ REMOVED: const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [useFloatingHub, setUseFloatingHub] = useState(true);
  const [isHubVisible, setIsHubVisible] = useState(true);
  
  // ✅ RESTORED: PrestigeHub state
  const [prestigeHubVisible, setPrestigeHubVisible] = useState(false);

  // ❌ REMOVED: toggleSidebar function since no sidebar

  // ✅ RESTORED: PrestigeHub toggle function
  const togglePrestigeHub = useCallback(() => {
    console.log('🎯 ChatApp togglePrestigeHub called, current state:', prestigeHubVisible);
    setPrestigeHubVisible(v => {
      console.log('🔄 PrestigeHub state changing from', v, 'to', !v);
      return !v;
    });
  }, [prestigeHubVisible]);

  const handleSidebarSelect = useCallback((key) => {
    if (useFloatingHub) {
      setPreviewCharacterKey(key);
    } else {
      setPreviewCharacterKey(key);
      // ❌ REMOVED: setIsSidebarOpen(false);
    }
  }, [setPreviewCharacterKey, useFloatingHub]);

  const handleDirectCharacterSwitch = useCallback((key) => {
    console.log('🔄 Switching to character:', key);
    setSelectedCharacterKey(key);
    setPreviewCharacterKey(null);
    // ❌ REMOVED: setIsSidebarOpen(false);
    setPrestigeHubVisible(false); // ✅ RESTORED: Close PrestigeHub on character switch
  }, [setSelectedCharacterKey, setPreviewCharacterKey]);

  const isMobile = useMediaQuery(600);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log("🔗 [ChatApp] WebSocket connected:", socket.id);
    };

    const handleMessage = (msg) => {
      console.log("📨 [ChatApp] Message:", msg);
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
        console.log("🆕 Created session:", sess);
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
    handleDirectCharacterSwitch(key);
  }, [handleDirectCharacterSwitch]);

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

  const charactersMap = characterCategories.reduce((map, cat) => {
    cat.characters.forEach(c => (map[c.key] = c.name));
    return map;
  }, {});

  return (
    <div className="app-container">
      <Header />

      {/* ✅ RESTORED: FloatingCharacterHub with PrestigeHub integration */}
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

      {!selectedCharacterKey && (
        <ChatLauncherPage onStartChat={handleStartChat} />
      )}
      
      {selectedCharacterKey && (
        <div className="chat-body">
          {/* ❌ REMOVED: ChatSidebar component entirely */}

          <div className="chat-window">
            <ChatWindow
              key={currentSessionId}
              character={selectedCharacterKey}
              characterName={charactersMap[selectedCharacterKey]}
              threadId={currentSessionId}
              onBack={() => setSelectedCharacterKey(null)}
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
          onStartChat={() => handleDirectCharacterSwitch(previewCharacterKey)}
        />
      )}
    </div>
  );
}