// src/components/ScenariosTab/ScenarioChatWindow/MobileBackButton/index.jsx
// Mobile-only back button for chat header

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './MobileBackButton.module.css';

/**
 * MobileBackButton - Back button for mobile header
 * Only visible on mobile (< 768px)
 * 
 * @param {Function} onClick - Navigate back handler
 */
export default function MobileBackButton({ onClick }) {
  // Defensive: Validate onClick
  if (!onClick || typeof onClick !== 'function') {
    console.error('❌ MobileBackButton: onClick is required');
    return null;
  }

  return (
    <button
      className={styles.mobileBackButton}
      onClick={onClick}
      aria-label="Go back to scenarios"
      type="button"
    >
      <ArrowLeft size={20} />
      <span className={styles.backText}>Back</span>
    </button>
  );
}