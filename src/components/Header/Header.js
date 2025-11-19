// src/components/Header/Header.js – AwakeVerse header + left sidebar nav
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

  // Auto-hide header after 6s (completely unmount)
  useEffect(() => {
    if (!isHeaderVisible || !isAuthenticated) return;
    const timer = setTimeout(() => setIsHeaderVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [isHeaderVisible, isAuthenticated]);

  // Build nav items
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
      ];

  const itemsByKey = Object.fromEntries(navItems.map((i) => [i.key, i]));

  const navGroups = [
    { key: 'primary', label: 'Primary', items: ['chat', 'discover'] },
    { key: 'storyWorld', label: 'Story world', items: ['stories'] },
    { key: 'productivity', label: 'Productivity', items: ['create', 'scenarios'] },
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
      {/* Header bar – completely unmounted when hidden */}
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

      {/* Vertical sidebar handle – mid-left, never overlaps brand */}
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
            <div className={styles.sidebarInner}>
              <div className={styles.sidebarHeader}>
                <div className={styles.sidebarTitleBlock}>
                  <span className={styles.sidebarTitle}>AwakeVerse</span>
                  <span className={styles.sidebarSubtitle}>
                    Primary, story worlds, and productivity.
                  </span>
                </div>
              </div>

              <nav className={styles.sidebarNav}>
                {navGroups.map((group) => {
                  const groupItems = group.items
                    .map((key) => itemsByKey[key])
                    .filter(Boolean);

                  if (groupItems.length === 0) return null;

                  return (
                    <section
                      key={group.key}
                      className={styles.sidebarSection}
                    >
                      <div className={styles.sidebarSectionLabel}>
                        {group.label}
                      </div>
                      <div className={styles.sidebarSectionItems}>
                        {groupItems.map(({ key, label, icon: Icon, viewState }) => (
                          <button
                            key={key}
                            type="button"
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
                    </section>
                  );
                })}
              </nav>

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
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
