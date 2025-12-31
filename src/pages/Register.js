// src/pages/Register.jsx - TRADITIONAL SIGNUP ONLY (OAuth on Login page)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  
  const navigate = useNavigate();

  // KEEP YOUR EXISTING REGISTRATION FLOW
  const registerUser = async (userData) => {
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: userData.email, 
          password: userData.password, 
          display_name: userData.displayName 
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

    // KEEP YOUR VALIDATION
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
        {/* BRAND IN TOP LEFT */}
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
    <div className="auth-page">
      {/* BRAND IN TOP LEFT */}
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
        {/* SCENE PANEL */}
        <div 
          className="auth-scene-panel"
          style={{
            background: `url(${process.env.PUBLIC_URL}/images/auth-scene.jpeg) center/cover`
          }}
        ></div>
        
        {/* FLOATING AUTH FORM - NO OAUTH */}
        <div className="auth-form-container">
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="error-text">{error}</div>}
            
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
            
            {/* ✅ ADD GOOGLE SIGNUP HINT */}
            <div style={{
              marginTop: 'var(--space-md)',
              padding: 'var(--space-sm)',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)'
              }}>
                Want to use Google?{' '}
                <Link 
                  to="/login"
                  style={{
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Sign in with Google
                </Link>
              </p>
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