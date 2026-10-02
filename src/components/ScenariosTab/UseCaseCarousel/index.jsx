// src/components/ScenariosTab/UseCaseCarousel/index.jsx - COMPACT BANNER VERSION
import React, { useState, useEffect } from 'react';
import './UseCaseCarousel.css';

const USE_CASES = [
  'Creative Writing',
  'Storyboarding',
  'Critical Thinking',
  'Philosophy Study',
  'Business Strategy',
  'Scientific Discourse',
  'Educational Research',
  'Ethical Dilemmas',
  'Character Development',
  'World Building'
];

export default function UseCaseCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % USE_CASES.length);
    }, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="use-case-banner">
      <span className="banner-label">Use for:</span>
      <div className="banner-carousel">
        <span className="banner-item" key={currentIndex}>
          {USE_CASES[currentIndex]}
        </span>
      </div>
    </div>
  );
}