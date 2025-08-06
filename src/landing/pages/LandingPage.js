// src/landing/pages/LandingPage.js - Complete Optimized Mobile-Enhanced Version
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
  
  // Typing animation state
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showInviteButtons, setShowInviteButtons] = useState(false);

  // ================================
  // MOBILE TOUCH GESTURE MODULE
  // ================================

  // Touch gesture state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);

  // Enhanced mobile navigation visibility
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Minimum distance for a swipe gesture (in pixels)
  const minSwipeDistance = 50;

  // ================================
  // PERFORMANCE OPTIMIZATIONS
  // ================================

  // Memoize getCharacter function
  const getCharacter = useCallback((key) => {
    for (const category of characterCategories) {
      const character = category.characters.find(c => c.key === key);
      if (character) return character;
    }
    return null;
  }, []);

  // Memoize chat conversations to prevent re-creation
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
  ], [getCharacter]);

  // ================================
  // EXISTING FUNCTIONALITY
  // ================================

  const fullMessage = "Aww shucks, not much I'm afraid! My village has always been peaceful, and I spent most of my time rafting down the Mississippi. But I reckon I could invite some folks who know a whole lot more about that subject than me!";

  // Auto-advance carousel with longer timing for screen 3
  useEffect(() => {
    if (isPaused || isTransitioning) return;
    
    // Longer delay for screen 3 to show typing animation
    const delay = currentScreen === 2 ? 18000 : 10000; // 18s for screen 3, 10s for others
    
    const interval = setInterval(() => {
      setCurrentScreen(prev => (prev + 1) % 3);
    }, delay);
    
    return () => clearInterval(interval);
  }, [isPaused, isTransitioning, currentScreen]);

  // Handle navigation to register
  const handleUserInteraction = useCallback(() => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000); // Resume after 5s
  }, []);

  // Typing animation for screen 3 - FIXED
  useEffect(() => {
    if (currentScreen === 2 && !isTyping && typedText === '') {
      // Add small delay to ensure screen is fully loaded
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
        }, 150); // Slightly faster typing
        
        return () => clearInterval(typeInterval);
      }, 500); // 500ms delay after screen loads
    }
  }, [currentScreen, typedText, fullMessage]);

  // Reset typing when leaving screen 3 - FIXED
  useEffect(() => {
    if (currentScreen !== 2) {
      setTypedText('');
      setIsTyping(false);
      setShowInviteButtons(false);
    }
  }, [currentScreen]);

  // Generate stars on mount - OPTIMIZED
  useEffect(() => {
    if (starsRef.current) {
      // Reduce star count on mobile for better performance
      const numberOfStars = window.innerWidth <= 768 ? 100 : 200; // Further reduced
      starsRef.current.innerHTML = '';
      
      // Use document fragment for better performance
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
  }, []);

  // ================================
  // TOUCH GESTURE HANDLERS
  // ================================

  // Handle touch start
  const onTouchStart = useCallback((e) => {
    // Only handle horizontal swipes, allow vertical scrolling
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(false);
  }, []);

  // Handle touch move
  const onTouchMove = useCallback((e) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const currentTouchY = e.targetTouches[0].clientY;
    const diffX = Math.abs(currentTouch - touchStart);
    
    // Get initial Y position for comparison
    const diffY = Math.abs(currentTouchY - (e.targetTouches[0].clientY || 0));
    
    // If horizontal movement is greater than vertical, prevent default to enable swipe
    if (diffX > diffY && diffX > 10) {
      setIsSwiping(true);
      // Only prevent default for horizontal swipes
      e.preventDefault();
    }
    
    setTouchEnd(currentTouch);
  }, [touchStart]);

  // Handle touch end - determine swipe direction
  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd || !isSwiping) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left = next screen
      nextScreen();
      handleUserInteraction();
    } else if (isRightSwipe) {
      // Swipe right = previous screen  
      prevScreen();
      handleUserInteraction();
    }

    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
    setIsSwiping(false);
  }, [touchStart, touchEnd, isSwiping, handleUserInteraction]);

  // ================================
  // NAVIGATION FUNCTIONS
  // ================================

  // Stable screen navigation with transition protection
  const navigateToScreen = useCallback((screenIndex) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      setCurrentScreen(screenIndex);
      handleUserInteraction();
      
      // Timeout for stability
      setTimeout(() => {
        setIsTransitioning(false);
      }, 1000);
    });
  }, [isTransitioning, handleUserInteraction]);

  const nextScreen = useCallback(() => {
    const next = (currentScreen + 1) % 3;
    navigateToScreen(next);
  }, [currentScreen, navigateToScreen]);

  const prevScreen = useCallback(() => {
    const prev = (currentScreen - 1 + 3) % 3;
    navigateToScreen(prev);
  }, [currentScreen, navigateToScreen]);

  // ================================
  // EVENT LISTENERS
  // ================================

  // Add touch event listeners to carousel
  useEffect(() => {
    const carousel = document.querySelector('.carousel-container');
    if (!carousel) return;

    // Add passive listeners for better performance
    carousel.addEventListener('touchstart', onTouchStart, { passive: true });
    carousel.addEventListener('touchmove', onTouchMove, { passive: false });
    carousel.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      carousel.removeEventListener('touchstart', onTouchStart);
      carousel.removeEventListener('touchmove', onTouchMove);
      carousel.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  // Show navigation on touch near edges (mobile)
  useEffect(() => {
    const handleTouchForNav = (e) => {
      if (window.innerWidth > 768) return; // Only on mobile
      
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const edgeThreshold = 50; // 50px from edge
      
      // Show nav if touching near right edge or bottom
      if (touch.clientX > screenWidth - edgeThreshold || 
          touch.clientY > window.innerHeight - 100) {
        setShowMobileNav(true);
        
        // Hide after 3 seconds
        setTimeout(() => setShowMobileNav(false), 3000);
      }
    };

    document.addEventListener('touchstart', handleTouchForNav, { passive: true });
    return () => document.removeEventListener('touchstart', handleTouchForNav);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        prevScreen();
      } else if (e.key === 'ArrowRight') {
        nextScreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [prevScreen, nextScreen]);

  // ================================
  // OPTIMIZED IMAGE COMPONENT
  // ================================

  // Track failed images globally to prevent reloading
  const [imageErrors, setImageErrors] = useState({});

  // Memoized image component to prevent reloading
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
        key={imageKey || src} // Stable key prevents reloading
        style={{ imageRendering: 'crisp-edges' }} // Prevent browser reprocessing
      />
    );
  });

  // ================================
  // RENDER
  // ================================

  return (
    <div 
      className="landing-container"
      onMouseMove={handleUserInteraction}
    >
      {/* Animated Stars */}
      <div className="stars" ref={starsRef}></div>

      {/* Mobile-Enhanced Carousel Container */}
      <div 
        className="carousel-container"
        style={{
          touchAction: 'pan-y pinch-zoom', // Allow vertical scroll, control horizontal
        }}
      >
        <div 
          className="carousel-track" 
          style={{ 
            transform: `translateX(-${currentScreen * 33.333}%)`,
            transition: isTransitioning ? 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
            touchAction: 'none', // Prevent default touch behavior on track
          }}
        >
          {/* Screen 1: Hero + Enhanced Character Panels */}
          <div className="carousel-slide" data-screen="0">
            <div className="screen-content">
              <div className="hero-content">
                <h1 className="logo">AWAKEVERSE</h1>
                <h2 className="main-tagline">
                  Solve mysteries with <span className="highlight-gold">Sherlock</span>, 
                  innovate with <span className="highlight-gold">Da Vinci</span>, 
                  explore love with <span className="highlight-gold">Helen</span>
                </h2>
                <p className="hero-subtitle">Chat with humanity's greatest minds - powwered by AI</p>
                
                <Link to="/register" className="cta-primary">
                  Start Your First Conversation
                </Link>
              </div>

              {/* Enhanced Character Panels with Category Flipping */}
              <EnhancedCharacterPanels />
            </div>
          </div>

          {/* Screen 2: Social Proof + Popular Conversations */}
          <div className="carousel-slide" data-screen="1">
            <div className="screen-content">
              <div className="social-proof-header">
                <div className="stars-rating">★★★★★</div>
                <p className="proof-text">Trusted by 15,000+ curious minds</p>
                <p className="tagline-below-rating">Get personalized advice from Sherlock, Sun Tzu, Plato, Tesla ...and 100s of the greatest minds</p>
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

          {/* Screen 3: Interactive Character Invitation Demo */}
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

      {/* Enhanced Mobile Navigation */}
      <div 
        className={`carousel-navigation ${showMobileNav ? 'mobile-visible' : ''}`}
        style={{
          opacity: window.innerWidth <= 768 ? (showMobileNav ? 1 : 0.3) : undefined
        }}
      >
        <button 
          className="nav-arrow nav-prev" 
          onClick={prevScreen}
          disabled={isTransitioning}
          aria-label="Previous screen"
          style={{
            fontSize: window.innerWidth <= 768 ? '1.4rem' : '1.2rem'
          }}
        >
          {window.innerWidth <= 768 ? '←' : '↑'}
        </button>
        
        <div className="carousel-dots">
          {[0, 1, 2].map((index) => (
            <button
              key={`dot-${index}`}
              className={`carousel-dot ${index === currentScreen ? 'active' : ''}`}
              onClick={() => navigateToScreen(index)}
              disabled={isTransitioning}
              aria-label={`Go to screen ${index + 1}`}
              style={{
                width: window.innerWidth <= 768 ? '12px' : '8px',
                height: window.innerWidth <= 768 ? '12px' : '8px'
              }}
            />
          ))}
        </div>
        
        <button 
          className="nav-arrow nav-next" 
          onClick={nextScreen}
          disabled={isTransitioning}
          aria-label="Next screen"
          style={{
            fontSize: window.innerWidth <= 768 ? '1.4rem' : '1.2rem'
          }}
        >
          {window.innerWidth <= 768 ? '→' : '↓'}
        </button>
      </div>
    </div>
  );
}