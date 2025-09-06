// src/components/TemplateGallery.jsx - Standalone template selection component
import React, { useState } from 'react';
import { usePremiumCharacterFlow } from '../hooks/usePremiumCharacterFlow';



// Mock template data - Phase 1
const MOCK_TEMPLATES = [
  {
    id: 1,
    name: 'Historical Leader',
    description: 'Military commanders, rulers, and political figures who shaped history',
    historical_period: 'Various',
    personality_archetype: 'Leader',
    expertise_domain: 'Leadership & Strategy',
    example_characters: ['Napoleon Bonaparte', 'Alexander the Great', 'Cleopatra'],
    template_preview: 'A strategic mind forged in the crucible of power...',
    usage_count: 156
  },
  {
    id: 2,
    name: 'Renaissance Scientist',
    description: 'Brilliant minds who advanced human knowledge through observation and experimentation',
    historical_period: 'Renaissance',
    personality_archetype: 'Scholar',
    expertise_domain: 'Science & Innovation',
    example_characters: ['Leonardo da Vinci', 'Galileo Galilei', 'Isaac Newton'],
    template_preview: 'Curiosity drives me to question everything the world presents...',
    usage_count: 89
  },
  {
    id: 3,
    name: 'Philosophical Sage',
    description: 'Deep thinkers who contemplated existence, ethics, and the nature of reality',
    historical_period: 'Ancient to Modern',
    personality_archetype: 'Sage',
    expertise_domain: 'Philosophy & Wisdom',
    example_characters: ['Socrates', 'Confucius', 'Marcus Aurelius'],
    template_preview: 'The unexamined life is not worth living...',
    usage_count: 134
  },
  {
    id: 4,
    name: 'Romantic Poet',
    description: 'Passionate artists who captured human emotion and beauty in verse',
    historical_period: 'Romantic Era',
    personality_archetype: 'Artist',
    expertise_domain: 'Literature & Arts',
    example_characters: ['Lord Byron', 'Emily Dickinson', 'Rumi'],
    template_preview: 'Words are but shadows of the soul\'s deepest longings...',
    usage_count: 67
  },
  {
    id: 5,
    name: 'Mystical Oracle',
    description: 'Spiritual guides with deep connection to unseen realms and ancient wisdom',
    historical_period: 'Timeless',
    personality_archetype: 'Mystic',
    expertise_domain: 'Spirituality & Mysticism',
    example_characters: ['Oracle of Delphi', 'Nostradamus', 'Rumi'],
    template_preview: 'The veil between worlds grows thin when wisdom is sought...',
    usage_count: 92
  },
  {
    id: 6,
    name: 'Modern Innovator',
    description: 'Visionary entrepreneurs and inventors who shaped the contemporary world',
    historical_period: 'Modern Era',
    personality_archetype: 'Innovator',
    expertise_domain: 'Technology & Business',
    example_characters: ['Tesla', 'Jobs', 'Curie'],
    template_preview: 'The future belongs to those who dare to imagine it differently...',
    usage_count: 78
  }
];

const TemplateGallery = ({ userPremiumStatus = null }) => {
  const { selectTemplate, backToLauncher } = usePremiumCharacterFlow();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
    // Debug logging
  console.log('TemplateGallery rendered');
  console.log('Window width:', window.innerWidth);
  console.log('Context functions available:', { 
    selectTemplate: typeof selectTemplate, 
    backToLauncher: typeof backToLauncher 
  });


  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const handleContinueWithTemplate = () => {
    if (selectedTemplate && selectTemplate) {  // Use selectTemplate from context
      selectTemplate(selectedTemplate);
    }
  };
  

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
      fontFamily: "'Cinzel', serif",
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '2rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: '2rem',
            color: '#FFD700',
            margin: '0 0 0.5rem 0',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
          }}>
            Choose Your Template
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            fontSize: '1rem'
          }}>
            Select a character archetype to begin customization
          </p>
        </div>
        
        <button
          onClick={backToLauncher}
          style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '2px solid rgba(255, 215, 0, 0.4)',
            borderRadius: '8px',
            color: '#FFD700',
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Cinzel', serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
          }}
        >
          ← Back to Characters
        </button>
      </div>

      {/* Template Grid */}
      <div style={{
        flex: 1,
        padding: '2rem',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth <= 768 
            ? '1fr' // Mobile: single column
            : 'repeat(auto-fit, minmax(350px, 1fr))', // Desktop: multiple columns
          gap: window.innerWidth <= 768 ? '1rem' : '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: window.innerWidth <= 768 ? '0 0.5rem' : '0' // Mobile padding
        }}>
          {MOCK_TEMPLATES.map((template, index) => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              style={{
                background: selectedTemplate?.id === template.id 
                  ? 'rgba(255, 215, 0, 0.1)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedTemplate?.id === template.id 
                  ? '2px solid rgba(255, 215, 0, 0.6)' 
                  : '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                backdropFilter: 'blur(10px)',
                opacity: 0,
                animation: `templateSlideIn 0.6s ease-out ${index * 0.1}s forwards`,
                transform: hoveredTemplate === template.id ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: selectedTemplate?.id === template.id 
                  ? '0 8px 25px rgba(255, 215, 0, 0.3)'
                  : hoveredTemplate === template.id 
                    ? '0 6px 20px rgba(255, 215, 0, 0.2)'
                    : 'none'
              }}
            >
              {/* Selection Indicator */}
              {selectedTemplate?.id === template.id && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '24px',
                  height: '24px',
                  background: '#FFD700',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  ✓
                </div>
              )}

              {/* Template Header */}
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{
                  color: '#FFD700',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  margin: '0 0 0.5rem 0',
                  letterSpacing: '0.5px'
                }}>
                  {template.name}
                </h3>
                
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: 'rgba(255, 215, 0, 0.2)',
                    color: 'rgba(255, 215, 0, 0.9)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}>
                    {template.personality_archetype}
                  </span>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem'
                  }}>
                    {template.historical_period}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                margin: '0 0 1rem 0'
              }}>
                {template.description}
              </p>

              {/* Preview Quote */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderLeft: '3px solid rgba(255, 215, 0, 0.5)',
                padding: '0.75rem',
                borderRadius: '0 8px 8px 0',
                marginBottom: '1rem'
              }}>
                <p style={{
                  color: 'rgba(255, 215, 0, 0.9)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  "{template.template_data?.system_instruction_template?.substring(0, 120) || 'A character with unique perspective and expertise...'}..."
                </p>
              </div>

              {/* Example Characters */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.85rem',
                  margin: '0 0 0.5rem 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Inspired by:
                </h4>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {template.example_characters.map((char, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem'
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.8rem'
                }}>
                  {template.expertise_domain}
                </span>
                <span style={{
                  color: 'rgba(255, 215, 0, 0.7)',
                  fontSize: '0.8rem'
                }}>
                  {template.usage_count} created
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      {selectedTemplate && (
        <div style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid rgba(255, 215, 0, 0.2)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4 style={{
              color: '#FFD700',
              margin: '0 0 0.25rem 0',
              fontSize: '1rem'
            }}>
              Selected: {selectedTemplate.name}
            </h4>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '0.9rem'
            }}>
              Ready to customize your character
            </p>
          </div>
          
          <button
            onClick={handleContinueWithTemplate}
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '25px',
              color: '#000',
              fontSize: '1rem',
              fontWeight: 700,
              padding: '1rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: "'Cinzel', serif",
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
            Continue with Template
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes templateSlideIn {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TemplateGallery;