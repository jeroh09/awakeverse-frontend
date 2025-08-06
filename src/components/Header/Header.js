// src/components/Header/Header.js - MODIFIED: Retracts again after 30 sec
import { useState, useEffect, useRef } from 'react';
import styles from './Header.module.css';
import { useUser } from '../../contexts/UserContext';
import ProfileButton from '../ProfileButton';

export default function Header() {
  const { user } = useUser();
  const [isRetracted, setIsRetracted] = useState(false);
  const retractionTimerRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Handle automatic retraction
  useEffect(() => {
    const scheduleRetraction = (delay) => {
      clearTimeout(retractionTimerRef.current);
      retractionTimerRef.current = setTimeout(() => {
        setIsRetracted(true);
      }, delay);
    };

    // Initial retraction after 6 seconds
    if (!isRetracted) {
      scheduleRetraction(6000);
    }

    // Reset timer on user activity
    const handleUserActivity = () => {
      if (!isRetracted) {
        scheduleRetraction(6000);
      }
    };

    // Set up event listeners
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

  // Handle manual show and schedule next retraction
  const handleShowHeader = () => {
    setIsRetracted(false);
    // Schedule retraction again after 30 seconds
    clearTimeout(retractionTimerRef.current);
    retractionTimerRef.current = setTimeout(() => {
      setIsRetracted(true);
    }, 30000);
  };

  return (
    <header className={`${styles.header} ${isRetracted ? styles.retracted : ''}`}>
      <h1 className={styles.title}>Awakeverse</h1>
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