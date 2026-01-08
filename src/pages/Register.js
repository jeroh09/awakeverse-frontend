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
  const [oauthAvailable, setOauthAvailable] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  // ============================================================================
  // ENHANCED: Save quiz session before OAuth redirect
  // ============================================================================
  const handleGoogleSignup = () => {
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
    window.location.href = `${API}/api/auth/google`;
  };

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
            
            {/* WHITE GOOGLE OAUTH BUTTON */}
            {oauthAvailable && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignup}
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
                  {/* FULL GOOGLE 4-COLOR LOGO */}
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </button>
                
                {/* OR DIVIDER */}
                <div className="oauth-divider" style={{
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