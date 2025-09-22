// src/pages/ForgotPassword.jsx - Password reset request page
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

  // Show success view after email sent
  if (emailSent) {
    return (
      <div className="auth-page">
        <div className="auth-demo-container">
          <ElegantCharacterPortraits 
            autoAdvanceInterval={15000}
            onCharacterChange={handleCharacterChange}
          />
        </div>

        <div className="auth-form verification-pending">
          <h2>Reset Email Sent</h2>
          
          <div className="verification-icon">
            🔐
          </div>
          
          <p>
            If an account with email <strong>{email}</strong> exists, we've sent password reset instructions.
          </p>
          
          <p>
            Check your email and click the reset link to create a new password.
          </p>
          
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
          
          <div className="verification-help">
            <p>Don't see the email?</p>
            <ul>
              <li>Check your spam/junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>The reset link expires in 24 hours</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Character portraits for desktop */}
      <div className="auth-demo-container">
        <ElegantCharacterPortraits 
          autoAdvanceInterval={12000}
          onCharacterChange={handleCharacterChange}
        />
      </div>

      {/* Reset form */}
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{getFormTitle()}</h2>
        
        <p style={{ marginBottom: '2rem', color: '#666', lineHeight: 1.6 }}>
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        
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
          {loading ? 'Sending Reset Email...' : 'Send Reset Instructions'}
        </button>
        
        <div className="auth-links">
          <Link to="/login">← Back to Login</Link>
          <Link to="/register">Create New Account</Link>
        </div>
      </form>
    </div>
  );
}