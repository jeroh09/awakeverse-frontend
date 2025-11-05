// src/components/Header/Header.js - Fixed navigation following AppViewContext pattern
import { useState, useEffect, useRef } from 'react';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppView } from '../../contexts/AppViewContext';
import ProfileButton from '../ProfileButton';

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
              Chat
            </button>
            <button 
              className={`${styles.navTab} ${
                viewContext.currentView === viewContext.VIEW_STATES.MARKET_HUB ? styles.active : ''
              }`}
              onClick={() => handleNavClick(viewContext.VIEW_STATES.MARKET_HUB)}
            >
              Discover
            </button>
            <button 
              className={`${styles.navTab} ${
                viewContext.currentView === viewContext.VIEW_STATES.CREATOR_DASHBOARD ? styles.active : ''
              }`}
              onClick={() => handleNavClick(viewContext.VIEW_STATES.CREATOR_DASHBOARD)}
            >
              Create
            </button>
            <button 
              className={`${styles.navTab} ${
                viewContext.currentView === viewContext.VIEW_STATES.SCENARIOS ? styles.active : ''
              }`}
              onClick={() => handleNavClick(viewContext.VIEW_STATES.SCENARIOS)}
            >
              Scenarios
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