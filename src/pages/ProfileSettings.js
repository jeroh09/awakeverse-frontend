// src/pages/ProfileSettings.js - WITH DEBUG CHECK
import React from 'react';
import SettingsPage from '../components/ProfileSettings/SettingsPage';
import '../styles.css';

// 🧪 TEMPORARY: Try to import test component
let TestHooksComponent;
try {
  TestHooksComponent = require('../components/TestHooksComponent').default;
  console.log('✅ TestHooksComponent imported successfully');
} catch (error) {
  console.error('❌ Failed to import TestHooksComponent:', error);
  TestHooksComponent = null;
}

export default function ProfileSettings() {
  console.log('🧪 ProfileSettings rendering, TestHooksComponent:', TestHooksComponent ? 'LOADED' : 'NOT LOADED');
  
  return (
    <div>
      {/* 🧪 TEMPORARY: Debug test component */}
      <div style={{ 
        background: '#f0f8ff', 
        padding: '20px', 
        margin: '20px', 
        border: '2px solid #007acc',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ color: '#007acc', marginTop: 0 }}>
          🧪 DEBUG - Market Hub Hook Testing
        </h2>
        
        {TestHooksComponent ? (
          <div>
            <p style={{ color: 'green' }}>✅ TestHooksComponent loaded successfully</p>
            <TestHooksComponent />
          </div>
        ) : (
          <div>
            <p style={{ color: 'red' }}>❌ TestHooksComponent failed to load</p>
            <p>Check browser console for import errors</p>
            <p>Make sure TestHooksComponent.jsx exists in src/components/</p>
          </div>
        )}
      </div>
      
      {/* Your existing ProfileSettings content */}
      <SettingsPage />
    </div>
  );
}