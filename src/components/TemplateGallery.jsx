// src/components/TemplateGallery.jsx - Standalone template selection component
import React, { useState } from 'react';
import usePremiumCharacters from '../hooks/usePremiumCharacters';

const TemplateGallery = ({ onSelectTemplate, onClose }) => {
  const { characterTemplates, loading: templatesLoading } = usePremiumCharacters();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  
  // Use real templates from backend instead of mock data
  const templates = Object.values(characterTemplates || {}).flat();

  
  // Group templates by personality archetype for filtering
  const archetypes = ['all', ...Object.keys(characterTemplates || {})];

  // Filter templates based on selected archetype
  const filteredTemplates = selectedArchetype === 'all' 
    ? templates 
    : (characterTemplates?.[selectedArchetype] || []);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  // Loading state
  if (templatesLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Georgia', serif",
        color: '#FFD700'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 215, 0, 0.3)',
          borderTop: '3px solid #FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <p style={{ fontSize: '1.1rem', margin: 0 }}>
          Loading character templates...
        </p>
      </div>
    );
  }

  // Error state - no templates loaded
  if (!templates.length) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Georgia', serif",
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#FFD700', margin: '0 0 1rem 0' }}>
            Templates Unavailable
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 1.5rem 0' }}>
            Character templates could not be loaded. Please try again later.
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontFamily: "'Georgia', serif"
            }}
          >
            Back to Characters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
      overflowY: 'auto',
      fontFamily: "'Georgia', serif"
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(11, 20, 38, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
        padding: '1rem 2rem',
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{
              color: '#FFD700',
              fontSize: '1.8rem',
              fontFamily: "'Playfair Display', serif",
              margin: '0 0 0.5rem 0',
              letterSpacing: '1px'
            }}>
              Character Templates
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '0.9rem'
            }}>
              Choose a template to start creating your character ({templates.length} available)
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            × Close
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        padding: '1rem 2rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <span style={{
            color: 'rgba(255, 215, 0, 0.8)',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            Filter by type:
          </span>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {archetypes.map(archetype => (
              <button
                key={archetype}
                onClick={() => setSelectedArchetype(archetype)}
                style={{
                  background: selectedArchetype === archetype 
                    ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: selectedArchetype === archetype 
                    ? 'none' 
                    : '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '20px',
                  color: selectedArchetype === archetype ? '#000' : '#FFD700',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.4rem 0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'none'
                }}
              >
                {archetype}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
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
                backdropFilter: 'blur(5px)'
              }}
            >
              {/* Template Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: '#FFD700',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem 0',
                    letterSpacing: '0.5px'
                  }}>
                    {template.name}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {template.personality_archetype && (
                      <span style={{
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '12px',
                        color: 'rgba(255, 215, 0, 0.9)',
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.5rem',
                        textTransform: 'none',
                        letterSpacing: '0.5px'
                      }}>
                        {template.personality_archetype}
                      </span>
                    )}
                    
                    {template.historical_period && (
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.5rem'
                      }}>
                        {template.historical_period}
                      </span>
                    )}
                  </div>
                </div>
                
                {template.usage_count !== undefined && (
                  <div style={{
                    background: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(0, 255, 136, 0.9)',
                    fontSize: '0.7rem',
                    padding: '0.3rem 0.5rem',
                    textAlign: 'center',
                    minWidth: '60px'
                  }}>
                    {template.usage_count} uses
                  </div>
                )}
              </div>

              {/* Template Description */}
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: '0 0 1rem 0'
              }}>
                {template.description}
              </p>

              {/* Template Preview */}
              {template.template_preview && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '8px',
                  padding: '0.8rem',
                  margin: '0 0 1rem 0'
                }}>
                  <p style={{
                    color: 'rgba(255, 215, 0, 0.9)',
                    fontSize: '0.8rem',
                    fontStyle: 'italic',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    "{template.template_preview}"
                  </p>
                </div>
              )}

              {/* Example Characters */}
              {template.example_characters && template.example_characters.length > 0 && (
                <div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.75rem',
                    margin: '0 0 0.5rem 0',
                    textTransform: 'none',
                    letterSpacing: '0.5px'
                  }}>
                    Example Characters:
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.3rem'
                  }}>
                    {template.example_characters.slice(0, 3).map((example, index) => (
                      <span
                        key={index}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.4rem'
                        }}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selection Confirmation */}
      {selectedTemplate && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(11, 20, 38, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 215, 0, 0.3)',
          padding: '1rem 2rem',
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{
                color: '#FFD700',
                fontSize: '0.9rem',
                fontWeight: 600,
                margin: '0 0 0.25rem 0'
              }}>
                Selected: {selectedTemplate.name}
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8rem',
                margin: 0
              }}>
                Ready to customize this template for your character
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setSelectedTemplate(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmSelection}
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                }}
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TemplateGallery;