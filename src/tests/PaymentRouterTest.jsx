// src/tests/PaymentRouterTest.jsx
import React, { useState } from 'react';
import PaymentRouter, { TIER_CONFIG, PROVIDER_CONFIG } from '../services/PaymentRouter';

function PaymentRouterTest() {
  const [testResults, setTestResults] = useState([]);

  const runTests = async () => {
    const results = [];

    // TEST 1: Service imports correctly
    try {
      results.push({
        name: 'Service Import',
        status: PaymentRouter ? 'PASS' : 'FAIL',
        message: 'PaymentRouter imported successfully'
      });
    } catch (error) {
      results.push({
        name: 'Service Import',
        status: 'FAIL',
        message: error.message
      });
    }

    // TEST 2: Configuration exports
    try {
      const hasTiers = TIER_CONFIG && Object.keys(TIER_CONFIG).length > 0;
      const hasProviders = PROVIDER_CONFIG && Object.keys(PROVIDER_CONFIG).length > 0;
      
      results.push({
        name: 'Configuration Exports',
        status: (hasTiers && hasProviders) ? 'PASS' : 'FAIL',
        message: `Tiers: ${Object.keys(TIER_CONFIG).length}, Providers: ${Object.keys(PROVIDER_CONFIG).length}`
      });
    } catch (error) {
      results.push({
        name: 'Configuration Exports',
        status: 'FAIL',
        message: error.message
      });
    }

    // TEST 3: Environment detection
    try {
      const env = PaymentRouter.getEnvironment();
      const hasRequiredFields = env.name && env.apiBase && env.frontendBase;
      
      results.push({
        name: 'Environment Detection',
        status: hasRequiredFields ? 'PASS' : 'FAIL',
        message: `Environment: ${env.name}, API: ${env.apiBase}`,
        data: env
      });
    } catch (error) {
      results.push({
        name: 'Environment Detection',
        status: 'FAIL',
        message: error.message
      });
    }

    // TEST 4: Configuration validation
    try {
      const config = PaymentRouter.validateConfiguration();
      
      results.push({
        name: 'Configuration Validation',
        status: config.valid ? 'PASS' : 'WARN',
        message: `Valid: ${config.valid}, Errors: ${config.errors.length}, Warnings: ${config.warnings.length}`,
        data: config
      });
    } catch (error) {
      results.push({
        name: 'Configuration Validation',
        status: 'FAIL',
        message: error.message
      });
    }

    // TEST 5: Available providers
    try {
      const providers = PaymentRouter.getAvailableProviders();
      const hasStripe = providers.some(p => p.name === 'stripe');
      const hasPayPal = providers.some(p => p.name === 'paypal');
      
      results.push({
        name: 'Available Providers',
        status: (hasStripe && hasPayPal) ? 'PASS' : 'FAIL',
        message: `Found ${providers.length} providers`,
        data: providers
      });
    } catch (error) {
      results.push({
        name: 'Available Providers',
        status: 'FAIL',
        message: error.message
      });
    }

    // TEST 6: Test mode detection
    try {
      const isTest = PaymentRouter.isTestMode();
      
      results.push({
        name: 'Test Mode Detection',
        status: 'PASS',
        message: `Test mode: ${isTest}`,
        data: { isTestMode: isTest }
      });
    } catch (error) {
      results.push({
        name: 'Test Mode Detection',
        status: 'FAIL',
        message: error.message
      });
    }

    // TEST 7: Context preservation
    try {
      const testContext = {
        test: 'data',
        timestamp: Date.now()
      };
      
      const contextId = PaymentRouter.preserveContext(testContext);
      const restored = PaymentRouter.restoreContext(contextId);
      
      const matches = restored && restored.test === testContext.test;
      
      results.push({
        name: 'Context Preservation',
        status: matches ? 'PASS' : 'FAIL',
        message: contextId ? 'Context saved and restored' : 'Failed to preserve context',
        data: { contextId, restored }
      });
    } catch (error) {
      results.push({
        name: 'Context Preservation',
        status: 'FAIL',
        message: error.message
      });
    }

    setTestResults(results);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>PaymentRouter Unit Tests</h1>
      <button 
        onClick={runTests}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          background: '#FFD700',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '2rem'
        }}
      >
        Run Unit Tests
      </button>

      {testResults.length > 0 && (
        <div>
          <h2>Test Results ({testResults.filter(t => t.status === 'PASS').length}/{testResults.length} passed)</h2>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: result.status === 'PASS' ? '#d4edda' : result.status === 'WARN' ? '#fff3cd' : '#f8d7da',
                border: '1px solid',
                borderColor: result.status === 'PASS' ? '#c3e6cb' : result.status === 'WARN' ? '#ffeaa7' : '#f5c6cb',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>{result.name}</strong>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  background: result.status === 'PASS' ? '#28a745' : result.status === 'WARN' ? '#ffc107' : '#dc3545',
                  color: 'white'
                }}>
                  {result.status}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {result.message}
              </div>
              {result.data && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ cursor: 'pointer', color: '#007bff' }}>View Data</summary>
                  <pre style={{ 
                    background: '#f4f4f4', 
                    padding: '0.5rem', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.8rem'
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PaymentRouterTest;