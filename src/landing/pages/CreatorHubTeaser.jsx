// CreatorHubTeaser.jsx - Compact 4-panel version
import React from 'react';
import { Link } from 'react-router-dom';

const CreatorHubTeaser = () => {
  const panels = [
    {
      icon: '📝',
      title: 'Submit',
      subtitle: 'Your Best Characters',
      description: 'Quality review process'
    },
    {
      icon: '⭐',
      title: 'Get Featured',
      subtitle: 'In Our Hub',
      description: 'Curated selection'
    },
    {
      icon: '💰',
      title: 'Earn Monthly',
      subtitle: 'From Interactions',
      description: 'Usage-based payouts'
    },
    {
      icon: '🚀',
      title: 'Coming Q2',
      subtitle: '2025 Launch',
      description: 'Join waitlist now'
    }
  ];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '20px',
      padding: '2rem',
      height: 'fit-content'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          color: '#FFD700',
          fontSize: '1.6rem',
          fontWeight: 700,
          margin: '0 0 0.5rem 0',
          fontFamily: "'Playfair Display', serif"
        }}>
          Creator Hub
        </h3>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.95rem',
          margin: '0 0 1rem 0',
          lineHeight: 1.4
        }}>
          Turn character creation into monthly income through our curated hub.
        </p>
      </div>

      {/* 4-Panel Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {panels.map((panel, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={{
              fontSize: '1.8rem',
              marginBottom: '0.75rem'
            }}>
              {panel.icon}
            </div>
            
            <h4 style={{
              color: '#FFD700',
              fontSize: '0.9rem',
              fontWeight: 600,
              margin: '0 0 0.25rem 0'
            }}>
              {panel.title}
            </h4>
            
            <div style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.8rem',
              fontWeight: 500,
              margin: '0 0 0.5rem 0'
            }}>
              {panel.subtitle}
            </div>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem',
              margin: 0,
              lineHeight: 1.3
            }}>
              {panel.description}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        textAlign: 'center'
      }}>
        <Link
          to="/register"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            border: 'none',
            borderRadius: '20px',
            color: '#000',
            fontSize: '0.9rem',
            fontWeight: 700,
            padding: '0.75rem 1.5rem',
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
          Join Creator Waitlist
        </Link>
      </div>
    </div>
  );
};

export default CreatorHubTeaser;