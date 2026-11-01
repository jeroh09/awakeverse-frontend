// src/components/ScenariosTab/TemplatesGallery/ScrollToMyDialogues.jsx
import React, { useState } from 'react';
import './ScrollToMyDialogues.css';

export default function ScrollToMyDialogues() {
  const [isHovered, setIsHovered] = useState(false);

  const handleScrollToDialogues = () => {
    const myDialoguesSection = document.querySelector('.my-scenarios-panel');
    
    if (myDialoguesSection) {
      // Smooth scroll to My Dialogues section
      myDialoguesSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      console.log('📜 Scrolled to My Dialogues section');
    } else {
      console.warn('⚠️ My Dialogues section not found');
    }
  };

  return (
    <div 
      className="scroll-to-dialogues"
      onClick={handleScrollToDialogues}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-label="Scroll to My Dialogues"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleScrollToDialogues();
        }
      }}
    >
      {/* Arrow Icon */}
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
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Text Label - Shows on hover */}
      <div className={`scroll-label ${isHovered ? 'visible' : ''}`}>
        My Dialogues
      </div>
    </div>
  );
}