// src/components/StoryMode/ScrollToMyStories.jsx
import React, { useState } from 'react';
import './ScrollToMyStories.css';

export default function ScrollToMyStories() {
  const [isHovered, setIsHovered] = useState(false);

  const handleScrollToStories = () => {
    const myStoriesSection = document.querySelector('.myStoriesPanel');
    
    if (myStoriesSection) {
      // Smooth scroll to My Stories section
      myStoriesSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      console.log('📚 Scrolled to My Stories section');
    } else {
      console.warn('⚠️ My Stories section not found');
    }
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