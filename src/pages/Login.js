// src/pages/Login.jsx - MODIFIED VERSION with OAuth Error Notifications
// REPLACE YOUR CURRENT Login.js with this version

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeError } from '../utils/errorUtils';
import '../style/AuthPageStyles.css';

// ✅ ADD THESE TWO IMPORTS
import { useOAuthErrorHandler } from '../hooks/useOAuthErrorHandler';
import { OAuthErrorNotification } from '../components/OAuthErrorNotification';

const API = process.env.NODE_ENV === 'development' ? '' : 'https://api.awakeverse.com';

// Mobile detection hook
function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [oauthAvailable, setOauthAvailable] = useState(false);
  
  const isMobile = useMobileDetection();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // ✅ ADD THIS LINE - Initialize OAuth error handler
  const { oauthError, clearOAuthError } = useOAuthErrorHandler();

  // Check OAuth availability
  useEffect(() => {
    const checkOAuth = async () => {
      try {
        const res = await fetch(`${API}/api/auth/oauth/health`);
        const data = await res.json();
        setOauthAvailable(data.google?.available || false);
      } catch (err) {
        setOauthAvailable(false);
      }
    };
    checkOAuth();
  }, []);

  // ❌ REMOVE THIS OLD OAUTH ERROR HANDLING (lines 58-75 in your current file)
  // The new useOAuthErrorHandler hook handles this automatically
  /*
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const errorMessages = {
        'oauth_denied': 'Google sign-in was cancelled',
        'oauth_failed': 'Google sign-in failed. Please try again',
        ...
      };
      setError(errorMessages[oauthError] || 'Google sign-in failed');
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);
  */

  // ✅ KEEP THIS - Check for verified email and quiz session
  useEffect(() => {
    const verified = searchParams.get('verified');
    const quizSession = searchParams.get('quiz_session');
    
    if (verified === 'true') {
      setSuccessMessage('✅ Email verified! Please sign in to continue.');
    }
    
    if (quizSession) {
      sessionStorage.setItem('pending_quiz_after_login', quizSession);
      console.log('📝 Stored quiz session for post-login:', quizSession);
    }
  }, [searchParams]);

  // ✅ KEEP THIS - Check for email verification token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleEmailVerification(token);
    }
  }, [searchParams]);

  // ✅ KEEP THIS - Check for success message from registration or password reset
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // ✅ KEEP ALL YOUR EXISTING FUNCTIONS
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
      } else {
        setVerificationStatus('error');
        setError(data.error || 'Email verification failed');
      }
    } catch (err) {
      setVerificationStatus('error');
      setError('Verification failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    window.location.href = `${API}/api/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setShowResendVerification(false);

    try {
      await login({ email, password });
      
      const pendingQuizFromUrl = sessionStorage.getItem('pending_quiz_after_login');
      sessionStorage.removeItem('pending_quiz_after_login');
      
      if (pendingQuizFromUrl) {
        console.log(`🎯 Redirecting to template with quiz: ${pendingQuizFromUrl}`);
        navigate(`/app?quiz_session=${pendingQuizFromUrl}&view=create`);
      } else {
        navigate('/app');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.message.includes('verify your email') || err.message.includes('requires_verification')) {
        setError('Please verify your email address before signing in.');
        setShowResendVerification(true);
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      
      setError(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  return (
    <div className="auth-page">
      {/* ✅ ADD THIS - OAuth Error Notification at the top */}
      {oauthError && (
        <OAuthErrorNotification 
          error={oauthError} 
          onDismiss={clearOAuthError}
        />
      )}

      {/* ✅ KEEP ALL YOUR EXISTING JSX */}
      {!isMobile ? (
        <div style={{
          position: 'absolute',
          top: 'var(--space-xl)',
          left: 'var(--space-xl)',
          zIndex: 100
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--brand-ivory)',
            textShadow: '0 0 20px var(--accent-glow)',
            margin: 0
          }}>
            AwakeVerse
          </h1>
        </div>
      ) : (
        <div style={{
          position: 'absolute',
          top: 'var(--space-lg)',
          left: 'var(--space-lg)',
          zIndex: 100
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--brand-ivory)',
            textShadow: '0 0 20px var(--accent-glow)',
            margin: 0
          }}>
            AwakeVerse
          </h1>
        </div>
      )}

      <div className="auth-container">
        <div 
          className="auth-scene-panel"
          style={{
            background: `url(${process.env.PUBLIC_URL}/images/auth-scene.jpeg) center/cover`
          }}
        ></div>
        
        <div className="auth-form-container">
          <form className="auth-form" onSubmit={handleSubmit}>
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
              <div style={{ 
                background: 'rgba(99, 102, 241, 0.1)', 
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-md)',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Need to verify your email?
                </p>
                <button 
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Resend verification email
                </button>
              </div>
            )}
            
            {/* GOOGLE OAUTH BUTTON */}
            {oauthAvailable && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="google-oauth-button"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    color: '#1f1f1f',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: 'var(--space-md)',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.background = 'rgba(255, 255, 255, 1)';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.95)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
                
                {/* OR DIVIDER */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: 'var(--space-md) 0',
                  gap: '12px'
                }}>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    background: 'var(--border-medium)'
                  }}></div>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>or</span>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    background: 'var(--border-medium)'
                  }}></div>
                </div>
              </>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                disabled={loading}
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !email || !password}
            >
              {loading ? 'Signing In...' : 'Continue'}
            </button>
            
            <div className="auth-links">
              <Link to="/forgot-password">Forgot password?</Link>
              <Link to="/register">Create account</Link>
            </div>
            
            <div className="auth-legal-text">
              <p>
                By continuing, you agree with our{' '}
                <a 
                  href="https://www.awakeverse.com/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Terms
                </a>{' '}
                and{' '}
                <a 
                  href="https://www.awakeverse.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}