// src/landing/components/HeroSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/hero.css';

export default function HeroSection() {
  const [animationStep, setAnimationStep] = useState(0);
  const [streamingText, setStreamingText] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const chatWindowRef = useRef(null);

  const messages = {
    user: "How do I overcome self-doubt?",
    marcus: "Self-doubt is merely a thought. Observe it without judgment, then act with virtue regardless.",
    sherlock: "Doubt stems from insufficient data. Gather evidence of your capabilities and let logic guide you."
  };

  // Animation sequence
  useEffect(() => {
    const sequence = async () => {
      switch (animationStep) {
        case 0: // User types in input
          await typeText(messages.user, 'input', 50);
          setTimeout(() => setAnimationStep(1), 500);
          break;
        case 1: // User message appears in chat
          setCurrentMessage('user');
          setTimeout(() => setAnimationStep(2), 1000);
          break;
        case 2: // Marcus typing indicator
          setTimeout(() => setAnimationStep(3), 1500);
          break;
        case 3: // Marcus streams reply
          setCurrentMessage('marcus');
          await typeText(messages.marcus, 'marcus', 50);
          setTimeout(() => setAnimationStep(4), 1000);
          break;
        case 4: // Sherlock typing indicator
          setTimeout(() => setAnimationStep(5), 1500);
          break;
        case 5: // Sherlock streams reply
          setCurrentMessage('sherlock');
          await typeText(messages.sherlock, 'sherlock', 50);
          setTimeout(() => setAnimationStep(6), 2000);
          break;
        case 6: // Pause and reset
          setTimeout(() => {
            setAnimationStep(0);
            setStreamingText('');
            setCurrentMessage('');
          }, 3000);
          break;
        default:
          break;
      }
    };

    sequence();
  }, [animationStep]);

  // Streaming text effect
  const typeText = (text, id, speed) => {
    return new Promise((resolve) => {
      let index = 0;
      setStreamingText('');
      
      const interval = setInterval(() => {
        if (index < text.length) {
          setStreamingText((prev) => prev + text[index]);
          index++;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  };

  // Dragging functionality
  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-pin')) return; // Don't drag when clicking pin
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <section id="hero" className="hero-section">
      <div className="hero-container">
        
        {/* Hero Scene with Image */}
        <div className="hero-scene">
          <img 
            src="/images/heroscene.jpeg"
            alt="Historical figures in conversation"
            className="hero-image"
            loading="eager"
          />
          
          {/* Animated Chat Window */}
          <div 
            ref={chatWindowRef}
            className={`chat-window ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`
            }}
          >
            <div 
              className="chat-window-header"
              onMouseDown={handleMouseDown}
            >
              <div className="chat-header-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="chat-header-title">Dialogue</span>
              <button 
                className="chat-pin"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                📌
              </button>
            </div>
            
            {!isMinimized && (
              <>
                <div className="chat-messages">
                  {/* User Message */}
                  {animationStep >= 1 && (
                    <div className="chat-message user">
                      <div className="message-bubble user-bubble">
                        {messages.user}
                      </div>
                    </div>
                  )}

                  {/* Typing Indicator - Marcus */}
                  {animationStep === 2 && (
                    <div className="chat-message character">
                      <div className="message-avatar">
                        <span>M</span>
                      </div>
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}

                  {/* Marcus Aurelius Reply */}
                  {animationStep >= 3 && currentMessage === 'marcus' && (
                    <div className="chat-message character">
                      <div className="message-avatar">
                        <span>M</span>
                      </div>
                      <div className="message-content">
                        <div className="message-name">Marcus Aurelius</div>
                        <div className="message-bubble character-bubble">
                          {streamingText}
                          {streamingText.length < messages.marcus.length && (
                            <span className="streaming-cursor">|</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Typing Indicator - Sherlock */}
                  {animationStep === 4 && (
                    <div className="chat-message character">
                      <div className="message-avatar">
                        <span>S</span>
                      </div>
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}

                  {/* Sherlock Holmes Reply */}
                  {animationStep >= 5 && currentMessage === 'sherlock' && (
                    <div className="chat-message character">
                      <div className="message-avatar">
                        <span>S</span>
                      </div>
                      <div className="message-content">
                        <div className="message-name">Sherlock Holmes</div>
                        <div className="message-bubble character-bubble">
                          {streamingText}
                          {streamingText.length < messages.sherlock.length && (
                            <span className="streaming-cursor">|</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="chat-input">
                  <input 
                    type="text"
                    value={animationStep === 0 ? streamingText : ''}
                    placeholder="Type your message..."
                    readOnly
                  />
                  <button className="send-button" aria-label="Send">
                    →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <h1 className="hero-title">The Conversation AI</h1>
          <p className="hero-subtitle">
            Create, chat, collaborate, and earn with iconic minds
          </p>
          
          <a href="/register" className="hero-cta">
            Start Your First Conversation
            <span aria-hidden="true">→</span>
          </a>
        </div>

      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <span>Scroll</span>
        <div className="scroll-arrow">↓</div>
      </div>
    </section>
  );
}