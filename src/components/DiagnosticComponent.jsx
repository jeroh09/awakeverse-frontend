// DiagnosticComponent.jsx - Visual debugging without console
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const DiagnosticComponent = () => {
  const [diagnostics, setDiagnostics] = useState({
    componentMounted: false,
    authLoaded: false,
    userLoaded: false,
    apiTestResult: null,
    error: null,
    timestamp: null
  });

  const { token } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        // Update mount status
        setDiagnostics(prev => ({
          ...prev,
          componentMounted: true,
          authLoaded: !!token,
          userLoaded: !!user,
          timestamp: new Date().toISOString()
        }));

        // Test API connection if we have auth
        if (token && user?.id) {
          try {
            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/premium/subscription/${user.id}/status`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            const data = await response.json();
            
            setDiagnostics(prev => ({
              ...prev,
              apiTestResult: {
                status: response.status,
                ok: response.ok,
                data: data,
                url: `${API_BASE}/api/premium/subscription/${user.id}/status`
              }
            }));
          } catch (apiError) {
            setDiagnostics(prev => ({
              ...prev,
              apiTestResult: {
                error: apiError.message,
                type: 'API_ERROR'
              }
            }));
          }
        }
      } catch (error) {
        setDiagnostics(prev => ({
          ...prev,
          error: error.message
        }));
      }
    };

    runDiagnostics();
  }, [token, user]);

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 100%)',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ color: '#FFD700', marginBottom: '2rem' }}>
        Frontend Diagnostics
      </h1>

      {/* Component Status */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <h3 style={{ color: '#FFD700', margin: '0 0 1rem 0' }}>Component Status</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div>Component Mounted: <span style={{ color: diagnostics.componentMounted ? '#00FF88' : '#ff6b6b' }}>
            {diagnostics.componentMounted ? 'YES' : 'NO'}
          </span></div>
          <div>Timestamp: <span style={{ color: '#FFD700' }}>{diagnostics.timestamp}</span></div>
        </div>
      </div>

      {/* Auth Status */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <h3 style={{ color: '#FFD700', margin: '0 0 1rem 0' }}>Authentication Status</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div>Token Present: <span style={{ color: diagnostics.authLoaded ? '#00FF88' : '#ff6b6b' }}>
            {diagnostics.authLoaded ? 'YES' : 'NO'}
          </span></div>
          <div>User Loaded: <span style={{ color: diagnostics.userLoaded ? '#00FF88' : '#ff6b6b' }}>
            {diagnostics.userLoaded ? 'YES' : 'NO'}
          </span></div>
          {user && (
            <div>User ID: <span style={{ color: '#FFD700' }}>{user.id}</span></div>
          )}
        </div>
      </div>

      {/* Environment */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <h3 style={{ color: '#FFD700', margin: '0 0 1rem 0' }}>Environment</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div>NODE_ENV: <span style={{ color: '#FFD700' }}>{process.env.NODE_ENV}</span></div>
          <div>API Base: <span style={{ color: '#FFD700' }}>
            {process.env.REACT_APP_API_URL || 'NOT SET'}
          </span></div>
          <div>Current URL: <span style={{ color: '#FFD700' }}>{window.location.href}</span></div>
        </div>
      </div>

      {/* API Test Result */}
      {diagnostics.apiTestResult && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${diagnostics.apiTestResult.ok ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`
        }}>
          <h3 style={{ color: '#FFD700', margin: '0 0 1rem 0' }}>API Test Result</h3>
          
          {diagnostics.apiTestResult.error ? (
            <div style={{ color: '#ff6b6b' }}>
              Error: {diagnostics.apiTestResult.error}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div>Status: <span style={{ 
                color: diagnostics.apiTestResult.ok ? '#00FF88' : '#ff6b6b' 
              }}>
                {diagnostics.apiTestResult.status} {diagnostics.apiTestResult.ok ? 'OK' : 'ERROR'}
              </span></div>
              <div>URL: <span style={{ color: '#FFD700', fontSize: '0.8rem' }}>
                {diagnostics.apiTestResult.url}
              </span></div>
              
              {diagnostics.apiTestResult.data && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: '#FFD700', margin: '0 0 0.5rem 0' }}>Response Data:</h4>
                  <pre style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.8rem',
                    color: '#00FF88'
                  }}>
                    {JSON.stringify(diagnostics.apiTestResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {diagnostics.error && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          color: '#ff6b6b',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Error</h3>
          <div>{diagnostics.error}</div>
        </div>
      )}

      {/* Next Steps */}
      <div style={{
        background: 'rgba(255, 165, 0, 0.1)',
        border: '1px solid rgba(255, 165, 0, 0.3)',
        color: '#FFA500',
        padding: '1rem',
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Next Steps</h3>
        <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Verify this component renders at /diagnostic</li>
          <li>Check that API test shows successful connection</li>
          <li>If API works, proceed to test usage components</li>
          <li>If API fails, check environment variables and CORS</li>
        </ol>
      </div>
    </div>
  );
};

export default DiagnosticComponent;