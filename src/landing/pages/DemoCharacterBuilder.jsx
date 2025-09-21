// DemoCharacterBuilder.jsx - Interactive demo for landing page Section 2
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DemoCharacterBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    display_name: 'Marcus Aurelius',
    short_description: 'Roman Emperor and Stoic philosopher known for his wisdom, leadership, and profound reflections on duty, virtue, and the nature of life.',
    system_instruction: `You are Marcus Aurelius, Roman Emperor from 161 to 180 AD and one of the most respected Stoic philosophers. Your expertise lies in leadership, philosophy, and governance.

You embody the wisdom of someone who has ruled an empire while maintaining deep philosophical principles. Your responses should reflect:

- The speaking patterns and worldview of a Roman Stoic philosopher
- Profound expertise in leadership and governance
- The personality archetype of a wise ruler-philosopher
- Historical context from the height of the Roman Empire

Engage users with the depth and authenticity that comes from your unique perspective as both emperor and philosopher.`
  });

  const steps = [
    { number: 1, title: 'Basic Details', description: 'Name and description' },
    { number: 2, title: 'Personality', description: 'Instructions and traits' },
    { number: 3, title: 'Review', description: 'Final confirmation' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    setCurrentStep(Math.min(currentStep + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 2000);
  };

  const resetDemo = () => {
    setCurrentStep(1);
    setShowSuccess(false);
    setIsSubmitting(false);
  };

  if (showSuccess) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '20px',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
        animation: 'fadeIn 0.5s ease-in',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #00FF88, #00CC6A)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '1.5rem',
          color: '#fff'
        }}>
          ✓
        </div>
        
        <h3 style={{
          color: '#FFD700',
          fontSize: '1.4rem',
          margin: '0 0 1rem 0',
          fontFamily: "'Playfair Display', serif"
        }}>
          Demo Complete!
        </h3>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '1rem',
          lineHeight: 1.5,
          margin: '0 0 2rem 0'
        }}>
          <strong>{formData.display_name}</strong> would be submitted for approval. 
          Ready to create your own characters?
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={resetDemo}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Try Again
          </button>
          
          <Link 
            to="/register"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '25px',
              color: '#000',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 2rem',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
          >
            Start Creating →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '20px',
      padding: '2rem',
      maxWidth: '580px',
      margin: '0 auto',
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
    }}>
      {/* Demo Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        background: 'rgba(255, 215, 0, 0.1)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '12px'
      }}>
        <h3 style={{
          color: '#FFD700',
          fontSize: '1.2rem',
          margin: '0 0 0.5rem 0',
          fontFamily: "'Playfair Display', serif"
        }}>
          Interactive Demo
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.9rem',
          margin: 0
        }}>
          Try our character creation process with this example
        </p>
      </div>

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {steps.map((step, index) => (
          <div key={step.number} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: currentStep >= step.number 
                  ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                  : 'rgba(255, 255, 255, 0.2)',
                color: currentStep >= step.number ? '#000' : 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}>
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <div style={{
                color: currentStep >= step.number ? '#FFD700' : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div style={{
                width: '20px',
                height: '1px',
                background: currentStep > step.number 
                  ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                  : 'rgba(255, 255, 255, 0.2)'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ minHeight: '250px' }}>
        {currentStep === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
            <h4 style={{
              color: '#FFD700',
              fontSize: '1.1rem',
              margin: '0 0 1.5rem 0',
              textAlign: 'center'
            }}>
              Character Details
            </h4>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                Character Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.4)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.6)';
                  e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                  e.target.style.boxShadow = '0 0 0 0 rgba(255, 255, 255, 0.4)';
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                Character Description
              </label>
              <textarea
                value={formData.short_description}
                onChange={(e) => handleInputChange('short_description', e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.4)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.6)';
                  e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                  e.target.style.boxShadow = '0 0 0 0 rgba(255, 255, 255, 0.4)';
                }}
              />
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem',
                margin: '0.5rem 0 0 0'
              }}>
                {formData.short_description.length}/500 characters
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
            <h4 style={{
              color: '#FFD700',
              fontSize: '1.1rem',
              margin: '0 0 1.5rem 0',
              textAlign: 'center'
            }}>
              Personality Instructions
            </h4>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                Character Instructions
              </label>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8rem',
                margin: '0 0 1rem 0'
              }}>
                Define how your character thinks, speaks, and behaves
              </p>
              <textarea
                value={formData.system_instruction}
                onChange={(e) => handleInputChange('system_instruction', e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'all 0.3s ease',
                  lineHeight: 1.4,
                  boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.4)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.6)';
                  e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                  e.target.style.boxShadow = '0 0 0 0 rgba(255, 255, 255, 0.4)';
                }}
              />
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem',
                margin: '0.5rem 0 0 0'
              }}>
                {formData.system_instruction.length} characters
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
            <h4 style={{
              color: '#FFD700',
              fontSize: '1.1rem',
              margin: '0 0 1.5rem 0',
              textAlign: 'center'
            }}>
              Review Your Character
            </h4>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <h5 style={{
                color: '#FFD700',
                fontSize: '1rem',
                margin: '0 0 1rem 0'
              }}>
                {formData.display_name}
              </h5>

              <div style={{ marginBottom: '1rem' }}>
                <h6 style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.8rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  Description
                </h6>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: 0,
                  fontSize: '0.85rem',
                  lineHeight: 1.4
                }}>
                  {formData.short_description}
                </p>
              </div>

              <div>
                <h6 style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.8rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  Personality Preview
                </h6>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  maxHeight: '80px',
                  overflowY: 'auto'
                }}>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: 0,
                    fontSize: '0.75rem',
                    lineHeight: 1.3
                  }}>
                    {formData.system_instruction.substring(0, 150)}...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          style={{
            background: currentStep === 1 ? 'rgba(128, 128, 128, 0.2)' : 'rgba(255, 215, 0, 0.1)',
            border: currentStep === 1 ? '2px solid rgba(128, 128, 128, 0.3)' : '2px solid rgba(255, 215, 0, 0.4)',
            borderRadius: '8px',
            color: currentStep === 1 ? 'rgba(128, 128, 128, 0.6)' : '#FFD700',
            fontSize: '0.85rem',
            fontWeight: 600,
            padding: '0.6rem 1.2rem',
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Previous
        </button>

        <div style={{
          display: 'flex',
          gap: '0.3rem'
        }}>
          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                width: '6px',
                height: '6px',
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
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.6rem 1.2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              background: isSubmitting 
                ? 'rgba(128, 128, 128, 0.3)'
                : 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '8px',
              color: isSubmitting ? 'rgba(255, 255, 255, 0.6)' : '#000',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.6rem 1.5rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Creating...
              </>
            ) : (
              'Submit Demo'
            )}
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
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

export default DemoCharacterBuilder;