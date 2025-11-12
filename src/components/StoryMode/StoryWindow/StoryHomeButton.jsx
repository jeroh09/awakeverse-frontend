import React from 'react';
import { Home } from 'lucide-react';
import './StoryHomeButton.css';

/**
 * StoryHomeButton — compact transparent Home icon for Story Window
 * @param {Function} onClick - navigate back to Story/Character selection
 */
export default function StoryHomeButton({ onClick }) {
  if (typeof onClick !== 'function') return null;

  return (
    <button
      className="story-home-button"
      onClick={onClick}
      title="Return Home"
      aria-label="Return Home"
    >
      <Home size={22} />
    </button>
  );
}
