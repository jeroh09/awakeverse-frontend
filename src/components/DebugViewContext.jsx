// Enhanced DebugViewContext.jsx with Discovery Flow Tracking
import React, { useState, useEffect } from 'react';
import { useAppView } from '../contexts/AppViewContext';

const DebugViewContext = () => {
  const { 
    currentView, 
    isTransitioning, 
    discoveredCharacters,
    switchView,
    VIEW_STATES 
  } = useAppView();

  const [debugData, setDebugData] = useState({
    callbackExecutions: [],
    lastCharacterSelected: null,
    discoveryAttempts: 0,
    discoverySuccesses: 0
  });

  // Add debug tracking functions to window for production testing
  useEffect(() => {
    window.debugDiscovery = {
      logCallbackExecution: (type, data) => {
        setDebugData(prev => ({
          ...prev,
          callbackExecutions: [
            ...prev.callbackExecutions.slice(-4), // Keep last 5
            { type, data, timestamp: Date.now() }
          ]
        }));
      },
      logCharacterSelection: (character) => {
        setDebugData(prev => ({
          ...prev,
          lastCharacterSelected: character,
          discoveryAttempts: prev.discoveryAttempts + 1
        }));
      },
      logDiscoverySuccess: () => {
        setDebugData(prev => ({
          ...prev,
          discoverySuccesses: prev.discoverySuccesses + 1
        }));
      },
      showAlert: (message) => {
        alert(`DEBUG: ${message}`);
      }
    };

    return () => {
      delete window.debugDiscovery;
    };
  }, []);

  const testSwitchView = (view) => {
    const success = switchView(view);
    window.debugDiscovery?.showAlert(`Switch to ${view}: ${success ? 'SUCCESS' : 'FAILED'}`);
  };

  const testDiscoveredFlow = () => {
    window.debugDiscovery?.showAlert(`
      Discovered Count: ${discoveredCharacters.length}
      Last Character: ${debugData.lastCharacterSelected?.display_name || 'None'}
      Attempts: ${debugData.discoveryAttempts}
      Successes: ${debugData.discoverySuccesses}
    `);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '60px',
      right: '10px',
      background: debugData.discoveryAttempts > debugData.discoverySuccesses ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '250px',
      border: discoveredCharacters.length > 0 ? '2px solid green' : '1px solid white'
    }}>
      <h4>Debug: Discovery Flow</h4>
      <p>Current View: <strong>{currentView}</strong></p>
      <p>Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <p>Discovered: <strong style={{color: discoveredCharacters.length > 0 ? 'lime' : 'orange'}}>
        {discoveredCharacters.length}
      </strong></p>
      <p>Attempts: {debugData.discoveryAttempts}</p>
      <p>Successes: {debugData.discoverySuccesses}</p>      
      {debugData.lastCharacterSelected && (
        <p style={{fontSize: '10px', borderTop: '1px solid white', paddingTop: '5px'}}>
          Last: {debugData.lastCharacterSelected.display_name}
        </p>
      )}
      
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => testSwitchView(VIEW_STATES.MARKET_HUB)}
          style={{ margin: '2px', padding: '2px 5px', fontSize: '10px' }}
        >
          Market
        </button>
        <button 
          onClick={testDiscoveredFlow}
          style={{ margin: '2px', padding: '2px 5px', fontSize: '10px' }}
        >
          Test Flow
        </button>
      </div>

      {debugData.callbackExecutions.length > 0 && (
        <div style={{fontSize: '10px', maxHeight: '100px', overflow: 'auto', marginTop: '5px', borderTop: '1px solid white', paddingTop: '5px'}}>
          <strong>Recent Callbacks:</strong>
          {debugData.callbackExecutions.slice(-3).map((exec, i) => (
            <div key={i}>
              {exec.type}: {exec.data?.display_name || 'unknown'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebugViewContext;