// src/components/MinimalUsageTest.jsx - Safe standalone test
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const MinimalUsageTest = ({ character = 'user_26_captain_awake', visible = true }) => {
  const { token } = useAuth();
  const { user } = useUser();
  const [testData, setTestData] = useState({
    character: character,
    isCustomCharacter: character && character.startsWith('user_'),
    token: !!token,
    userId: user?.id || 'no-user',
    apiBase: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    fetchAttempt: 'not-started',
    fetchResult: null,
    error: null,
    timestamp: new Date().toISOString()
  });

  const [isVisible, setIsVisible] = useState(visible);

  // Safe fetch test that won't break anything
  const testUsageFetch = async () => {
    if (!token || !user?.id) {
      setTestData(prev => ({
        ...prev,
        fetchAttempt: 'skipped-no-auth',
        error: 'No token or user ID'
      }));
      return;
    }

    setTestData(prev => ({
      ...prev,
      fetchAttempt: 'attempting',
      error: null
    }));

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/premium/user_subscription/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseData = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      };

      if (response.ok) {
        const result = await response.json();
        setTestData(prev => ({
          ...prev,
          fetchAttempt: 'success',
          fetchResult: result
        }));
      } else {
        setTestData(prev => ({
          ...prev,
          fetchAttempt: 'failed',
          error: `HTTP ${response.status}: ${response.statusText}`,
          fetchResult: responseData
        }));
      }

    } catch (error) {
      setTestData(prev => ({
        ...prev,
        fetchAttempt: 'error',
        error: error.message
      }));
    }
  };

  // Auto-test on mount if we have auth
  useEffect(() => {
    if (token && user?.id && testData.isCustomCharacter) {
      // Small delay to let page load
      setTimeout(() => testUsageFetch(), 1000);
    }
  }, [token, user?.id]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.95)',
      border: '2px solid #FFD700',
      borderRadius: '8px',
      padding: '1rem',
      color: '#FFD700',
      fontSize: '0.7rem',
      fontFamily: 'monospace',
      maxWidth: '350px',
      maxHeight: '500px',
      overflowY: 'auto',
      zIndex: 99999999
    }}>
      {/* Header with close button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.5rem',
        borderBottom: '1px solid #FFD700',
        paddingBottom: '0.5rem'
      }}>
        <strong>Usage Test Panel</strong>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: '1px solid #FFD700',
            color: '#FFD700',
            borderRadius: '4px',
            cursor: 'pointer',
            padding: '0.2rem 0.4rem'
          }}
        >
          ×
        </button>
      </div>

      {/* Test results */}
      <div style={{ lineHeight: 1.4 }}>
        <div><strong>Character:</strong> {testData.character}</div>
        <div><strong>Is Custom:</strong> {testData.isCustomCharacter ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Has Token:</strong> {testData.token ? '✅ Yes' : '❌ No'}</div>
        <div><strong>User ID:</strong> {testData.userId}</div>
        <div><strong>API Base:</strong> {testData.apiBase}</div>
        
        <div style={{ margin: '0.5rem 0', borderTop: '1px solid #666', paddingTop: '0.5rem' }}>
          <strong>Fetch Status:</strong>{' '}
          <span style={{
            color: testData.fetchAttempt === 'success' ? '#00FF88' : 
                  testData.fetchAttempt === 'failed' || testData.fetchAttempt === 'error' ? '#ff6b6b' :
                  testData.fetchAttempt === 'attempting' ? '#FFA500' : '#FFD700'
          }}>
            {testData.fetchAttempt}
          </span>
        </div>

        {testData.error && (
          <div style={{ color: '#ff6b6b', marginBottom: '0.5rem' }}>
            <strong>Error:</strong> {testData.error}
          </div>
        )}

        {testData.fetchResult && (
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Response:</strong>
            <pre style={{ 
              color: '#fff', 
              fontSize: '0.6rem',
              background: 'rgba(255,255,255,0.1)',
              padding: '0.5rem',
              borderRadius: '4px',
              marginTop: '0.3rem',
              overflow: 'auto',
              maxHeight: '150px'
            }}>
              {JSON.stringify(testData.fetchResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Manual test button */}
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #666' }}>
          <button
            onClick={testUsageFetch}
            disabled={!token || !user?.id}
            style={{
              background: token && user?.id ? '#FFD700' : '#666',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              padding: '0.3rem 0.6rem',
              cursor: token && user?.id ? 'pointer' : 'not-allowed',
              fontSize: '0.7rem',
              width: '100%'
            }}
          >
            {testData.fetchAttempt === 'attempting' ? 'Testing...' : 'Test API Call'}
          </button>
        </div>

        {/* Timestamp */}
        <div style={{ 
          fontSize: '0.6rem', 
          color: '#999', 
          marginTop: '0.5rem',
          textAlign: 'center'
        }}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default MinimalUsageTest;