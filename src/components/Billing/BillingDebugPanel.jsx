// src/components/Billing/BillingDebugPanel.jsx
import React, { useState, useEffect } from 'react';

const BillingDebugPanel = ({ user, billing }) => {
  const [debugInfo, setDebugInfo] = useState({
    timestamp: new Date().toISOString(),
    status: 'initializing',
    checks: [],
    errors: []
  });

  const addCheck = (label, result, details = {}) => {
    setDebugInfo(prev => ({
      ...prev,
      checks: [...prev.checks, {
        label,
        result,
        timestamp: new Date().toISOString(),
        details
      }]
    }));
  };

  const addError = (label, error) => {
    setDebugInfo(prev => ({
      ...prev,
      errors: [...prev.errors, {
        label,
        error: error?.message || String(error),
        timestamp: new Date().toISOString()
      }]
    }));
  };

  useEffect(() => {
    addCheck('Component Mounted', 'success', { user: user?.id });
  }, []);

  useEffect(() => {
    if (user) {
      addCheck('User Available', 'success', { id: user.id, email: user.email });
    } else {
      addCheck('User Available', 'failed', { note: 'User is null/undefined' });
    }
  }, [user]);

  const testAPI = async () => {
    try {
      const response = await fetch('https://api.awakeverse.com/api/billing/health', {
        credentials: 'include'
      });
      const data = await response.json();
      addCheck('API Health Check', 'success', { status: data.status });
      return true;
    } catch (error) {
      addError('API Health Check Failed', error);
      return false;
    }
  };

  const testBillingAPI = async () => {
    try {
      const response = await fetch('https://api.awakeverse.com/api/billing/details', {
        credentials: 'include'
      });
      const data = await response.json();
      addCheck('Billing Details API', 'success', { 
        status: response.status,
        success: data.success 
      });
      return data;
    } catch (error) {
      addError('Billing Details API Failed', error);
      return null;
    }
  };

  const runAllTests = async () => {
    setDebugInfo(prev => ({ ...prev, status: 'testing' }));
    await testAPI();
    await testBillingAPI();
    setDebugInfo(prev => ({ ...prev, status: 'completed' }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '20px',
      zIndex: 9999,
      maxWidth: '400px',
      fontFamily: 'monospace',
      fontSize: '12px',
      border: '1px solid #6366F1'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#6366F1' }}>Billing Debug Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {debugInfo.status}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>User ID:</strong> {user?.id || 'null'}
      </div>
      
      <button 
        onClick={runAllTests}
        style={{
          background: '#6366F1',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        Run Diagnostics
      </button>
      
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {debugInfo.checks.map((check, i) => (
          <div key={i} style={{ 
            marginBottom: '5px',
            padding: '5px',
            background: check.result === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            borderLeft: `3px solid ${check.result === 'success' ? '#10B981' : '#EF4444'}`
          }}>
            <div>
              <span style={{ color: check.result === 'success' ? '#10B981' : '#EF4444' }}>
                {check.result === 'success' ? '✓' : '✗'}
              </span>
              {' '}{check.label}
            </div>
            {Object.keys(check.details).length > 0 && (
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                {JSON.stringify(check.details)}
              </div>
            )}
          </div>
        ))}
        
        {debugInfo.errors.length > 0 && (
          <div style={{ marginTop: '10px', borderTop: '1px solid #EF4444', paddingTop: '10px' }}>
            <strong style={{ color: '#EF4444' }}>Errors:</strong>
            {debugInfo.errors.map((error, i) => (
              <div key={i} style={{ 
                marginTop: '5px',
                padding: '5px',
                background: 'rgba(239,68,68,0.2)',
                color: '#FCA5A5'
              }}>
                <div>{error.label}: {error.error}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingDebugPanel;