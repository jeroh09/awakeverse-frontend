// src/components/CharacterCreationSuccess.jsx - Make sure this file exists at this exact path
import React from 'react';

const CharacterCreationSuccess = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5000,
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #00FF88, #00CC6A)',
        padding: '3rem',
        borderRadius: '16px',
        textAlign: 'center',
        maxWidth: '500px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '2rem',
          color: '#000',
          fontWeight: 'bold'
        }}>
          Character Created Successfully!
        </h1>
        <p style={{ 
          margin: '0 0 2rem 0', 
          fontSize: '1.2rem',
          color: '#000'
        }}>
          Your character has been submitted for approval.
          You'll be notified when it's ready!
        </p>
        <button 
          onClick={() => {
            // Reset the flow and return to launcher
            window.location.hash = '#launcher';
            window.location.reload();
          }}
          style={{
            background: '#000',
            color: '#fff',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Return to Character Gallery
        </button>
      </div>
    </div>
  );
};

// CRITICAL: Make sure this default export exists
export default CharacterCreationSuccess;