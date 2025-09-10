// src/components/TemplateGallery.jsx - Defensive template loading with fallbacks
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Fallback templates if API fails
const FALLBACK_TEMPLATES = {
  'Scholar': [
    {
      id: 1,
      name: 'Ancient Philosopher',
      description: 'Wise thinker from classical antiquity seeking truth through dialogue',
      historical_period: 'Ancient',
      personality_archetype: 'Scholar',
      expertise_domain: 'Philosophy',
      template_data: {
        system_instruction_template: "You are an ancient philosopher seeking truth through dialogue.",
        suggested_constraints: "Speak in thoughtful, measured tones. Reference classical concepts.",
        sample_triggers: ["wisdom", "truth", "virtue", "knowledge"]
      }
    }
  ],
  'Artist': [
    {
      id: 2,
      name: 'Renaissance Artist',
      description: 'Creative genius from the Renaissance period fascinated by beauty and science',
      historical_period: 'Renaissance',
      personality_archetype: 'Artist',
      expertise_domain: 'Art',
      template_data: {
        system_instruction_template: "You are a Renaissance artist fascinated by both beauty and science.",
        suggested_constraints: "Discuss art techniques and humanist ideals.",
        sample_triggers: ["art", "beauty", "innovation", "patronage"]
      }
    }
  ]
};

const TemplateGallery = ({ onSelectTemplate, onClose }) => {
  const { token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedArchetype, setSelectedArchetype] = useState('all');

  // Defensive template loading with multiple fallback layers
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        // Primary API attempt
        if (token) {
          try {
            const response = await fetch(`${API_BASE}/api/premium/templates?per_page=100`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              // Add timeout to prevent hanging
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Templates API response:', data);

              // Handle both grouped and flat template responses
              let templateList = [];
              if (data.template_groups) {
                // Grouped response - flatten all groups
                templateList = Object.values(data.template_groups).flat();
              } else if (data.templates) {
                // Direct template array
                templateList = data.templates;
              } else {
                // Fallback to any array in response
                templateList = Array.isArray(data) ? data : [];
              }

              // Ensure all templates have required fields
              const validTemplates = templateList.filter(template => 
                template && 
                template.id && 
                template.name && 
                template.description
              );

              if (validTemplates.length > 0) {
                console.log(`Loaded ${validTemplates.length} valid templates from API`);
                setTemplates(validTemplates);
                setLoading(false);
                return;
              }
            }
          } catch (apiError) {
            console.warn('Template API failed:', apiError);
            // Continue to fallback
          }
        }

        // Fallback 1: Try public template endpoint (no auth)
        try {
          const publicResponse = await fetch(`${API_BASE}/api/premium/templates`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });

          if (publicResponse.ok) {
            const publicData = await publicResponse.json();
            const publicTemplates = Array.isArray(publicData) ? publicData : 
                                   publicData.templates || [];
            
            if (publicTemplates.length > 0) {
              console.log('Loaded templates from public API');
              setTemplates(publicTemplates);
              setLoading(false);
              return;
            }
          }
        } catch (publicError) {
          console.warn('Public template API failed:', publicError);
          // Continue to hardcoded fallback
        }

        // Fallback 2: Use hardcoded templates
        console.log('Using fallback templates');
        const fallbackTemplateList = Object.values(FALLBACK_TEMPLATES).flat();
        setTemplates(fallbackTemplateList);

      } catch (error) {
        console.error('All template loading methods failed:', error);
        setError('Unable to load templates. Using basic templates.');
        setTemplates(Object.values(FALLBACK_TEMPLATES).flat());
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [token]);

  // Group templates by archetype for filtering
  const templateGroups = templates.reduce((groups, template) => {
    const archetype = template.personality_archetype || 'Other';
    if (!groups[archetype]) {
      groups[archetype] = [];
    }
    groups[archetype].push(template);
    return groups;
  }, {});

  const archetypes = ['all', ...Object.keys(templateGroups)];

  // Filter templates based on selected archetype
  const filteredTemplates = selectedArchetype === 'all' 
    ? templates 
    : (templateGroups[selectedArchetype] || []);

  const handleTemplateSelect = (template) => {
    // Ensure template has ID before selection
    if (!template.id) {
      console.error('Template missing ID:', template);
      setError('Invalid template selected. Please try another.');
      return;
    }
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate && selectedTemplate.id) {
      onSelectTemplate(selectedTemplate);
    } else {
      setError('Please select a valid template.');
    }
  };

  // Loading state
  if (loading) {
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

    // Service down state - when no templates loaded successfully
  if (!loading && templates.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Georgia', serif"
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
            Service Temporarily Unavailable
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 1.5rem 0' }}>
            Template service is currently down. Please try again later or browse existing characters.
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
              cursor: 'pointer'
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

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          margin: '1rem 2rem',
          color: '#ff6b6b',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

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
                  textTransform: 'capitalize'
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
        {filteredTemplates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <p style={{ fontSize: '1.1rem', margin: '0 0 1rem 0' }}>
              No templates found for "{selectedArchetype}"
            </p>
            <button
              onClick={() => setSelectedArchetype('all')}
              style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
                color: '#FFD700',
                fontSize: '0.9rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer'
              }}
            >
              View All Templates
            </button>
          </div>
        ) : (
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
                onMouseEnter={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
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
                          textTransform: 'capitalize',
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
                      textTransform: 'uppercase',
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

                {/* Template ID Debug Info (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.25rem',
                    background: 'rgba(255, 215, 0, 0.1)',
                    fontSize: '0.7rem',
                    color: 'rgba(255, 215, 0, 0.7)',
                    borderRadius: '4px'
                  }}>
                    ID: {template.id} | Valid: {template.id ? 'Yes' : 'No'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
                disabled={!selectedTemplate?.id}
                style={{
                  background: selectedTemplate?.id 
                    ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                    : 'rgba(128, 128, 128, 0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: selectedTemplate?.id ? '#000' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  padding: '0.75rem 1.5rem',
                  cursor: selectedTemplate?.id ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedTemplate?.id ? '0 4px 15px rgba(255, 215, 0, 0.3)' : 'none',
                  opacity: selectedTemplate?.id ? 1 : 0.6
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