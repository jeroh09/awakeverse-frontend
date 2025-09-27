// src/pages/ProfileSettings.js - UPDATED with test component
import React from 'react';
import SettingsPage from '../components/ProfileSettings/SettingsPage';
import TestHooksComponent from '../components/TestHooksComponent';
import '../styles.css';

export default function ProfileSettings() {
  return (
    <div>
      {/* 🧪 TEMPORARY: Market Hub Hook Testing - Remove after testing */}
      <div style={{ 
        background: '#f0f8ff', 
        padding: '20px', 
        margin: '20px', 
        border: '2px solid #007acc',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ color: '#007acc', marginTop: 0 }}>
          🧪 TEMPORARY TESTING - Market Hub Hooks
        </h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Remove this section after testing is complete
        </p>
        <TestHooksComponent />
      </div>
      
      {/* Your existing ProfileSettings content */}
      <SettingsPage />
    </div>
  );
}