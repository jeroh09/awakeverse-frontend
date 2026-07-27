// src/ChatApp.js
// ✅ PHASE 3 STEP 5: Syncs selectedCharacterKey to AppViewContext.activeChatCharacter
// ✅ ONBOARDING: Gate for new users + overlay via sidebar "Get Started"
// ✅ CTRL+A: Global launcher overlay — opens from any view, Escape or button to dismiss

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
import PodcastStudioPage from './components/PodcastStudio/PodcastStudioPage';
import FilmMode from './components/Film/FilmMode';
import OnboardingFlow, { isOnboardingComplete } from './components/Onboarding/OnboardingFlow';
import './components/LauncherOverlay/LauncherOverlay.css';
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

// ─── Defensive check: is the user typing in a field? ─────────────────────────
// If yes, Ctrl+A should select text normally — we don't intercept
function isTypingInField() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  if (el.isContentEditable) return true;
  return false;
}

export default function ChatApp() {
  const {
    currentView,
    VIEW_STATES,
    switchView,
    addDiscoveredCharacter,
    discoveredCharacters,
    activeChatCharacter,
    setActiveChatCharacter,
    activePodcastContext,
    setActivePodcastContext
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

  // ─── Onboarding state ────────────────────────────────────────────────────
  const [onboardingComplete, setOnboardingComplete] = useState(() => isOnboardingComplete());
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Listen for sidebar "Get Started" click
  useEffect(() => {
    const handler = () => setShowOnboarding(true);
    window.addEventListener('awakeverse:open-onboarding', handler);
    return () => window.removeEventListener('awakeverse:open-onboarding', handler);
  }, []);

  const handleOnboardingComplete = useCallback((path) => {
    setOnboardingComplete(true);
    setShowOnboarding(false);
    switch (path) {
      case 'discover':   switchView(VIEW_STATES.MARKET_HUB);  break;
      case 'story':      switchView(VIEW_STATES.STORY_MODE);   break;
      case 'workspace':  switchView(VIEW_STATES.VERSE_STUDIO); break;
      case 'create':     // Intentional: create path → chat launcher
      default:           // Catches 'skip', escape, and any unknown path
        setSelectedCharacterKey(null);
        switchView(VIEW_STATES.CHAT);
        break;
    }
  }, [switchView, VIEW_STATES, setSelectedCharacterKey]);

  // ─── Launcher overlay state ───────────────────────────────────────────────
  const [launcherOverlayOpen, setLauncherOverlayOpen] = useState(false);
  const [overlayClosing, setOverlayClosing] = useState(false);

  // Smooth close — plays exit animation then unmounts
  const closeLauncherOverlay = useCallback(() => {
    setOverlayClosing(true);
    setTimeout(() => {
      setLauncherOverlayOpen(false);
      setOverlayClosing(false);
    }, 200);
  }, []);

  const openLauncherOverlay = useCallback(() => {
    setLauncherOverlayOpen(true);
  }, []);

  // ─── Global Ctrl+A listener ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only fire on Ctrl+A (not Cmd+A on Mac — that's select all, leave it alone)
      if (!e.ctrlKey || e.key !== 'a') return;

      // DEFENSIVE: don't intercept when typing in a field
      if (isTypingInField()) return;

      // DEFENSIVE: don't intercept when onboarding is showing
      if (showOnboarding || !onboardingComplete) return;

      e.preventDefault(); // Prevent browser's select-all

      // Toggle: open if closed, close if open
      if (launcherOverlayOpen) {
        closeLauncherOverlay();
      } else {
        openLauncherOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    launcherOverlayOpen,
    showOnboarding,
    onboardingComplete,
    openLauncherOverlay,
    closeLauncherOverlay
  ]);

  // Escape key closes overlay
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && launcherOverlayOpen) {
        closeLauncherOverlay();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [launcherOverlayOpen, closeLauncherOverlay]);

  // Listen for mobile trigger from Header showButton
  useEffect(() => {
    const handler = () => {
      if (launcherOverlayOpen) {
        closeLauncherOverlay();
      } else {
        openLauncherOverlay();
      }
    };
    window.addEventListener('awakeverse:toggle-launcher', handler);
    return () => window.removeEventListener('awakeverse:toggle-launcher', handler);
  }, [launcherOverlayOpen, openLauncherOverlay, closeLauncherOverlay]);

  // When a chat starts from the overlay — start chat AND close overlay
  const handleStartChatFromOverlay = useCallback((key) => {
    closeLauncherOverlay();
    handleCharacterSelection(key, 'overlay');
  }, [closeLauncherOverlay]); // handleCharacterSelection added below via ref pattern

  // ─── Character / session state ────────────────────────────────────────────
  const { userCharacters } = usePremiumCharacters();
  const featuredResult = useFeaturedCharacters({ enabled: true });
  const leaderboardResult = useLeaderboard({ period: 'week', limit: 5 });

  const [sessionsByCharacter, setSessionsByCharacter] = useState({});
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [targetMessage] = useState(null);
  const [useFloatingHub, setUseFloatingHub] = useState(true);
  const [isHubVisible, setIsHubVisible] = useState(true);
  const [prestigeHubVisible, setPrestigeHubVisible] = useState(false);
  const [marketHubScenario, setMarketHubScenario] = useState(null);

  useEffect(() => {
    setActiveChatCharacter(selectedCharacterKey);
  }, [selectedCharacterKey, setActiveChatCharacter]);

  const handleBackToLauncher = useCallback(() => {
    setSelectedCharacterKey(null);
    setPreviewCharacterKey(null);
    setPrestigeHubVisible(false);
    switchView(VIEW_STATES.CHAT);
    if (window.location.hash !== '#launcher') {
      window.history.replaceState({ isAppRoot: true, view: 'launcher' }, '', '/app#launcher');
    }
  }, [setSelectedCharacterKey, setPreviewCharacterKey, switchView, VIEW_STATES]);

  const handleCharacterSelection = useCallback((key, source = 'direct') => {
    setSelectedCharacterKey(key);
    setPreviewCharacterKey(null);
    setPrestigeHubVisible(false);
    switchView(VIEW_STATES.CHAT);
    window.history.pushState(
      { isAppRoot: true, view: 'chat', character: key },
      '',
      `/app#chat/${key}`
    );
  }, [setSelectedCharacterKey, setPreviewCharacterKey, switchView, VIEW_STATES]);

  // Wire overlay start chat now that handleCharacterSelection is defined
  const handleStartChatFromOverlayFinal = useCallback((key) => {
    closeLauncherOverlay();
    handleCharacterSelection(key, 'overlay');
  }, [closeLauncherOverlay, handleCharacterSelection]);

  const handleMarketHubCharacterSelect = useCallback((character) => {
    addDiscoveredCharacter(character);
    handleCharacterSelection(character.character_key, 'market_hub');
  }, [addDiscoveredCharacter, handleCharacterSelection]);

  const handleMarketHubStartChat = useCallback((character) => {
    const characterKey = typeof character === 'string' ? character : character.character_key;
    if (!characterKey) return;
    if (typeof character !== 'string') addDiscoveredCharacter(character);
    handleCharacterSelection(characterKey, 'market_hub_chat');
  }, [handleCharacterSelection, addDiscoveredCharacter]);

  const handleMarketHubScenarioSelect = useCallback((scenario) => {
    if (!scenario || !scenario.debateId || !scenario.scenarioId) return;
    setMarketHubScenario(scenario);
    switchView(VIEW_STATES.SCENARIOS);
  }, [switchView, VIEW_STATES.SCENARIOS]);

  const handleMarketHubScenarioClosed = useCallback(() => {
    setMarketHubScenario(null);
  }, []);

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
    setPrestigeHubVisible(v => !v);
  }, [prestigeHubVisible]);

  const handleSidebarSelect = useCallback((key) => {
    setPreviewCharacterKey(key);
  }, [setPreviewCharacterKey]);

  const isMobile = useMediaQuery(600);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleConnect = () => console.log('[ChatApp] WebSocket connected:', socket.id);
    const handleMessage = () => {};
    socket.on('connect', handleConnect);
    socket.on('message', handleMessage);
    return () => {
      socket.off('connect', handleConnect);
      socket.off('message', handleMessage);
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
      if (sess?.messages) sess.messages.sort((a, b) => a.ts - b.ts);
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
            inviteSess = { id: participant, messages: [], participants: [], created_at: null };
          }
          if (inviteSess.messages) inviteSess.messages.sort((a, b) => a.ts - b.ts);
          setSessionsByCharacter(prev => ({ ...prev, [participant]: inviteSess }));
        }
      }
    })();
  }, [selectedCharacterKey, user, currentSessionId]);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1);
      if (!hash || !hash.startsWith('chat/')) {
      // Browser back reached the launcher state
        handleBackToLauncher();
      } else {
      // Browser back reached a different chat
        const key = hash.replace('chat/', '');
        setSelectedCharacterKey(key);
        switchView(VIEW_STATES.CHAT);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleBackToLauncher, setSelectedCharacterKey, switchView]);

  const handleStartChat = useCallback((key) => {
    handleCharacterSelection(key, 'start_chat');
  }, [handleCharacterSelection]);

  const handleNewMessage = async (charKey, text) => {
    const sess = sessionsByCharacter[charKey];
    if (!sess) return;
    setSessionsByCharacter(prev => ({
      ...prev,
      [charKey]: {
        ...prev[charKey],
        messages: [...(prev[charKey].messages || []), { user: true, text, ts: Date.now() }]
      }
    }));
    await api.post(`/sessions/${charKey}/${sess.id}`, { text });
  };

  const charactersMap = useMemo(() => {
    const map = characterCategories.reduce((acc, cat) => {
      cat.characters.forEach(c => (acc[c.key] = c.name));
      return acc;
    }, {});
    if (userCharacters && Array.isArray(userCharacters)) {
      userCharacters
        .filter(char => char && char.status === 'approved')
        .forEach(char => {
          if (char.character_key && char.display_name) map[char.character_key] = char.display_name;
        });
    }
    discoveredCharacters.forEach(char => {
      if (char.character_key && char.display_name) map[char.character_key] = char.display_name;
    });
    return map;
  }, [userCharacters, discoveredCharacters]);

  // ─── New user gate ────────────────────────────────────────────────────────
  if (!onboardingComplete) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <Header />
      <StripeSuccessHandler />

      {/* ── Onboarding overlay (Get Started from sidebar) ── */}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      {/* ── Ctrl+A Launcher overlay ─────────────────────── */}
      {launcherOverlayOpen && (
        <div className={`launcher-overlay ${overlayClosing ? 'launcher-overlay--closing' : ''}`}>
          {/* Indigo indicator bar — signals overlay mode */}
          <div className="launcher-overlay__indicator" />

          {/* Dismiss button */}
          <button
            className="launcher-overlay__close"
            onClick={closeLauncherOverlay}
            aria-label="Close launcher"
          >
            <span>Close</span>
            <span className="launcher-overlay__close-kbd">Esc</span>
          </button>

          {/* ChatLauncherPage — rendered exactly as normal */}
          <ChatLauncherPage
            onStartChat={handleStartChatFromOverlayFinal}
            discoveredCharacters={discoveredCharacters}
          />
        </div>
      )}

      {/* ── Floating character hub ───────────────────────── */}
      {selectedCharacterKey && useFloatingHub && currentView === VIEW_STATES.CHAT && (
        <FloatingCharacterHub
          current={selectedCharacterKey}
          onSelect={handleSidebarSelect}
          enabled={isHubVisible}
          onPrestigeHubToggle={togglePrestigeHub}
          prestigeHubVisible={prestigeHubVisible}
        />
      )}

      {/* ── Views ────────────────────────────────────────── */}
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
                  onCharacterSelect={handleMarketHubStartChat}
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

      {currentView === VIEW_STATES.CREATOR_DASHBOARD && <CreatorDashboard />}

      {currentView === VIEW_STATES.SCENARIOS && (
        <div className="scenarios-view-container">
          <ScenariosTab
            marketHubScenario={marketHubScenario}
            onMarketHubScenarioClosed={handleMarketHubScenarioClosed}
          />
        </div>
      )}

      {currentView === VIEW_STATES.STORY_MODE && (
        <div className="story-mode-view-container">
          <StoryModeTab />
        </div>
      )}

      {currentView === VIEW_STATES.VERSE_STUDIO && (
        <div className="verse-workspace-view-container">
          <VerseStudioTab />
        </div>
      )}

      {currentView === VIEW_STATES.PODCAST_STUDIO && (
        <PodcastStudioPage
          context={activePodcastContext}
          onClose={() => switchView(VIEW_STATES.CHAT)}
        />
      )}

      {currentView === VIEW_STATES.FILM && (
        <div className="film-mode-view-container">
          <FilmMode />
        </div>
      )}

      {previewCharacterKey && (
        <CharacterDetailPanel
          character={characterCategories.flatMap(c => c.characters).find(c => c.key === previewCharacterKey)}
          onClose={() => setPreviewCharacterKey(null)}
          onStartChat={() => handleCharacterSelection(previewCharacterKey, 'preview_start')}
        />
      )}
    </div>
  );
}