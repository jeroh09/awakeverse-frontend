// src/landing/pages/LandingPage.js - Fixed Header + Mobile Vertical Scroll
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { characterCategories } from '../../data/characterCategories';
import EnhancedCharacterPanels from '../components/EnhancedCharacterPanels';
import './LandingPage.css';

export default function LandingPage() {
  const starsRef = useRef(null);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Typing animation state
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showInviteButtons, setShowInviteButtons] = useState(false);

  // Touch gesture state (only for desktop carousel)
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle logo visibility based on current screen (desktop only)
  useEffect(() => {
    if (isMobile) return; // Logo always visible on mobile
    
    const logo = document.querySelector('.logo');
    if (logo) {
      if (currentScreen === 0) {
        logo.style.opacity = '1';
        logo.style.pointerEvents = 'auto';
      } else {
        logo.style.opacity = '0';
        logo.style.pointerEvents = 'none';
      }
    }
  }, [currentScreen, isMobile]);

  // Performance optimizations
  const getCharacter = useCallback((key) => {
    for (const category of characterCategories) {
      const character = category.characters.find(c => c.key === key);
      if (character) return character;
    }
    return null;
  }, []);

  // Memoize chat conversations
  const chatConversations = useMemo(() => [
    {
      character: getCharacter('socrates'),
      messages: [
        { user: true, text: "What is the meaning of life?" },
        { user: false, text: "My dear friend, the unexamined life is not worth living. True wisdom begins when we admit how little we know. Perhaps the meaning lies not in answers, but in the quality of our questions." }
      ]
    },
    {
      character: getCharacter('shakespeare'),
      messages: [
        { user: true, text: "How do I write better?" },
        { user: false, text: "All the world's a stage, good sir! Write from the heart's deepest chambers. Observe humanity in all its folly and glory - therein lies your material. A well-turned phrase can outlive kingdoms." }
      ]
    },
    {
      character: getCharacter('tesla'),
      messages: [
        { user: true, text: "What drives innovation?" },
        { user: false, text: "The present belongs to them, but the future, for which I really worked, is mine. Innovation springs from seeing what others cannot - the invisible forces that shape our world." }
      ]
    }
    // Third example hidden on mobile via CSS, but available on desktop
  ], [getCharacter]);

  const fullMessage = "Aww shucks, not much I'm afraid! My village has always been peaceful, and I spent most of my time rafting down the Mississippi. But I reckon I could invite some folks who know a whole lot more about that subject than me!";

  // DESKTOP ONLY: Auto-advance carousel
  useEffect(() => {
    if (isMobile || isPaused || isTransitioning) return;

    const delay = currentScreen === 2 ? 18000 : 10000;
    const interval = setInterval(() => {
      setCurrentScreen(prev => (prev + 1) % 3);
    }, delay);

    return () => clearInterval(interval);
  }, [isMobile, isPaused, isTransitioning, currentScreen]);

  // Handle user interaction
  const handleUserInteraction = useCallback(() => {
    if (!isMobile) {
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 5000);
    }
  }, [isMobile]);

  // Typing animation for screen 3
  useEffect(() => {
    if (currentScreen === 2 && !isTyping && typedText === '') {
      setTimeout(() => {
        setIsTyping(true);
        setShowInviteButtons(false);

        const words = fullMessage.split(' ');
        let currentIndex = 0;

        const typeInterval = setInterval(() => {
          if (currentIndex < words.length) {
            const newText = words.slice(0, currentIndex + 1).join(' ');
            setTypedText(newText);
            currentIndex++;
          } else {
            clearInterval(typeInterval);
            setIsTyping(false);
            setTimeout(() => setShowInviteButtons(true), 800);
          }
        }, 150);

        return () => clearInterval(typeInterval);
      }, 500);
    }
  }, [currentScreen, typedText, fullMessage]);

  // Reset typing when leaving screen 3
  useEffect(() => {
    if (currentScreen !== 2) {
      setTypedText('');
      setIsTyping(false);
      setShowInviteButtons(false);
    }
  }, [currentScreen]);

  // Generate stars with mobile optimization
  useEffect(() => {
    if (starsRef.current) {
      const numberOfStars = isMobile ? 80 : 200;
      starsRef.current.innerHTML = '';

      const fragment = document.createDocumentFragment();

      for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 4 + 's';
        star.style.animationDuration = (2 + Math.random() * 3) + 's';

        const brightness = 0.4 + Math.random() * 0.6;
        star.style.opacity = brightness;

        fragment.appendChild(star);
      }

      starsRef.current.appendChild(fragment);
    }
  }, [isMobile]);

  // DESKTOP ONLY: Touch gesture handlers
  const onTouchStart = useCallback((e) => {
    if (isMobile) return; // Disable for mobile vertical scroll
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, [isMobile]);

  const onTouchMove = useCallback((e) => {
    if (isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  }, [isMobile]);

  const onTouchEnd = useCallback(() => {
    if (isMobile || !touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextScreen();
    } else if (distance < -minSwipeDistance) {
      prevScreen();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [isMobile, touchStart, touchEnd]);

  // Navigation functions (desktop only)
  const navigateToScreen = useCallback((screenIndex) => {
    if (isMobile || isTransitioning) return;

    setIsTransitioning(true);
    setCurrentScreen(screenIndex);
    handleUserInteraction();

    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  }, [isMobile, isTransitioning, handleUserInteraction]);

  const nextScreen = useCallback(() => {
    if (isMobile) return;
    const next = (currentScreen + 1) % 3;
    navigateToScreen(next);
  }, [isMobile, currentScreen, navigateToScreen]);

  const prevScreen = useCallback(() => {
    if (isMobile) return;
    const prev = (currentScreen - 1 + 3) % 3;
    navigateToScreen(prev);
  }, [isMobile, currentScreen, navigateToScreen]);

  // MOBILE: Scroll to section function
  const scrollToSection = useCallback((sectionIndex) => {
    if (!isMobile) return;
    
    const sections = document.querySelectorAll('.carousel-slide');
    if (sections[sectionIndex]) {
      sections[sectionIndex].scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setCurrentScreen(sectionIndex);
    }
  }, [isMobile]);

  // Touch event listeners (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const carousel = document.querySelector('.carousel-container');
    if (!carousel) return;

    carousel.addEventListener('touchstart', onTouchStart, { passive: true });
    carousel.addEventListener('touchmove', onTouchMove, { passive: true });
    carousel.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      carousel.removeEventListener('touchstart', onTouchStart);
      carousel.removeEventListener('touchmove', onTouchMove);
      carousel.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile, onTouchStart, onTouchMove, onTouchEnd]);

  // Keyboard navigation (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        prevScreen();
      } else if (e.key === 'ArrowRight') {
        nextScreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isMobile, prevScreen, nextScreen]);

  // MOBILE: Intersection Observer for current screen tracking
  useEffect(() => {
    if (!isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const screenIndex = parseInt(entry.target.dataset.screen);
            setCurrentScreen(screenIndex);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = document.querySelectorAll('.carousel-slide');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [isMobile]);

  // Optimized image component
  const [imageErrors, setImageErrors] = useState({});

  const OptimizedImage = React.memo(({ src, alt, className, fallbackLetter, imageKey }) => {
    const hasError = imageErrors[imageKey || src];

    const handleError = useCallback(() => {
      const key = imageKey || src;
      setImageErrors(prev => ({ ...prev, [key]: true }));
    }, [imageKey, src]);

    if (hasError) {
      return (
        <div className={`${className}-fallback`} style={{ display: 'flex' }}>
          {fallbackLetter}
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
        loading="lazy"
        draggable={false}
        key={imageKey || src}
        style={{ imageRendering: 'crisp-edges' }}
      />
    );
  });

  return (
    <div
      className="landing-container"
      onMouseMove={!isMobile ? handleUserInteraction : undefined}
    >
      {/* Animated Stars */}
      <div className="stars" ref={starsRef}></div>

      {/* FIXED: Top-left logo - Always visible */}
      <h1 className="logo">AwakeVerse</h1>

      {/* Mobile/Desktop Responsive Carousel Container */}
      <div className="carousel-container">
        <div
          className="carousel-track"
          style={{
            // Desktop: horizontal carousel, Mobile: vertical stack
            transform: isMobile ? 'none' : `translateX(-${currentScreen * 33.333}%)`,
            transition: !isMobile && isTransitioning ? 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }}
        >
          {/* Screen 1: Hero + Character Panels */}
          <div className="carousel-slide" data-screen="0">
            <div className="screen-content">
              <div className="hero-content">
                {/* NEW: Main hero headline */}
                <h2 className="main-hero-headline">
                  Conversations without Limits {isMobile ? '- AI Powered' : '- Powered by AI'}
                </h2>
                
                {/* DEMOTED: Secondary tagline */}
                <h3 className="secondary-tagline">
                  Solve mysteries with <span className="highlight-gold">Sherlock</span>,
                  innovate with <span className="highlight-gold">Da Vinci</span>,
                  explore love with <span className="highlight-gold">Helen</span>
                </h3>

                <Link to="/register" className="cta-primary">
                  Start Your First Conversation
                </Link>
              </div>

              {/* Enhanced Character Panels */}
              <EnhancedCharacterPanels />
            </div>
          </div>

          {/* Screen 2: Social Proof + Conversations */}
          <div className="carousel-slide" data-screen="1">
            <div className="screen-content">
              <div className="social-proof-header">
                <div className="stars-rating">★★★★★</div>
                <p className="proof-text">Trusted by 15,000+ curious minds</p>
                <p className="tagline-below-rating">
                  Get personalized advice from Sherlock, Sun Tzu, Plato, Tesla ...and 100s of the greatest minds
                </p>
              </div>

              <div className="conversations-content">
                <h2 className="conversation-examples-title">
                  <em>Chat with Casanova</em>, <em>Debate ethics with Nietzsche</em>, <em>Decide strategy with Zhukov</em>
                </h2>

                <div className="chat-examples">
                  {chatConversations.map((chat, index) => (
                    <div key={`chat-${chat.character?.key || index}`} className="chat-example">
                      <div className="chat-header">
                        <OptimizedImage
                          src={chat.character?.thumbnailUrl}
                          alt={chat.character?.name || 'Character'}
                          className="chat-avatar"
                          fallbackLetter={chat.character?.name?.charAt(0) || 'C'}
                          imageKey={`chat-avatar-${chat.character?.key || index}`}
                        />
                        <span className="chat-character-name">{chat.character?.name || 'Character'}</span>
                      </div>
                      <div className="chat-messages">
                        {chat.messages.map((message, msgIndex) => (
                          <div
                            key={`msg-${index}-${msgIndex}`}
                            className={`chat-message ${message.user ? 'user' : 'ai'}`}
                          >
                            <div className="message-bubble">
                              {message.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Screen 3: Interactive Invitation Demo */}
          <div className="carousel-slide" data-screen="2">
            <div className="screen-content">
              <h2 className="section-title">Invite Experts to Join</h2>
              <p className="invitation-subtitle">Characters can invite others with specialized knowledge</p>

              <div className="invitation-demo">
                <div className="demo-chat">
                  <div className="chat-header">
                    <OptimizedImage
                      src={getCharacter('huckleberry_finn')?.thumbnailUrl || '/images/huckleberry_finn.jpg'}
                      alt="Huckleberry Finn"
                      className="chat-avatar"
                      fallbackLetter="H"
                      imageKey="huckleberry-finn-avatar"
                    />
                    <div className="chat-info">
                      <span className="chat-name">Huckleberry Finn</span>
                      <span className="chat-status">Online</span>
                    </div>
                  </div>

                  <div className="chat-messages">
                    <div className="chat-message user">
                      <div className="message-bubble">
                        What do you know about military strategy and warfare?
                      </div>
                    </div>

                    <div className="chat-message ai">
                      <div className="message-bubble">
                        {typedText}
                        {isTyping && <span className="typing-cursor">|</span>}
                      </div>
                    </div>

                    {showInviteButtons && (
                      <div className="invite-suggestions">
                        <p className="invite-text">Would you like me to invite some military experts?</p>
                        <div className="invite-buttons">
                          <Link to="/register" className="invite-button">
                            <OptimizedImage
                              src={getCharacter('sun_tzu')?.thumbnailUrl || '/images/sun_tzu.jpg'}
                              alt="Sun Tzu"
                              className="invite-avatar"
                              fallbackLetter="S"
                              imageKey="sun-tzu-invite"
                            />
                            Invite Sun Tzu
                          </Link>
                          <Link to="/register" className="invite-button">
                            <OptimizedImage
                              src={getCharacter('georgy_zhukov')?.thumbnailUrl || '/images/georgy_zhukov.jpg'}
                              alt="Georgy Zhukov"
                              className="invite-avatar"
                              fallbackLetter="Z"
                              imageKey="georgy-zhukov-invite"
                            />
                            Invite Zhukov
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="demo-explanation">
                  <h3>How It Works</h3>
                  <ul>
                    <li>Characters recognize when topics are outside their expertise</li>
                    <li>They can suggest and invite relevant experts to join the conversation</li>
                    <li>Multiple historical figures can participate in the same discussion</li>
                    <li>Get diverse perspectives on complex topics</li>
                  </ul>

                  <Link to="/register" className="start-exploring">
                    Start Exploring →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation - Desktop carousel / Mobile section jumper */}
      <div className="carousel-navigation">
        <button
          className="nav-arrow nav-prev"
          onClick={isMobile ? () => scrollToSection(Math.max(0, currentScreen - 1)) : prevScreen}
          disabled={(!isMobile && isTransitioning) || (isMobile && currentScreen === 0)}
          aria-label="Previous screen"
        >
          {isMobile ? '↑' : '↑'}
        </button>

        <div className="carousel-dots">
          {[0, 1, 2].map((index) => (
            <button
              key={`dot-${index}`}
              className={`carousel-dot ${index === currentScreen ? 'active' : ''}`}
              onClick={isMobile ? () => scrollToSection(index) : () => navigateToScreen(index)}
              disabled={!isMobile && isTransitioning}
              aria-label={`Go to screen ${index + 1}`}
            />
          ))}
        </div>

        <button
          className="nav-arrow nav-next"
          onClick={isMobile ? () => scrollToSection(Math.min(2, currentScreen + 1)) : nextScreen}
          disabled={(!isMobile && isTransitioning) || (isMobile && currentScreen === 2)}
          aria-label="Next screen"
        >
          {isMobile ? '↓' : '↓'}
        </button>
      </div>
    </div>
  );
}