// src/components/CharacterCreationSuccess.jsx - Ultra minimal version
import React from 'react';

const CharacterCreationSuccess = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#000',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5000
    }}>
      <h1>SUCCESS RENDERED</h1>
    </div>
  );
};

export default CharacterCreationSuccess;