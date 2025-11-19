// src/components/Header/Header.js - AwakeVerse premium header with slide-in mobile nav
import { useState } from 'react';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppView } from '../../contexts/AppViewContext';
import ProfileButton from '../ProfileButton';

// === AwakeVerse Nav Icons (inline SVG, indigo glow via filter) ===

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
    {/* parchment */}
    <path
      d="M6 4h9a2 2 0 0 1 2 2v12H8a2 2 0 0 1-2-2V4z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      filter="url(#storiesGlow)"
    />
    {/* lines */}
    <path
      d="M10 10h4M10 13h3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      filter="url(#storiesGlow)"
    />
    {/* quill */}
    <path
      d="M16 4c1.5 1 3 3.8 3 6.5S16 16 13 17.5c0 0 0.5-2.5 2-5s1.4-4.5 1-6.5z"
      stroke="currentColor"
      strokeWidth="2"
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
  const { user } = useUser();
  const { isAuthenticated } = useAuth();
  const [isRetracted, setIsRetracted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

  let viewContext = null;
  try {
    viewContext = useAppView();
  } catch (e) {
    console.error('Header: useAppView must be used within AppViewProvider', e);
  }

  const showNavigation = isAuthenticated && viewContext;

  const navItems = showNavigation
    ? [
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
          key: 'stories',
          label: 'Stories',
          icon: StoriesIcon,
          viewState: viewContext.VIEW_STATES.STORY_MODE,
        },
      ]
    : [];

  const handleNavClick = (viewState) => {
    if (!viewContext) return;
    viewContext.switchView(viewState);
    setIsMobileMenuOpen(false);
    setIsRetracted(false);
  };

  const toggleMobileMenu = () => {
    if (!showNavigation) return;
    setIsMobileMenuOpen((open) => !open);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleRetractHeader = () => {
    setIsRetracted(true);
  };

  const handleShowHeader = () => {
    setIsRetracted(false);
  };

  const avatarUrlRaw = user?.avatarUrl || user?.avatar_url;
  const avatarUrl =
    avatarUrlRaw && typeof avatarUrlRaw === 'string'
      ? avatarUrlRaw.startsWith('http')
        ? avatarUrlRaw
        : `${API_BASE}${avatarUrlRaw}`
      : null;

  const userInitial =
    user?.displayName?.charAt(0) ||
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    'A';

  const headerClassName = isRetracted
    ? `${styles.header} ${styles.retracted}`
    : styles.header;

  return (
    <>
      <header className={headerClassName}>
        <div className={styles.leftSection}>
          {/* Logo row: AwakeVerse + (mobile) hamburger */}
          <div className={styles.brandRow}>
            <h1 className={styles.title}>AwakeVerse</h1>

            {showNavigation && (
              <button
                className={styles.menuToggle}
                onClick={toggleMobileMenu}
                aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              >
                <span className={styles.menuBar} />
                <span className={styles.menuBar} />
                <span className={styles.menuBar} />
              </button>
            )}
          </div>

          {/* Desktop nav: icons + labels */}
          {showNavigation && (
            <nav className={styles.navigationDesktop} aria-label="Primary">
              {navItems.map(({ key, label, icon: Icon, viewState }) => (
                <button
                  key={key}
                  className={`${styles.navTab} ${
                    viewContext.currentView === viewState ? styles.active : ''
                  }`}
                  onClick={() => handleNavClick(viewState)}
                >
                  <Icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Right side: avatar + profile + retract control */}
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
                onClick={handleRetractHeader}
                aria-label="Hide header"
                title="Hide header"
              >
                ⌃
              </button>
            </>
          )}
        </div>
      </header>

      {/* Show button when header is retracted (desktop) */}
      {isRetracted && (
        <button
          className={styles.showButton}
          onClick={handleShowHeader}
          aria-label="Show header"
          title="Show header"
        >
          ⋯
        </button>
      )}

      {/* Mobile slide-in nav */}
      {showNavigation && isMobileMenuOpen && (
        <div className={styles.mobileNavOverlay} onClick={closeMobileMenu}>
          <nav
            className={styles.mobileNav}
            aria-label="Mobile navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.mobileNavHeader}>
              <span className={styles.mobileNavTitle}>AwakeVerse</span>
              <button
                className={styles.mobileClose}
                onClick={closeMobileMenu}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>

            <div className={styles.mobileNavItems}>
              {navItems.map(({ key, label, icon: Icon, viewState }) => (
                <button
                  key={key}
                  className={`${styles.mobileNavItem} ${
                    viewContext.currentView === viewState ? styles.mobileActive : ''
                  }`}
                  onClick={() => handleNavClick(viewState)}
                >
                  <Icon className={styles.mobileNavIcon} />
                  <span className={styles.mobileNavLabel}>{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
