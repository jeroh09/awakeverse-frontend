// src/pages/Register.jsx - WITH OAUTH QUIZ SUPPORT
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../style/AuthPageStyles.css';

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState('form');
  const [successMessage, setSuccessMessage] = useState('');
  const [oauthAvailable, setOauthAvailable] = useState({ google: false, apple: false });
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check OAuth availability
  useEffect(() => {
    const checkOAuth = async () => {
      try {
        const res = await fetch(`${API}/api/auth/oauth/health`);
        const data = await res.json();
        setOauthAvailable({
          google: data.google?.available || false,
          apple: data.apple?.available || false,
        });
      } catch (err) {
        setOauthAvailable({ google: false, apple: false });
      }
    };
    checkOAuth();
  }, []);

  // ============================================================================
  // ENHANCED: Save quiz session before OAuth redirect
  // ============================================================================
  // Shared OAuth entry — stashes quiz session before redirect (all providers)
  const handleOAuthSignup = (provider) => {
    setLoading(true);
    setError('');

    // Get quiz session from URL or localStorage
    const quizSessionFromUrl = searchParams.get('quiz_session');
    let quizSessionId = quizSessionFromUrl;

    if (!quizSessionId) {
      // Try to get from localStorage (quiz completion)
      try {
        const quizData = localStorage.getItem('awakeverse_quiz_session');
        if (quizData) {
          const parsed = JSON.parse(quizData);
          quizSessionId = parsed.quiz_session_id;
        }
      } catch (e) {
        console.warn('Failed to parse quiz session:', e);
      }
    }

    // Save quiz session to sessionStorage before OAuth redirect
    if (quizSessionId) {
      sessionStorage.setItem('oauth_quiz_session', quizSessionId);
    }

    // Redirect to OAuth (backend will check sessionStorage alternative via state param)
    // For now, we rely on backend checking database after OAuth completes
    window.location.href = `${API}/api/auth/${provider}`;
  };

  const handleGoogleSignup = () => handleOAuthSignup('google');
  const handleAppleSignup = () => handleOAuthSignup('apple');

  const registerUser = async (userData) => {
    try {
      // Capture quiz_session from URL if present
      const quizSessionId = searchParams.get('quiz_session');

      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: userData.email, 
          password: userData.password, 
          display_name: userData.displayName,
          quiz_session_id: quizSessionId  // ← Existing
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      return data;
    } catch (err) {
      throw new Error(err.message || "Registration failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain uppercase, lowercase, and number');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registerUser({ 
        email, 
        password, 
        displayName 
      });
      
      if (result.requires_verification) {
        setRegistrationStep('verification-sent');
        setSuccessMessage('Account created! Please check your email for verification instructions.');
      } else {
        navigate('/login', { 
          state: { message: 'Registration successful! Please sign in.' }
        });
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;

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
        setSuccessMessage('Verification email resent! Please check your inbox.');
      } else {
        setError(data.error || 'Failed to resend verification');
      }
    } catch (err) {
      setError('Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  // VERIFICATION SENT VIEW
  if (registrationStep === 'verification-sent') {
    return (
      <div className="auth-page">
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

        <div className="auth-container">
          <div className="auth-scene-panel"></div>
          
          <div className="auth-form-container">
            <div className="auth-form verification-pending">
              <h2>Verify Your Email</h2>
              
              <div className="verification-icon">
                📧
              </div>
              
              {successMessage && (
                <div className="success-text">{successMessage}</div>
              )}
              
              {error && (
                <div className="error-text">{error}</div>
              )}
              
              <p>
                We've sent a verification email to <strong>{email}</strong>
              </p>
              
              <p>
                Click the verification link in your email to activate your account.
              </p>
              
              <div className="verification-actions">
                <button 
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="secondary-button"
                >
                  {loading ? 'Sending...' : 'Resend Email'}
                </button>
                
                <Link to="/login" className="primary-button">
                  Go to Login
                </Link>
              </div>
              
              <div className="auth-legal-text">
                <p>Check spam folder • Links expire in 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page register-page">
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

      <div className="auth-container">
        <div 
          className="auth-scene-panel"
          style={{
            background: `url(${process.env.PUBLIC_URL}/images/auth-scene.jpeg) center/cover`
          }}
        ></div>
        
        <div className="auth-form-container">
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="error-text">{error}</div>}
            
            {/* UNIFIED OAUTH RAIL — Google + Apple */}
            {(oauthAvailable.google || oauthAvailable.apple) && (
              <div className="oauth-rail">
                {oauthAvailable.google && (
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="oauth-mark"
                    aria-label="Sign up with Google"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                      <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                    </svg>
                    <span>Sign up with Google</span>
                  </button>
                )}
                {oauthAvailable.apple && (
                  <button
                    type="button"
                    onClick={handleAppleSignup}
                    disabled={loading}
                    className="oauth-mark"
                    aria-label="Sign up with Apple"
                  >
                    <svg width="15" height="17" viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M13.09 9.54c-.02-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.42.73-3.05.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.29 2-1.4 2.43-.36 6.02 1 8 .67.97 1.46 2.05 2.5 2.01 1.01-.04 1.39-.65 2.6-.65 1.21 0 1.56.65 2.62.63 1.08-.02 1.77-.99 2.43-1.96.77-1.12 1.08-2.21 1.1-2.27-.02-.01-2.11-.81-2.13-3.21zM11.13 3.5c.56-.68.94-1.62.83-2.56-.81.03-1.79.54-2.37 1.21-.52.6-.97 1.56-.85 2.48.9.07 1.83-.46 2.39-1.13z" fill="currentColor"/>
                    </svg>
                    <span>Sign up with Apple</span>
                  </button>
                )}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Choose your display name"
                disabled={loading}
                required
              />
            </div>
            
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                disabled={loading}
                required
              />
            </div>
            
            <div className="password-requirements">
              <small>
                Password must contain: uppercase, lowercase, number, 8+ characters
              </small>
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <div className="auth-links">
              <Link to="/login">Already have an account?</Link>
            </div>
            
            <div className="auth-legal-text">
              <p>
                By creating an account, you agree with our{' '}
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