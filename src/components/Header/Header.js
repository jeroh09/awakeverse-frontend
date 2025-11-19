// src/components/Header/Header.js - AwakeVerse premium header with left slide-in sidebar
import { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppView } from '../../contexts/AppViewContext';
import ProfileButton from '../ProfileButton';
import usePremiumCapabilities from '../../hooks/usePremiumCapabilities';

// === SVG ICONS ABOVE THIS LINE STAY AS-IS ===

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
