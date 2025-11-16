// src/landing/components/HeroSection.jsx
import React, { useState, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../styles/hero.css';

export default function HeroSection() {
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [sectionRef, isVisible] = useIntersectionObserver();
  
  const messages = [
    "Sherlock, I think my friend is lying..",
    "Hey Tesla, should I buy Bitcoin?",
    "Hi da Vinci, rate my idea!",
    "Cleopatra, how do I deal with toxic coworkers?",
    "Harriet, my plan feels risky. Am I ready?"
  ];
  
  const currentMessage = messages[messageIndex];
  const typingSpeed = 80;
  const deletingSpeed = 50;
  const pauseAfterComplete = 2000;
  const pauseAfterDelete = 500;

  // Typing animation effect
  useEffect(() => {
    let timeout;

    if (!isDeleting && typedText === currentMessage) {
      // Finished typing - pause then start deleting
      timeout = setTimeout(() => setIsDeleting(true), pauseAfterComplete);
    } else if (isDeleting && typedText === '') {
      // Finished deleting - move to next message
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, pauseAfterDelete);
    } else {
      // Continue typing or deleting
      const speed = isDeleting ? deletingSpeed : typingSpeed;
      timeout = setTimeout(() => {
        setTypedText(prev => {
          if (isDeleting) {
            return currentMessage.substring(0, prev.length - 1);
          } else {
            return currentMessage.substring(0, prev.length + 1);
          }
        });
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, currentMessage, messages.length]);

  return (
    <section 
      id="hero" 
      ref={sectionRef}
      className={`hero-section ${isVisible ? 'animate-in' : ''}`}
    >
      <div className="hero-container">
        
        {/* Hero Scene with Image */}
        <div className="hero-scene">
          <img 
            src="/images/heroscene.jpeg"
            alt="Historical figures in conversation"
            className="hero-image"
            loading="eager"
            width="1200"
            height="675"
          />
          
          {/* Chat UI Overlay */}
          <div className="chat-overlay">
            <div className="chat-input-box">
              <input 
                type="text" 
                value={typedText}
                readOnly
                placeholder="Ask anything..."
                aria-label="Chat input preview"
              />
              <span className="typing-cursor">|</span>
              <a href="/chat" className="start-chat-button">
                Start Chat
              </a>
            </div>
          </div>
        </div>

        {/* Hero Text Content */}
        <div className="hero-content">
          <h1 className="hero-title">The Conversation AI</h1>
          <p className="hero-subtitle">
            Create, chat, collaborate, and earn with iconic minds
          </p>
          <a href="/chat" className="hero-cta">
            Start Your First Conversation
            <span aria-hidden="true">→</span>
          </a>
        </div>

      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator" aria-hidden="true">
        <span>Scroll</span>
        <span>↓</span>
      </div>
    </section>
  );
}