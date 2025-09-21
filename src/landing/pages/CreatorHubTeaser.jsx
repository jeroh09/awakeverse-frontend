// CreatorHubTeaser.jsx - Creator monetization feature showcase
import React from 'react';
import { Link } from 'react-router-dom';

const CreatorHubTeaser = () => {
  const features = [
    {
      icon: '🎯',
      title: 'Get Featured',
      description: 'Submit your best characters for curation review'
    },
    {
      icon: '💰',
      title: 'Earn Monthly',
      description: 'Get paid based on user interaction levels'
    },
    {
      icon: '📊',
      title: 'Track Performance',
      description: 'Monitor your character usage and earnings'
    }
  ];

  const stats = [
    { label: 'Avg. Monthly Payout', value: '$127', subtitle: 'for featured creators' },
    { label: 'Characters Featured', value: '2,400+', subtitle: 'and growing' },
    { label: 'Creator Community', value: '850+', subtitle: 'active creators' }
  ];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '20px',
      padding: '2.5rem',
      height: 'fit-content'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          fontSize: '1.5rem'
        }}>
          ⭐
        </div>
        
        <h3 style={{
          color: '#FFD700',
          fontSize: '1.8rem',
          fontWeight: 700,
          margin: '0 0 0.75rem 0',
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
          Turn your character creations into monthly income. We curate the best 
          characters for our hub and reward creators based on user engagement.
        </p>

        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '25px',
          padding: '0.5rem 1rem',
          display: 'inline-block',
          fontSize: '0.9rem',
          color: '#FFD700',
          fontWeight: 600
        }}>
          🚀 Coming Q2 2025
        </div>
      </div>

      {/* How It Works */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <h4 style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '1.1rem',
          fontWeight: 600,
          margin: '0 0 1.5rem 0',
          textAlign: 'center'
        }}>
          How It Works
        </h4>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{
                fontSize: '1.5rem',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 215, 0, 0.2)',
                borderRadius: '10px',
                flexShrink: 0
              }}>
                {feature.icon}
              </div>
              
              <div>
                <h5 style={{
                  color: '#FFD700',
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 0.5rem 0'
                }}>
                  {feature.title}
                </h5>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Preview */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <h4 style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '1rem',
          fontWeight: 600,
          margin: '0 0 1rem 0',
          textAlign: 'center'
        }}>
          Creator Success Metrics
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem'
        }}>
          {stats.map((stat, index) => (
            <div
              key={index}
              style={{
                textAlign: 'center',
                padding: '1rem',
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '10px'
              }}
            >
              <div style={{
                color: '#00FF88',
                fontSize: '1.4rem',
                fontWeight: 700,
                margin: '0 0 0.25rem 0'
              }}>
                {stat.value}
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.8rem',
                fontWeight: 600,
                margin: '0 0 0.25rem 0'
              }}>
                {stat.label}
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.7rem'
              }}>
                {stat.subtitle}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Early Access CTA */}
      <div style={{
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h5 style={{
            color: '#FFD700',
            fontSize: '1rem',
            fontWeight: 600,
            margin: '0 0 0.75rem 0'
          }}>
            Join the Creator Waitlist
          </h5>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            margin: '0 0 1rem 0',
            lineHeight: 1.4
          }}>
            Get early access to creator tools and be among the first to monetize 
            your characters when the hub launches.
          </p>
          
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

        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.8rem',
          margin: 0
        }}>
          Requires Pro or Unlimited subscription
        </p>
      </div>
    </div>
  );
};

export default CreatorHubTeaser;