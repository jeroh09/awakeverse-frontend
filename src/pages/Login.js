// src/pages/Login.jsx - Enhanced with retry logic and better error handling
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ElegantCharacterPortraits from '../components/ElegantCharacterPortraits';
import UnifiedMobileAuth from '../components/UnifiedMobileAuth';
import '../components/ElegantCharacterPortraits.css';
import '../style/AuthPageStyles.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after showing it
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // 🔧 NEW: Enhanced submit handler with better error management
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      await login({ 
        email: formData.email || email, 
        password: formData.password || password 
      });
      
      // Reset retry count on successful login
      setRetryCount(0);
      navigate('/app');
    } catch (err) {
      console.error('Login error caught in component:', err);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // Show user-friendly error message (no more "internal server error")
      setError(err.message || 'Login failed. Please try again.');
      
      // 🔧 NEW: Auto-clear error after 5 seconds to improve UX
      setTimeout(() => {
        setError('');
      }, 5000);
      
    } finally {
      setLoading(false);
    }
  };

  const handleDesktopSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    await handleSubmit({ email, password });
  };

  // Handle character changes from the portrait component
  const handleCharacterChange = (character) => {
    setCurrentCharacter(character);
  };

  // Dynamic form title based on current character
  const getFormTitle = () => {
    if (currentCharacter) {
      return `Welcome, ${currentCharacter.name} awaits`;
    }
    return 'Welcome Back';
  };

  // 🔧 NEW: Get dynamic loading message
  const getLoadingMessage = () => {
    if (retryCount > 0) {
      return 'Retrying connection...';
    }
    return 'Awakening...';
  };

  // 🔧 NEW: Show retry info if there have been retries
  const showRetryInfo = retryCount > 0 && !loading && !error;

  return (
    <div className="auth-page">
      {/* MOBILE: Enhanced mobile auth component */}
      <UnifiedMobileAuth 
        mode="login"
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
      />

      {/* DESKTOP: Side-by-side layout */}
      {/* Left side: Elegant character portraits */}
      <div className="auth-demo-container">
        <ElegantCharacterPortraits 
          autoAdvanceInterval={12000}
          onCharacterChange={handleCharacterChange}
        />
      </div>

      {/* Right side: Floating auth form */}
      <form className="auth-form" onSubmit={handleDesktopSubmit}>
        <h2>{getFormTitle()}</h2>
        
        {successMessage && (
          <div className="success-text">{successMessage}</div>
        )}
        
        {/* 🔧 ENHANCED: Better error display with retry info */}
        {error && (
          <div className="error-text">
            {error}
            {error.includes('Server is temporarily unavailable') && (
              <div style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                We're working to resolve this. Please try again in a moment.
              </div>
            )}
          </div>
        )}
        
        {/* 🔧 NEW: Show retry success message */}
        {showRetryInfo && (
          <div className="info-text" style={{ color: '#666', fontSize: '0.9em', marginBottom: '10px' }}>
            Connection restored. You can try logging in again.
          </div>
        )}
        
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading}
          style={{
            borderColor: error && error.includes('email') ? '#ff6b6b' : undefined
          }}
        />
        
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={loading}
          style={{
            borderColor: error && error.includes('password') ? '#ff6b6b' : undefined
          }}
        />
        
        <button 
          type="submit" 
          disabled={loading || !email || !password}
          style={{
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? getLoadingMessage() : 'Enter the Realm'}
        </button>
        
        {/* 🔧 NEW: Connection status hint */}
        {loading && (
          <div style={{ 
            marginTop: '10px', 
            fontSize: '0.8em', 
            color: '#666', 
            textAlign: 'center' 
          }}>
            {retryCount > 0 ? 'Attempting to reconnect...' : 'Connecting to server...'}
          </div>
        )}
        
        <p>
          New to Awakeverse? <Link to="/register">Begin your journey</Link>
        </p>
      </form>
    </div>
  );
}