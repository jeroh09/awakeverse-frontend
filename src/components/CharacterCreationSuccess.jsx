// src/components/CharacterCreationSuccess.jsx - Enhanced with proper cleanup and error handling
import React, { useState, useEffect, useRef } from 'react';

const CharacterCreationSuccess = ({ onClose, characterData }) => {
  const { successData, setSuccessData } = useSimplifiedPremiumFlow();
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [isMobile, setIsMobile] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Refs for cleanup
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Add this new function after your useState declarations
  //const handleSafeNavigation = () => {
    //if (resetFlowState) {
      //resetFlowState();
    //} else if (backToLauncher) {
      //backToLauncher();
    //} else {
    // Emergency fallback - navigate directly
      //window.location.hash = '#launcher';
      //window.location.reload();
    //}
  //};

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Countdown timer with proper cleanup
  useEffect(() => {
    isMountedRef.current = true;

    const updateTimer = () => {
      if (!isMountedRef.current) return;
      
      setRedirectTimer(prev => {
        const newValue = prev - 1;
        if (newValue <= 0 && !hasUserInteracted) {
          // Use resetFlowState for cleaner navigation
          //if (resetFlowState) {
            //resetFlowState();
          //} else if (backToLauncher) {
            //backToLauncher();
          //}
        setSuccessData(null);
        }
        return Math.max(0, newValue);
      });
    };

    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [hasUserInteracted]);

  // Handle manual navigation
  const handleManualReturn = () => {
    setHasUserInteracted(true);
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Navigate back
   // handleSafeNavigation();
   onClose();
  };

  // Safety check for missing character name
  // Safety check for missing character name
  const displayName = characterData?.display_name || 'Your Character';


  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
      fontFamily: "'Playfair Display', serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 4s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        width: '60px',
        height: '60px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 3s ease-in-out infinite 1s'
      }} />

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 215, 0, 0.4)',
        borderRadius: '20px',
        padding: isMobile ? '2rem' : '3rem',
        textAlign: 'center',
        maxWidth: isMobile ? '350px' : '500px',
        width: '100%',
        backdropFilter: 'blur(10px)',
        animation: 'fadeInScale 0.6s ease-out',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Success Icon */}
        <div style={{
          fontSize: isMobile ? '3rem' : '4rem',
          marginBottom: '1rem',
          color: '#FFD700',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          animation: 'bounce 2s ease-in-out infinite'
        }}>
          ✨
        </div>
        
        {/* Success Message */}
        <h2 style={{
          color: '#FFD700',
          fontSize: isMobile ? '1.5rem' : '1.8rem',
          margin: '0 0 1rem 0',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          letterSpacing: '1px',
          fontWeight: 700
        }}>
          Character Submitted Successfully!
        </h2>
        
        {/* Character Name */}
        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: isMobile ? '1rem' : '1.1rem',
          lineHeight: 1.6,
          margin: '0 0 1.5rem 0'
        }}>
          <strong style={{ color: '#FFD700' }}>{displayName}</strong> has been submitted for approval. 
          You'll receive an email notification when your character is ready to chat.
        </p>
        
        {/* Trial Information */}
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '10px',
          padding: isMobile ? '0.8rem' : '1rem',
          margin: '0 0 2rem 0'
        }}>
          <p style={{
            color: 'rgba(255, 215, 0, 0.9)',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🎉</span>
            Your 3-day trial will start automatically when approved
          </p>
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={handleManualReturn}
            disabled={!setSuccessData}
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: 600,
              padding: isMobile ? '0.7rem 1.5rem' : '0.8rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
              width: isMobile ? '100%' : 'auto',
              minWidth: '150px',
              opacity: (!setSuccessData) ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!setSuccessData) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
            }}
          >
            Return to Characters
          </button>
        </div>

        {/* Auto-redirect notice */}
        {!hasUserInteracted && redirectTimer > 0 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '0.8rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderTop: '2px solid #FFD700',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Auto-redirecting in {redirectTimer} second{redirectTimer !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setHasUserInteracted(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 215, 0, 0.8)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '0.5rem'
              }}
            >
              Cancel auto-redirect
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.6; 
            transform: scale(1.1); 
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CharacterCreationSuccess;