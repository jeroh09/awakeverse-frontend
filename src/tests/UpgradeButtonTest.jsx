// src/tests/UpgradeButtonTest.jsx
import React, { useState } from 'react';
import PaymentRouter from '../services/PaymentRouter';
import { useAuth } from '../contexts/AuthContext';

function UpgradeButtonTest() {
  const { token } = useAuth();
  const [selectedTier, setSelectedTier] = useState('pro');
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');
  const [testOutput, setTestOutput] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const logOutput = (message, type = 'info') => {
    setTestOutput(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message
    }]);
  };

  const handleUpgrade = async () => {
    setIsProcessing(true);
    logOutput('🚀 Starting payment redirect...', 'info');
    
    try {
      const env = PaymentRouter.getEnvironment();
      logOutput(`📍 Environment: ${env.name}`, 'info');
      logOutput(`🔗 API Base: ${env.apiBase}`, 'info');
      
      logOutput(`💳 Tier: ${selectedTier}, Currency: ${selectedCurrency}`, 'info');
      
      // This will redirect the browser
      await PaymentRouter.redirectToCheckout({
        tier: selectedTier,
        currency: selectedCurrency,
        triggerSource: 'upgrade_button_test',
        metadata: {
          testId: Date.now(),
          component: 'UpgradeButtonTest'
        }
      });
      
      // If we reach here, redirect failed
      logOutput('❌ Redirect failed - still on page', 'error');
      setIsProcessing(false);
      
    } catch (error) {
      logOutput(`❌ Error: ${error.message}`, 'error');
      setIsProcessing(false);
    }
  };

  const handleTestUrl = async () => {
    setIsProcessing(true);
    logOutput('🔍 Testing URL generation (no redirect)...', 'info');
    
    try {
      const result = await PaymentRouter.getCheckoutUrl({
        tier: selectedTier,
        currency: selectedCurrency,
        triggerSource: 'url_test'
      });
      
      if (result.success) {
        logOutput('✅ URL generated successfully', 'success');
        logOutput(`🔗 URL: ${result.url}`, 'info');
        logOutput(`🆔 Session ID: ${result.sessionId}`, 'info');
      } else {
        logOutput(`❌ Failed: ${result.error?.userMessage}`, 'error');
        logOutput(`📋 Error code: ${result.error?.code}`, 'error');
        logOutput(`🔄 Retryable: ${result.error?.retryable}`, 'info');
      }
      
    } catch (error) {
      logOutput(`❌ Exception: ${error.message}`, 'error');
    }
    
    setIsProcessing(false);
  };

  const clearOutput = () => {
    setTestOutput([]);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Upgrade Button Test</h1>
      
      {!token && (
        <div style={{
          padding: '1rem',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          marginBottom: '2rem',
          color: '#721c24'
        }}>
          ⚠️ <strong>Not Authenticated</strong> - Please log in to test payment flows
        </div>
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Controls */}
        <div>
          <h2>Payment Options</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Tier:
            </label>
            <select 
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              <option value="starter">Starter (£3.99)</option>
              <option value="pro">Pro (£6.99)</option>
              <option value="unlimited">Unlimited (£11.99)</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Currency:
            </label>
            <select 
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              <option value="GBP">GBP (£)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button
              onClick={handleTestUrl}
              disabled={isProcessing || !token}
              style={{
                padding: '1rem',
                fontSize: '1rem',
                background: isProcessing || !token ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isProcessing || !token ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? '⏳ Processing...' : '🔍 Test URL (No Redirect)'}
            </button>
            
            <button
              onClick={handleUpgrade}
              disabled={isProcessing || !token}
              style={{
                padding: '1rem',
                fontSize: '1rem',
                background: isProcessing || !token ? '#ccc' : '#FFD700',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: isProcessing || !token ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isProcessing ? '⏳ Redirecting...' : '💳 Upgrade Now (Will Redirect)'}
            </button>
            
            <button
              onClick={clearOutput}
              style={{
                padding: '0.5rem',
                fontSize: '0.9rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Output
            </button>
          </div>
        </div>
        
        {/* Output Console */}
        <div>
          <h2>Test Output</h2>
          <div style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '1rem',
            borderRadius: '8px',
            minHeight: '400px',
            maxHeight: '600px',
            overflowY: 'auto',
            fontFamily: 'Monaco, monospace',
            fontSize: '0.85rem'
          }}>
            {testOutput.length === 0 ? (
              <div style={{ color: '#888' }}>
                Console output will appear here...
              </div>
            ) : (
              testOutput.map((log, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '0.5rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #333',
                    color: 
                      log.type === 'error' ? '#f48771' :
                      log.type === 'success' ? '#89d185' :
                      '#d4d4d4'
                  }}
                >
                  <span style={{ color: '#858585' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {' '}
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div style={{
        padding: '1rem',
        background: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px'
      }}>
        <h3>💡 Expected Behavior</h3>
        <ul style={{ margin: '0.5rem 0' }}>
          <li><strong>Test URL:</strong> Should log checkout URL without redirecting</li>
          <li><strong>Upgrade Now:</strong> Should redirect to Stripe checkout page</li>
          <li><strong>Local Dev:</strong> URL should be localhost:5000</li>
          <li><strong>Production:</strong> URL should be api.awakeverse.com</li>
        </ul>
      </div>
    </div>
  );
}

export default UpgradeButtonTest;