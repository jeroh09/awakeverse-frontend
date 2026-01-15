// src/ChatApp.js - Enhanced with Stripe Success Handler (No Reload)
// ✅ PHASE 3 STEP 5: Syncs selectedCharacterKey to AppViewContext.activeChatCharacter
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from './contexts/WebSocketContext';
import { useCharacter } from './contexts/CharacterContext';
import { useUser } from './contexts/UserContext';
import { useAppView } from './contexts/AppViewContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import Header from './components/Header/Header';
import ChatLauncherPage from './components/ChatLauncherPage';
import ChatWindow from './components/ChatWindow';
import CharacterDetailPanel from './components/CharacterDetailPanel/CharacterDetailPanel';
import FloatingCharacterHub from './components/FloatingCharacterHub/FloatingCharacterHub';
import MarketHubPage from './components/MarketHub/MarketHubPage';
import { characterCategories } from './data/characterCategories';
import usePremiumCharacters from './hooks/usePremiumCharacters';
import { useFeaturedCharacters } from './hooks/useFeaturedCharacters';
import { useLeaderboard } from './hooks/useLeaderboard';
import CreatorDashboard from './components/CreatorHub/CreatorDashboard';
import ScenariosTab from './components/ScenariosTab/index';
import StoryModeTab from './components/StoryMode/index';
import { useSearchParams } from 'react-router-dom';
import StripeSuccessHandler from './components/StripeSuccessHandler';
import VerseStudioTab from './components/VerseStudio/VerseStudioTab';
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
  // Get view context
  // ✅ NEW: Added activeChatCharacter and setActiveChatCharacter
  const { 
    currentView, 
    VIEW_STATES, 
    switchView, 
    addDiscoveredCharacter,
    discoveredCharacters,
    activeChatCharacter,
    setActiveChatCharacter
  } = useAppView();

  const {
    selectedCharacterKey,
    setSelectedCharacterKey,
    previewCharacterKey,
    setPreviewCharacterKey
  } = useCharacter();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Get custom character data for display names
  const { userCharacters, loading: customCharactersLoading } = usePremiumCharacters();

  // Testing hooks - Remove after testing
  const featuredResult = useFeaturedCharacters({ enabled: true });
  const leaderboardResult = useLeaderboard({ period: 'week', limit: 5 });

  const [sessionsByCharacter, setSessionsByCharacter] = useState({});
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [targetMessage] = useState(null);
  const [useFloatingHub, setUseFloatingHub] = useState(true);
  const [isHubVisible, setIsHubVisible] = useState(true);
  const [prestigeHubVisible, setPrestigeHubVisible] = useState(false);
  const [marketHubScenario, setMarketHubScenario] = useState(null);

  // ✅ NEW: Sync selectedCharacterKey to AppViewContext
  // This allows Header and other components to know when we're in an active chat
  useEffect(() => {
    // Sync character selection to context
    setActiveChatCharacter(selectedCharacterKey);
    
    // Log for debugging
    if (selectedCharacterKey) {
      console.log('💬 Active chat character set:', selectedCharacterKey);
    } else {
      console.log('💬 Returned to chat launcher (no active character)');
    }
  }, [selectedCharacterKey, setActiveChatCharacter]);

  // History-safe back navigation
  const handleBackToLauncher = useCallback(() => {
    setSelectedCharacterKey(null);
    setPreviewCharacterKey(null);
    setPrestigeHubVisible(false);
    
    // Switch to chat view when going back to launcher
    switchView(VIEW_STATES.CHAT);
    
    if (window.location.hash !== '#launcher') {
      window.history.replaceState(
        { isAppRoot: true, view: 'launcher' }, 
        '', 
        '/app#launcher'
      );
    }
  }, [setSelectedCharacterKey, setPreviewCharacterKey, switchView, VIEW_STATES]);

  // History-safe character selection
  const handleCharacterSelection = useCallback((key, source = 'direct') => { 
    setSelectedCharacterKey(key);
    setPreviewCharacterKey(null);
    setPrestigeHubVisible(false);
    
    // Switch to chat view when character is selected
    switchView(VIEW_STATES.CHAT);
    
    window.history.replaceState(
      { isAppRoot: true, view: 'chat', character: key }, 
      '', 
      `/app#chat/${key}`
    );
  }, [setSelectedCharacterKey, setPreviewCharacterKey, switchView, VIEW_STATES]);

  // Handle character selection from Market Hub
  const handleMarketHubCharacterSelect = useCallback((character) => {
    // Add to discovered characters list
    addDiscoveredCharacter(character);
    
    // Start chat with this character
    handleCharacterSelection(character.character_key, 'market_hub');
  }, [addDiscoveredCharacter, handleCharacterSelection]);

  // SIMPLEST FIX: Just use the same function for both actions
  const handleMarketHubStartChat = useCallback((character) => {
    console.log('🔄 Market Hub start chat with:', character);

    // Extract character key whether we get object or string
    const characterKey = typeof character === 'string' ? character : character.character_key;

    if (!characterKey) {
      console.error('❌ No character key found:', character);
      return;
    }

    // If we have the full character object, add it to discovered
    if (typeof character !== 'string') {
      console.log('✅ Auto-adding to discovered:', character.display_name);
      addDiscoveredCharacter(character);
    }

    // Start the chat
    handleCharacterSelection(characterKey, 'market_hub_chat');
  }, [handleCharacterSelection, addDiscoveredCharacter]);
  
  // Handle scenario selection from Market Hub (for debates)
  const handleMarketHubScenarioSelect = useCallback((scenario) => {
    console.log('🌍 Market Hub scenario selected:', scenario);
    
    if (!scenario || !scenario.debateId || !scenario.scenarioId) {
      console.error('❌ Invalid scenario data:', scenario);
      return;
    }

    console.log('🔄 Switching to Scenarios view with Market Hub scenario');
    
    // Store the scenario to pass to ScenariosTab
    setMarketHubScenario(scenario);
    
    // Switch to scenarios view
    switchView(VIEW_STATES.SCENARIOS);
    
    console.log('✅ View switched to SCENARIOS, scenario ready to open');
  }, [switchView, VIEW_STATES.SCENARIOS]);

  // Clear Market Hub scenario when chat closes
  const handleMarketHubScenarioClosed = useCallback(() => {
    console.log('🔄 Clearing Market Hub scenario');
    setMarketHubScenario(null);
  }, []);

  // Initialize app state from URL on load
  useEffect(() => {
    if (!user) return;
    
    const hash = window.location.hash.slice(1);
    
    if (hash.startsWith('chat/')) {
      const characterKey = hash.replace('chat/', '');
      if (characterKey && characterCategories.some(cat => 
        cat.characters.some(char => char.key === characterKey)
      )) {
        setSelectedCharacterKey(characterKey);
        switchView(VIEW_STATES.CHAT);
      }
    }
    
    if (!window.history.state?.isAppRoot) {
      window.history.replaceState({ isAppRoot: true }, '', '/app');
    }
  }, [user, setSelectedCharacterKey, switchView, VIEW_STATES]);

  const togglePrestigeHub = useCallback(() => {
    setPrestigeHubVisible(v => {
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
    if (!key || !user) return;
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
  }, [selectedCharacterKey, user, currentSessionId]);

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

  // Character display name mapping including custom characters
  const charactersMap = useMemo(() => {
    const map = characterCategories.reduce((acc, cat) => {
      cat.characters.forEach(c => (acc[c.key] = c.name));
      return acc;
    }, {});

    // Add user's custom characters
    if (userCharacters && Array.isArray(userCharacters)) {
      userCharacters
        .filter(char => char && char.status === 'approved')
        .forEach(char => {
          if (char.character_key && char.display_name) {
            map[char.character_key] = char.display_name;
          }
        });
    }

    discoveredCharacters.forEach(char => {
      if (char.character_key && char.display_name) {
        map[char.character_key] = char.display_name;
      }
    });
    return map;
  }, [userCharacters, discoveredCharacters]);

  return (
    <div className="app-container">
      <Header />
      
      {/* Stripe Success Handler - Processes payments without page reload */}
      <StripeSuccessHandler />
      
      {selectedCharacterKey && useFloatingHub && currentView === VIEW_STATES.CHAT && (
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

      {/* Conditional rendering based on current view */}
      {currentView === VIEW_STATES.CHAT && (
        <>
          {!selectedCharacterKey && (
            <ChatLauncherPage 
              onStartChat={handleStartChat}
              discoveredCharacters={discoveredCharacters}
            />
          )}
          
          {selectedCharacterKey && (
            <div className="chat-body">
              <div className="chat-window">
                <ChatWindow
                  key={currentSessionId}
                  character={selectedCharacterKey}
                  characterName={charactersMap[selectedCharacterKey] || selectedCharacterKey}
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
                  discoveredCharacters={discoveredCharacters}
                />
              </div>
            </div>
          )}
        </>
      )}

      {currentView === VIEW_STATES.MARKET_HUB && (
        <div>
          <MarketHubPage 
            onCharacterSelect={handleMarketHubCharacterSelect}
            onStartChat={handleMarketHubStartChat}
            onScenarioSelect={handleMarketHubScenarioSelect}
            isViewMode={true}
          />
        </div>
      )}

      {/* Creator Dashboard view */}
      {currentView === VIEW_STATES.CREATOR_DASHBOARD && (
        <CreatorDashboard />
      )}

      {currentView === VIEW_STATES.SCENARIOS && (
        <div className="scenarios-view-container">
          <ScenariosTab 
            marketHubScenario={marketHubScenario}
            onMarketHubScenarioClosed={handleMarketHubScenarioClosed} 
          />
        </div>
      )}

      {/* ✅ ADD THIS: Story Mode View */}
      {currentView === VIEW_STATES.STORY_MODE && (
        <div className="story-mode-view-container">
          <StoryModeTab />
        </div>
      )}
      {/* Verse Workspace (Verse Studio) view */}
      {currentView === VIEW_STATES.VERSE_STUDIO && (
        <div className="verse-workspace-view-container">
          <VerseStudioTab />
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