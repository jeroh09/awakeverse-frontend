// src/components/StoryMode/ScrollToMyStories.jsx
// SIMPLE VERSION - Just scrolls to bottom of page
import React, { useState } from 'react';
import './ScrollToMyStories.css';

export default function ScrollToMyStories() {
  const [isHovered, setIsHovered] = useState(false);

  const handleScrollToStories = () => {
    // Simple: Just scroll to bottom of page
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
    
    console.log('📚 Scrolled to bottom (My Stories)');
  };

  return (
    <div 
      className="scroll-to-stories"
      onClick={handleScrollToStories}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-label="Scroll to My Stories"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleScrollToStories();
        }
      }}
    >
      {/* Down Arrow Icon */}
      <div className="scroll-arrow-icon">
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Down arrow */}
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Text Label - Shows below button */}
      <div className={`scroll-label ${isHovered ? 'visible' : ''}`}>
        View My Stories
      </div>
    </div>
  );
}