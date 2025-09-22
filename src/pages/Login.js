// src/pages/Login.jsx - Enhanced with mobile email verification support
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ElegantCharacterPortraits from '../components/ElegantCharacterPortraits';
import UnifiedMobileAuth from '../components/UnifiedMobileAuth';
import '../components/ElegantCharacterPortraits.css';
import '../style/AuthPageStyles.css';

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check for email verification token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleEmailVerification(token);
    }
  }, [searchParams]);

  // Check for success message from registration or password reset
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Handle email verification from URL token
  const handleEmailVerification = async (token) => {
    setVerificationStatus('processing');
    
    try {
      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationStatus('success');
        setSuccessMessage('Email verified successfully! You can now sign in.');
        
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
          navigate('/app');
          return;
        }
      } else {
        setVerificationStatus('error');
        setError(data.error || 'Email verification failed');
      }
    } catch (err) {
      setVerificationStatus('error');
      setError('Verification failed. Please try again.');
    }
  };

  // Enhanced submit handler with email verification support
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    setShowResendVerification(false);

    try {
      await login({ 
        email: formData.email || email, 
        password: formData.password || password 
      });
      
      setRetryCount(0);
      navigate('/app');
    } catch (err) {
      console.error('Login error caught in component:', err);
      setRetryCount(prev => prev + 1);
      
      // Handle specific email verification error
      if (err.message.includes('verify your email') || err.message.includes('requires_verification')) {
        setError('Please verify your email address before signing in.');
        setShowResendVerification(true);
      } else {
        setError(err.message || 'Login failed. Please try again.');
        setShowResendVerification(false);
      }
      
      setTimeout(() => {
        setError('');
        setShowResendVerification(false);
      }, 7000);
      
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

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    await handleSubmit({ email, password });
  };

  const handleResendVerification = async (emailAddress) => {
    const targetEmail = emailAddress || email;
    
    if (!targetEmail) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Verification email sent! Please check your inbox.');
        setShowResendVerification(false);
      } else {
        setError(data.error || 'Failed to resend verification');
      }
    } catch (err) {
      setError('Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterChange = (character) => {
    setCurrentCharacter(character);
  };

  const getFormTitle = () => {
    if (verificationStatus === 'processing') {
      return 'Verifying Email...';
    }
    if (verificationStatus === 'success') {
      return 'Email Verified!';
    }
    if (currentCharacter) {
      return `Welcome, ${currentCharacter.name} awaits`;
    }
    return 'Welcome Back';
  };

  const getLoadingMessage = () => {
    if (retryCount > 0) {
      return 'Retrying connection...';
    }
    return 'Awakening...';
  };

  const showRetryInfo = retryCount > 0 && !loading && !error;

  return (
    <div className="auth-page">
      {/* MOBILE: Enhanced mobile auth component */}
      <UnifiedMobileAuth 
        mode="login"
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        showResendVerification={showResendVerification}
        onResendVerification={handleResendVerification}
        email={email}
        successMessage={successMessage}
      />

      {/* DESKTOP: Side-by-side layout */}
      <div className="auth-demo-container">
        <ElegantCharacterPortraits 
          autoAdvanceInterval={12000}
          onCharacterChange={handleCharacterChange}
        />
      </div>

      <form className="auth-form" onSubmit={handleDesktopSubmit}>
        <h2>{getFormTitle()}</h2>
        
        {verificationStatus === 'processing' && (
          <div className="info-text">
            Verifying your email address...
          </div>
        )}
        
        {successMessage && (
          <div className="success-text">{successMessage}</div>
        )}
        
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
        
        {showResendVerification && (
          <div className="verification-help-box">
            <p>Need to verify your email?</p>
            <button 
              type="button"
              onClick={() => handleResendVerification(email)}
              disabled={loading}
              className="link-button"
            >
              Resend verification email
            </button>
          </div>
        )}
        
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
        
        <div className="auth-links">
          <Link to="/forgot-password">Forgot your password?</Link>
          <Link to="/register">New to Awakeverse? Begin your journey</Link>
        </div>
      </form>
    </div>
  );
}