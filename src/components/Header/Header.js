// src/components/Header/Header.js - AwakeVerse premium header with left slide-in sidebar
import { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppView } from '../../contexts/AppViewContext';
import ProfileButton from '../ProfileButton';
import usePremiumCapabilities from '../../hooks/usePremiumCapabilities';

// === SVG ICONS ABOVE THIS LINE STAY AS-IS ===

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


// Main Header component
export default function Header() {
  const { user } = useUser();
  const { isAuthenticated } = useAuth();
  const [isRetracted, setIsRetracted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const API_BASE =
    process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

  // View context (Chat / Discover / etc.)
  let viewContext = null;
  try {
    viewContext = useAppView();
  } catch (e) {
    console.error(
      'Header: useAppView must be used within AppViewProvider',
      e,
    );
  }

  const showNavigation = isAuthenticated && viewContext;

  // Premium capabilities (subscription + character usage)
  const capabilities = usePremiumCapabilities();
  const {
    subscription_state,
    is_premium,
    is_trial,
    days_remaining,
    character_count,
    character_limit,
  } = capabilities || {};

  // Build nav items once we know view states
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

  // Sections:
  // Primary = Chat + Discover
  const primaryNavItems = navItems.filter(
    (item) => item.key === 'chat' || item.key === 'discover',
  );
  // Story World = Story (we’ll plug "My Characters" / "My Stories" inside that view later)
  const storyWorldNavItems = navItems.filter(
    (item) => item.key === 'stories',
  );
  // Productivity = Create + Scenarios
  const productivityNavItems = navItems.filter(
    (item) => item.key === 'create' || item.key === 'scenarios',
  );

  const handleNavClick = (viewState) => {
    if (!viewContext) return;
    viewContext.switchView(viewState);
    setIsSidebarOpen(false);
    // If user is navigating, we can safely hide the brand bar again later via timer
  };

  const handleSidebarToggle = () => {
    if (!showNavigation) return;
    setIsSidebarOpen((open) => !open);
    // If header was fully retracted, bring it back when user opens the menu
    setIsRetracted(false);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleRetractHeader = () => {
    setIsRetracted(true);
  };

  const handleShowHeader = () => {
    setIsRetracted(false);
  };

  // Auto-retract the top header after 6 seconds (once user is authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isRetracted) return;

    const timer = setTimeout(() => {
      setIsRetracted(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isRetracted]);

  // Avatar / initials
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

  // Subscription text in sidebar footer
  let planLabel = 'Free Tier';
  if (is_premium) planLabel = 'Premium';
  else if (is_trial) planLabel = 'Trial';

  let subscriptionLine = '';
  if (typeof days_remaining === 'number') {
    if (is_trial) {
      subscriptionLine = `Trial: ${days_remaining} day${
        days_remaining === 1 ? '' : 's'
      } left`;
    } else if (is_premium) {
      subscriptionLine = `Renews in ${days_remaining} day${
        days_remaining === 1 ? '' : 's'
      }`;
    }
  } else if (subscription_state === 'trial_expired') {
    subscriptionLine = 'Trial ended • Upgrade to keep benefits';
  }

  const usageLine =
    typeof character_count === 'number' &&
    typeof character_limit === 'number'
      ? `${character_count} / ${character_limit} characters used`
      : null;

  const headerClassName = isRetracted
    ? `${styles.header} ${styles.retracted}`
    : styles.header;

  return (
    <>
      {/* Top brand bar – AwakeVerse only */}
      <header className={headerClassName}>
        <div className={styles.leftSection}>
          <div className={styles.brandRow}>
            <h1 className={styles.title}>AwakeVerse</h1>
          </div>
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
                      // Hide broken avatars and fall back to initials
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {userInitial.toUpperCase()}
                  </div>
                )}
              </div>

              <ProfileButton />

              <button
                type="button"
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

      {/* Left sidebar handle + slide-in navigation (desktop + mobile) */}
      {showNavigation && (
        <>
          {/* Fixed hamburger handle on the left edge */}
          <button
            type="button"
            className={`${styles.sidebarHandle} ${
              isSidebarOpen ? styles.sidebarHandleOpen : ''
            }`}
            onClick={handleSidebarToggle}
            aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
          >
            <span className={styles.handleIcon} aria-hidden="true">
              <span className={styles.handleBar} />
              <span className={styles.handleBar} />
              <span className={styles.handleBar} />
            </span>
          </button>

          {/* Left slide-in sidebar */}
          <aside
            className={`${styles.sidebar} ${
              isSidebarOpen ? styles.sidebarOpen : ''
            }`}
            aria-label="AwakeVerse navigation"
          >
            <div className={styles.sidebarInner}>
              {/* PRIMARY – Chat + Discover */}
              {primaryNavItems.length > 0 && (
                <section className={styles.sidebarSection}>
                  <div className={styles.sidebarLabel}>Primary</div>
                  <div className={styles.sidebarNavGroup}>
                    {primaryNavItems.map(
                      ({ key, label, icon: Icon, viewState }) => (
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
                          <span className={styles.sidebarNavText}>{label}</span>
                        </button>
                      ),
                    )}
                  </div>
                </section>
              )}

              {/* STORY WORLD – Story */}
              {storyWorldNavItems.length > 0 && (
                <section className={styles.sidebarSection}>
                  <div className={styles.sidebarLabel}>Story World</div>
                  <div className={styles.sidebarNavGroup}>
                    {storyWorldNavItems.map(
                      ({ key, label, icon: Icon, viewState }) => (
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
                          <span className={styles.sidebarNavText}>{label}</span>
                        </button>
                      ),
                    )}
                  </div>
                </section>
              )}

              {/* PRODUCTIVITY – Create + Scenarios */}
              {productivityNavItems.length > 0 && (
                <section className={styles.sidebarSection}>
                  <div className={styles.sidebarLabel}>Productivity</div>
                  <div className={styles.sidebarNavGroup}>
                    {productivityNavItems.map(
                      ({ key, label, icon: Icon, viewState }) => (
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
                          <span className={styles.sidebarNavText}>{label}</span>
                        </button>
                      ),
                    )}
                  </div>
                </section>
              )}

              {/* Sidebar footer – user + subscription plan */}
              <footer className={styles.sidebarFooter}>
                <div className={styles.sidebarUserRow}>
                  <div className={styles.sidebarAvatar}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="User avatar"
                        className={styles.sidebarAvatarImage}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className={styles.sidebarAvatarInitial}>
                        {userInitial.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className={styles.sidebarUserMeta}>
                    <span className={styles.sidebarUserName}>
                      {user?.displayName || user?.name || 'Creator'}
                    </span>
                    <span className={styles.sidebarUserPlan}>
                      {planLabel}
                    </span>
                    {subscriptionLine && (
                      <span className={styles.sidebarUserSubscription}>
                        {subscriptionLine}
                      </span>
                    )}
                    {usageLine && (
                      <span className={styles.sidebarUserUsage}>
                        {usageLine}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.sidebarProfileActions}>
                  <button
                    type="button"
                    className={styles.sidebarChipButton}
                    onClick={() => {
                      // You can hook this to a profile view later
                      closeSidebar();
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    className={`${styles.sidebarChipButton} ${styles.sidebarChipButtonDanger}`}
                    onClick={() => {
                      // Let ProfileButton handle actual logout; this just closes the sidebar
                      closeSidebar();
                    }}
                  >
                    Log out
                  </button>
                </div>
              </footer>
            </div>
          </aside>

          {/* Click-off backdrop when sidebar is open */}
          {isSidebarOpen && (
            <button
              type="button"
              className={styles.sidebarBackdrop}
              aria-label="Close navigation"
              onClick={closeSidebar}
            />
          )}
        </>
      )}

      {/* Reveal button when header is fully retracted */}
      {isRetracted && (
        <button
          type="button"
          className={styles.revealButton}
          onClick={handleShowHeader}
          aria-label="Show header"
        >
          AwakeVerse
        </button>
      )}
    </>
  );
}
