// src/landing/pages/LandingPage.js - Desktop + Mobile Streaming Design
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
  const [isResizing, setIsResizing] = useState(false);

  // Mobile-specific state
  const [currentPanel, setCurrentPanel] = useState(0);

  // Typing animation state (mobile)
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showInviteButtons, setShowInviteButtons] = useState(false);

  // Touch gesture state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Mobile detection with smooth transition
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      if (mobile !== isMobile) {
        setIsResizing(true);
        setTimeout(() => {
          setIsMobile(mobile);
          setIsResizing(false);
        }, 150);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Get character by key
  const getCharacter = useCallback((key) => {
    for (const category of characterCategories) {
      const character = category.characters.find(c => c.key === key);
      if (character) return character;
    }
    return null;
  }, []);

  // Mobile panel configuration
  const mobilePanels = useMemo(() => [
    {
      character: getCharacter('sherlock'),
      theme: 'night-sky',
      tagline: 'Master observation, deduction & justice',
      icons: ['🔍', '⚖️', '🕵️', '🔬']
    },
    {
      character: getCharacter('shakespeare'),
      theme: 'crimson-mystery',
      tagline: 'Explore drama, poetry & human nature',
      icons: ['🎭', '📜', '👑', '✒️']
    },
    {
      character: getCharacter('cleopatra'),
      theme: 'emerald-depths',
      tagline: 'Discover power, strategy & leadership',
      icons: ['👑', '🐍', '💎', '🏛️']
    },
    {
      character: getCharacter('da_vinci'),
      theme: 'royal-purple',
      tagline: 'Unlock creativity, innovation & genius',
      icons: ['🎨', '⚙️', '🔬', '✈️']
    },
    {
      character: getCharacter('sappho'),
      theme: 'golden-wisdom',
      tagline: 'Explore love, poetry & passion',
      icons: ['💕', '🌹', '🎵', '📖']
    },
    {
      type: 'experts',
      theme: 'midnight-experts',
      title: 'Expert Invitations',
      tagline: 'Invite experts to join your conversations',
      characters: [getCharacter('sherlock'), getCharacter('sun_tzu')]
    }
  ], [getCharacter]);

  // Desktop chat conversations (existing)
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

  const fullMessage = "Aww shucks, not much I'm afraid! My village has always been peaceful, and I spent most of my time rafting down the Mississippi. But I reckon I could invite some folks who know a whole lot more about that subject than me!";

  // Handle logo visibility (desktop only)
  useEffect(() => {
    if (isMobile) return;
    
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

  // DESKTOP: Auto-advance carousel
  useEffect(() => {
    if (isMobile || isPaused || isTransitioning) return;

    const delay = currentScreen === 2 ? 18000 : 10000;
    const interval = setInterval(() => {
      setCurrentScreen(prev => (prev + 1) % 3);
    }, delay);

    return () => clearInterval(interval);
  }, [isMobile, isPaused, isTransitioning, currentScreen]);

  // MOBILE: Auto-advance panels
  useEffect(() => {
    if (!isMobile || isPaused || isTransitioning) return;

    const interval = setInterval(() => {
      setCurrentPanel(prev => (prev + 1) % 6);
    }, 4000);

    return () => clearInterval(interval);
  }, [isMobile, isPaused, isTransitioning, currentPanel]);

  // Handle user interaction
  const handleUserInteraction = useCallback(() => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), isMobile ? 8000 : 5000);
  }, [isMobile]);

  // Desktop typing animation for screen 3
  useEffect(() => {
    if (isMobile || currentScreen !== 2 || isTyping || typedText !== '') return;

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
  }, [currentScreen, typedText, fullMessage, isMobile]);

  // Reset typing when leaving desktop screen 3
  useEffect(() => {
    if (isMobile || currentScreen !== 2) {
      setTypedText('');
      setIsTyping(false);
      setShowInviteButtons(false);
    }
  }, [currentScreen, isMobile]);

  // Generate stars with device optimization
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

  // Touch gesture handlers
  const onTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      if (isMobile) {
        mobileNextPanel();
      } else {
        nextScreen();
      }
    } else if (distance < -minSwipeDistance) {
      if (isMobile) {
        mobilePrevPanel();
      } else {
        prevScreen();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, isMobile]);

  // Desktop navigation functions
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

  // Mobile navigation functions
  const navigateToPanel = useCallback((panelIndex) => {
    if (!isMobile || isTransitioning) return;

    setIsTransitioning(true);
    setCurrentPanel(panelIndex);
    handleUserInteraction();

    setTimeout(() => {
      setIsTransitioning(false);
    }, 800);
  }, [isMobile, isTransitioning, handleUserInteraction]);

  const mobileNextPanel = useCallback(() => {
    if (!isMobile) return;
    const next = (currentPanel + 1) % 6;
    navigateToPanel(next);
  }, [isMobile, currentPanel, navigateToPanel]);

  const mobilePrevPanel = useCallback(() => {
    if (!isMobile) return;
    const prev = (currentPanel - 1 + 6) % 6;
    navigateToPanel(prev);
  }, [isMobile, currentPanel, navigateToPanel]);

  // Touch event listeners
  useEffect(() => {
    const container = document.querySelector('.landing-container');
    if (!container) return;

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        if (isMobile) {
          mobilePrevPanel();
        } else {
          prevScreen();
        }
      } else if (e.key === 'ArrowRight') {
        if (isMobile) {
          mobileNextPanel();
        } else {
          nextScreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isMobile, prevScreen, nextScreen, mobilePrevPanel, mobileNextPanel]);

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

  // Show loading transition during resize
  if (isResizing) {
    return (
      <div className="landing-container">
        <div className="stars" ref={starsRef}></div>
        <h1 className="logo">AwakeVerse</h1>
        <div className="resize-transition">
          <div className="loading-indicator"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`landing-container ${isMobile ? 'mobile-mode' : 'desktop-mode'}`}
      onMouseMove={!isMobile ? handleUserInteraction : undefined}
    >
      {/* Animated Stars */}
      <div className="stars" ref={starsRef}></div>

      {/* Logo - Always visible on mobile, conditional on desktop */}
      <h1 className="logo">AwakeVerse</h1>

      {isMobile ? (
        /* MOBILE: 6-Panel Streaming Design */
        <>
          <div className="progress-bar"></div>
          
          <div className="mobile-panels-container">
            <div
              className="mobile-panels-track"
              style={{
                transform: `translateX(-${currentPanel * 16.666}%)`,
                transition: isTransitioning ? 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
              }}
            >
              {mobilePanels.map((panel, index) => (
                <div key={index} className={`mobile-panel ${panel.theme}`}>
                  {panel.type === 'experts' ? (
                    // Expert Invitation Panel
                    <>
                      <div className="dual-avatars">
                        <div className="expert-avatar">
                          <OptimizedImage
                            src={panel.characters[0]?.thumbnailUrl}
                            alt={panel.characters[0]?.name}
                            className="avatar-image"
                            fallbackLetter={panel.characters[0]?.name?.charAt(0)}
                            imageKey={`expert-${panel.characters[0]?.key}`}
                          />
                        </div>
                        <div className="expert-avatar">
                          <OptimizedImage
                            src={panel.characters[1]?.thumbnailUrl}
                            alt={panel.characters[1]?.name}
                            className="avatar-image"
                            fallbackLetter={panel.characters[1]?.name?.charAt(0)}
                            imageKey={`expert-${panel.characters[1]?.key}`}
                          />
                        </div>
                      </div>
                      <div className="mobile-streaming-container">
                        <div className="mobile-character-name">{panel.title}</div>
                        <div className="mobile-streaming-tagline">
                          <span className="mobile-typewriter">{panel.tagline}</span>
                          <span className="mobile-cursor">●</span>
                        </div>
                      </div>
                      <Link to="/register" className="mobile-cta-button">
                        Start Chat →
                      </Link>
                      {index === 5 && (
                        <div className="mobile-swipe-hint">Swipe to start your journey</div>
                      )}
                    </>
                  ) : (
                    // Regular Character Panel
                    <>
                      <div className="mobile-character-avatar">
                        <OptimizedImage
                          src={panel.character?.thumbnailUrl}
                          alt={panel.character?.name}
                          className="avatar-image"
                          fallbackLetter={panel.character?.name?.charAt(0)}
                          imageKey={`mobile-character-${panel.character?.key}`}
                        />
                      </div>
                      <div className="mobile-streaming-container">
                        <div className="mobile-character-name">{panel.character?.name}</div>
                        <div className="mobile-streaming-tagline">
                          <span className="mobile-typewriter">{panel.tagline}</span>
                          <span className="mobile-cursor">●</span>
                        </div>
                        <div className="mobile-action-icons">
                          {panel.icons?.map((icon, iconIndex) => (
                            <div key={iconIndex} className="mobile-action-icon">
                              {icon}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Link to="/register" className="mobile-cta-button">
                        Start Chat →
                      </Link>
                      {index === 0 && (
                        <div className="mobile-swipe-hint">Swipe to explore minds</div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Panel Indicators */}
          <div className="mobile-panel-indicators">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <button
                key={index}
                className={`mobile-indicator ${index === currentPanel ? 'active' : ''}`}
                onClick={() => navigateToPanel(index)}
                disabled={isTransitioning}
                aria-label={`Go to panel ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : (
        /* DESKTOP: Original 3-Screen Carousel Design */
        <>
          <div className="carousel-container">
            <div
              className="carousel-track"
              style={{
                transform: `translateX(-${currentScreen * 33.333}%)`,
                transition: isTransitioning ? 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
              }}
            >
              {/* Screen 1: Hero + Character Panels */}
              <div className="carousel-slide" data-screen="0">
                <div className="screen-content">
                  <div className="hero-content">
                    <h2 className="main-hero-headline">
                      Conversations without Limits - Powered by AI
                    </h2>
                    
                    <h3 className="secondary-tagline">
                      Solve mysteries with <span className="highlight-gold">Sherlock</span>,
                      innovate with <span className="highlight-gold">Da Vinci</span>,
                      explore love with <span className="highlight-gold">Helen</span>
                    </h3>

                    <Link to="/register" className="cta-primary">
                      Start Your First Conversation
                    </Link>
                  </div>

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

          {/* Desktop Navigation */}
          <div className="carousel-navigation">
            <button
              className="nav-arrow nav-prev"
              onClick={prevScreen}
              disabled={isTransitioning}
              aria-label="Previous screen"
            >
              ↑
            </button>

            <div className="carousel-dots">
              {[0, 1, 2].map((index) => (
                <button
                  key={`dot-${index}`}
                  className={`carousel-dot ${index === currentScreen ? 'active' : ''}`}
                  onClick={() => navigateToScreen(index)}
                  disabled={isTransitioning}
                  aria-label={`Go to screen ${index + 1}`}
                />
              ))}
            </div>

            <button
              className="nav-arrow nav-next"
              onClick={nextScreen}
              disabled={isTransitioning}
              aria-label="Next screen"
            >
              ↓
            </button>
          </div>
        </>
      )}
    </div>
  );
}