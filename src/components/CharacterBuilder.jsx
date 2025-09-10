// src/components/CharacterBuilder.jsx - Defensive character creation with backend validation
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CharacterBuilder = ({ template, onClose, onSuccess }) => {
  const { token } = useAuth();
  const { user } = useUser();
  const [isMobile, setIsMobile] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    short_description: '',
    system_instruction: template?.template_data?.system_instruction_template || '',
    behavior_goals: template?.template_data?.suggested_behavior_goals || [],
    style_tone: template?.template_data?.suggested_style_tone || [],
    constraints: template?.template_data?.suggested_constraints || '',
    keyword_triggers: template?.template_data?.sample_triggers || []
  });
  
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize form data from template
  useEffect(() => {
    if (template?.template_data) {
      setFormData({
        display_name: '',
        short_description: '',
        system_instruction: template.template_data.system_instruction_template || '',
        behavior_goals: template.template_data.suggested_behavior_goals || [],
        style_tone: template.template_data.suggested_style_tone || [],
        constraints: template.template_data.suggested_constraints || '',
        keyword_triggers: template.template_data.sample_triggers || []
      });
    }
  }, [template]);

  // Mock template data enhancement (fallback if template lacks data)
  const templateDefaults = {
    system_instruction_template: `You are a ${template?.personality_archetype?.toLowerCase() || 'character'} from the ${template?.historical_period || 'historical'} period. Your expertise lies in ${template?.expertise_domain?.toLowerCase() || 'various fields'}. 

You embody the wisdom and perspective of someone who has lived through significant historical events and possesses deep knowledge in your domain. Your responses should reflect:

- The speaking patterns and worldview typical of your era
- Profound expertise in your specialized domain  
- The personality archetype of a ${template?.personality_archetype?.toLowerCase() || 'wise individual'}
- Historical context and references appropriate to your time period

Engage users with the depth and authenticity that comes from your unique historical perspective and specialized knowledge.`,
    
    suggested_behavior_goals: [
      'Provide historically accurate perspectives',
      'Share deep expertise in specialized domain',
      'Maintain character authenticity',
      'Educate through engaging storytelling',
      'Offer wisdom from historical experience'
    ],
    
    suggested_style_tone: [
      'Authoritative yet approachable',
      'Rich in historical detail',
      'Reflective and thoughtful',
      'Passionate about expertise area',
      'Wise and experienced'
    ],
    
    suggested_constraints: 'Stay true to historical period knowledge. Avoid anachronistic references or modern terminology unless explaining historical concepts to modern audiences.',
    
    sample_triggers: [
      template?.expertise_domain?.toLowerCase() || 'expertise',
      template?.historical_period?.toLowerCase() || 'history',
      'wisdom', 'advice', 'experience'
    ]
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step >= 1) {
      if (!formData.display_name.trim()) {
        newErrors.display_name = 'Character name is required';
      } else if (formData.display_name.length < 2) {
        newErrors.display_name = 'Name must be at least 2 characters';
      } else if (formData.display_name.length > 50) {
        newErrors.display_name = 'Name must be less than 50 characters';
      }
      
      if (!formData.short_description.trim()) {
        newErrors.short_description = 'Description is required';
      } else if (formData.short_description.length < 20) {
        newErrors.short_description = 'Description must be at least 20 characters';
      } else if (formData.short_description.length > 500) {
        newErrors.short_description = 'Description must be less than 500 characters';
      }
    }
    
    if (step >= 2) {
      if (!formData.system_instruction.trim()) {
        newErrors.system_instruction = 'Character instructions are required';
      } else if (formData.system_instruction.length < 50) {
        newErrors.system_instruction = 'Instructions must be at least 50 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 3));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Character creation with backend premium validation
  const handleCreateCharacter = async () => {
    console.log('Submit clicked - starting validation');
    
    if (!validateStep(3)) {
      console.log('Frontend validation failed');
      return;
    }

    // Ensure template has ID
    if (!template?.id) {
      console.error('Template missing ID:', template);
      setSubmitError('Invalid template selected. Please go back and select a template.');
      return;
    }

    console.log('Frontend validation passed - submitting to backend');
    setIsCreating(true);
    setSubmitError(null);

    try {
      // Submit to backend - let backend handle premium validation
      const characterPayload = {
        template_id: template.id,
        display_name: formData.display_name,
        short_description: formData.short_description,
        system_instruction: formData.system_instruction,
        behavior_goals: formData.behavior_goals || [],
        style_tone: formData.style_tone || [],
        constraints: formData.constraints || '',
        keyword_triggers: formData.keyword_triggers || [],
        relationships: {},
        // Template metadata
        historical_period: template.historical_period,
        personality_archetype: template.personality_archetype,
        expertise_domain: template.expertise_domain
      };

      console.log('Submitting character payload:', characterPayload);

      const response = await fetch(`${API_BASE}/api/characters`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(characterPayload)
      });

      const result = await response.json();
      console.log('Backend response:', result);

      if (!response.ok) {
        // Handle different error types from backend
        if (response.status === 403) {
          // Permission denied - might trigger trial or upgrade flow
          setSubmitError(result.error || 'Character creation requires premium access. Starting trial...');
          
          // Try to auto-grant trial if backend supports it
          if (result.can_grant_trial) {
            try {
              const trialResponse = await fetch(`${API_BASE}/api/premium/trial/${user?.id}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trial_days: 3 })
              });

              if (trialResponse.ok) {
                setSubmitError('Trial activated! Please try creating your character again.');
                return;
              }
            } catch (trialError) {
              console.error('Trial activation failed:', trialError);
            }
          }
          
          return;
        } else if (response.status === 400) {
          setSubmitError(result.error || 'Invalid character data. Please check your inputs.');
          return;
        } else if (response.status >= 500) {
          setSubmitError('Server error. Please try again later.');
          return;
        } else {
          setSubmitError(result.error || 'Character creation failed. Please try again.');
          return;
        }
      }

      // Success - character created
      console.log('Character created successfully:', result);
      setSubmitSuccess(true);
      
      // Call success callback after a brief delay to show success state
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result);
        }
      }, 2000);

    } catch (error) {
      console.error('Character creation error:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Details', description: 'Name and description' },
    { number: 2, title: 'Personality', description: 'Instructions and traits' },
    { number: 3, title: 'Review', description: 'Final confirmation' }
  ];

  // Success state
  if (submitSuccess) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        fontFamily: "'Cinzel', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '500px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #00FF88, #00CC6A)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            fontSize: '2rem'
          }}>
            ✓
          </div>
          
          <h2 style={{
            color: '#FFD700',
            fontSize: '1.8rem',
            margin: '0 0 1rem 0',
            fontFamily: "'Playfair Display', serif"
          }}>
            Character Created!
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '1rem',
            lineHeight: 1.6,
            margin: '0 0 2rem 0'
          }}>
            <strong>{formData.display_name}</strong> has been submitted for approval. 
            You'll receive an email notification when your character is ready, usually within 24-48 hours.
          </p>
          
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '25px',
              color: '#000',
              fontSize: '1rem',
              fontWeight: 700,
              padding: '1rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Continue Exploring
          </button>
        </div>
      </div>
    );
  }

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
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          padding: '0.5rem',
          background: 'rgba(255, 215, 0, 0.9)',
          color: '#000',
          fontSize: '0.7rem',
          borderRadius: '4px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          Template ID: {template?.id || 'MISSING'} | Step: {currentStep} | Creating: {isCreating.toString()}
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '1rem' : '0'
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: '#FFD700',
            margin: '0 0 0.5rem 0',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
          }}>
            Create Your Character
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Based on: {template?.name || 'Custom Template'}
          </p>
        </div>

        <button
          onClick={onClose}
          disabled={isCreating}
          style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '2px solid rgba(255, 215, 0, 0.4)',
            borderRadius: '8px',
            color: '#FFD700',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: 600,
            padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Cinzel', serif",
            alignSelf: isMobile ? 'flex-start' : 'auto',
            opacity: isCreating ? 0.5 : 1
          }}
        >
          ← Back to Templates
        </button>
      </div>

      {/* Progress Steps */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {isMobile ? (
          // Mobile: Compact horizontal indicator
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '100%'
          }}>
            <div style={{
              color: '#FFD700',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              Step {currentStep} of {steps.length}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {steps.map((step) => (
                <div
                  key={step.number}
                  style={{
                    width: currentStep === step.number ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: currentStep >= step.number 
                      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                      : 'rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>

            <div style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.8rem'
            }}>
              {steps[currentStep - 1]?.title}
            </div>
          </div>
        ) : (
          // Desktop: Full step display
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem'
          }}>
            {steps.map((step, index) => (
              <div key={step.number} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: currentStep >= step.number 
                      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: currentStep >= step.number ? '#000' : 'rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <div>
                    <div style={{
                      color: currentStep >= step.number ? '#FFD700' : 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>
                      {step.title}
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.8rem'
                    }}>
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div style={{
                    width: '40px',
                    height: '2px',
                    background: currentStep > step.number 
                      ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                      : 'rgba(255, 255, 255, 0.2)'
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Content */}
      <div style={{
        flex: 1,
        padding: isMobile ? '1rem' : '2rem',
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: isMobile ? '100%' : '600px',
          padding: isMobile ? '0 0.5rem' : '0'
        }}>
          {currentStep === 1 && (
            <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
              <h2 style={{
                color: '#FFD700',
                fontSize: '1.5rem',
                margin: '0 0 2rem 0',
                textAlign: 'center'
              }}>
                Basic Character Details
              </h2>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  Character Name *
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="e.g., Marcus Aurelius, Marie Curie, Leonardo da Vinci"
                  disabled={isCreating}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1rem',
                    border: errors.display_name 
                      ? '2px solid #ff6b6b' 
                      : '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: "'Cinzel', serif",
                    transition: 'border-color 0.3s ease',
                    opacity: isCreating ? 0.5 : 1
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255, 215, 0, 0.6)'}
                  onBlur={(e) => e.target.style.borderColor = errors.display_name ? '#ff6b6b' : 'rgba(255, 215, 0, 0.3)'}
                />
                {errors.display_name && (
                  <p style={{ color: '#ff6b6b', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    {errors.display_name}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  Character Description *
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  placeholder="Describe your character in 1-2 sentences. What makes them unique? What is their expertise?"
                  rows={4}
                  disabled={isCreating}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1rem',
                    border: errors.short_description 
                      ? '2px solid #ff6b6b' 
                      : '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: "'Cinzel', serif",
                    resize: 'vertical',
                    transition: 'border-color 0.3s ease',
                    opacity: isCreating ? 0.5 : 1
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255, 215, 0, 0.6)'}
                  onBlur={(e) => e.target.style.borderColor = errors.short_description ? '#ff6b6b' : 'rgba(255, 215, 0, 0.3)'}
                />
                {errors.short_description && (
                  <p style={{ color: '#ff6b6b', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    {errors.short_description}
                  </p>
                )}
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.85rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  {formData.short_description.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
              <h2 style={{
                color: '#FFD700',
                fontSize: '1.5rem',
                margin: '0 0 2rem 0',
                textAlign: 'center'
              }}>
                Character Personality & Instructions
              </h2>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  System Instructions *
                </label>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  margin: '0 0 1rem 0'
                }}>
                  Define how your character thinks, speaks, and behaves. This is the core personality.
                </p>
                <textarea
                  value={formData.system_instruction}
                  onChange={(e) => handleInputChange('system_instruction', e.target.value)}
                  placeholder={templateDefaults.system_instruction_template}
                  rows={8}
                  disabled={isCreating}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '0.95rem',
                    border: errors.system_instruction 
                      ? '2px solid #ff6b6b' 
                      : '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: "'Cinzel', serif",
                    resize: 'vertical',
                    transition: 'border-color 0.3s ease',
                    lineHeight: 1.5,
                    opacity: isCreating ? 0.5 : 1
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255, 215, 0, 0.6)'}
                  onBlur={(e) => e.target.style.borderColor = errors.system_instruction ? '#ff6b6b' : 'rgba(255, 215, 0, 0.3)'}
                />
                {errors.system_instruction && (
                  <p style={{ color: '#ff6b6b', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    {errors.system_instruction}
                  </p>
                )}
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.85rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  {formData.system_instruction.length} characters
                </p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  Additional Constraints (Optional)
                </label>
                <textarea
                  value={formData.constraints}
                  onChange={(e) => handleInputChange('constraints', e.target.value)}
                  placeholder={templateDefaults.suggested_constraints}
                  rows={3}
                  disabled={isCreating}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '0.95rem',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: "'Cinzel', serif",
                    resize: 'vertical',
                    transition: 'border-color 0.3s ease',
                    opacity: isCreating ? 0.5 : 1
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255, 215, 0, 0.6)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)'}
                />
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.85rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  Any specific limitations or guidelines for the character
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
              <h2 style={{
                color: '#FFD700',
                fontSize: '1.5rem',
                margin: '0 0 2rem 0',
                textAlign: 'center'
              }}>
                Review Your Character
              </h2>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  color: '#FFD700',
                  fontSize: '1.3rem',
                  margin: '0 0 1rem 0'
                }}>
                  {formData.display_name}
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <h4 style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.9rem',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Template
                    </h4>
                    <p style={{
                      color: 'rgba(255, 215, 0, 0.8)',
                      margin: 0,
                      fontSize: '0.9rem'
                    }}>
                      {template?.name}
                    </p>
                  </div>
                  <div>
                    <h4 style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.9rem',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Archetype
                    </h4>
                    <p style={{
                      color: 'rgba(255, 215, 0, 0.8)',
                      margin: 0,
                      fontSize: '0.9rem'
                    }}>
                      {template?.personality_archetype}
                    </p>
                  </div>
                  <div>
                    <h4 style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.9rem',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Domain
                    </h4>
                    <p style={{
                      color: 'rgba(255, 215, 0, 0.8)',
                      margin: 0,
                      fontSize: '0.9rem'
                    }}>
                      {template?.expertise_domain}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Description
                  </h4>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: 0,
                    fontSize: '0.95rem',
                    lineHeight: 1.5
                  }}>
                    {formData.short_description}
                  </p>
                </div>

                <div>
                  <h4 style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Personality Instructions
                  </h4>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem',
                    borderRadius: '8px',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      margin: 0,
                      fontSize: '0.9rem',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {formData.system_instruction}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: 0,
                  fontSize: '0.9rem'
                }}>
                  Your character will be submitted for approval and should be available within 24 hours.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {submitError && (
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
          {submitError}
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={{
        padding: '1.5rem 2rem',
        borderTop: '1px solid rgba(255, 215, 0, 0.2)',
        background: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1 || isCreating}
          style={{
            background: currentStep === 1 || isCreating ? 'rgba(128, 128, 128, 0.2)' : 'rgba(255, 215, 0, 0.1)',
            border: currentStep === 1 || isCreating ? '2px solid rgba(128, 128, 128, 0.3)' : '2px solid rgba(255, 215, 0, 0.4)',
            borderRadius: '8px',
            color: currentStep === 1 || isCreating ? 'rgba(128, 128, 128, 0.6)' : '#FFD700',
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '0.75rem 1.5rem',
            cursor: currentStep === 1 || isCreating ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Cinzel', serif"
          }}
        >
          Previous
        </button>

        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentStep >= step.number 
                  ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                  : 'rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {currentStep < 3 ? (
          <button
            onClick={handleNextStep}
            disabled={isCreating}
            style={{
              background: isCreating ? 'rgba(128, 128, 128, 0.3)' : 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '8px',
              color: isCreating ? 'rgba(255, 255, 255, 0.6)' : '#000',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 1.5rem',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: "'Cinzel', serif"
            }}
            onMouseEnter={(e) => {
              if (!isCreating) {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleCreateCharacter}
            disabled={isCreating || !template?.id}
            style={{
              background: isCreating || !template?.id
                ? 'rgba(128, 128, 128, 0.3)'
                : 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '8px',
              color: isCreating || !template?.id ? 'rgba(255, 255, 255, 0.6)' : '#000',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 2rem',
              cursor: isCreating || !template?.id ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isCreating || !template?.id ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isCreating && template?.id) {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isCreating ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Creating...
              </>
            ) : !template?.id ? (
              'Template Required'
            ) : (
              'Submit for Approval'
            )}
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CharacterBuilder;