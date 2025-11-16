// src/components/UnifiedMobileAuth.jsx - SIMPLIFIED FOR NEW DESIGN
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './EnhancedMobileAuth.css';

export default function UnifiedMobileAuth({ 
  mode = 'login', 
  onSubmit, 
  error, 
  loading,
  showResendVerification,
  onResendVerification,
  email 
}) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // For mobile, we use the same scene+form layout but simplified
  return (
    <div className="auth-page">
      {/* BRAND IN TOP LEFT */}
      <div style={{
        position: 'absolute',
        top: 'var(--space-lg)',
        left: 'var(--space-lg)',
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
        
        {/* FLOATING AUTH FORM */}
        <div className="auth-form-container">
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="error-text">{error}</div>}
            
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
                  onClick={() => onResendVerification(formData.email)}
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
            
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Choose your display name"
                  disabled={loading}
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your email"
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={mode === 'register' ? 'Create a password' : 'Your password'}
                disabled={loading}
                required
              />
            </div>
            
            {mode === 'register' && (
              <div className="password-requirements">
                <small>
                  Password must contain: uppercase, lowercase, number, 8+ characters
                </small>
              </div>
            )}
            
            <button type="submit" disabled={loading}>
              {loading 
                ? (mode === 'register' ? 'Creating Account...' : 'Signing In...') 
                : (mode === 'register' ? 'Create Account' : 'Continue')
              }
            </button>
            
            <div className="auth-links">
              {mode === 'login' ? (
                <>
                  <Link to="/forgot-password">Forgot password?</Link>
                  <Link to="/register">Create account</Link>
                </>
              ) : (
                <Link to="/login">Already have an account?</Link>
              )}
            </div>
            
            <div className="auth-legal-text">
              <p>
                By {mode === 'register' ? 'creating an account' : 'continuing'}, you agree with our{' '}
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