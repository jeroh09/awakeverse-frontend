// src/pages/Register.jsx - ACTUALLY adding terms/privacy to desktop form
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ElegantCharacterPortraits from '../components/ElegantCharacterPortraits';
import UnifiedMobileAuth from '../components/UnifiedMobileAuth';
import '../components/ElegantCharacterPortraits.css';
import '../style/AuthPageStyles.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  
  const navigate = useNavigate();

  // Direct API call instead of using AuthContext to avoid auto-login
  const registerUser = async (userData) => {
    const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";
    
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: userData.email, 
        password: userData.password, 
        display_name: userData.displayName 
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Registration failed");
    }

    return await res.json();
  };

  const handleSubmit = async (formData) => {
    const emailValue = formData.email || email;
    const passwordValue = formData.password || password;
    const displayNameValue = formData.displayName || displayName;

    if (!emailValue || !passwordValue || !displayNameValue) {
      setError('Please fill in all fields');
      return;
    }

    if (passwordValue.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await registerUser({ 
        email: emailValue, 
        password: passwordValue, 
        displayName: displayNameValue 
      });
      
      // Success! Redirect to login without auto-login
      navigate('/login', { 
        state: { message: 'Your realm awaits! Please sign in to begin.' }
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDesktopSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit({ email, password, displayName });
  };

  // Handle character changes from the portrait component
  const handleCharacterChange = (character) => {
    setCurrentCharacter(character);
  };

  // Dynamic form title based on current character
  const getFormTitle = () => {
    if (currentCharacter) {
      return `Chat with ${currentCharacter.name}`;
    }
    return 'Awaken the Legends';
  };

  return (
    <div className="auth-page">
      {/* ✅ MOBILE: Use UnifiedMobileAuth component we just fixed */}
      <UnifiedMobileAuth 
        mode="register"
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
      />

      {/* DESKTOP: Side-by-side layout */}
      {/* Left side: Elegant character portraits */}
      <div className="auth-demo-container">
        <ElegantCharacterPortraits 
          autoAdvanceInterval={12000}
          onCharacterChange={handleCharacterChange}
        />
      </div>

      {/* Right side: Floating auth form */}
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
        />
        
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading}
        />
        
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password (min 6 characters)"
          disabled={loading}
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Realm...' : 'Begin Your Journey'}
        </button>
        
        {/* ✅ NOW ACTUALLY ADDING: Terms and Privacy Policy */}
        <div className="auth-legal-text">
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
        
        <p>
          Already registered? <Link to="/login">Return to your realm</Link>
        </p>
      </form>
    </div>
  );
}