import React from 'react';
import { Home } from 'lucide-react';
import './FloatingControls.css';
/**
 * HomeButton - Floating home icon to return to ChatLauncher
 * 
 * @param {Function} onClick - Navigate back to ChatLauncher
 * @param {string} theme - 'light' or 'awakeverse'
 */
export default function HomeButton({
  onClick,
  theme = 'light'
}) {
  // Defensive: Guard against missing onClick
  if (!onClick || typeof onClick !== 'function') {
    console.error('❌ HomeButton: onClick prop is required');
    return null;
  }

  return (
    <button
      className={`floating-home-button theme-${theme}`}
      onClick={onClick}
      title="Return to Chat Launcher"
      aria-label="Return to Chat Launcher"
    >
      <Home size={24} />
    </button>
  );
}