// src/components/Header/Header.js - Fixed navigation following AppViewContext pattern
import { useState, useEffect, useRef } from 'react';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppView } from '../../contexts/AppViewContext';
import ProfileButton from '../ProfileButton';

/* === AwakeVerse Nav Icons (inline SVG, indigo glow via filter) === */

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


export default function Header() {
  const { user } = useUser();
  const { isAuthenticated } = useAuth();
  const [isRetracted, setIsRetracted] = useState(false);
  const retractionTimerRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

  // Get view context safely
  let viewContext = null;
  try {
    viewContext = useAppView();
  } catch (error) {
    // Context not available on non-app routes - this is normal
  }

  // Handle automatic retraction
  useEffect(() => {
    const scheduleRetraction = (delay) => {
      clearTimeout(retractionTimerRef.current);
      retractionTimerRef.current = setTimeout(() => {
        setIsRetracted(true);
      }, delay);
    };

    if (!isRetracted) {
      scheduleRetraction(6000);
    }

    const handleUserActivity = () => {
      if (!isRetracted) {
        scheduleRetraction(6000);
      }
    };

    const events = ['mousemove', 'click', 'keydown', 'scroll'];
    events.forEach(event => 
      document.addEventListener(event, handleUserActivity)
    );

    return () => {
      clearTimeout(retractionTimerRef.current);
      events.forEach(event => 
        document.removeEventListener(event, handleUserActivity)
      );
    };
  }, [isRetracted]);

  const handleShowHeader = () => {
    setIsRetracted(false);
    clearTimeout(retractionTimerRef.current);
    retractionTimerRef.current = setTimeout(() => {
      setIsRetracted(true);
    }, 30000);
  };

  // Handle navigation - simplified, no return value check
  const handleNavClick = (viewState) => {
    if (!viewContext) return;
    viewContext.switchView(viewState);
  };

  // Show navigation only when authenticated and context available
  const showNavigation = isAuthenticated && viewContext;

  return (
    <header className={`${styles.header} ${isRetracted ? styles.retracted : ''}`}>
      <div className={styles.leftSection}>
        <h1 className={styles.title}>AwakeVerse</h1>
        
        {/* Navigation tabs */}
        {showNavigation && (
          <nav className={styles.navigation}>
            <button
              className={`${styles.navTab} ${
                viewContext.currentView === viewContext.VIEW_STATES.CHAT ? styles.active : ''
              }`}
              onClick={() => handleNavClick(viewContext.VIEW_STATES.CHAT)}
            >
              <ChatIcon className={styles.navIcon} />
              <span className={styles.navLabel}>Chat</span>
            </button>
            <button
              className={`${styles.navTab} ${
                viewContext.currentView === viewContext.VIEW_STATES.MARKET_HUB ? styles.active : ''
              }`}
              onClick={() => handleNavClick(viewContext.VIEW_STATES.MARKET_HUB)}
            >
              <DiscoverIcon className={styles.navIcon} />
              <span className={styles.navLabel}>Discover</span>
            </button>

            <button 
              className={`${styles.navTab} ${
                viewContext.currentView === viewContext.VIEW_STATES.CREATOR_DASHBOARD ? styles.active : ''
              }`}
              onClick={() => handleNavClick(viewContext.VIEW_STATES.CREATOR_DASHBOARD)}
            >
              <CreateIcon className={styles.navIcon} />
              <span className={styles.navLabel}>Create</span>
            </button>

             <button
              className={`${styles.navTab} ${
                viewContext.currentView === viewContext.VIEW_STATES.SCENARIOS ? styles.active : ''
              }`}
              onClick={() => handleNavClick(viewContext.VIEW_STATES.SCENARIOS)}
            >
              <ScenariosIcon className={styles.navIcon} />
              <span className={styles.navLabel}>Scenarios</span>
            </button>
            <button
              className={`${styles.navTab} ${
                viewContext.currentView === viewContext.VIEW_STATES.STORY_MODE ? styles.active : ''
              }`}
              onClick={() => handleNavClick(viewContext.VIEW_STATES.STORY_MODE)}
            >
              <StoriesIcon className={styles.navIcon} />
              <span className={styles.navLabel}>Stories</span>
            </button>
          </nav>
        )}
      </div>

      <div className={styles.userSection}>
        <img
          src={user?.avatarUrl || `${API_BASE}/avatars/user_${user?.id || 'unknown'}_default.jpg`}
          alt={user?.displayName || 'User'}
          className={styles.avatar}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div className={styles.placeholder} style={{ display: 'none' }}>
          Profile
        </div>
        <ProfileButton />
      </div>
      
      {isRetracted && (
        <button 
          className={styles.showButton}
          onClick={handleShowHeader}
          aria-label="Show header"
          title="Click to show header"
        >
          ⋯
        </button>
      )}
    </header>
  );
}