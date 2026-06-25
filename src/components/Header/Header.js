// src/components/Header/Header.js
// ✅ No header bar — replaced with floating AV pill trigger (top-left)
// ✅ Detached panel with double-border ring (onboarding ob-panel technique)
// ✅ Profile row in footer opens upward popup menu (profile, settings, billing, logout)
// ✅ useAuth() provides isAuthenticated + logout — same as AuthContext exports
// ✅ All original logic preserved: Oracle, onboarding, launcher, viewContext, nav groups

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppView } from '../../contexts/AppViewContext';

// ─── Nav Icons (inline SVG, indigo glow) ─────────────────────────────────────

const ChatIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
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
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
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
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
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
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
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
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="createGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55" />
      </filter>
    </defs>
    <rect x="5" y="4" width="14" height="16" rx="3" stroke="currentColor" strokeWidth="2" filter="url(#createGlow)" />
    <path d="M9 9h2M12 12h3M9 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" filter="url(#createGlow)" />
  </svg>
);

const VerseStudioIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="verseGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#6366f1" floodOpacity="0.65" />
      </filter>
    </defs>
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" opacity="0.7" filter="url(#verseGlow)" />
    <circle cx="9" cy="9" r="1.7" fill="currentColor" opacity="0.95" filter="url(#verseGlow)" />
    <circle cx="15" cy="10" r="1.5" fill="currentColor" opacity="0.85" filter="url(#verseGlow)" />
    <circle cx="11" cy="15" r="1.4" fill="currentColor" opacity="0.85" filter="url(#verseGlow)" />
    <path
      d="M9 9L15 10L11 15Z"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      opacity="0.85" filter="url(#verseGlow)"
    />
  </svg>
);

const PodcastStudioIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="podcastGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#6366f1" floodOpacity="0.65" />
      </filter>
    </defs>
    <rect x="9" y="2" width="6" height="11" rx="3"
      stroke="currentColor" strokeWidth="1.8" opacity="0.95" filter="url(#podcastGlow)" />
    <path d="M5 10a7 7 0 0014 0"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" filter="url(#podcastGlow)" />
    <line x1="12" y1="19" x2="12" y2="22"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" filter="url(#podcastGlow)" />
    <line x1="8" y1="22" x2="16" y2="22"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" filter="url(#podcastGlow)" />
    <path d="M3 8v1.5M6 6.5v3M21 8v1.5M18 6.5v3"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" filter="url(#podcastGlow)" />
  </svg>
);

const GetStartedIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <defs>
      <filter id="gsGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.6" />
      </filter>
    </defs>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" filter="url(#gsGlow)" />
    <path d="M12 5v1.5M12 17.5V19M5 12h1.5M17.5 12H19"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" filter="url(#gsGlow)" />
    <path d="M14.5 9l-4 4.5 2-1 2-3.5z" fill="currentColor" opacity="0.9" filter="url(#gsGlow)" />
    <path d="M9.5 15l4-4.5-2 1-2 3.5z" fill="currentColor" opacity="0.4" filter="url(#gsGlow)" />
  </svg>
);

// ✅ Wordmark — A ivory, V indigo, in Caveat italic
const AwakeVerseWordmark = ({ className }) => (
  <span className={`${styles.wordmark} ${className || ''}`} aria-label="AwakeVerse">
    <span className={styles.wordmarkIvory}>A</span>
    <span className={styles.wordmarkIndigo}>V</span>
  </span>
);

// ✅ Full wordmark for panel header
const AwakeVerseWordmarkFull = ({ className }) => (
  <span className={`${styles.wordmark} ${className || ''}`} aria-label="AwakeVerse">
    <span className={styles.wordmarkIvory}>A</span>
    <span className={styles.wordmarkIndigo}>wake</span>
    <span className={styles.wordmarkIvory}>V</span>
    <span className={styles.wordmarkIndigo}>erse</span>
  </span>
);

// ─── Profile popup menu items ─────────────────────────────────────────────────
// Extend this array to add more profile pages
const PROFILE_MENU_ITEMS = [
  { key: 'profile',  label: 'Profile',       icon: 'ti-user',         viewState: 'PROFILE' },
  { key: 'settings', label: 'Settings',      icon: 'ti-settings',     viewState: 'SETTINGS' },
  { key: 'billing',  label: 'Billing',       icon: 'ti-credit-card',  viewState: 'BILLING' },
  { key: 'upgrade',  label: 'Upgrade',       icon: 'ti-star',         viewState: 'UPGRADE' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Header() {
  const { user, getSubscriptionInfo } = useUser();
  const { isAuthenticated, logout } = useAuth();
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

  // Defensive viewContext — same try/catch as original
  let viewContext = null;
  try {
    viewContext = useAppView();
  } catch (e) {
    console.error('Header: useAppView must be used within AppViewProvider', e);
  }

  const [isSidebarOpen,  setIsSidebarOpen]  = useState(false);
  const [isProfileOpen,  setIsProfileOpen]  = useState(false);
  const profileMenuRef = useRef(null);

  const showNavigation = isAuthenticated && !!viewContext;

  // ── Close panel on Escape ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Close profile menu on outside click ──────────────────────────────────
  useEffect(() => {
    if (!isProfileOpen) return;
    const onOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isProfileOpen]);

  // ── Nav items — unchanged from original ──────────────────────────────────
  const navItems = !showNavigation
    ? []
    : [
        { key: 'chat',          label: 'Chat',      icon: ChatIcon,          viewState: viewContext.VIEW_STATES.CHAT },
        { key: 'discover',      label: 'Discover',  icon: DiscoverIcon,      viewState: viewContext.VIEW_STATES.MARKET_HUB },
        { key: 'stories',       label: 'Story',     icon: StoriesIcon,       viewState: viewContext.VIEW_STATES.STORY_MODE },
        { key: 'create',        label: 'Create',    icon: CreateIcon,        viewState: viewContext.VIEW_STATES.CREATOR_DASHBOARD },
        { key: 'scenarios',     label: 'Dialogue',  icon: ScenariosIcon,     viewState: viewContext.VIEW_STATES.SCENARIOS },
        { key: 'podcastStudio', label: 'Studio',    icon: PodcastStudioIcon, viewState: viewContext.VIEW_STATES.PODCAST_STUDIO },
        { key: 'verseStudio',   label: 'Workspace', icon: VerseStudioIcon,   viewState: viewContext.VIEW_STATES.VERSE_STUDIO },
      ];

  const itemsByKey = Object.fromEntries(navItems.map((item) => [item.key, item]));

  const navGroups = [
    { key: 'primary',      label: 'Primary',      items: ['chat', 'discover'] },
    { key: 'storyWorld',   label: 'Story world',  items: ['stories'] },
    { key: 'productivity', label: 'Productivity', items: ['create', 'scenarios', 'podcastStudio', 'verseStudio'] },
  ];

  // ── Handlers — all original logic preserved ───────────────────────────────

  const handleNavClick = useCallback((viewState) => {
    if (!viewContext) return;
    viewContext.switchView(viewState);
    setIsSidebarOpen(false);
  }, [viewContext]);

  // ✅ Oracle — closes panel, fires event (ChatLauncherPage listens)
  const handleOracleClick = useCallback(() => {
    setIsSidebarOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('awakeverse:open-oracle-chat'));
    }, 180);
  }, []);

  // ✅ Get Started — closes panel, fires onboarding event
  const handleGetStartedClick = useCallback(() => {
    setIsSidebarOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('awakeverse:open-onboarding'));
    }, 200);
  }, []);

  // ✅ Profile menu — navigate to a sub-page via viewContext
  const handleProfileMenuClick = useCallback((viewState) => {
    setIsProfileOpen(false);
    setIsSidebarOpen(false);
    if (viewContext && viewState) {
      // Navigate if viewContext has that state; fall back gracefully
      try { viewContext.switchView(viewState); } catch (e) { /* page not wired yet */ }
    }
  }, [viewContext]);

  const handleLogout = useCallback(() => {
    setIsProfileOpen(false);
    setIsSidebarOpen(false);
    logout();
  }, [logout]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    setIsProfileOpen(false);
  }, []);

  // ── User data ─────────────────────────────────────────────────────────────

  const avatarUrlRaw = user?.avatarUrl || user?.avatar_url;
  const avatarUrl =
    avatarUrlRaw && typeof avatarUrlRaw === 'string'
      ? avatarUrlRaw.startsWith('http')
        ? avatarUrlRaw
        : `${API_BASE}${avatarUrlRaw}`
      : null;

  const userInitial =
    user?.display_name?.charAt(0) ||
    user?.displayName?.charAt(0)  ||
    user?.name?.charAt(0)         ||
    user?.email?.charAt(0)        ||
    'A';

  const displayName =
    user?.display_name || user?.displayName || user?.name || 'AwakeVerse explorer';

  const userHandle = user?.username || user?.email || '';

  const subscriptionInfo   = getSubscriptionInfo ? getSubscriptionInfo() : null;
  const subscriptionLabel  = subscriptionInfo?.display_name || 'Free';
  const subscriptionActive = subscriptionInfo?.is_active || false;

  // ── Avatar element — reused in trigger pill and footer ────────────────────
  const AvatarEl = (
    <div className={styles.avatarShell}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className={styles.avatarImage}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className={styles.avatarFallback}>{userInitial.toUpperCase()}</div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── AV trigger pill — fixed top-left, always visible ── */}
      <button
        className={styles.trigger}
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open navigation"
        aria-expanded={isSidebarOpen}
      >
        <AwakeVerseWordmark className={styles.triggerWordmark} />
        <span className={styles.triggerSep} aria-hidden="true" />
        <span className={styles.triggerHome}>Home</span>
      </button>

      {/* ── Overlay — closes panel on click outside ── */}
      <div
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayOpen : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ── Detached floating panel ── */}
      <div
        className={`${styles.panelWrap} ${isSidebarOpen ? styles.panelWrapOpen : ''}`}
        role="dialog"
        aria-label="AwakeVerse navigation"
        aria-modal="true"
      >
        {/* Double-border outer shell */}
        <div className={styles.panelOuter}>
          <div className={styles.panel}>

            {/* Panel header — wordmark as Oracle trigger */}
            <div className={styles.panelHead}>
              <div className={styles.panelHeadLeft}>
                <button
                  className={`${styles.wordmark} ${styles.panelWordmark}`}
                  onClick={handleOracleClick}
                  aria-label="Ask the Oracle"
                  title="Ask the Oracle"
                >
                  <AwakeVerseWordmarkFull />
                </button>
                <span className={styles.panelSubtitle}>
                  Primary, story worlds &amp; productivity.
                </span>
              </div>
              <button
                className={styles.panelClose}
                onClick={closeSidebar}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>

            {/* Nav groups */}
            {showNavigation && (
              <nav className={styles.nav}>
                {navGroups.map((group) => {
                  const groupItems = group.items.map((key) => itemsByKey[key]).filter(Boolean);
                  if (groupItems.length === 0) return null;
                  return (
                    <React.Fragment key={group.key}>
                      <div className={styles.sectionLabel}>{group.label}</div>
                      {groupItems.map(({ key, label, icon: Icon, viewState }) => (
                        <button
                          key={key}
                          className={`${styles.navItem} ${
                            viewContext.currentView === viewState ? styles.navItemActive : ''
                          }`}
                          onClick={() => handleNavClick(viewState)}
                        >
                          <Icon className={styles.navIcon} />
                          <span className={styles.navLabel}>{label}</span>
                        </button>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* Get Started — always at bottom */}
                <div className={styles.navDivider} />
                <div className={styles.sectionLabel}>Guide</div>
                <button
                  className={styles.navItem}
                  onClick={handleGetStartedClick}
                >
                  <GetStartedIcon className={styles.navIcon} />
                  <span className={styles.navLabel}>Get Started</span>
                </button>
              </nav>
            )}

            {/* Footer — profile row with upward popup */}
            {isAuthenticated && (
              <footer className={styles.footer} ref={profileMenuRef}>

                {/* Profile popup menu — opens upward */}
                <div
                  className={`${styles.profileMenu} ${isProfileOpen ? styles.profileMenuOpen : ''}`}
                  role="menu"
                  aria-label="Profile menu"
                >
                  {PROFILE_MENU_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      className={styles.profileMenuItem}
                      role="menuitem"
                      onClick={() => handleProfileMenuClick(item.viewState)}
                    >
                      <i className={`ti ${item.icon} ${styles.profileMenuIcon}`} aria-hidden="true" />
                      {item.label}
                    </button>
                  ))}
                  <button
                    className={`${styles.profileMenuItem} ${styles.profileMenuItemDanger}`}
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <i className={`ti ti-logout ${styles.profileMenuIcon}`} aria-hidden="true" />
                    Sign out
                  </button>
                </div>

                {/* User button */}
                <button
                  className={`${styles.userBtn} ${isProfileOpen ? styles.userMenuOpen : ''}`}
                  onClick={() => setIsProfileOpen((o) => !o)}
                  aria-label="Open profile menu"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                >
                  {AvatarEl}
                  <div className={styles.userMeta}>
                    <div className={styles.userName}>{displayName}</div>
                    {userHandle && (
                      <div className={styles.userHandle}>{userHandle}</div>
                    )}
                  </div>
                  <div
                    className={`${styles.subscriptionBadge} ${
                      subscriptionActive ? styles.subscriptionActive : ''
                    }`}
                  >
                    {subscriptionLabel}
                  </div>
                  <i className={`ti ti-chevron-up ${styles.userChevron}`} aria-hidden="true" />
                </button>

              </footer>
            )}
          </div>
        </div>
      </div>
    </>
  );
}