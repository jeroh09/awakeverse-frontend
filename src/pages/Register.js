// src/pages/Register.jsx - Fixed version with proper mobile navigation
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
    const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
    
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
      {/* MOBILE: Enhanced mobile auth component with navigation link */}
      <div className="unified-mobile-auth">
        <div className="mobile-device-frame">
          <div className="mobile-screen">
            <div className="character-selection-view">
              <div className="mobile-header">
                <h2>{getFormTitle()}</h2>
                <p>Enter the realm of legendary conversations</p>
              </div>

              {error && <div className="mobile-error">{error}</div>}
              
              <form className="mobile-auth-form" onSubmit={handleDesktopSubmit}>
                <div className="form-group">
                  <label htmlFor="mobile-displayName">Your Name in the Realm</label>
                  <input
                    id="mobile-displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Username"
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="mobile-email">Email</label>
                  <input
                    id="mobile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="mobile-password">Password</label>
                  <input
                    id="mobile-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    disabled={loading}
                  />
                </div>
                
                <button type="submit" className="mobile-submit-btn" disabled={loading}>
                  {loading ? 'Creating Realm...' : 'Begin Your Journey'}
                </button>
              </form>

              {/* FIXED: Added mobile navigation link */}
              <div className="mobile-switch-mode">
                <p>
                  Already awakened? <Link to="/login">Return to your realm</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
        
        <p>
          Already registered? <Link to="/login">Return to your realm</Link>
        </p>
      </form>
    </div>
  );
}