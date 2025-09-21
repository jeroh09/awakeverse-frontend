// CreatorHubTeaser.jsx - Simplified creator hub teaser for landing page
import React from 'react';
import { Link } from 'react-router-dom';

const CreatorHubTeaser = () => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '20px',
      padding: '2rem',
      height: 'fit-content',
      textAlign: 'center'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          color: '#FFD700',
          fontSize: '1.5rem',
          fontWeight: 700,
          margin: '0 0 1rem 0',
          fontFamily: "'Playfair Display', serif"
        }}>
          Creator Hub
        </h3>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '1rem',
          margin: '0 0 1.5rem 0',
          lineHeight: 1.5
        }}>
          Turn character creations into monthly income. Submit quality characters 
          and earn based on user interactions.
        </p>
      </div>

      {/* Quick Benefits */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#FFD700' }}>✓</span>
            Submit your best characters
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#FFD700' }}>✓</span>
            Get featured in our hub
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#FFD700' }}>✓</span>
            Earn monthly payouts
          </div>
        </div>
      </div>

      {/* CTA */}
      <div>
        <Link
          to="/creator-hub"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            border: 'none',
            borderRadius: '20px',
            color: '#000',
            fontSize: '0.95rem',
            fontWeight: 700,
            padding: '0.8rem 2rem',
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
          }}
        >
          Learn More
        </Link>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.8rem',
          margin: '1rem 0 0 0'
        }}>
          Requires Pro or Unlimited subscription
        </p>
      </div>
    </div>
  );
};

export default CreatorHubTeaser;