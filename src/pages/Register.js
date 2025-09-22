// src/pages/Register.jsx - Enhanced with email verification
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ElegantCharacterPortraits from '../components/ElegantCharacterPortraits';
import UnifiedMobileAuth from '../components/UnifiedMobileAuth';
import '../components/ElegantCharacterPortraits.css';
import '../style/AuthPageStyles.css';

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [registrationStep, setRegistrationStep] = useState('form'); // 'form', 'verification-sent', 'verification-complete'
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  // Enhanced registration with email verification
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

  const handleSubmit = async (formData) => {
    const emailValue = formData.email || email;
    const passwordValue = formData.password || password;
    const displayNameValue = formData.displayName || displayName;

    if (!emailValue || !passwordValue || !displayNameValue) {
      setError('Please fill in all fields');
      return;
    }

    // Enhanced password validation
    if (passwordValue.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordValue)) {
      setError('Password must contain uppercase, lowercase, and number');
      return;
    }

    // Basic email validation
    if (!emailValue.includes('@') || !emailValue.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registerUser({ 
        email: emailValue, 
        password: passwordValue, 
        displayName: displayNameValue 
      });
      
      if (result.requires_verification) {
        // Show verification pending step
        setRegistrationStep('verification-sent');
        setSuccessMessage('Account created! Please check your email for verification instructions.');
      } else {
        // Immediate success (fallback case)
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

  const handleDesktopSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit({ email, password, displayName });
  };

  const handleCharacterChange = (character) => {
    setCurrentCharacter(character);
  };

  const getFormTitle = () => {
    if (registrationStep === 'verification-sent') {
      return 'Check Your Email';
    }
    if (currentCharacter) {
      return `Chat with ${currentCharacter.name}`;
    }
    return 'Awaken the Legends';
  };

  // Render verification pending view
  if (registrationStep === 'verification-sent') {
    return (
      <div className="auth-page">
        <div className="auth-demo-container">
          <ElegantCharacterPortraits 
            autoAdvanceInterval={15000}
            onCharacterChange={handleCharacterChange}
          />
        </div>

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
            Click the verification link in your email to activate your account and start chatting with legendary figures.
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
          
          <div className="verification-help">
            <p>Don't see the email?</p>
            <ul>
              <li>Check your spam/junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Try resending the verification email</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* MOBILE */}
      <UnifiedMobileAuth 
        mode="register"
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
      />

      {/* DESKTOP */}
      <div className="auth-demo-container">
        <ElegantCharacterPortraits 
          autoAdvanceInterval={12000}
          onCharacterChange={handleCharacterChange}
        />
        <div className="showcase-legal-text">
          <p>
            By creating an account, you agree to our{' '}
            <a 
              href="https://www.awakeverse.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a 
              href="https://www.awakeverse.com/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      <form className="auth-form" onSubmit={handleDesktopSubmit}>
        <h2>{getFormTitle()}</h2>
        
        {error && <div className="error-text">{error}</div>}
        
        <label htmlFor="displayName">Your Display Name</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Choose your identity"
          disabled={loading}
          required
        />
        
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading}
          required
        />
        
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a secure password (8+ chars, upper, lower, number)"
          disabled={loading}
          required
        />
        
        <div className="password-requirements">
          <small>
            Password must contain: uppercase letter, lowercase letter, number, and be 8+ characters
          </small>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Begin Your Journey'}
        </button>
        
        <p>
          Already registered? <Link to="/login">Return to your realm</Link>
        </p>
      </form>
    </div>
  );
}