// src/landing/components/PillarsSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pillars.css';

const pillars = [
  {
    id: 'learn',
    icon: '📚',
    title: 'Learn',
    description: 'Get tutored by history\'s greatest minds',
    features: [
      'Science explained by the inventors',
      'Philosophy from the source',
      'Custom study scenarios',
      'Multi-expert discussions'
    ],
    image: '/images/pillar-learn.jpeg',
    cta: 'Explore Characters'
  },
  {
    id: 'create',
    icon: '🎨',
    title: 'Create',
    description: 'Build your own historical characters',
    features: [
      'Choose from 100+ templates',
      'Customize personality & knowledge',
      'Set historical context',
      'Bring your vision to life'
    ],
    image: '/images/pillar-create.jpeg',
    cta: 'Start Creating'
  },
  {
    id: 'build',
    icon: '💼',
    title: 'Build',
    description: 'Pitch to historical expert panels',
    features: [
      'Validate your business ideas',
      'Get strategic advice from legends',
      'Create custom debate scenarios',
      'Test assumptions with experts'
    ],
    image: '/images/pillar-build.jpeg',
    cta: 'Create a Scenario'
  },
  {
    id: 'earn',
    icon: '💰',
    title: 'Earn',
    description: 'Monetize your character creations',
    features: [
      'Publish to marketplace',
      'Earn based on engagement',
      'Featured creator spotlight',
      'Track analytics & growth'
    ],
    image: '/images/pillar-earn.jpeg',
    cta: 'Become a Creator'
  }
];

export default function PillarsSection() {
  return (
    <section id="pillars" className="pillars-section">
      <div className="pillars-container">
        
        {/* Section Header */}
        <div className="pillars-header">
          <h2 className="pillars-title">
            Learn, Create, Build, Earn
          </h2>
          <p className="pillars-subtitle">
            Your complete journey on AwakeVerse
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="pillars-grid">
          {pillars.map((pillar) => (
            <article key={pillar.id} className="pillar-card">
              
              {/* Pillar Image */}
              <div className="pillar-image-container">
                <img
                  src={pillar.image}
                  alt={pillar.title}
                  className="pillar-image"
                  loading="eager"
                />
                <div className="pillar-icon" aria-hidden="true">
                  {pillar.icon}
                </div>
                <div className="pillar-overlay"></div>
              </div>

              {/* Pillar Content */}
              <div className="pillar-content">
                <h3 className="pillar-title">{pillar.title}</h3>
                <p className="pillar-description">
                  {pillar.description}
                </p>
                
                <ul className="pillar-features">
                  {pillar.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>

                <Link to="/register" className="pillar-cta">
                  {pillar.cta}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  );
}