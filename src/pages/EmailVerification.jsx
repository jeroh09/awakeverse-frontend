// src/pages/EmailVerification.jsx - Dedicated email verification page
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ElegantCharacterPortraits from '../components/ElegantCharacterPortraits';
import '../components/ElegantCharacterPortraits.css';
import '../style/AuthPageStyles.css';

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export default function EmailVerification() {
  const [verificationStatus, setVerificationStatus] = useState('processing'); // 'processing', 'success', 'error', 'expired'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [email, setEmail] = useState('');
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleEmailVerification(token);
    } else {
      setVerificationStatus('error');
      setError('Invalid verification link. No token provided.');
    }
  }, [token]);

  const handleEmailVerification = async (verificationToken) => {
    setVerificationStatus('processing');
    
    try {
      const result = await verifyEmail(verificationToken);
      
      if (result.success) {
        setVerificationStatus('success');
        
        // If verification included auto-login, redirect after showing success
        if (result.access_token) {
          setTimeout(() => {
            navigate('/app');
          }, 2000);
        }
      } else {
        setVerificationStatus('error');
        setError(result.error || 'Email verification failed');
      }
    } catch (err) {
      if (err.message.includes('expired')) {
        setVerificationStatus('expired');
        setError('Verification link has expired. Please request a new one.');
      } else {
        setVerificationStatus('error');
        setError(err.message || 'Email verification failed');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resendVerification(email);
      setVerificationStatus('resent');
    } catch (err) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterChange = (character) => {
    setCurrentCharacter(character);
  };

  const getTitle = () => {
    switch (verificationStatus) {
      case 'processing':
        return 'Verifying Your Email...';
      case 'success':
        return 'Email Verified Successfully!';
      case 'expired':
        return 'Verification Link Expired';
      case 'resent':
        return 'New Verification Email Sent';
      case 'error':
      default:
        return 'Verification Failed';
    }
  };

  const getIcon = () => {
    switch (verificationStatus) {
      case 'processing':
        return '⏳';
      case 'success':
        return '✅';
      case 'expired':
        return '⏰';
      case 'resent':
        return '📧';
      case 'error':
      default:
        return '❌';
    }
  };

  const getDescription = () => {
    switch (verificationStatus) {
      case 'processing':
        return 'Please wait while we verify your email address...';
      case 'success':
        return 'Your email has been verified! You can now access all features of Awakeverse.';
      case 'expired':
        return 'Your verification link has expired for security reasons. Please request a new verification email.';
      case 'resent':
        return 'We\'ve sent a new verification email. Please check your inbox and click the verification link.';
      case 'error':
      default:
        return 'We couldn\'t verify your email address. This might be due to an invalid or expired link.';
    }
  };

  return (
    <div className="auth-page">
      {/* Character portraits for visual appeal */}
      <div className="auth-demo-container">
        <ElegantCharacterPortraits 
          autoAdvanceInterval={15000}
          onCharacterChange={handleCharacterChange}
        />
      </div>

      {/* Verification status display */}
      <div className="auth-form verification-pending">
        <h2>{getTitle()}</h2>
        
        <div className="verification-icon">
          {getIcon()}
        </div>
        
        <p>{getDescription()}</p>
        
        {error && (
          <div className="error-text">{error}</div>
        )}
        
        {/* Processing state */}
        {verificationStatus === 'processing' && (
          <div className="verification-progress">
            <div className="spinner"></div>
            <p>Verifying your email address...</p>
          </div>
        )}
        
        {/* Success state */}
        {verificationStatus === 'success' && (
          <div className="verification-actions">
            <Link to="/app" className="primary-button">
              Enter Awakeverse
            </Link>
            <Link to="/login" className="secondary-button">
              Go to Login
            </Link>
          </div>
        )}
        
        {/* Expired or error state - allow resend */}
        {(verificationStatus === 'expired' || verificationStatus === 'error') && (
          <div className="verification-recovery">
            <div className="resend-section">
              <label htmlFor="email">Enter your email to get a new verification link:</label>
              <div className="resend-form">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff'
                  }}
                />
                <button
                  onClick={handleResendVerification}
                  disabled={loading || !email}
                  className="primary-button"
                  style={{ width: '100%' }}
                >
                  {loading ? 'Sending...' : 'Send New Verification Email'}
                </button>
              </div>
            </div>
            
            <div className="verification-actions">
              <Link to="/register" className="secondary-button">
                Create New Account
              </Link>
              <Link to="/login" className="secondary-button">
                Back to Login
              </Link>
            </div>
          </div>
        )}
        
        {/* Resent state */}
        {verificationStatus === 'resent' && (
          <div className="verification-actions">
            <Link to="/login" className="primary-button">
              Go to Login
            </Link>
            <button
              onClick={() => setVerificationStatus('expired')}
              className="secondary-button"
            >
              Try Different Email
            </button>
          </div>
        )}
        
        {/* Help section */}
        <div className="verification-help">
          <p>Having trouble?</p>
          <ul>
            <li>Check your spam/junk folder</li>
            <li>Make sure you clicked the complete link from the email</li>
            <li>Verification links expire after 24 hours</li>
            <li>Contact support if you continue having issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}