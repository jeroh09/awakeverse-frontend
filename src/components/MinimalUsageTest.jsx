// MinimalUsageTest.jsx - Test usage hook step by step
import React, { useState } from 'react';

const MinimalUsageTest = () => {
  const [step, setStep] = useState(1);
  const [testResults, setTestResults] = useState({});

  // Step 1: Test basic component render
  const testBasicRender = () => {
    setTestResults(prev => ({
      ...prev,
      basicRender: 'SUCCESS - Component renders'
    }));
    setStep(2);
  };

  // Step 2: Test contexts import
  const testContexts = () => {
    try {
      const { useAuth } = require('../contexts/AuthContext');
      const { useUser } = require('../contexts/UserContext');
      
      setTestResults(prev => ({
        ...prev,
        contextsImport: 'SUCCESS - Contexts imported'
      }));
      setStep(3);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        contextsImport: `ERROR - ${error.message}`
      }));
    }
  };

  // Step 3: Test hook import
  const testHookImport = () => {
    try {
      const useUsageTracking = require('../hooks/useUsageTracking').default;
      
      setTestResults(prev => ({
        ...prev,
        hookImport: 'SUCCESS - Hook imported'
      }));
      setStep(4);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        hookImport: `ERROR - ${error.message}`
      }));
    }
  };

  // Step 4: Test hook usage
  const testHookUsage = () => {
    try {
      // This would normally be done with actual hook, but we'll simulate
      setTestResults(prev => ({
        ...prev,
        hookUsage: 'READY - Hook ready to test with character'
      }));
      setStep(5);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        hookUsage: `ERROR - ${error.message}`
      }));
    }
  };

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 100%)',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ color: '#FFD700', marginBottom: '2rem' }}>
        Usage Component Debug - Step {step}
      </h1>

      {/* Progress */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ color: '#FFD700', margin: '0 0 1rem 0' }}>Testing Progress</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {Object.entries(testResults).map(([test, result]) => (
            <div key={test} style={{
              color: result.includes('SUCCESS') ? '#00FF88' : 
                     result.includes('ERROR') ? '#ff6b6b' : '#FFA500'
            }}>
              {test}: {result}
            </div>
          ))}
        </div>
      </div>

      {/* Step Controls */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ color: '#FFD700', margin: '0 0 1rem 0' }}>Test Steps</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {step >= 1 && (
            <button 
              onClick={testBasicRender}
              style={{
                background: testResults.basicRender ? '#00FF88' : 'rgba(255, 215, 0, 0.2)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                color: testResults.basicRender ? '#000' : '#FFD700',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              1. Test Basic Render
            </button>
          )}
          
          {step >= 2 && (
            <button 
              onClick={testContexts}
              style={{
                background: testResults.contextsImport ? '#00FF88' : 'rgba(255, 215, 0, 0.2)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                color: testResults.contextsImport ? '#000' : '#FFD700',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              2. Test Contexts
            </button>
          )}
          
          {step >= 3 && (
            <button 
              onClick={testHookImport}
              style={{
                background: testResults.hookImport ? '#00FF88' : 'rgba(255, 215, 0, 0.2)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                color: testResults.hookImport ? '#000' : '#FFD700',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              3. Test Hook Import
            </button>
          )}
          
          {step >= 4 && (
            <button 
              onClick={testHookUsage}
              style={{
                background: testResults.hookUsage ? '#00FF88' : 'rgba(255, 215, 0, 0.2)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                color: testResults.hookUsage ? '#000' : '#FFD700',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              4. Test Hook Usage
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        background: 'rgba(255, 165, 0, 0.1)',
        border: '1px solid rgba(255, 165, 0, 0.3)',
        color: '#FFA500',
        padding: '1rem',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Instructions</h3>
        <p>Click each button in order to test where the usage components fail:</p>
        <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Basic render test (this should work since diagnostic works)</li>
          <li>Context imports (AuthContext, UserContext)</li>
          <li>Usage hook import (useUsageTracking)</li>
          <li>Hook execution test</li>
        </ol>
        <p style={{ marginTop: '1rem' }}>
          The first failure will tell us exactly what's wrong with the usage components.
        </p>
      </div>
    </div>
  );
};

export default MinimalUsageTest;