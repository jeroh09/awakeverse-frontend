// src/landing/pages/LandingPage.jsx - Updated
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

// Import styles
import '../styles/landing.css';

// Component imports
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import FeaturesCarousel from '../components/FeaturesCarousel';
import PillarsSection from '../components/PillarsSection';
import CreatorSection from '../components/CreatorSection'; // Now imported
import Footer from '../components/Footer';

export default function LandingPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track current section on scroll (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const viewportHeight = window.innerHeight;
      const section = Math.round(scrollPosition / viewportHeight);
      setCurrentSection(section);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Scroll to specific section
  const scrollToSection = useCallback((sectionIndex) => {
    const targetY = sectionIndex * window.innerHeight;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  }, []);

  return (
    <div className="landing-page">
      
      {/* Header Navigation */}
      <Header />
      
      {/* Section 1: Hero */}
      <HeroSection />

      {/* Section 2: Features Carousel */}
      <FeaturesCarousel />

      {/* Section 3: Four Pillars */}
      <PillarsSection />

      {/* Section 4: Creator Economy */}
      <CreatorSection />

      {/* Section Navigation Dots (Desktop) */}
      {!isMobile && (
        <div className="section-nav">
          <div 
            className={`section-nav-dot ${currentSection === 0 ? 'active' : ''}`}
            onClick={() => scrollToSection(0)}
            aria-label="Go to Hero section"
          />
          <div 
            className={`section-nav-dot ${currentSection === 1 ? 'active' : ''}`}
            onClick={() => scrollToSection(1)}
            aria-label="Go to Features section"
          />
          <div 
            className={`section-nav-dot ${currentSection === 2 ? 'active' : ''}`}
            onClick={() => scrollToSection(2)}
            aria-label="Go to Pillars section"
          />
          <div 
            className={`section-nav-dot ${currentSection === 3 ? 'active' : ''}`}
            onClick={() => scrollToSection(3)}
            aria-label="Go to Creator section"
          />
        </div>
      )}
      <Footer />
    </div>
  );
}