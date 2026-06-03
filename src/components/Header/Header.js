// src/components/Header/Header.js
// ✅ Caveat wordmark (A + V indigo)
// ✅ ONBOARDING: "Get Started" nav item dispatches awakeverse:open-onboarding
// ✅ CTRL+A: showButton on mobile dispatches awakeverse:toggle-launcher instead of re-showing header
// ✅ UPDATED: sidebarTitle wordmark is now a button that opens Oracle chat

import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppView } from '../../contexts/AppViewContext';
import ProfileButton from '../ProfileButton';

// ─── Nav Icons (inline SVG, indigo glow) ─────────────────────────────────────

const ChatIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="chatGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55" />
      </filter>
    </defs>
    <path
      d="M5 6.5C5 5.12 6.12 4 7.5 4h9c1.38 0 2.5 1.12 2.5 2.5v6c0 1.38-1.12 2.5-2.5 2.5H10l-3.5 3v-3H7.5C6.12 15 5 13.88 5 12.5v-6z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      filter="url(#chatGlow)"
    />
  </svg>
);

const DiscoverIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="discoverGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55" />
      </filter>
    </defs>
    <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2" filter="url(#discoverGlow)" />
    <path d="M9 15V12M12 15V9M15 15V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" filter="url(#discoverGlow)" />
  </svg>
);

const StoriesIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="storiesGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55" />
      </filter>
    </defs>
    <path
      d="M7 5h8.5A2.5 2.5 0 0 1 18 7.5V18l-3.5-2L11 18l-4-2.5V7.5A2.5 2.5 0 0 1 9.5 5H11"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      filter="url(#storiesGlow)"
    />
  </svg>
);

const ScenariosIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="scenariosGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55" />
      </filter>
    </defs>
    <path
      d="M12 4c-4 0-7 2-7 6v2c0 4 3 6 7 6s7-2 7-6v-2c0-4-3-6-7-6z"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      filter="url(#scenariosGlow)"
    />
    <path
      d="M9 12c0-1 .8-1.5 1.5-1.5S12 11 12 12M15 12c0-1-.8-1.5-1.5-1.5S12 11 12 12"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      filter="url(#scenariosGlow)"
    />
  </svg>
);

const CreateIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="createGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55" />
      </filter>
    </defs>
    <path d="M12 5v14M5 12h14"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      filter="url(#createGlow)"
    />
  </svg>
);

const WorkspaceIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="workspaceGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55" />
      </filter>
    </defs>
    <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" filter="url(#workspaceGlow)" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" filter="url(#workspaceGlow)" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" filter="url(#workspaceGlow)" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" filter="url(#workspaceGlow)" />
  </svg>
);

const GetStartedIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="getStartedGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55" />
      </filter>
    </defs>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" filter="url(#getStartedGlow)" />
    <path d="M12 8v1M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" filter="url(#getStartedGlow)" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── AwakeVerse wordmark ───────────────────────────────────────────────────────
const AwakeVerseWordmark = ({ className }) => (
  <span className={className}>
    <span style={{ color: '#6366f1' }}>A</span>
    <span style={{ color: '#f5f5dc' }}>wake</span>
    <span style={{ color: '#6366f1' }}>V</span>
    <span style={{ color: '#f5f5dc' }}>erse</span>
  </span>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function Header({ showNavigation = true }) {
  const { user, getSubscriptionInfo } = useUser() || {};
  const { isAuthenticated }           = useAuth() || {};
  const viewContext                   = useAppView();

  const [isSidebarOpen,   setIsSidebarOpen]   = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMobile,        setIsMobile]        = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-hide header after 6 seconds
  useEffect(() => {
    const t = setTimeout(() => setIsHeaderVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const navGroups = [
    { key: 'primary',      label: 'Primary',      items: ['chat', 'discover', 'create'] },
    { key: 'story',        label: 'Story Worlds',  items: ['stories', 'scenarios'] },
    { key: 'productivity', label: 'Productivity',  items: ['workspace'] },
  ];

  const VIEW_STATES = viewContext?.VIEW_STATES || {};

  const itemsByKey = {
    chat:       { key: 'chat',       label: 'Chat',        icon: ChatIcon,       viewState: VIEW_STATES.CHAT },
    discover:   { key: 'discover',   label: 'Discover',    icon: DiscoverIcon,   viewState: VIEW_STATES.MARKET_HUB },
    create:     { key: 'create',     label: 'Create',      icon: CreateIcon,     viewState: VIEW_STATES.CHARACTER_BUILDER },
    stories:    { key: 'stories',    label: 'Stories',     icon: StoriesIcon,    viewState: VIEW_STATES.STORY },
    scenarios:  { key: 'scenarios',  label: 'Dialogues',   icon: ScenariosIcon,  viewState: VIEW_STATES.SCENARIOS },
    workspace:  { key: 'workspace',  label: 'Workspace',   icon: WorkspaceIcon,  viewState: VIEW_STATES.WORKSPACE },
  };

  const handleNavClick = (viewState) => {
    if (!viewContext) return;
    viewContext.switchView(viewState);
    setIsSidebarOpen(false);
  };

  const handleGetStartedClick = () => {
    setIsSidebarOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('awakeverse:open-onboarding'));
    }, 200);
  };

  // ✅ NEW: Oracle trigger — closes sidebar, fires event, ChatLauncherPage listens
  const handleOracleClick = () => {
    setIsSidebarOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('awakeverse:open-oracle-chat'));
    }, 180);
  };

  const toggleSidebar = () => {
    if (!showNavigation) return;
    setIsSidebarOpen((open) => !open);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleShowButtonClick = () => {
    if (isMobile) {
      window.dispatchEvent(new CustomEvent('awakeverse:toggle-launcher'));
    } else {
      setIsHeaderVisible(true);
    }
  };

  const avatarUrlRaw = user?.avatarUrl || user?.avatar_url;
  const avatarUrl =
    avatarUrlRaw && typeof avatarUrlRaw === 'string'
      ? avatarUrlRaw.startsWith('http')
        ? avatarUrlRaw
        : `${API_BASE}${avatarUrlRaw}`
      : null;

  const userInitial =
    user?.display_name?.charAt(0) ||
    user?.displayName?.charAt(0) ||
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    'A';

  const subscriptionInfo   = getSubscriptionInfo ? getSubscriptionInfo() : null;
  const subscriptionLabel  = subscriptionInfo?.display_name || 'Free';
  const subscriptionActive = subscriptionInfo?.is_active || false;

  const isInActiveChatWindow  = viewContext?.activeChatCharacter !== null && viewContext?.activeChatCharacter !== undefined;
  const isInActiveStoryWindow = viewContext?.activeStory !== null && viewContext?.activeStory !== undefined;
  const shouldHideButton = isMobile && (isInActiveChatWindow || isInActiveStoryWindow);

  return (
    <>
      {/* ── Top header bar ─────────────────────────────────── */}
      {isHeaderVisible && (
        <header className={styles.header}>
          <div className={styles.brandShell}>
            <h1 className={styles.title}>
              <AwakeVerseWordmark className={styles.wordmark} />
            </h1>
          </div>
          <div className={styles.userSection}>
            {isAuthenticated && (
              <>
                <div className={styles.avatarShell}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="User avatar"
                      className={styles.avatarImage}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className={styles.avatarFallback}>{userInitial.toUpperCase()}</div>
                  )}
                </div>
                <ProfileButton user={user} />
              </>
            )}
            <button
              className={styles.retractButton}
              onClick={() => setIsHeaderVisible(false)}
              aria-label="Hide header"
            >
              ↑
            </button>
          </div>
        </header>
      )}

      {/* ── Show button (when header hidden) ───────────────── */}
      {!isHeaderVisible && !shouldHideButton && (
        <button
          className={styles.showButton}
          onClick={handleShowButtonClick}
          aria-label={isMobile ? 'Open launcher' : 'Show header'}
        >
          <span className={styles.showButtonText}>
            <AwakeVerseWordmark className={styles.wordmark} />
          </span>
          <ChevronDownIcon className={styles.showButtonIcon} />
        </button>
      )}

      {/* ── Hamburger handle ───────────────────────────────── */}
      {showNavigation && (
        <button
          type="button"
          className={`${styles.sidebarHandle} ${isSidebarOpen ? styles.sidebarHandleOpen : ''}`}
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={styles.handleBar} />
          <span className={styles.handleBar} />
          <span className={styles.handleBar} />
        </button>
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      {showNavigation && (
        <div
          className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.sidebarOverlayOpen : ''}`}
          onClick={closeSidebar}
        >
          <aside
            className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}
            onClick={(e) => e.stopPropagation()}
            aria-label="AwakeVerse navigation"
          >
            {/* ── Sidebar header ── */}
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitleBlock}>

                {/* ✅ UPDATED: wordmark is now a button that opens Oracle chat */}
                <button
                  className={styles.sidebarTitleBtn}
                  onClick={handleOracleClick}
                  aria-label="Open Oracle chat"
                  title="Ask the Oracle"
                >
                  <span className={styles.sidebarTitle}>
                    <AwakeVerseWordmark className={styles.wordmark} />
                  </span>
                </button>

                <span className={styles.sidebarSubtitle}>
                  Primary, story worlds, and productivity.
                </span>
              </div>
            </div>

            {/* ── Nav groups ── */}
            <nav className={styles.sidebarNav}>
              {navGroups.map((group) => {
                const groupItems = group.items.map((key) => itemsByKey[key]).filter(Boolean);
                if (groupItems.length === 0) return null;
                return (
                  <div className={styles.sidebarSection} key={group.key}>
                    <div className={styles.sidebarSectionLabel}>{group.label}</div>
                    <div className={styles.sidebarSectionItems}>
                      {groupItems.map(({ key, label, icon: Icon, viewState }) => (
                        <button
                          key={key}
                          className={`${styles.sidebarNavItem} ${
                            viewContext.currentView === viewState ? styles.sidebarNavItemActive : ''
                          }`}
                          onClick={() => handleNavClick(viewState)}
                        >
                          <Icon className={styles.sidebarNavIcon} />
                          <span className={styles.sidebarNavLabel}>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* ✅ Get Started group — always at bottom */}
              <div className={`${styles.sidebarSection} ${styles.sidebarSectionGetStarted}`}>
                <div className={styles.sidebarSectionLabel}>Guide</div>
                <div className={styles.sidebarSectionItems}>
                  <button
                    className={styles.sidebarNavItem}
                    onClick={handleGetStartedClick}
                  >
                    <GetStartedIcon className={styles.sidebarNavIcon} />
                    <span className={styles.sidebarNavLabel}>Get Started</span>
                  </button>
                </div>
              </div>
            </nav>

            {/* ── Sidebar footer ── */}
            <div className={styles.sidebarFooter}>
              <div className={styles.userMeta}>
                <span className={styles.userName}>
                  {user?.display_name || user?.displayName || user?.name || 'User'}
                </span>
                <span className={styles.userEmail}>
                  {user?.email || ''}
                </span>
              </div>
              <span className={`${styles.subscriptionBadge} ${subscriptionActive ? styles.subscriptionActive : ''}`}>
                {subscriptionLabel}
              </span>
            </div>

          </aside>
        </div>
      )}
    </>
  );
}