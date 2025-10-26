// src/tests/PaymentRouterIntegrationTest.jsx
import React, { useState } from 'react';
import PaymentRouter from '../services/PaymentRouter';
import { useAuth } from '../contexts/AuthContext';

function PaymentRouterIntegrationTest() {
  const { token } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runIntegrationTests = async () => {
    setIsRunning(true);
    const results = [];

    // TEST 1: Health Check
    try {
      console.log('Running health check...');
      const health = await PaymentRouter.healthCheck();
      
      const isHealthy = health.status === 'healthy' || health.status === 'degraded';
      const hasStripe = health.providers?.stripe?.available;
      
      results.push({
        name: 'System Health Check',
        status: isHealthy ? 'PASS' : 'FAIL',
        message: `Status: ${health.status}, Stripe: ${hasStripe ? 'Available' : 'Unavailable'}`,
        data: health
      });
    } catch (error) {
      results.push({
        name: 'System Health Check',
        status: 'FAIL',
        message: error.message,
        data: { error: error.message }
      });
    }

    // TEST 2: Get Checkout URL (without redirect)
    if (token) {
      try {
        console.log('Testing checkout URL generation...');
        const result = await PaymentRouter.getCheckoutUrl({
          tier: 'pro',
          currency: 'GBP',
          triggerSource: 'integration_test'
        });
        
        results.push({
          name: 'Checkout URL Generation',
          status: result.success ? 'PASS' : 'FAIL',
          message: result.success 
            ? `URL generated: ${result.url?.substring(0, 50)}...`
            : `Error: ${result.error?.userMessage}`,
          data: result
        });
      } catch (error) {
        results.push({
          name: 'Checkout URL Generation',
          status: 'FAIL',
          message: error.message,
          data: { error: error.message }
        });
      }
    } else {
      results.push({
        name: 'Checkout URL Generation',
        status: 'SKIP',
        message: 'Skipped - not authenticated'
      });
    }

    // TEST 3: Validate different tiers
    const tiers = ['starter', 'pro', 'unlimited'];
    for (const tier of tiers) {
      try {
        console.log(`Testing tier: ${tier}...`);
        const result = await PaymentRouter.getCheckoutUrl({
          tier: tier,
          currency: 'GBP'
        });
        
        results.push({
          name: `Tier: ${tier}`,
          status: result.success ? 'PASS' : token ? 'FAIL' : 'SKIP',
          message: result.success 
            ? `✓ ${tier} tier works`
            : token ? result.error?.userMessage : 'Not authenticated',
          data: result.success ? { url: result.url?.substring(0, 50) } : result.error
        });
      } catch (error) {
        results.push({
          name: `Tier: ${tier}`,
          status: 'FAIL',
          message: error.message
        });
      }
    }

    // TEST 4: Currency support
    const currencies = ['GBP', 'USD', 'EUR'];
    for (const currency of currencies) {
      try {
        console.log(`Testing currency: ${currency}...`);
        const result = await PaymentRouter.getCheckoutUrl({
          tier: 'pro',
          currency: currency
        });
        
        results.push({
          name: `Currency: ${currency}`,
          status: result.success ? 'PASS' : token ? 'FAIL' : 'SKIP',
          message: result.success 
            ? `✓ ${currency} supported`
            : token ? result.error?.userMessage : 'Not authenticated',
          data: result.success ? { currency: result.currency } : result.error
        });
      } catch (error) {
        results.push({
          name: `Currency: ${currency}`,
          status: 'FAIL',
          message: error.message
        });
      }
    }

    // TEST 5: Invalid tier handling
    try {
      console.log('Testing invalid tier handling...');
      const result = await PaymentRouter.getCheckoutUrl({
        tier: 'invalid_tier',
        currency: 'GBP'
      });
      
      results.push({
        name: 'Invalid Tier Handling',
        status: !result.success ? 'PASS' : 'FAIL',
        message: !result.success 
          ? `✓ Correctly rejected invalid tier: ${result.error?.userMessage}`
          : '✗ Should have rejected invalid tier',
        data: result
      });
    } catch (error) {
      results.push({
        name: 'Invalid Tier Handling',
        status: 'FAIL',
        message: error.message
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>PaymentRouter Integration Tests</h1>
      
      <div style={{ 
        padding: '1rem', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <strong>⚠️ Prerequisites:</strong>
        <ul>
          <li>Backend must be running (localhost:5000 or production)</li>
          <li>You must be logged in for full tests</li>
          <li>Stripe integration must be configured</li>
        </ul>
        {!token && <div style={{ color: '#856404', marginTop: '0.5rem' }}>
          ⚠️ Not authenticated - some tests will be skipped
        </div>}
      </div>

      <button 
        onClick={runIntegrationTests}
        disabled={isRunning}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          background: isRunning ? '#ccc' : '#FFD700',
          border: 'none',
          borderRadius: '8px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          marginBottom: '2rem'
        }}
      >
        {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
      </button>

      {testResults.length > 0 && (
        <div>
          <h2>
            Test Results ({testResults.filter(t => t.status === 'PASS').length}/
            {testResults.filter(t => t.status !== 'SKIP').length} passed)
          </h2>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: 
                  result.status === 'PASS' ? '#d4edda' : 
                  result.status === 'SKIP' ? '#e2e3e5' :
                  result.status === 'WARN' ? '#fff3cd' : '#f8d7da',
                border: '1px solid',
                borderColor: 
                  result.status === 'PASS' ? '#c3e6cb' : 
                  result.status === 'SKIP' ? '#d6d8db' :
                  result.status === 'WARN' ? '#ffeaa7' : '#f5c6cb',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>{result.name}</strong>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  background: 
                    result.status === 'PASS' ? '#28a745' : 
                    result.status === 'SKIP' ? '#6c757d' :
                    result.status === 'WARN' ? '#ffc107' : '#dc3545',
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
                    fontSize: '0.8rem',
                    maxHeight: '300px'
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

export default PaymentRouterIntegrationTest;