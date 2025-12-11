// src/components/Header/Header.js – UPDATED WITH VERSE STUDIO NAV
import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppView } from '../../contexts/AppViewContext';
import ProfileButton from '../ProfileButton';

// === AwakeVerse Nav Icons (inline SVG, indigo glow) ===

const ChatIcon = ({ className }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="chatGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="2"
          floodColor="#6366f1"
          floodOpacity="0.55"
        />
      </filter>
    </defs>
    <path
      d="M5 6.5C5 5.12 6.12 4 7.5 4h9c1.38 0 2.5 1.12 2.5 2.5v6c0 1.38-1.12 2.5-2.5 2.5H10l-3.5 3v-3H7.5C6.12 15 5 13.88 5 12.5v-6z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#chatGlow)"
    />
  </svg>
);

const DiscoverIcon = ({ className }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="discoverGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="2"
          floodColor="#6366f1"
          floodOpacity="0.55"
        />
      </filter>
    </defs>
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="4"
      stroke="currentColor"
      strokeWidth="2"
      filter="url(#discoverGlow)"
    />
    <path
      d="M9 15V12M12 15V9M15 15V11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      filter="url(#discoverGlow)"
    />
  </svg>
);

const StoriesIcon = ({ className }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="storiesGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="2"
          floodColor="#6366f1"
          floodOpacity="0.55"
        />
      </filter>
    </defs>
    <path
      d="M7 5h8.5A2.5 2.5 0 0 1 18 7.5V18l-3.5-2L11 18l-4-2.5V7.5A2.5 2.5 0 0 1 9.5 5H11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#storiesGlow)"
    />
  </svg>
);

const ScenariosIcon = ({ className }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="scenariosGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="2"
          floodColor="#6366f1"
          floodOpacity="0.55"
        />
      </filter>
    </defs>
    <path
      d="M12 4c-4 0-7 2-7 6v2c0 4 3 6 7 6s7-2 7-6v-2c0-4-3-6-7-6z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      filter="url(#scenariosGlow)"
    />
    <path
      d="M9 12c0-1 .8-1.5 1.5-1.5S12 11 12 12M15 12c0-1-.8-1.5-1.5-1.5S12 11 12 12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      filter="url(#scenariosGlow)"
    />
  </svg>
);

const CreateIcon = ({ className }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="createGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="2"
          floodColor="#6366f1"
          floodOpacity="0.55"
        />
      </filter>
    </defs>
    <rect
      x="5"
      y="4"
      width="14"
      height="16"
      rx="3"
      stroke="currentColor"
      strokeWidth="2"
      filter="url(#createGlow)"
    />
    <path
      d="M9 9h2 M12 12h3 M9 15h5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      filter="url(#createGlow)"
    />
  </svg>
);

/**
 * VerseStudioIcon – unique thumbnail for Verse Studio
 * 3-node constellation / orbit to signal multi-LLM collaboration
 */
const VerseStudioIcon = ({ className }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="verseGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="2.2"
          floodColor="#6366f1"
          floodOpacity="0.65"
        />
      </filter>
    </defs>
    {/* Outer orbit */}
    <circle
      cx="12"
      cy="12"
      r="7"
      stroke="currentColor"
      strokeWidth="1.8"
      opacity="0.7"
      filter="url(#verseGlow)"
    />
    {/* Node 1 */}
    <circle
      cx="9"
      cy="9"
      r="1.7"
      fill="currentColor"
      opacity="0.95"
      filter="url(#verseGlow)"
    />
    {/* Node 2 */}
    <circle
      cx="15"
      cy="10"
      r="1.5"
      fill="currentColor"
      opacity="0.85"
      filter="url(#verseGlow)"
    />
    {/* Node 3 */}
    <circle
      cx="11"
      cy="15"
      r="1.4"
      fill="currentColor"
      opacity="0.85"
      filter="url(#verseGlow)"
    />
    {/* Connecting paths */}
    <path
      d="M9 9L15 10L11 15Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
      filter="url(#verseGlow)"
    />
  </svg>
);

export default function Header() {
  const { user, getSubscriptionInfo } = useUser();
  const { isAuthenticated } = useAuth();
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

  let viewContext = null;
  try {
    viewContext = useAppView();
  } catch (e) {
    console.error('Header: useAppView must be used within AppViewProvider', e);
  }

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const showNavigation = isAuthenticated && !!viewContext;

  // Auto-hide header after 6s
  useEffect(() => {
    if (!isHeaderVisible || !isAuthenticated) return;
    const timer = setTimeout(() => setIsHeaderVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [isHeaderVisible, isAuthenticated]);

  // --- Build nav items & groups ---
  const navItems = !showNavigation
    ? []
    : [
        {
          key: 'chat',
          label: 'Chat',
          icon: ChatIcon,
          viewState: viewContext.VIEW_STATES.CHAT,
        },
        {
          key: 'discover',
          label: 'Discover',
          icon: DiscoverIcon,
          viewState: viewContext.VIEW_STATES.MARKET_HUB,
        },
        {
          key: 'stories',
          label: 'Story',
          icon: StoriesIcon,
          viewState: viewContext.VIEW_STATES.STORY_MODE,
        },
        {
          key: 'create',
          label: 'Create',
          icon: CreateIcon,
          viewState: viewContext.VIEW_STATES.CREATOR_DASHBOARD,
        },
        {
          key: 'scenarios',
          label: 'Scenarios',
          icon: ScenariosIcon,
          viewState: viewContext.VIEW_STATES.SCENARIOS,
        },
        {
          key: 'verseStudio',
          label: 'Workspace',           // 🔹 sidebar label
          icon: VerseStudioIcon,
          viewState: viewContext.VIEW_STATES.VERSE_STUDIO,
        },
      ];

  const itemsByKey = Object.fromEntries(navItems.map((item) => [item.key, item]));

  const navGroups = [
    {
      key: 'primary',
      label: 'Primary',
      items: ['chat', 'discover'],
    },
    {
      key: 'storyWorld',
      label: 'Story world',
      items: ['stories'],
    },
    {
      key: 'productivity',
      label: 'Productivity',
      items: ['create', 'scenarios', 'verseStudio'],
    },
  ];

  const handleNavClick = (viewState) => {
    if (!viewContext) return;
    viewContext.switchView(viewState);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    if (!showNavigation) return;
    setIsSidebarOpen((open) => !open);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  // Avatar
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

  const subscriptionInfo = getSubscriptionInfo ? getSubscriptionInfo() : null;
  const subscriptionLabel = subscriptionInfo?.display_name || 'Free';
  const subscriptionActive = subscriptionInfo?.is_active || false;

  return (
    <>
      {/* Top brand bar – fully removed when not visible */}
      {isHeaderVisible && (
        <header className={styles.header}>
          <div className={styles.brandShell}>
            <h1 className={styles.title}>AwakeVerse</h1>
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
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className={styles.avatarFallback}>
                      {userInitial.toUpperCase()}
                    </div>
                  )}
                </div>
                <ProfileButton user={user} />
                <button
                  className={styles.retractButton}
                  onClick={() => setIsHeaderVisible(false)}
                  aria-label="Hide header"
                  title="Hide header"
                >
                  ⌃
                </button>
              </>
            )}
          </div>
        </header>
      )}

      {/* Pill to show header again */}
      {!isHeaderVisible && (
        <button
          className={styles.showButton}
          onClick={() => setIsHeaderVisible(true)}
          aria-label="Show header"
        >
          AwakeVerse
        </button>
      )}

      {/* Subtle pill-style hamburger (left edge) */}
      {showNavigation && (
        <button
          type="button"
          className={`${styles.sidebarHandle} ${
            isSidebarOpen ? styles.sidebarHandleOpen : ''
          }`}
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={styles.handleBar} />
          <span className={styles.handleBar} />
          <span className={styles.handleBar} />
        </button>
      )}

      {/* Sidebar + overlay */}
      {showNavigation && (
        <div
          className={`${styles.sidebarOverlay} ${
            isSidebarOpen ? styles.sidebarOverlayOpen : ''
          }`}
          onClick={closeSidebar}
        >
          <aside
            className={`${styles.sidebar} ${
              isSidebarOpen ? styles.sidebarOpen : ''
            }`}
            onClick={(e) => e.stopPropagation()}
            aria-label="AwakeVerse navigation"
          >
            {/* Sidebar header */}
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitleBlock}>
                <span className={styles.sidebarTitle}>AwakeVerse</span>
                <span className={styles.sidebarSubtitle}>
                  Primary, story worlds, and productivity.
                </span>
              </div>
            </div>

            {/* Nav groups */}
            <nav className={styles.sidebarNav}>
              {navGroups.map((group) => {
                const groupItems = group.items
                  .map((key) => itemsByKey[key])
                  .filter(Boolean);

                if (groupItems.length === 0) return null;

                return (
                  <div className={styles.sidebarSection} key={group.key}>
                    <div className={styles.sidebarSectionLabel}>
                      {group.label}
                    </div>
                    <div className={styles.sidebarSectionItems}>
                      {groupItems.map(({ key, label, icon: Icon, viewState }) => (
                        <button
                          key={key}
                          className={`${styles.sidebarNavItem} ${
                            viewContext.currentView === viewState
                              ? styles.sidebarNavItemActive
                              : ''
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
            </nav>

            {/* Sidebar footer – user + subscription */}
            {isAuthenticated && (
              <footer className={styles.sidebarFooter}>
                <div className={styles.userMeta}>
                  <div className={styles.userName}>
                    {user?.display_name ||
                      user?.displayName ||
                      user?.name ||
                      'AwakeVerse explorer'}
                  </div>
                  {user?.username && (
                    <div className={styles.userEmail}>{user.username}</div>
                  )}
                </div>
                <div
                  className={`${styles.subscriptionBadge} ${
                    subscriptionActive ? styles.subscriptionActive : ''
                  }`}
                >
                  {subscriptionLabel}
                </div>
              </footer>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
