// src/components/DebugPanel.jsx - Preview Environment Testing Component
import React, { useState, useEffect } from 'react';
import { usePremiumCapabilitiesContext } from '../contexts/PremiumCapabilitiesContext';
import usePremiumCharacters from '../hooks/usePremiumCharacters';

const DebugPanel = () => {
  const capabilities = usePremiumCapabilitiesContext();
  const characters = usePremiumCharacters();
  const [isExpanded, setIsExpanded] = useState(false);
  const [networkCalls, setNetworkCalls] = useState([]);

  // Only show in preview environment
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Monitor network calls
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        
        // Log premium API calls
        if (url.includes('/api/premium/')) {
          setNetworkCalls(prev => [
            ...prev.slice(-9), // Keep last 10 calls
            {
              url: url.replace(process.env.REACT_APP_API_URL || '', ''),
              method: options?.method || 'GET',
              status: response.status,
              duration: endTime - startTime,
              cached: response.status === 304,
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        setNetworkCalls(prev => [
          ...prev.slice(-9),
          {
            url: url.replace(process.env.REACT_APP_API_URL || '', ''),
            method: options?.method || 'GET',
            status: 'ERROR',
            duration: endTime - startTime,
            error: error.message,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const panelStyle = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    background: 'rgba(0, 0, 0, 0.9)',
    color: '#00ff00',
    padding: '12px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '11px',
    zIndex: 99999,
    maxWidth: isExpanded ? '600px' : '300px',
    maxHeight: isExpanded ? '80vh' : '200px',
    overflow: 'auto',
    border: '2px solid #00ff00',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const getStatusColor = (state) => {
    switch (state) {
      case 'free': return '#ff6b6b';
      case 'trial_active': return '#4ecdc4';
      case 'trial_expired': return '#ffa726';
      case 'premium_active': return '#66bb6a';
      case 'premium_expired': return '#ff8a65';
      case 'pending_approval': return '#ab47bc';
      default: return '#90a4ae';
    }
  };

  return (
    <div style={panelStyle} onClick={toggleExpanded}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        borderBottom: '1px solid #00ff00',
        paddingBottom: '4px'
      }}>
        <span style={{ fontWeight: 'bold' }}>PREMIUM DEBUG</span>
        <span style={{ fontSize: '10px' }}>
          {isExpanded ? '[-]' : '[+]'} 
          {process.env.VERCEL_ENV || 'dev'}
        </span>
      </div>

      {/* Core Status */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          color: getStatusColor(capabilities.subscriptionState),
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          STATE: {capabilities.subscriptionState || 'LOADING'}
        </div>
        <div>Premium: {String(capabilities.isPremium)}</div>
        <div>Can Create: {String(capabilities.canCreateCharacter)}</div>
        <div>Characters: {capabilities.characterCount}/{capabilities.characterLimit}</div>
        {capabilities.daysRemaining && (
          <div style={{ color: '#ffa726' }}>
            Days Left: {capabilities.daysRemaining}
          </div>
        )}
      </div>

      {/* Loading/Error States */}
      {capabilities.loading && (
        <div style={{ color: '#4ecdc4', marginBottom: '8px' }}>
          LOADING CAPABILITIES...
        </div>
      )}
      
      {capabilities.error && (
        <div style={{ color: '#ff6b6b', marginBottom: '8px' }}>
          ERROR: {capabilities.error}
        </div>
      )}

      {isExpanded && (
        <>
          {/* UI Flags */}
          <div style={{ marginBottom: '8px', borderTop: '1px solid #333', paddingTop: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>UI FLAGS:</div>
            <div>Show Trial: {String(capabilities.shouldShowTrial)}</div>
            <div>Show Upgrade: {String(capabilities.shouldShowUpgrade)}</div>
            <div>Show Pending: {String(capabilities.shouldShowCharacterPending)}</div>
            <div>Show Warning: {String(capabilities.shouldShowExpiryWarning)}</div>
            <div>Primary CTA: {capabilities.primaryAction}</div>
          </div>

          {/* Character Data */}
          <div style={{ marginBottom: '8px', borderTop: '1px solid #333', paddingTop: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>CHARACTERS:</div>
            <div>Total: {characters.userCharacters.length}</div>
            <div>Approved: {characters.approvedCharacters.length}</div>
            <div>Pending: {characters.pendingCharacters.length}</div>
            <div>Char Loading: {String(characters.loading)}</div>
          </div>

          {/* Network Monitoring */}
          <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>NETWORK CALLS:</div>
            {networkCalls.slice(-5).map((call, index) => (
              <div key={index} style={{
                fontSize: '10px',
                marginBottom: '2px',
                color: call.cached ? '#4ecdc4' : 
                       call.status === 'ERROR' ? '#ff6b6b' :
                       call.status < 300 ? '#66bb6a' : '#ffa726'
              }}>
                <div>
                  {call.method} {call.url}
                </div>
                <div style={{ paddingLeft: '8px' }}>
                  {call.status} | {call.duration}ms | {call.timestamp}
                  {call.cached && ' | CACHED'}
                  {call.error && ` | ${call.error}`}
                </div>
              </div>
            ))}
          </div>

          {/* Performance Metrics */}
          <div style={{ borderTop: '1px solid #333', paddingTop: '8px', marginTop: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>PERFORMANCE:</div>
            <div>Last Fetch: {capabilities.lastFetch ? 
              new Date(capabilities.lastFetch).toLocaleTimeString() : 'Never'}</div>
            <div>Initialized: {String(capabilities.isInitialized)}</div>
            <div>API Calls: {networkCalls.length}</div>
            <div>Cache Hits: {networkCalls.filter(c => c.cached).length}</div>
          </div>

          {/* Test Actions */}
          <div style={{ borderTop: '1px solid #333', paddingTop: '8px', marginTop: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ACTIONS:</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                capabilities.refresh();
              }}
              style={{
                background: '#333',
                color: '#00ff00',
                border: '1px solid #00ff00',
                padding: '4px 8px',
                marginRight: '8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              REFRESH
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                capabilities.invalidateAndRefresh();
              }}
              style={{
                background: '#333',
                color: '#00ff00',
                border: '1px solid #00ff00',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              FORCE REFRESH
            </button>
          </div>

          {/* Environment Info */}
          <div style={{ 
            borderTop: '1px solid #333', 
            paddingTop: '8px', 
            marginTop: '8px',
            fontSize: '9px',
            color: '#666'
          }}>
            <div>Env: {process.env.VERCEL_ENV || process.env.NODE_ENV}</div>
            <div>API: {process.env.REACT_APP_API_URL}</div>
            <div>Build: {process.env.REACT_APP_VERCEL_GIT_COMMIT_SHA?.slice(0, 7)}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default DebugPanel;