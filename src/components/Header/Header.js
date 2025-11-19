// src/components/Header/Header.js – AwakeVerse header + left sidebar nav (simplified layout)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppView } from '../../contexts/AppViewContext';

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
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

  let viewContext = null;
  try {
    viewContext = useAppView();
  } catch (e) {
    console.error('Header: useAppView must be used within AppViewProvider', e);
  }

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const showNavigation = isAuthenticated && !!viewContext;

  // Auto-hide header after 6s
  useEffect(() => {
    if (!isHeaderVisible || !isAuthenticated) return;
    const timer = setTimeout(() => setIsHeaderVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [isHeaderVisible, isAuthenticated]);

  // Close profile menu when sidebar closes
  useEffect(() => {
    if (!isSidebarOpen) {
      setIsProfileMenuOpen(false);
    }
  }, [isSidebarOpen]);

  // View helpers (guard if context missing)
  const VIEW_STATES = viewContext?.VIEW_STATES || {};
  const currentView = viewContext?.currentView;

  const switchTo = (viewState) => {
    if (!viewContext || !viewState) return;
    viewContext.switchView(viewState);
    setIsSidebarOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleProfileAction = (action) => {
    setIsProfileMenuOpen(false);
    setIsSidebarOpen(false);
    
    switch(action) {
      case 'profile':
        navigate('/profile-settings');
        break;
      case 'avatar':
        navigate('/upload-avatar');
        break;
      case 'contact':
        navigate('/contact-us');
        break;
      case 'logout':
        logout();
        navigate('/');
        break;
      default:
        break;
    }
  };

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

  const userName = user?.display_name ||
    user?.displayName ||
    user?.name ||
    'AwakeVerse explorer';

  const userEmail = user?.username || user?.email || '';

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
          onClick={() => setIsSidebarOpen((open) => !open)}
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
          onClick={() => setIsSidebarOpen(false)}
        >
          <aside
            className={`${styles.sidebar} ${
              isSidebarOpen ? styles.sidebarOpen : ''
            }`}
            onClick={(e) => e.stopPropagation()}
            aria-label="AwakeVerse navigation"
          >
            <div className={styles.sidebarInner}>
              {/* Sidebar header */}
              <div className={styles.sidebarHeader}>
                <div className={styles.sidebarTitleBlock}>
                  <span className={styles.sidebarTitle}>AwakeVerse</span>
                  <span className={styles.sidebarSubtitle}>
                    Primary, story worlds, and productivity.
                  </span>
                </div>
              </div>

              {/* Sidebar nav – THREE EXPLICIT GROUPS (stacked) */}
              <nav className={styles.sidebarNav}>
                {/* Primary: Chat + Discover */}
                <section className={styles.sidebarSection}>
                  <div className={styles.sidebarSectionLabel}>Primary</div>
                  <div className={styles.sidebarSectionItems}>
                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${
                        currentView === VIEW_STATES.CHAT
                          ? styles.sidebarNavItemActive
                          : ''
                      }`}
                      onClick={() => switchTo(VIEW_STATES.CHAT)}
                    >
                      <ChatIcon className={styles.sidebarNavIcon} />
                      <span className={styles.sidebarNavLabel}>Chat</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${
                        currentView === VIEW_STATES.MARKET_HUB
                          ? styles.sidebarNavItemActive
                          : ''
                      }`}
                      onClick={() => switchTo(VIEW_STATES.MARKET_HUB)}
                    >
                      <DiscoverIcon className={styles.sidebarNavIcon} />
                      <span className={styles.sidebarNavLabel}>Discover</span>
                    </button>
                  </div>
                </section>

                {/* Story world: Story */}
                <section className={styles.sidebarSection}>
                  <div className={styles.sidebarSectionLabel}>Story world</div>
                  <div className={styles.sidebarSectionItems}>
                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${
                        currentView === VIEW_STATES.STORY_MODE
                          ? styles.sidebarNavItemActive
                          : ''
                      }`}
                      onClick={() => switchTo(VIEW_STATES.STORY_MODE)}
                    >
                      <StoriesIcon className={styles.sidebarNavIcon} />
                      <span className={styles.sidebarNavLabel}>Story</span>
                    </button>
                  </div>
                </section>

                {/* Productivity: Create + Scenarios */}
                <section className={styles.sidebarSection}>
                  <div className={styles.sidebarSectionLabel}>Productivity</div>
                  <div className={styles.sidebarSectionItems}>
                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${
                        currentView === VIEW_STATES.CREATOR_DASHBOARD
                          ? styles.sidebarNavItemActive
                          : ''
                      }`}
                      onClick={() => switchTo(VIEW_STATES.CREATOR_DASHBOARD)}
                    >
                      <CreateIcon className={styles.sidebarNavIcon} />
                      <span className={styles.sidebarNavLabel}>Create</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${
                        currentView === VIEW_STATES.SCENARIOS
                          ? styles.sidebarNavItemActive
                          : ''
                      }`}
                      onClick={() => switchTo(VIEW_STATES.SCENARIOS)}
                    >
                      <ScenariosIcon className={styles.sidebarNavIcon} />
                      <span className={styles.sidebarNavLabel}>Scenarios</span>
                    </button>
                  </div>
                </section>
              </nav>

              {/* Sidebar footer – profile menu */}
              {isAuthenticated && (
                <footer className={styles.sidebarFooter}>
                  <button
                    className={`${styles.profileTrigger} ${
                      isProfileMenuOpen ? styles.profileTriggerExpanded : ''
                    }`}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    aria-expanded={isProfileMenuOpen}
                    aria-label="Profile menu"
                  >
                    <div className={styles.profileAvatar}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="User avatar"
                          className={styles.profileAvatarImage}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={styles.profileAvatarFallback}>
                          {userInitial.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={styles.profileInfo}>
                      <div className={styles.profileName}>{userName}</div>
                      <div className={styles.profileStatus}>{subscriptionLabel}</div>
                    </div>
                    <span className={styles.profileChevron}>▼</span>
                  </button>

                  {/* Profile dropdown menu */}
                  {isProfileMenuOpen && (
                    <div className={styles.profileMenu}>
                      <button
                        className={styles.profileMenuItem}
                        onClick={() => handleProfileAction('profile')}
                      >
                        <svg className={styles.profileMenuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Profile Settings
                      </button>
                      
                      <button
                        className={styles.profileMenuItem}
                        onClick={() => handleProfileAction('avatar')}
                      >
                        <svg className={styles.profileMenuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Upload Avatar
                      </button>
                      
                      <div className={styles.profileMenuDivider}></div>
                      
                      <button
                        className={styles.profileMenuItem}
                        onClick={() => handleProfileAction('contact')}
                      >
                        <svg className={styles.profileMenuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Contact Support
                      </button>
                      
                      <div className={styles.profileMenuDivider}></div>
                      
                      <button
                        className={`${styles.profileMenuItem} ${styles.profileMenuDanger}`}
                        onClick={() => handleProfileAction('logout')}
                      >
                        <svg className={styles.profileMenuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </footer>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}