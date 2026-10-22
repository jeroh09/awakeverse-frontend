// src/landing/components/CreatorShowcase.jsx
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const CreatorShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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

  // Color schemes for each card
  const colorSchemes = [
    { // Card 1 - Blue/Purple
      background: 'rgba(79, 70, 229, 0.08)',
      border: '1px solid rgba(79, 70, 229, 0.3)',
      shadow: '0 8px 32px rgba(79, 70, 229, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      hoverShadow: '0 16px 48px rgba(79, 70, 229, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
    },
    { // Card 2 - Gold
      background: 'rgba(255, 215, 0, 0.08)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      shadow: '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 1px 0 rgba(255, 215, 0, 0.1)',
      hoverShadow: '0 16px 48px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.15)',
    },
    { // Card 3 - White/Silver
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      shadow: '0 8px 32px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      hoverShadow: '0 16px 48px rgba(255, 255, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    },
    { // Card 4 - Deep Blue
      background: 'rgba(59, 130, 246, 0.08)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      shadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(59, 130, 246, 0.1)',
      hoverShadow: '0 16px 48px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(59, 130, 246, 0.15)',
    },
    { // Card 5 - Orange Gold
      background: 'rgba(255, 165, 0, 0.08)',
      border: '1px solid rgba(255, 165, 0, 0.3)',
      shadow: '0 8px 32px rgba(255, 165, 0, 0.2), inset 0 1px 0 rgba(255, 165, 0, 0.1)',
      hoverShadow: '0 16px 48px rgba(255, 165, 0, 0.3), inset 0 1px 0 rgba(255, 165, 0, 0.15)',
    },
    { // Card 6 - Purple/White gradient
      background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)',
      border: '1px solid rgba(124, 58, 237, 0.3)',
      shadow: '0 8px 32px rgba(124, 58, 237, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      hoverShadow: '0 16px 48px rgba(124, 58, 237, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
    },
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % creators.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, creators.length]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % creators.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + creators.length) % creators.length);
  };

  const goToSlide = (index) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section style={styles.section}>
      <div style={styles.sectionContent}>
        <div style={styles.header}>
          <Star size={28} style={{ color: '#4f46e5' }} />
          <h2 style={styles.title}>Meet Our Top Creators</h2>
        </div>
        <p style={styles.subtitle}>
          Real people building successful character portfolios
        </p>
        
        <div style={styles.carouselContainer}>
          <button 
            style={{...styles.navButton, left: '0'}}
            onClick={prevSlide}
            aria-label="Previous creator"
          >
            ‹
          </button>

          <div style={styles.carouselTrack}>
            <div 
              style={{ 
                ...styles.carouselSlides,
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {creators.map((creator, index) => {
                const colorScheme = colorSchemes[index % 6];
                
                return (
                  <div key={index} style={styles.slide}>
                    <div 
                      style={{
                        ...styles.card,
                        background: colorScheme.background,
                        border: colorScheme.border,
                        boxShadow: colorScheme.shadow,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = colorScheme.hoverShadow;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = colorScheme.shadow;
                      }}
                    >
                      <div style={styles.imageWrapper}>
                        <img
                          src={creator.image}
                          alt={creator.name}
                          style={styles.image}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect fill="%23334155" width="120" height="120"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff" font-size="14"%3ECreator%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div style={styles.badge}>{creator.badge}</div>
                      </div>
                      
                      <div style={styles.info}>
                        <h3 style={styles.name}>{creator.name}</h3>
                        <p style={styles.category}>{creator.category}</p>
                        
                        <div style={styles.stats}>
                          <span style={styles.earnings}>{creator.earnings}</span>
                          <span style={styles.divider}>•</span>
                          <span style={styles.characters}>{creator.characters}</span>
                        </div>
                        
                        <p style={styles.quote}>"{creator.quote}"</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            style={{...styles.navButton, right: '0'}}
            onClick={nextSlide}
            aria-label="Next creator"
          >
            ›
          </button>
        </div>

        <div style={styles.indicators}>
          {creators.map((_, index) => (
            <button
              key={index}
              style={{
                ...styles.dot,
                ...(index === currentIndex ? styles.dotActive : {})
              }}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button 
          style={styles.playButton}
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        >
          {isAutoPlaying ? 'Pause' : 'Play'} Auto-scroll
        </button>
      </div>
    </section>
  );
};

const styles = {
  section: {
    padding: '80px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  sectionContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '42px',
    fontWeight: '700',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',

    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
  },
  subtitle: {
    fontSize: '18px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '60px',
    fontStyle: 'italic',
  },
  carouselContainer: {
    position: 'relative',
    maxWidth: '800px',
    margin: '40px auto 0',
    padding: '0 60px',
  },
  carouselTrack: {
    overflow: 'hidden',
    borderRadius: '20px',
    border: '3px solid #FFD700',
    boxShadow: '0 0 50px rgba(255, 215, 0, 0.4)',
  },
  carouselSlides: {
    display: 'flex',
    transition: 'transform 0.5s ease-in-out',
  },
  slide: {
    minWidth: '100%',
    flexShrink: 0,
  },
  card: {
    borderRadius: '20px',
    padding: '32px',
    margin: '0 auto',
    maxWidth: '100%',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
  },
  imageWrapper: {
    position: 'relative',
    width: '120px',
    height: '120px',
    margin: '0 auto 24px',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid rgba(255, 238, 2, 1)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
  },
  badge: {
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '12px',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
  },
  info: {
    textAlign: 'center',
  },
  name: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '8px',
  },
  category: {
    fontSize: '13px',
    color: '#E2E8F0',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  earnings: {
    color: '#4ade80',
    fontWeight: '700',
  },
  divider: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  characters: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quote: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    lineHeight: '1.6',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    fontSize: '28px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  indicators: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '32px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.3)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
  },
  dotActive: {
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    width: '32px',
    borderRadius: '6px',
    boxShadow: '0 0 12px rgba(255, 215, 0, 0.6)',
  },
  playButton: {
    display: 'block',
    margin: '24px auto 0',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'rgba(255, 255, 255, 0.7)',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default CreatorShowcase;