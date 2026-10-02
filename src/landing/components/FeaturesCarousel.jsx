// src/landing/components/FeaturesCarousel.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/features.css';

const features = [
  {
    id: 'scenarios',
    title: 'Scenarios',
    subtitle: 'Create Custom Conversation Experiences',
    description: 'Design multi-character scenarios for specific goals - debate panels, expert consultations, historical councils, and more.',
    image: '/images/carousel-scenarios.jpeg',
    cta: 'Explore Scenarios'
  },
  {
    id: 'stories',
    title: 'Stories',
    subtitle: 'Structured Narrative Adventures',
    description: 'Immersive story-driven experiences where your choices shape the narrative alongside historical characters.',
    image: '/images/carousel-stories.jpeg',
    cta: 'Start a Story'
  },
  {
    id: 'markethub',
    title: 'Market Hub',
    subtitle: 'Discover & Publish Characters',
    description: 'Browse thousands of AI characters created by the community. Publish your own and earn based on engagement.',
    image: '/images/carousel-markethub.jpeg',
    cta: 'Visit Market Hub'
  }
];

export default function FeaturesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Navigate to specific slide
  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false); // Pause auto-play when user manually navigates
    
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentFeature = features[currentIndex];

  return (
    <section id="features" className="features-section">
      <div className="features-container">
        
        {/* Section Header */}
        <div className="features-header">
          <h2 className="features-title">Explore the Possibilities</h2>
          <p className="features-subtitle">
            Three powerful ways to engage with AI characters
          </p>
        </div>

        {/* Carousel */}
        <div className="carousel-wrapper">
          
          {/* Feature Image */}
          <div className="feature-image-container">
            <img
              src={currentFeature.image}
              alt={currentFeature.title}
              className="feature-image"
              key={currentFeature.id}
            />
          </div>

          {/* Feature Content */}
          <div className="feature-content" key={currentFeature.id}>
            <h3 className="feature-title">{currentFeature.title}</h3>
            <p className="feature-subtitle">{currentFeature.subtitle}</p>
            <p className="feature-description">{currentFeature.description}</p>
            
            <Link to="/register" className="feature-cta">
              {currentFeature.cta}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Navigation Dots */}
          <div className="carousel-dots">
            {features.map((feature, index) => (
              <button
                key={feature.id}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to ${feature.title}`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}