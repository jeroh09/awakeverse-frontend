// Fixed TemplateGallery.jsx - Updated with new design system
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Enhanced fallback templates with all archetypes
const FALLBACK_TEMPLATES = {
  'Scholar': [
    {
      id: 1,
      name: 'Ancient Philosopher',
      description: 'Wise thinker from classical antiquity seeking truth through dialogue',
      historical_period: 'Ancient',
      personality_archetype: 'Scholar',
      expertise_domain: 'Philosophy'
    }
  ],
  'Artist': [
    {
      id: 2,
      name: 'Renaissance Artist', 
      description: 'Creative genius from the Renaissance period fascinated by beauty and science',
      historical_period: 'Renaissance',
      personality_archetype: 'Artist',
      expertise_domain: 'Art'
    }
  ],
  'Leader': [
    {
      id: 3,
      name: 'Industrial Innovator',
      description: 'Inventor or entrepreneur from the Industrial Revolution',
      historical_period: 'Industrial',
      personality_archetype: 'Leader',
      expertise_domain: 'Science'
    }
  ],
  'Warrior': [
    {
      id: 4,
      name: 'Champion Athlete',
      description: 'Legendary competitor who dominated their sport',
      historical_period: 'Sports',
      personality_archetype: 'Warrior',
      expertise_domain: 'Athletics'
    }
  ],
  'Explorer': [
    {
      id: 5,
      name: 'Sci-Fi Explorer',
      description: 'Space traveler or futuristic scientist',
      historical_period: 'Science Fiction',
      personality_archetype: 'Explorer',
      expertise_domain: 'Science'
    }
  ]
};

const TemplateGallery = ({ onSelectTemplate, onClose }) => {
  const { user } = useUser();
  const [templates, setTemplates] = useState([]);
  const [templateGroups, setTemplateGroups] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  const [debugInfo, setDebugInfo] = useState({});

  // Load templates with proper error handling and structure
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Primary API attempt
        if (user) {
          try {
            const response = await fetch(`${API_BASE}/api/premium/templates?per_page=100`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
              const data = await response.json();

              // FIXED: Use the proper backend structure
              if (data.status === 'success') {
                // Use template_groups for categories (complete data)
                const groups = data.template_groups || {};
                const categories = data.available_categories || [];
                const templateList = data.templates || [];
                
                setTemplates(templateList);
                setTemplateGroups(groups);
                setAvailableCategories(categories);
                setLoading(false);
                return;
              }
            }
          } catch (apiError) {
            console.warn('Template API failed:', apiError);
            // Continue to fallback
          }
        }

        // Fallback: Use hardcoded templates
        const fallbackTemplateList = Object.values(FALLBACK_TEMPLATES).flat();
        const fallbackCategories = Object.keys(FALLBACK_TEMPLATES);
        
        setTemplates(fallbackTemplateList);
        setTemplateGroups(FALLBACK_TEMPLATES);
        setAvailableCategories(fallbackCategories);
        setDebugInfo({ fallback: true, count: fallbackTemplateList.length });

      } catch (error) {
        console.error('All template loading methods failed:', error);
        setError('Unable to load templates. Using basic templates.');
        setTemplates(Object.values(FALLBACK_TEMPLATES).flat());
        setTemplateGroups(FALLBACK_TEMPLATES);
        setAvailableCategories(Object.keys(FALLBACK_TEMPLATES));
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [user]);

  // FIXED: Build archetypes list from availableCategories instead of templateGroups
  const archetypes = ['all', ...availableCategories];

  // FIXED: Filter templates properly using template_groups
  const filteredTemplates = selectedArchetype === 'all' 
    ? templates 
    : (templateGroups[selectedArchetype] || []);

  const handleTemplateSelect = (template) => {
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

  // Get era badge color based on era
  const getEraBadgeColor = (era) => {
    const eraColors = {
      ancient: '#8B4513',
      medieval: '#2C3E50',
      renaissance: '#E67E22',
      industrial: '#7D3C98',
      sports: '#2E86C1',
      'science fiction': '#16A085',
      modern: '#1F618D',
      future: '#27AE60',
      default: '#3498DB'
    };

    const normalizedEra = (era || '').toLowerCase().trim();
    return eraColors[normalizedEra] || eraColors.default;
  };

  // Format era display name
  const formatEraName = (era) => {
    if (!era) return 'Modern';

    const eraMap = {
      ancient: 'Ancient Times',
      medieval: 'Medieval Era',
      renaissance: 'Renaissance',
      industrial: 'Industrial Era',
      sports: 'Modern Sports',
      'science fiction': 'Science Fiction',
      modern: 'Modern Day',
      future: 'Future'
    };

    const normalizedEra = era.toLowerCase().trim();
    return eraMap[normalizedEra] || era;
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
        background: '#0A0F1A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#6366F1'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.3)',
          borderTop: '3px solid #6366F1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <p style={{ fontSize: '1.1rem', margin: 0, color: '#F1F5F9' }}>
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
        background: '#0A0F1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{
          background: '#141B2E',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#6366F1', margin: '0 0 1rem 0', fontFamily: "'Syne', sans-serif" }}>
            Service Temporarily Unavailable
          </h2>
          <p style={{ color: '#94A3B8', margin: '0 0 1.5rem 0' }}>
            Template service is currently down. Please try again later or browse existing characters.
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #6366F1, #4f46e5)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif"
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
      background: '#0A0F1A',
      overflowY: 'auto',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(10, 15, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
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
              color: '#F5F5DC',
              fontSize: '1.8rem',
              fontFamily: "'Syne', sans-serif",
              margin: '0 0 0.5rem 0',
              letterSpacing: '1px',
              fontWeight: 700
            }}>
              Character Templates
            </h1>
            <p style={{
              color: '#94A3B8',
              margin: 0,
              fontSize: '0.9rem'
            }}>
              Choose a template to start creating your character ({templates.length} available)
            </p>
          </div>        
          <button
            onClick={onClose}
            style={{
              background: 'rgba(28, 38, 64, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '8px',
              color: '#F1F5F9',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: "'Inter', system-ui, sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(36, 49, 82, 0.8)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(28, 38, 64, 0.8)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
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
        borderBottom: '1px solid rgba(99, 102, 241, 0.1)'
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
            color: 'rgba(99, 102, 241, 0.8)',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            Filter by type ({archetypes.length - 1} categories):
          </span>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {archetypes.map(archetype => (
              <button
                key={archetype}
                onClick={() => setSelectedArchetype(archetype)}
                style={{
                  background: selectedArchetype === archetype 
                    ? 'radial-gradient(circle at top left, rgba(79, 70, 229, 0.7), rgba(15, 23, 42, 0.95))' 
                    : '#141B2E',
                  border: selectedArchetype === archetype 
                    ? '1px solid #6366F1' 
                    : '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '20px',
                  color: selectedArchetype === archetype ? '#F1F5F9' : '#94A3B8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.4rem 0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'capitalize',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  boxShadow: selectedArchetype === archetype ? '0 4px 14px rgba(99, 102, 241, 0.5)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedArchetype !== archetype) {
                    e.currentTarget.style.borderColor = '#6366F1';
                    e.currentTarget.style.color = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedArchetype !== archetype) {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                {archetype} {archetype !== 'all' && templateGroups[archetype] ? `(${templateGroups[archetype].length})` : ''}
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
            color: '#94A3B8'
          }}>
            <p style={{ fontSize: '1.1rem', margin: '0 0 1rem 0' }}>
              No templates found for "{selectedArchetype}"
            </p>
            <button
              onClick={() => setSelectedArchetype('all')}
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                color: '#6366F1',
                fontSize: '0.9rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif"
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
                    ? 'rgba(99, 102, 241, 0.1)' 
                    : '#141B2E',
                  border: selectedTemplate?.id === template.id 
                    ? '2px solid rgba(99, 102, 241, 0.6)' 
                    : '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(5px)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                    e.currentTarget.style.background = '#1C2640';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.15), 0 8px 24px -8px rgba(99, 102, 241, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.background = '#141B2E';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {/* Background gradient effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at top, rgba(79, 70, 229, 0.35), transparent 55%)',
                  opacity: 0.7,
                  pointerEvents: 'none'
                }} />

                {/* Template Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      {template.personality_archetype && (
                        <span style={{
                          background: 'rgba(37, 99, 235, 0.18)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '12px',
                          color: '#bfdbfe',
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
                          background: getEraBadgeColor(template.historical_period),
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: '#F1F5F9',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.5rem',
                          fontWeight: 600
                        }}>
                          {formatEraName(template.historical_period)}
                        </span>
                      )}
                    </div>
                    
                    <h3 style={{
                      color: '#F1F5F9',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      margin: '0 0 0.5rem 0',
                      letterSpacing: '0.5px',
                      fontFamily: "'Syne', sans-serif"
                    }}>
                      {template.name}
                    </h3>
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
                  color: '#94A3B8',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  margin: '0 0 1rem 0',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {template.description}
                </p>

                {/* Expertise Domain */}
                {template.expertise_domain && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <span style={{
                      color: '#64748B',
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }}>
                      Expertise:
                    </span>
                    <span style={{
                      color: '#6366F1',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      {template.expertise_domain}
                    </span>
                  </div>
                )}

                {/* Use Template Button */}
                <button
                  style={{
                    width: '100%',
                    padding: '0.7rem 1.1rem',
                    background: 'linear-gradient(135deg, #6366F1, #4f46e5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '999px',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.7)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    zIndex: 1,
                    fontFamily: "'Inter', system-ui, sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 14px 30px rgba(79, 70, 229, 0.85)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.7)';
                  }}
                >
                  Use Template
                </button>
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
          background: 'rgba(10, 15, 26, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(99, 102, 241, 0.3)',
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
                color: '#6366F1',
                fontSize: '0.9rem',
                fontWeight: 600,
                margin: '0 0 0.25rem 0',
                fontFamily: "'Syne', sans-serif"
              }}>
                Selected: {selectedTemplate.name}
              </p>
              <p style={{
                color: '#94A3B8',
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
                  background: 'rgba(28, 38, 64, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Inter', system-ui, sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(36, 49, 82, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(28, 38, 64, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedTemplate?.id}
                style={{
                  background: selectedTemplate?.id 
                    ? 'linear-gradient(135deg, #6366F1, #4f46e5)'
                    : 'rgba(128, 128, 128, 0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: selectedTemplate?.id ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  padding: '0.75rem 1.5rem',
                  cursor: selectedTemplate?.id ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedTemplate?.id ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none',
                  opacity: selectedTemplate?.id ? 1 : 0.6,
                  fontFamily: "'Inter', system-ui, sans-serif"
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate?.id) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 26px rgba(79, 70, 229, 0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate?.id) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
                  }
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