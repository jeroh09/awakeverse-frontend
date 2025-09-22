// src/pages/ResetPassword.jsx - Mobile-friendly version
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ElegantCharacterPortraits from '../components/ElegantCharacterPortraits';
import '../components/ElegantCharacterPortraits.css';
import '../style/AuthPageStyles.css';

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token, 
          password 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Password reset successful! Please sign in with your new password.' }
          });
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
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

  const getPasswordStrength = () => {
    if (!password) return null;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;

    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ff4444', '#ff8800', '#ffbb00', '#88bb00', '#44bb00'];
    
    return {
      level: levels[strength - 1] || 'Very Weak',
      color: colors[strength - 1] || '#ff4444',
      score: strength
    };
  };

  // Success view - mobile and desktop
  if (success) {
    return (
      <div className="auth-page">
        {/* MOBILE SUCCESS */}
        <div className="mobile-reset-success">
          <div className="mobile-success-content">
            <h2>Password Reset Complete!</h2>
            <div className="success-icon">✅</div>
            <p>Your password has been successfully reset.</p>
            <p>You can now sign in with your new password.</p>
            
            <div className="mobile-verification-actions">
              <Link to="/login" className="mobile-primary-btn">
                Go to Login
              </Link>
            </div>
            
            <div className="mobile-help-compact">
              <small>Redirecting to login in 3 seconds...</small>
            </div>
          </div>
        </div>

        {/* DESKTOP SUCCESS */}
        <div className="auth-demo-container desktop-only">
          <ElegantCharacterPortraits 
            autoAdvanceInterval={15000}
            onCharacterChange={handleCharacterChange}
          />
        </div>

        <div className="auth-form verification-pending desktop-only">
          <h2>Password Reset Complete!</h2>
          <div className="verification-icon">✅</div>
          <p>Your password has been successfully reset.</p>
          <p>You can now sign in with your new password.</p>
          
          <div className="verification-actions">
            <Link to="/login" className="primary-button">
              Go to Login
            </Link>
          </div>
          
          <div className="redirect-notice">
            <small>Redirecting to login in 3 seconds...</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* MOBILE FORM */}
      <div className="mobile-reset-form">
        <div className="mobile-form-content">
          <h2>Create New Password</h2>
          <p>Enter your new password below.</p>
          
          {!token ? (
            <div className="mobile-error">
              Invalid reset link. <Link to="/forgot-password">Request a new reset</Link>.
            </div>
          ) : (
            <>
              {error && <div className="mobile-error">{error}</div>}
              
              <form onSubmit={handleSubmit} className="mobile-simple-form">
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    required
                  />
                  
                  {/* Mobile password strength */}
                  {password && (
                    <div className="mobile-password-strength">
                      {(() => {
                        const strength = getPasswordStrength();
                        return (
                          <div>
                            <div className="mobile-strength-bar">
                              <div 
                                className="mobile-strength-fill"
                                style={{ 
                                  width: `${(strength.score / 5) * 100}%`,
                                  backgroundColor: strength.color
                                }}
                              ></div>
                            </div>
                            <small style={{ color: strength.color }}>
                              {strength.level}
                            </small>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={loading}
                    required
                  />
                  
                  {/* Mobile password match */}
                  {confirmPassword && (
                    <div className="mobile-password-match">
                      {password === confirmPassword ? (
                        <small style={{ color: '#44bb00' }}>✓ Passwords match</small>
                      ) : (
                        <small style={{ color: '#ff4444' }}>✗ Passwords do not match</small>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mobile-password-req">
                  <small>Must contain: uppercase, lowercase, number, 8+ characters</small>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                  className="mobile-submit-btn"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
          
          <div className="mobile-auth-links">
            <Link to="/login">← Back to Login</Link>
            <Link to="/forgot-password">Request New Reset</Link>
          </div>
        </div>
      </div>

      {/* DESKTOP FORM */}
      <div className="auth-demo-container desktop-only">
        <ElegantCharacterPortraits 
          autoAdvanceInterval={12000}
          onCharacterChange={handleCharacterChange}
        />
      </div>

      <form className="auth-form desktop-only compact-form" onSubmit={handleSubmit}>
        <h2>Create New Password</h2>
        
        {!token ? (
          <div className="error-text">
            Invalid reset link. Please <Link to="/forgot-password">request a new password reset</Link>.
          </div>
        ) : (
          <>
            <p className="form-description">Enter your new password below. Make sure it's strong and secure.</p>
            
            {error && <div className="error-text">{error}</div>}
            
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={loading}
              required
              autoFocus
            />
            
            {password && (
              <div className="password-strength">
                {(() => {
                  const strength = getPasswordStrength();
                  return (
                    <div>
                      <div className="strength-bar">
                        <div 
                          className="strength-fill"
                          style={{ 
                            width: `${(strength.score / 5) * 100}%`,
                            backgroundColor: strength.color
                          }}
                        ></div>
                      </div>
                      <small style={{ color: strength.color }}>
                        Strength: {strength.level}
                      </small>
                    </div>
                  );
                })()}
              </div>
            )}
            
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={loading}
              required
            />
            
            {confirmPassword && (
              <div className="password-match">
                {password === confirmPassword ? (
                  <small style={{ color: '#44bb00' }}>✓ Passwords match</small>
                ) : (
                  <small style={{ color: '#ff4444' }}>✗ Passwords do not match</small>
                )}
              </div>
            )}
            
            <div className="password-requirements">
              <small>
                Password must contain: uppercase letter, lowercase letter, number, and be 8+ characters
              </small>
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </>
        )}
        
        <div className="auth-links">
          <Link to="/login">← Back to Login</Link>
          <Link to="/forgot-password">Request New Reset</Link>
        </div>
      </form>
    </div>
  );
}