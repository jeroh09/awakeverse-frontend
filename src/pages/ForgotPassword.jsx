// src/pages/ForgotPassword.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../style/AuthPageStyles.css';

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const location = useLocation();

  // Pre-fill email if coming from Login.js OAuth account prompt
  useEffect(() => {
    if (location.state?.prefillEmail) {
      setEmail(location.state.prefillEmail);
    }
  }, [location]);

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setEmailSent(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="auth-page">
        <div className="auth-form verification-pending">
          <h2>Check Your Email</h2>
          <div className="verification-icon">📧</div>
          <p>If an account exists for <strong>{email}</strong>, we've sent reset instructions.</p>
          <div className="verification-actions">
            <button onClick={() => setEmailSent(false)} className="secondary-button">
              Try Different Email
            </button>
            <Link to="/login" className="primary-button">Back to Login</Link>
          </div>
          <div className="auth-legal-text">
            <p>Check spam folder • Link expires in 24 hours</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>

        <p className="form-description">
          Enter your email to receive reset instructions
        </p>

        {error && <div className="error-text">{error}</div>}

        <div className="form-group">
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
            autoFocus={!location.state?.prefillEmail} // don't steal focus if pre-filled
          />
        </div>

        <button type="submit" disabled={loading || !email}>
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </button>

        <div className="auth-links">
          <Link to="/login">← Back to Login</Link>
          <Link to="/register">Create Account</Link>
        </div>

        <div className="auth-legal-text">
          <p>
            By continuing, you agree with our{' '}
            <a href="https://www.awakeverse.com/terms" target="_blank" rel="noopener noreferrer">Terms</a>
            {' '}and{' '}
            <a href="https://www.awakeverse.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </p>
        </div>
      </form>
    </div>
  );
}