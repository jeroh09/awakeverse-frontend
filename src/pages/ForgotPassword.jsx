// src/pages/ForgotPassword.jsx - Mobile-friendly 
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ElegantCharacterPortraits from '../components/ElegantCharacterPortraits';
import '../components/ElegantCharacterPortraits.css';
import '../style/AuthPageStyles.css';

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setEmailSent(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterChange = (character) => {
    setCurrentCharacter(character);
  };

  const getFormTitle = () => {
    if (emailSent) {
      return 'Check Your Email';
    }
    if (currentCharacter) {
      return `${currentCharacter.name} Will Guide You`;
    }
    return 'Reset Your Password';
  };

  // Success view - works on both mobile and desktop
  if (emailSent) {
    return (
      <div className="auth-page">
        {/* MOBILE: Simple mobile layout */}
        <div className="mobile-forgot-success">
          <div className="mobile-success-content">
            <h2>Reset Email Sent</h2>
            <div className="success-icon">📧</div>
            <p>If an account exists for <strong>{email}</strong>, we've sent reset instructions.</p>
            
            <div className="mobile-success-actions">
              <button 
                onClick={() => setEmailSent(false)}
                className="mobile-secondary-btn"
              >
                Try Different Email
              </button>
              <Link to="/login" className="mobile-primary-btn">
                Back to Login
              </Link>
            </div>
            
            <div className="mobile-help-text">
              <small>Check spam folder • Link expires in 24 hours</small>
            </div>
          </div>
        </div>

        {/* DESKTOP: Character portraits */}
        <div className="auth-demo-container desktop-only">
          <ElegantCharacterPortraits 
            autoAdvanceInterval={15000}
            onCharacterChange={handleCharacterChange}
          />
        </div>

        <div className="auth-form desktop-only compact-verification">
          <h2>Reset Email Sent</h2>
          <div className="verification-icon">🔐</div>
          <p>If an account exists for <strong>{email}</strong>, we've sent reset instructions.</p>
          
          <div className="verification-actions">
            <button 
              onClick={() => setEmailSent(false)}
              className="secondary-button"
            >
              Try Different Email
            </button>
            <Link to="/login" className="primary-button">
              Back to Login
            </Link>
          </div>
          
          <div className="compact-help">
            <small>Check spam folder • Link expires in 24 hours</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* MOBILE: Simple mobile form */}
      <div className="mobile-forgot-form mobile-only">
        <div className="mobile-form-content">
          <h2>Reset Password</h2>
          <p>Enter your email to receive reset instructions.</p>
          
          {error && <div className="mobile-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="mobile-simple-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                required
                autoFocus
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !email}
              className="mobile-submit-btn"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
          
          <div className="mobile-auth-links">
            <Link to="/login">← Back to Login</Link>
            <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>

      {/* DESKTOP: Character portraits and form */}
      <div className="auth-demo-container desktop-only">
        <ElegantCharacterPortraits 
          autoAdvanceInterval={12000}
          onCharacterChange={handleCharacterChange}
        />
      </div>

      <form className="auth-form desktop-only compact-form" onSubmit={handleSubmit}>
        <h2>{getFormTitle()}</h2>
        <p className="form-description">Enter your email to receive reset instructions.</p>
        
        {error && <div className="error-text">{error}</div>}
        
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          disabled={loading}
          required
          autoFocus
        />
        
        <button type="submit" disabled={loading || !email}>
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
        
        <div className="auth-links">
          <Link to="/login">← Back to Login</Link>
          <Link to="/register">Create Account</Link>
        </div>
      </form>
    </div>
  );
}