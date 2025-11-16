// src/pages/Login.jsx - COMPLETE REWRITE
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeError } from '../utils/errorUtils';
import '../style/AuthPageStyles.css';

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
  
  const isMobile = useMobileDetection();
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
      } else {
        setVerificationStatus('error');
        setError(data.error || 'Email verification failed');
      }
    } catch (err) {
      setVerificationStatus('error');
      setError('Verification failed. Please try again.');
    }
  };

  // Enhanced submit handler
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
      navigate('/app');
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific email verification error
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
      {/* BRAND - Different placement for mobile vs desktop */}
      {!isMobile ? (
        // Desktop: Brand in top-left corner
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
        // Mobile: Brand inside the form
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
        {/* SCENE PANEL */}
        <div 
          className="auth-scene-panel"
          style={{
            background: `url(${process.env.PUBLIC_URL}/images/auth-scene.jpeg) center/cover`
          }}
        ></div>
        
        {/* FLOATING AUTH FORM */}
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