// TestHooksComponent.jsx - Quick test component for verifying our fixes
import React from 'react';
import { useFeaturedCharacters } from '../hooks/useFeaturedCharacters';
import { useLeaderboard } from '../hooks/useLeaderboard';

const TestHooksComponent = () => {
  // Test featured characters hook
  const { 
    featuredCharacters, 
    loading: featuredLoading, 
    error: featuredError,
    totalFeatured,
    weekStart 
  } = useFeaturedCharacters({ enabled: true });

  // Test leaderboard hook
  const { 
    rankings, 
    loading: leaderboardLoading, 
    error: leaderboardError,
    period,
    totalEntries 
  } = useLeaderboard({ period: 'week', limit: 5 });

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 Hook Testing Component</h2>
      
      {/* Featured Characters Test */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>✅ Featured Characters Hook Test</h3>
        <p><strong>Loading:</strong> {featuredLoading ? 'YES' : 'NO'}</p>
        <p><strong>Error:</strong> {featuredError || 'None'}</p>
        <p><strong>Total Featured:</strong> {totalFeatured}</p>
        <p><strong>Week Start:</strong> {weekStart}</p>
        <p><strong>Characters Count:</strong> {featuredCharacters.length}</p>
        
        {featuredCharacters.length > 0 && (
          <div>
            <h4>First Character Data:</h4>
            <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
              {JSON.stringify(featuredCharacters[0], null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Leaderboard Test */}
      <div style={{ border: '1px solid #ccc', padding: '15px' }}>
        <h3>🏆 Leaderboard Hook Test</h3>
        <p><strong>Loading:</strong> {leaderboardLoading ? 'YES' : 'NO'}</p>
        <p><strong>Error:</strong> {leaderboardError || 'None'}</p>
        <p><strong>Period:</strong> {period}</p>
        <p><strong>Total Entries:</strong> {totalEntries}</p>
        <p><strong>Rankings Count:</strong> {rankings.length}</p>
        
        {rankings.length > 0 && (
          <div>
            <h4>First Ranking Data:</h4>
            <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
              {JSON.stringify(rankings[0], null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8' }}>
        <h3>📊 Test Summary</h3>
        <p>✅ Featured Characters: {featuredError ? '❌ FAILED' : featuredCharacters.length > 0 ? '✅ SUCCESS' : '⏳ LOADING'}</p>
        <p>✅ Leaderboard: {leaderboardError ? '❌ FAILED' : rankings.length > 0 ? '✅ SUCCESS' : '⏳ LOADING'}</p>
      </div>
    </div>
  );
};

export default TestHooksComponent;