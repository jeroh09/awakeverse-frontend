// src/landing/pages/LandingPage.js - Desktop + Mobile Streaming Design
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { characterCategories } from '../../data/characterCategories';
import EnhancedCharacterPanels from '../components/EnhancedCharacterPanels';
import DemoCharacterBuilder from './DemoCharacterBuilder';
import SubscriptionPlansCards from './SubscriptionPlansCards'; 
import CreatorHubTeaser from './CreatorHubTeaser';
import CreatorShowcase from '../components/CreatorShowcase'; 
import './LandingPage.css';

export default function LandingPage() {
  // All state declarations
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showInviteButtons, setShowInviteButtons] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // Constants
  const fullMessage = "Aww shucks, not much I'm afraid! My village has always been peaceful, and I spent most of my time rafting down the Mississippi. But I reckon I could invite some folks who know a whole lot more about that subject than me!";

  // Get character by key function
  const getCharacter = useCallback((key) => {
    for (const category of characterCategories) {
      const character = category.characters.find(c => c.key === key);
      if (character) return character;
    }
    return null;
  }, []);

  // Handle user interaction
  const handleUserInteraction = useCallback(() => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), isMobile ? 8000 : 5000);
  }, [isMobile]);

  // Scroll to specific section function
  const scrollToSection = useCallback((sectionIndex) => {
    if (!isMobile) { 
      const targetY = sectionIndex * window.innerHeight;
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  }, [isMobile]);

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
  }, [touchStart, touchEnd, isMobile, mobileNextPanel, mobilePrevPanel, nextScreen, prevScreen]);

  // Optimized image component
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

  // Desktop chat conversations
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

  // Detect current section based on scroll position
  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const section = Math.round(scrollY / viewportHeight);
      setCurrentSection(Math.max(0, Math.min(section, 2)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Keyboard navigation for sections
  useEffect(() => {
    if (isMobile) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowDown' && currentSection < 2) {
        scrollToSection(currentSection + 1);
      } else if (e.key === 'ArrowUp' && currentSection > 0) {
        scrollToSection(currentSection - 1);
      } else if (e.key === 'ArrowLeft') {
        prevScreen();
      } else if (e.key === 'ArrowRight') {
        nextScreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSection, scrollToSection, isMobile, prevScreen, nextScreen]);

  // MOBILE: Auto-advance panels
  useEffect(() => {
    if (!isMobile || isPaused || isTransitioning) return;

    const interval = setInterval(() => {
      setCurrentPanel(prev => (prev + 1) % 6);
    }, 4000);

    return () => clearInterval(interval);
  }, [isMobile, isPaused, isTransitioning, currentPanel]);

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
  }, [currentScreen, typedText, fullMessage, isMobile, isTyping]);

  // Reset typing when leaving desktop screen 3
  useEffect(() => {
    if (isMobile || currentScreen !== 2) {
      setTypedText('');
      setIsTyping(false);
      setShowInviteButtons(false);
    }
  }, [currentScreen, isMobile]);

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

  // Mobile keyboard navigation
  useEffect(() => {
    if (!isMobile) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        mobilePrevPanel();
      } else if (e.key === 'ArrowRight') {
        mobileNextPanel();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isMobile, mobilePrevPanel, mobileNextPanel]);

  // Show loading transition during resize
  if (isResizing) {
    return (
      <div className="landing-container">
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
      {/* Desktop Header - Only visible on desktop */}
      <header className="desktop-header">
        <Link to="/" className="header-logo">
          AwakeVerse
        </Link>

        <nav className="desktop-header-nav">
          <div className="desktop-header-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/contact-us">Contact</Link>
          </div>

          <div className="desktop-header-auth">
            <Link to="/login" className="desktop-auth-button sign-in">
              Sign In
            </Link>
            <Link to="/register" className="desktop-auth-button sign-up">
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

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
                      <Link to="/register" 
                        className="mobile-cta-button"
                        style={{ marginBottom: '10px' }}> 
                        Start Chat →
                      </Link>
                      {index === 5 && (
                        <div 
                          className="mobile-swipe-hint"
                          style={{ 
                            position: 'absolute',
                            bottom: '7rem',
                            right: '2rem',
                            left: 'auto',
                            transform: 'translateX(-50%)',
                            textAlign: 'center'
                          }}
                        >
                          Swipe to start your journey
                        </div>
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
                      <Link to="/register" 
                        className="mobile-cta-button"
                        style={{ marginBottom: '10px' }}>
                        Start Chat →
                      </Link>
                     {index === 0 && (
                       <div 
                         className="mobile-swipe-hint" 
                         style={{ 
                           position: 'absolute',
                           bottom: '7rem',
                           right: '2rem',
                           left: 'auto',
                           transform: 'none',
                           textAlign: 'right', 
                           width: 'auto',
                       }}>
                         Swipe to explore more minds
                       </div>
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
        /* DESKTOP: Hybrid Layout - Carousel + Scrollable Sections */
        <div className="desktop-main-wrapper">
          {/* Section 1: Fixed Height Carousel */}
          <section className="desktop-section-1">
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
                        <span className="highlight-gold">Create</span>, chat, collaborate, and <span className="highlight-gold">earn</span> with iconic minds — in real time
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
          </section>

          {/* Section 2: Character Creation Demo */}
          <section className="desktop-section-2">
            <div className="desktop-section-content">
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '3rem',
                alignItems: 'center',
                width: '100%',
                maxWidth: '1200px'
              }}>
                {/* Left: Explanation */}
                <div className="panel-double-border" style={{ 
                  textAlign: 'left',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}>
                  <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '2.2rem',
                    color: '#ffd700',
                    marginBottom: '1.5rem',
                    textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                    lineHeight: 1.2
                  }}>
                    Create Your Own Characters
                  </h2>
                  
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.1rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1.6,
                    marginBottom: '2rem'
                  }}>
                    Build custom AI characters. Try templates. 
                    Customize personalities, expertise, and behavior 
                    to create your perfect conversation partner.
                  </p>

                  <div style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    <h3 style={{
                      color: '#FFD700',
                      fontSize: '1.1rem',
                      margin: '0 0 1rem 0',
                      fontFamily: "'Playfair Display', serif"
                    }}>
                      How It Works
                    </h3>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}>
                      <li style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem',
                        marginBottom: '0.8rem',
                        paddingLeft: '1.5rem',
                        position: 'relative'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          color: '#FFD700',
                          fontWeight: 'bold'
                        }}>1.</span>
                        Choose a template
                      </li>
                      <li style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem',
                        marginBottom: '0.8rem',
                        paddingLeft: '1.5rem',
                        position: 'relative'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          color: '#FFD700',
                          fontWeight: 'bold'
                        }}>2.</span>
                        Customize name, personality, and expertise
                      </li>
                      <li style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem',
                        marginBottom: '0.8rem',
                        paddingLeft: '1.5rem',
                        position: 'relative'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          color: '#FFD700',
                          fontWeight: 'bold'
                        }}>3.</span>
                        Submit for approval
                      </li>
                      <li style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem',
                        paddingLeft: '1.5rem',
                        position: 'relative'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          color: '#FFD700',
                          fontWeight: 'bold'
                        }}>4.</span>
                        Start conversations
                      </li>
                    </ul>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <Link 
                      to="/register" 
                      style={{
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        border: 'none',
                        borderRadius: '25px',
                        color: '#000',
                        fontSize: '1rem',
                        fontWeight: 700,
                        padding: '0.8rem 2rem',
                        textDecoration: 'none',
                        display: 'inline-block',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(255, 255, 255, 0.87)'
                      }}
                    >
                      Start Creating
                    </Link>
                    
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.9rem'
                    }}>
                      Try the demo first →
                    </div>
                  </div>
                </div>

                {/* Right: Interactive Demo */}
                <div style={{
                  background: 'rgba(26, 26, 46, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}>
                <div className="panel-double-border">
                  <DemoCharacterBuilder />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* NEW: Creator Showcase Carousel - Between Section 2 and Section 3 */}
          <section className="desktop-section-creator-showcase" style={{
            minHeight: '100vh',
            position: 'relative',
            scrollSnapAlign: 'start',
            background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 2rem 4rem 2rem'
          }}>
            <div style={{ width: '100%', maxWidth: '1200px' }}>
              <CreatorShowcase />
            </div>
          </section>

          {/* Section 3: Subscription Plans + Creator Hub */}
          <section className="desktop-section-3">
            <div className="desktop-section-content" style={{ paddingTop: '40px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '3rem',
                alignItems: 'start',
                width: '100%',
                maxWidth: '1400px',
                marginBottom: '4rem'
              }}>
                {/* Left: Subscription Plans */}
                <div>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '3rem'
                  }}>
                    <h2 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '2.5rem',
                      color: '#ffd700',
                      marginBottom: '1rem',
                      textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                      lineHeight: 1.2
                    }}>
                      Choose Your Plan
                    </h2>
                    
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1.2rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: 1.6,
                      maxWidth: '600px',
                      margin: '0 auto'
                    }}>
                      Unlock the full potential of AI conversations with unlimited access 
                      to characters, advanced features, and creator opportunities.
                    </p>
                  </div>

                  <SubscriptionPlansCards />

                  {/* Trust Signals */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '2rem',
                    marginTop: '2rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: 'linear-gradient(135deg, #00FF88, #00CC6A)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        color: '#000',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                      Cancel anytime
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: 'linear-gradient(135deg, #00FF88, #00CC6A)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        color: '#000',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                      Secure payment
                    </div>
                  </div>
                </div>

                {/* Right: Creator Hub Teaser */}
                <div style={{
                  position: 'sticky',
                  top: '100px'
                }}>
                  <CreatorHubTeaser />
                </div>
              </div>

              {/* Footer Links Section */}
              <div style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '3rem',
                marginTop: '3rem'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '2rem',
                  maxWidth: '1200px',
                  margin: '0 auto 3rem auto'
                }}>
                  {/* Company */}
                  <div>
                    <h4 style={{
                      color: '#FFD700',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      margin: '0 0 1rem 0',
                      fontFamily: "'Playfair Display', serif"
                    }}>
                      Company
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <Link to="/about" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        About Us
                      </Link>
                      <Link to="/contact-us" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Contact Us
                      </Link>
                      <Link to="/careers" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Careers
                      </Link>
                    </div>
                  </div>

                  {/* Product */}
                  <div>
                    <h4 style={{
                      color: '#FFD700',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      margin: '0 0 1rem 0',
                      fontFamily: "'Playfair Display', serif"
                    }}>
                      Product
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <Link to="/pricing" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Pricing Page
                      </Link>
                      <Link to="/features" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Features
                      </Link>
                      <Link to="/creators" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Creators Landing
                      </Link>
                    </div>
                  </div>

                  {/* Legal */}
                  <div>
                    <h4 style={{
                      color: '#FFD700',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      margin: '0 0 1rem 0',
                      fontFamily: "'Playfair Display', serif"
                    }}>
                      Legal
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <Link to="/terms" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Terms of Service
                      </Link>
                      <Link to="/privacy" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Privacy Policy
                      </Link>
                      <Link to="/community-guidelines" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Community Guidelines
                      </Link>
                    </div>
                  </div>

                  {/* Support */}
                  <div>
                    <h4 style={{
                      color: '#FFD700',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      margin: '0 0 1rem 0',
                      fontFamily: "'Playfair Display', serif"
                    }}>
                      Support
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <Link to="/help" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Help Center
                      </Link>
                      <Link to="/support" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        Contact Support
                      </Link>
                      <a href="mailto:hello@awakeverse.com" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                      >
                        hello@awakeverse.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Copyright */}
                <div style={{
                  textAlign: 'center',
                  paddingTop: '2rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.9rem'
                }}>
                  © 2025 Awakeverse Ltd. All rights reserved.
                </div>
              </div>
            </div>
          </section>

          {/* Desktop Scroll Indicator */}
          {!isMobile && (
            <div className="desktop-scroll-indicator">
              <div 
                className={`scroll-dot ${currentSection === 0 ? 'active' : ''}`} 
                onClick={() => scrollToSection(0)}
              ></div>
              <div 
                className={`scroll-dot ${currentSection === 1 ? 'active' : ''}`} 
                onClick={() => scrollToSection(1)}
              ></div>
              <div 
                className={`scroll-dot ${currentSection === 2 ? 'active' : ''}`} 
                onClick={() => scrollToSection(2)}
              ></div>
              <div 
                className={`scroll-dot ${currentSection === 3 ? 'active' : ''}`} 
                onClick={() => scrollToSection(3)}
              ></div>
            </div>
          )} 
        </div>
      )}
    </div>
  );
}