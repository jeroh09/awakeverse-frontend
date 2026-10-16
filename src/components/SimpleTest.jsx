// SimpleTest.jsx - Minimal test to verify routing works
import React from 'react';

const SimpleTest = () => {
  console.log('SimpleTest component rendered');
  
  return (
    <div style={{
      padding: '2rem',
      background: '#0B1426',
      color: 'white',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#FFD700' }}>Simple Test Component</h1>
      <p>If you can see this, routing is working!</p>
      <p>Check the console for any errors.</p>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        borderRadius: '8px',
        marginTop: '1rem'
      }}>
        <h3>Environment Check:</h3>
        <p>Current URL: {window.location.href}</p>
        <p>React Environment: {process.env.NODE_ENV}</p>
        <p>API Base: {process.env.REACT_APP_API_URL || 'Not set'}</p>
      </div>
    </div>
  );
};

export default SimpleTest;