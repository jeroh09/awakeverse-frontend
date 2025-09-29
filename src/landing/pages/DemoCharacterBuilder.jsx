// DemoCharacterBuilder.jsx - Interactive demo for landing page Section 2
import React, { useState, useEffect } from 'react';
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
    
    // Simulate submission process
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
        animation: 'fadeIn 0.5s ease-in'
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
      padding: '1.5rem',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 0 30px rgba(255, 215, 0, 0.1)'
    }}>
      {/* Demo Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'rgba(255, 215, 0, 0.1)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.08)'
      }}>
        <h3 style={{
          color: '#FFD700',
          fontSize: '1.1rem',
          margin: '0 0 0.5rem 0',
          fontFamily: "'Playfair Display', serif"
        }}>
          Interactive Demo
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.85rem',
          margin: 0
        }}>
          Try our character creation process
        </p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '1.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '0.25rem',
        boxShadow: 'inset 0 0 15px rgba(255, 215, 0, 0.05)'
      }}>
        {steps.map((step) => (
          <button
            key={step.number}
            onClick={() => setCurrentStep(step.number)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: currentStep === step.number 
                ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                : 'transparent',
              color: currentStep === step.number ? '#000' : 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: currentStep === step.number 
                  ? 'rgba(0, 0, 0, 0.2)'
                  : currentStep > step.number 
                    ? 'rgba(255, 215, 0, 0.3)'
                    : 'rgba(255, 255, 255, 0.2)',
                color: currentStep === step.number 
                  ? '#000' 
                  : currentStep > step.number 
                    ? '#FFD700' 
                    : 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <span>{step.title}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Compact Step Content */}
      <div style={{ minHeight: '200px' }}>
        {currentStep === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.4rem'
                }}>
                  Character Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.4rem'
                }}>
                  Template
                </label>
                <div style={{
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  border: '2px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '6px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  color: '#FFD700'
                }}>
                  Ancient Philosopher
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '0.4rem'
              }}>
                Description
              </label>
              <textarea
                value={formData.short_description}
                onChange={(e) => handleInputChange('short_description', e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.4rem'
            }}>
              Character Instructions
            </label>
            <textarea
              value={formData.system_instruction}
              onChange={(e) => handleInputChange('system_instruction', e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.8rem',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.3
              }}
            />
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
              margin: '0.5rem 0 0 0'
            }}>
              Define how your character thinks and behaves
            </p>
          </div>
        )}

        {currentStep === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <h5 style={{
                color: '#FFD700',
                fontSize: '0.9rem',
                margin: '0 0 0.8rem 0'
              }}>
                {formData.display_name}
              </h5>

              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 0.8rem 0',
                fontSize: '0.8rem',
                lineHeight: 1.3
              }}>
                {formData.short_description}
              </p>

              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.5rem',
                borderRadius: '4px',
                maxHeight: '60px',
                overflowY: 'auto'
              }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: 0,
                  fontSize: '0.7rem',
                  lineHeight: 1.2
                }}>
                  {formData.system_instruction.substring(0, 150)}...
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '6px',
              padding: '0.8rem',
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0,
                fontSize: '0.8rem'
              }}>
                Ready to submit for approval
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Compact Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
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
              borderRadius: '6px',
              color: '#000',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Next →
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
              borderRadius: '6px',
              color: isSubmitting ? 'rgba(255, 255, 255, 0.6)' : '#000',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.5rem 1.2rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '10px',
                  height: '10px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Demo...
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