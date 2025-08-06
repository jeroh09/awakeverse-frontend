// src/pages/Login.jsx - Final version with Elegant Character Portraits
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ElegantCharacterPortraits from '../components/ElegantCharacterPortraits';
import UnifiedMobileAuth from '../components/UnifiedMobileAuth';
import '../components/ElegantCharacterPortraits.css';
import '../style/AuthPageStyles.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentCharacter, setCurrentCharacter] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after showing it
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      await login({ 
        email: formData.email || email, 
        password: formData.password || password 
      });
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDesktopSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    await handleSubmit({ email, password });
  };

  // Handle character changes from the portrait component
  const handleCharacterChange = (character) => {
    setCurrentCharacter(character);
  };

  // Dynamic form title based on current character
  const getFormTitle = () => {
    if (currentCharacter) {
      return `Welcome, ${currentCharacter.name} awaits`;
    }
    return 'Welcome Back';
  };

  return (
    <div className="auth-page">
      {/* MOBILE: Enhanced mobile auth component */}
      <UnifiedMobileAuth 
        mode="login"
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
        
        {successMessage && (
          <div className="success-text">{successMessage}</div>
        )}
        {error && <div className="error-text">{error}</div>}
        
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
          placeholder="Enter your password"
          disabled={loading}
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Awakening...' : 'Enter the Realm'}
        </button>
        
        <p>
          New to Awakeverse? <Link to="/register">Begin your journey</Link>
        </p>
      </form>
    </div>
  );
}