// src/landing/components/HeroSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import StageHero from './StageHero';
import '../styles/hero.css';

// Central stage image (four sets, sequential spotlights). Uploaded to Spaces:
const STAGE_IMAGE =
  'https://awakeverse-blog.lon1.cdn.digitaloceanspaces.com/content/campaign/stage-four-sets.jpg';

export default function HeroSection() {
  const [sectionRef, isVisible] = useIntersectionObserver();

  return (
    <section
      id="hero"
      ref={sectionRef}
      className={`hero-section ${isVisible ? 'animate-in' : ''}`}
    >
      <div className="hero-container">

        {/* Hero Scene — stage image with synced spotlights + morphing input deck.
            Replaces the old <img> + .chat-overlay. Create button is decorative
            and routes to /login. */}
        <div className="hero-scene">
          <StageHero imageUrl={STAGE_IMAGE} createTo="/login" />
        </div>

        {/* Hero Text Content — unchanged */}
        <div className="hero-content">
          <h1 className="hero-title">The Conversation AI</h1>
          <p className="hero-subtitle">
            Create, chat, collaborate, and earn with iconic minds
          </p>
          <Link to="/register" className="hero-cta">
            Start Your First Conversation
            <span aria-hidden="true">→</span>
          </Link>
        </div>

      </div>
    </section>
  );
}