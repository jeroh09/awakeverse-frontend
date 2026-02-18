// src/landing/components/HeroSection.jsx
import React, { useState, useEffect } from 'react';
import '../styles/hero.css';

export default function HeroSection() {
  const [animationStep, setAnimationStep] = useState(0);
  
  // Animation sequence timing
  useEffect(() => {
    const sequence = [
      { step: 0, duration: 2000 },  // User types
      { step: 1, duration: 1500 },  // Typing indicator
      { step: 2, duration: 3000 },  // Marcus replies
      { step: 3, duration: 1500 },  // Typing indicator
      { step: 4, duration: 3000 },  // Holmes replies
      { step: 5, duration: 1500 },  // Typing indicator
      { step: 6, duration: 3000 },  // Plato replies
      { step: 7, duration: 3000 },  // Pause at end
    ];

    const currentSequence = sequence[animationStep];
    if (!currentSequence) {
      // Reset to beginning
      setAnimationStep(0);
      return;
    }

    const timeout = setTimeout(() => {
      setAnimationStep((prev) => prev + 1);
    }, currentSequence.duration);

    return () => clearTimeout(timeout);
  }, [animationStep]);

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
          <div className="chat-window">
            <div className="chat-window-header">
              <div className="chat-header-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="chat-header-title">Conversation</span>
            </div>
            
            <div className="chat-messages">
              {/* User Message */}
              {animationStep >= 0 && (
                <div className="chat-message user">
                  <div className="message-bubble user-bubble">
                    How do I overcome self-doubt?
                  </div>
                </div>
              )}

              {/* Typing Indicator 1 */}
              {animationStep === 1 && (
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
              {animationStep >= 2 && (
                <div className="chat-message character">
                  <div className="message-avatar">
                    <span>M</span>
                  </div>
                  <div className="message-content">
                    <div className="message-name">Marcus Aurelius</div>
                    <div className="message-bubble character-bubble">
                      Self-doubt is merely a thought. Observe it without judgment, then act with virtue regardless.
                    </div>
                  </div>
                </div>
              )}

              {/* Typing Indicator 2 */}
              {animationStep === 3 && (
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
              {animationStep >= 4 && (
                <div className="chat-message character">
                  <div className="message-avatar">
                    <span>S</span>
                  </div>
                  <div className="message-content">
                    <div className="message-name">Sherlock Holmes</div>
                    <div className="message-bubble character-bubble">
                      Doubt stems from insufficient data. Gather evidence of your capabilities and let logic guide you.
                    </div>
                  </div>
                </div>
              )}

              {/* Typing Indicator 3 */}
              {animationStep === 5 && (
                <div className="chat-message character">
                  <div className="message-avatar">
                    <span>P</span>
                  </div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              {/* Plato Reply */}
              {animationStep >= 6 && (
                <div className="chat-message character">
                  <div className="message-avatar">
                    <span>P</span>
                  </div>
                  <div className="message-content">
                    <div className="message-name">Plato</div>
                    <div className="message-bubble character-bubble">
                      Know thyself. Self-doubt fades when you align actions with your true nature and purpose.
                    </div>
                  </div>
                </div>
              )}
            </div>
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