// src/landing/components/CreatorSection.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/creator.css';

const creators = [
  {
    name: 'Rachael Chen',
    image: '/images/rachael.jpg',
    category: 'Philosophy Characters',
    earnings: '$247/month',
    characters: '8 characters',
    badge: 'Rising Star',
    quote: 'My Socrates character reached 10K chats in the first month'
  },
  {
    name: 'Alexandra Torres',
    image: '/images/alexandra.jpg',
    category: 'Science Educators',
    earnings: '$389/month',
    characters: '5 characters',
    badge: 'Veteran Creator',
    quote: 'Creating Marie Curie has become my creative passion project'
  },
  {
    name: 'Simon Blackwell',
    image: '/images/simon.jpg',
    category: 'Historical Figures',
    earnings: '$156/month',
    characters: '3 characters',
    badge: 'Trending',
    quote: 'I earned my first $100 in just 3 weeks'
  },
  {
    name: 'Maya Patel',
    image: '/images/maya.jpg',
    category: 'Literary Characters',
    earnings: '$312/month',
    characters: '6 characters',
    badge: 'Top Creator',
    quote: 'Building Shakespeare and Austen characters has been incredibly rewarding'
  },
  {
    name: 'James Morrison',
    image: '/images/james.jpg',
    category: 'Business Mentors',
    earnings: '$198/month',
    characters: '4 characters',
    badge: 'Rising Star',
    quote: 'My entrepreneur characters help thousands learn business skills'
  },
  {
    name: 'Sofia Rodriguez',
    image: '/images/sofia.jpg',
    category: 'Art & Culture',
    earnings: '$425/month',
    characters: '9 characters',
    badge: 'Elite Creator',
    quote: 'From Da Vinci to Frida Kahlo, bringing art history to life'
  }
];

export default function CreatorSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % creators.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % creators.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + creators.length) % creators.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentCreator = creators[currentIndex];

  return (
    <section id="creator" className="creator-section">
      <div className="creator-container">
        
        {/* Section Header */}
        <div className="creator-header">
          <h2 className="creator-title">Meet Our Top Creators</h2>
          <p className="creator-subtitle">
            Real people building successful character portfolios
          </p>
        </div>

        {/* Carousel */}
        <div className="creator-carousel">

          {/* Carousel Track */}
          <div className="creator-track">
            <div 
              className="creator-slides"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {creators.map((creator, index) => (
                <div key={index} className="creator-slide">
                  <div className="creator-card">
                    
                    {/* Creator Image */}
                    <div className="creator-image-wrapper">
                      <img
                        src={creator.image}
                        alt={creator.name}
                        className="creator-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="creator-image-fallback">
                        {creator.name.charAt(0)}
                      </div>
                      <div className="creator-badge">{creator.badge}</div>
                    </div>
                    
                    {/* Creator Info */}
                    <div className="creator-info">
                      <h3 className="creator-name">{creator.name}</h3>
                      <p className="creator-category">{creator.category}</p>
                      
                      <div className="creator-stats">
                        <span className="creator-earnings">{creator.earnings}</span>
                        <span className="creator-divider">•</span>
                        <span className="creator-characters">{creator.characters}</span>
                      </div>
                      
                      <p className="creator-quote">"{creator.quote}"</p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Navigation Dots */}
        <div className="creator-dots">
          {creators.map((_, index) => (
            <button
              key={index}
              className={`creator-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to creator ${index + 1}`}
            />
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="creator-ctas">
          <Link to="/register" className="creator-cta primary">
             Chat
            <span>→</span>
          </Link>
          <Link to="/register" className="creator-cta secondary">
            Create
            <span>→</span>
          </Link>
        </div>

      </div>
    </section>
  );
}