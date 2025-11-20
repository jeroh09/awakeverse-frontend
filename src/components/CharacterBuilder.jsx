// Fixed TemplateGallery.jsx - Complete version with design system implementation and info panel
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { theme } from '../design-system/tokens';

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
  const [showInfoPanel, setShowInfoPanel] = useState(false);

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

  // Loading state
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: theme.colors.background.canvas,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: theme.typography.fonts.body,
        color: theme.colors.accent.primary
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${theme.colors.accent.glow}`,
          borderTop: `3px solid ${theme.colors.accent.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: theme.spacing.md
        }} />
        <p style={{ 
          fontSize: theme.typography.sizes.body,
          margin: 0,
          color: theme.colors.text.secondary
        }}>
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
        background: theme.colors.background.canvas,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: theme.typography.fonts.body
      }}>
        <div style={{
          background: theme.colors.background.surface,
          border: `1px solid ${theme.colors.border.medium}`,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xxl,
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: theme.shadows.elevation03
        }}>
          <h2 style={{ 
            color: theme.colors.accent.primary, 
            margin: `0 0 ${theme.spacing.md} 0`,
            fontFamily: theme.typography.fonts.display,
            fontSize: theme.typography.sizes.h3
          }}>
            Service Temporarily Unavailable
          </h2>
          <p style={{ 
            color: theme.colors.text.secondary, 
            margin: `0 0 ${theme.spacing.lg} 0`,
            fontSize: theme.typography.sizes.body
          }}>
            Template service is currently down. Please try again later or browse existing characters.
          </p>
          <button
            onClick={onClose}
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent.primary}, #4f46e5)`,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.body,
              fontWeight: theme.typography.weights.semibold,
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              cursor: 'pointer',
              boxShadow: theme.shadows.glowStrong
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
      background: theme.colors.background.canvas,
      overflowY: 'auto',
      fontFamily: theme.typography.fonts.body
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: theme.colors.background.surface,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${theme.colors.border.medium}`,
        padding: `${theme.spacing.md} ${theme.spacing.xl}`,
        zIndex: 100,
        boxShadow: theme.shadows.elevation01
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          maxWidth: '1200px',
          margin: '0 auto',
          gap: theme.spacing.lg
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              color: theme.colors.brand.ivory,
              fontSize: theme.typography.sizes.h2,
              fontFamily: theme.typography.fonts.display,
              margin: `0 0 ${theme.spacing.sm} 0`,
              fontWeight: theme.typography.weights.bold
            }}>
              Character Templates
            </h1>
            <p style={{
              color: theme.colors.text.secondary,
              margin: 0,
              fontSize: theme.typography.sizes.bodySmall
            }}>
              Choose a template to start creating your character ({templates.length} available)
            </p>
          </div>

          {/* Info Panel Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md
          }}>
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              style={{
                background: showInfoPanel ? theme.colors.accent.primary : theme.colors.background.interactive,
                border: `1px solid ${showInfoPanel ? theme.colors.accent.primary : theme.colors.border.medium}`,
                borderRadius: theme.borderRadius.md,
                color: showInfoPanel ? theme.colors.text.primary : theme.colors.text.secondary,
                fontSize: theme.typography.sizes.bodySmall,
                fontWeight: theme.typography.weights.semibold,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                cursor: 'pointer',
                transition: theme.transitions.normal,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}
            >
              <span>ℹ️</span>
              Info
            </button>
            
            <button
              onClick={onClose}
              style={{
                background: theme.colors.background.interactive,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text.secondary,
                fontSize: theme.typography.sizes.bodySmall,
                fontWeight: theme.typography.weights.semibold,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                cursor: 'pointer',
                transition: theme.transitions.normal
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.background.peak;
                e.currentTarget.style.color = theme.colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.background.interactive;
                e.currentTarget.style.color = theme.colors.text.secondary;
              }}
            >
              × Close
            </button>
          </div>
        </div>

        {/* Info Panel */}
        {showInfoPanel && (
          <div style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.lg,
            background: theme.colors.background.interactive,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.elevation02
          }}>
            <h3 style={{
              color: theme.colors.accent.primary,
              fontSize: theme.typography.sizes.h4,
              fontFamily: theme.typography.fonts.display,
              margin: `0 0 ${theme.spacing.md} 0`,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm
            }}>
              <span>📚</span>
              How to Create Your Character
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: theme.spacing.lg
            }}>
              {/* Step 1 */}
              <div style={{
                padding: theme.spacing.md,
                background: theme.colors.background.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border.subtle}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.colors.accent.primary}, #4f46e5)`,
                    color: theme.colors.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: theme.typography.sizes.caption,
                    fontWeight: theme.typography.weights.bold
                  }}>
                    1
                  </div>
                  <h4 style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.sizes.body,
                    margin: 0,
                    fontWeight: theme.typography.weights.semibold
                  }}>
                    Browse Templates
                  </h4>
                </div>
                <p style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.sizes.bodySmall,
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Explore different character archetypes - Scholars, Artists, Leaders, Warriors, and Explorers. Each template comes with pre-configured personality traits and expertise domains.
                </p>
              </div>

              {/* Step 2 */}
              <div style={{
                padding: theme.spacing.md,
                background: theme.colors.background.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border.subtle}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.colors.accent.primary}, #4f46e5)`,
                    color: theme.colors.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: theme.typography.sizes.caption,
                    fontWeight: theme.typography.weights.bold
                  }}>
                    2
                  </div>
                  <h4 style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.sizes.body,
                    margin: 0,
                    fontWeight: theme.typography.weights.semibold
                  }}>
                    Select & Customize
                  </h4>
                </div>
                <p style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.sizes.bodySmall,
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Click on a template to select it. You'll be able to customize the character's name, description, personality instructions, and behavioral constraints in the next step.
                </p>
              </div>

              {/* Step 3 */}
              <div style={{
                padding: theme.spacing.md,
                background: theme.colors.background.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border.subtle}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.colors.accent.primary}, #4f46e5)`,
                    color: theme.colors.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: theme.typography.sizes.caption,
                    fontWeight: theme.typography.weights.bold
                  }}>
                    3
                  </div>
                  <h4 style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.sizes.body,
                    margin: 0,
                    fontWeight: theme.typography.weights.semibold
                  }}>
                    Submit for Approval
                  </h4>
                </div>
                <p style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.sizes.bodySmall,
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  After customization, your character will be submitted for quality review. Approval typically takes 24-48 hours. You'll receive an email notification when ready.
                </p>
              </div>

              {/* Step 4 */}
              <div style={{
                padding: theme.spacing.md,
                background: theme.colors.background.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border.subtle}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.colors.accent.primary}, #4f46e5)`,
                    color: theme.colors.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: theme.typography.sizes.caption,
                    fontWeight: theme.typography.weights.bold
                  }}>
                    4
                  </div>
                  <h4 style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.sizes.body,
                    margin: 0,
                    fontWeight: theme.typography.weights.semibold
                  }}>
                    Start Conversations
                  </h4>
                </div>
                <p style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.sizes.bodySmall,
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Once approved, your character becomes available in your chat interface. Engage in authentic conversations that reflect their historical period, expertise, and personality.
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div style={{
              marginTop: theme.spacing.lg,
              padding: theme.spacing.md,
              background: 'rgba(99, 102, 241, 0.1)',
              border: `1px solid ${theme.colors.accent.glow}`,
              borderRadius: theme.borderRadius.md
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: theme.spacing.sm
              }}>
                <span style={{ fontSize: '1.2em' }}>💡</span>
                <div>
                  <h5 style={{
                    color: theme.colors.accent.primary,
                    fontSize: theme.typography.sizes.bodySmall,
                    margin: `0 0 ${theme.spacing.xs} 0`,
                    fontWeight: theme.typography.weights.semibold
                  }}>
                    Pro Tips
                  </h5>
                  <ul style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.typography.sizes.bodySmall,
                    margin: 0,
                    paddingLeft: theme.spacing.md,
                    lineHeight: 1.5
                  }}>
                    <li>Use the filter buttons to narrow down by character type</li>
                    <li>Popular templates show usage counts for reference</li>
                    <li>Each template includes historical context and expertise domains</li>
                    <li>You can fully customize personality instructions later</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: `1px solid rgba(239, 68, 68, 0.3)`,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          margin: theme.spacing.md,
          color: theme.colors.semantic.error,
          fontSize: theme.typography.sizes.bodySmall,
          textAlign: 'center',
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{
        padding: `${theme.spacing.md} ${theme.spacing.xl}`,
        background: theme.colors.background.canvas,
        borderBottom: `1px solid ${theme.colors.border.subtle}`
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          flexWrap: 'wrap'
        }}>
          <span style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.sizes.bodySmall,
            fontWeight: theme.typography.weights.semibold
          }}>
            Filter by type ({archetypes.length - 1} categories):
          </span>
          
          <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
            {archetypes.map(archetype => (
              <button
                key={archetype}
                onClick={() => setSelectedArchetype(archetype)}
                style={{
                  background: selectedArchetype === archetype 
                    ? `linear-gradient(135deg, ${theme.colors.accent.primary}, #4f46e5)` 
                    : theme.colors.background.surface,
                  border: selectedArchetype === archetype 
                    ? 'none' 
                    : `1px solid ${theme.colors.border.medium}`,
                  borderRadius: theme.borderRadius.full,
                  color: selectedArchetype === archetype ? theme.colors.text.primary : theme.colors.accent.primary,
                  fontSize: theme.typography.sizes.caption,
                  fontWeight: theme.typography.weights.semibold,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  cursor: 'pointer',
                  transition: theme.transitions.normal,
                  textTransform: 'capitalize',
                  boxShadow: selectedArchetype === archetype ? theme.shadows.glow : 'none'
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
        padding: theme.spacing.xl,
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {filteredTemplates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: `${theme.spacing.xxl} ${theme.spacing.xl}`,
            color: theme.colors.text.secondary
          }}>
            <p style={{ 
              fontSize: theme.typography.sizes.body,
              margin: `0 0 ${theme.spacing.md} 0` 
            }}>
              No templates found for "{selectedArchetype}"
            </p>
            <button
              onClick={() => setSelectedArchetype('all')}
              style={{
                background: theme.colors.background.surface,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.accent.primary,
                fontSize: theme.typography.sizes.bodySmall,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                cursor: 'pointer',
                transition: theme.transitions.normal
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.background.interactive;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.background.surface;
              }}
            >
              View All Templates
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: theme.spacing.lg
          }}>
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                style={{
                  background: selectedTemplate?.id === template.id 
                    ? theme.colors.background.interactive 
                    : theme.colors.background.surface,
                  border: selectedTemplate?.id === template.id 
                    ? `2px solid ${theme.colors.accent.primary}` 
                    : `1px solid ${theme.colors.border.medium}`,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                  cursor: 'pointer',
                  transition: theme.transitions.normal,
                  backdropFilter: 'blur(5px)',
                  boxShadow: selectedTemplate?.id === template.id 
                    ? theme.shadows.elevation03 
                    : theme.shadows.elevation02,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.currentTarget.style.borderColor = theme.colors.accent.primary;
                    e.currentTarget.style.background = theme.colors.background.interactive;
                    e.currentTarget.style.boxShadow = theme.shadows.elevation03;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.currentTarget.style.borderColor = theme.colors.border.medium;
                    e.currentTarget.style.background = theme.colors.background.surface;
                    e.currentTarget.style.boxShadow = theme.shadows.elevation02;
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
                  background: `radial-gradient(circle at top, ${theme.colors.accent.glow}, transparent 55%)`,
                  opacity: 0.7,
                  pointerEvents: 'none'
                }} />

                {/* Template Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: theme.spacing.md,
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      color: theme.colors.text.primary,
                      fontSize: theme.typography.sizes.bodyLarge,
                      fontWeight: theme.typography.weights.semibold,
                      margin: `0 0 ${theme.spacing.sm} 0`,
                      fontFamily: theme.typography.fonts.display
                    }}>
                      {template.name}
                    </h3>
                    
                    <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                      {template.personality_archetype && (
                        <span style={{
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: `1px solid ${theme.colors.accent.glow}`,
                          borderRadius: theme.borderRadius.full,
                          color: theme.colors.accent.primary,
                          fontSize: theme.typography.sizes.caption,
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          textTransform: 'capitalize',
                          fontWeight: theme.typography.weights.medium
                        }}>
                          {template.personality_archetype}
                        </span>
                      )}
                      
                      {template.historical_period && (
                        <span style={{
                          background: theme.colors.background.interactive,
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: theme.borderRadius.full,
                          color: theme.colors.text.secondary,
                          fontSize: theme.typography.sizes.caption,
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          fontWeight: theme.typography.weights.medium
                        }}>
                          {template.historical_period}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {template.usage_count !== undefined && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: `1px solid rgba(16, 185, 129, 0.3)`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.semantic.success,
                      fontSize: theme.typography.sizes.caption,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      textAlign: 'center',
                      minWidth: '60px',
                      fontWeight: theme.typography.weights.medium
                    }}>
                      {template.usage_count} uses
                    </div>
                  )}
                </div>

                {/* Template Description */}
                <p style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.sizes.bodySmall,
                  lineHeight: 1.5,
                  margin: `0 0 ${theme.spacing.md} 0`,
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
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.md,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <span style={{
                      color: theme.colors.text.tertiary,
                      fontSize: theme.typography.sizes.caption,
                      fontWeight: theme.typography.weights.medium
                    }}>
                      Expertise:
                    </span>
                    <span style={{
                      color: theme.colors.accent.primary,
                      fontSize: theme.typography.sizes.caption,
                      fontWeight: theme.typography.weights.semibold
                    }}>
                      {template.expertise_domain}
                    </span>
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
          background: theme.colors.background.surface,
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${theme.colors.border.medium}`,
          padding: `${theme.spacing.md} ${theme.spacing.xl}`,
          zIndex: 100,
          boxShadow: theme.shadows.elevation03
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
                color: theme.colors.accent.primary,
                fontSize: theme.typography.sizes.bodySmall,
                fontWeight: theme.typography.weights.semibold,
                margin: `0 0 ${theme.spacing.xs} 0`
              }}>
                Selected: {selectedTemplate.name}
              </p>
              <p style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.sizes.caption,
                margin: 0
              }}>
                Ready to customize this template for your character
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: theme.spacing.md }}>
              <button
                onClick={() => setSelectedTemplate(null)}
                style={{
                  background: theme.colors.background.interactive,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.sizes.bodySmall,
                  fontWeight: theme.typography.weights.semibold,
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  cursor: 'pointer',
                  transition: theme.transitions.normal
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.background.peak;
                  e.currentTarget.style.color = theme.colors.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.colors.background.interactive;
                  e.currentTarget.style.color = theme.colors.text.secondary;
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedTemplate?.id}
                style={{
                  background: selectedTemplate?.id 
                    ? `linear-gradient(135deg, ${theme.colors.accent.primary}, #4f46e5)`
                    : theme.colors.background.interactive,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  color: selectedTemplate?.id ? theme.colors.text.primary : theme.colors.text.tertiary,
                  fontSize: theme.typography.sizes.bodySmall,
                  fontWeight: theme.typography.weights.bold,
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  cursor: selectedTemplate?.id ? 'pointer' : 'not-allowed',
                  transition: theme.transitions.normal,
                  boxShadow: selectedTemplate?.id ? theme.shadows.glowStrong : 'none',
                  opacity: selectedTemplate?.id ? 1 : 0.6
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate?.id) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = theme.shadows.elevation04;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate?.id) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = theme.shadows.glowStrong;
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