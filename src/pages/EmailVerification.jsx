// src/pages/EmailVerification.jsx - COMPREHENSIVE QUIZ FIX
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../style/AuthPageStyles.css';

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export default function EmailVerification() {
  const [verificationStatus, setVerificationStatus] = useState('processing');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [searchParams] = useSearchParams();
  const { resendVerification } = useAuth();
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

  // Helper function to check if cookies are set
  const checkCookiesSet = () => {
    const cookies = document.cookie;
    const hasAccessToken = cookies.includes('av_sid=');
    const hasRefreshToken = cookies.includes('av_rid=');
    const hasCsrfToken = cookies.includes('av_csrf=');
    
    return hasAccessToken && hasRefreshToken && hasCsrfToken;
  };

  // Helper function to wait for cookies with retry
  const waitForCookies = async (maxAttempts = 5, delayMs = 500) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (checkCookiesSet()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return false;
  };

  // ============================================================================
  // ENHANCED: Get quiz session from multiple sources
  // ============================================================================
  const getQuizSession = () => {
    // Priority 1: sessionStorage (survives page reloads during verification)
    const sessionQuiz = sessionStorage.getItem('pending_quiz_session');
    if (sessionQuiz) {
      return sessionQuiz;
    }

    // Priority 2: localStorage (from quiz completion)
    try {
      const quizData = localStorage.getItem('awakeverse_quiz_session');
      if (quizData) {
        const parsed = JSON.parse(quizData);
        return parsed.quiz_session_id;
      }
    } catch (e) {
      console.warn('Failed to parse quiz session from localStorage:', e);
    }

    return null;
  };

  // ============================================================================
  // ENHANCED VERIFICATION FLOW WITH QUIZ SUPPORT
  // ============================================================================
  const handleEmailVerification = async (verificationToken) => {
    setVerificationStatus('processing');

    try {
      // Call API directly
      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: verificationToken })
      });

      const result = await res.json();

      if (res.ok && result.status === 'success') {
        setVerificationStatus('success');

        // ✅ ENHANCED: Get quiz session from multiple sources
        let quizSessionId = null;

        // Priority 1: Backend response (most reliable for new users)
        if (result.quiz_session_id) {
          quizSessionId = result.quiz_session_id;
          // Store in sessionStorage for fallback
          sessionStorage.setItem('pending_quiz_session', quizSessionId);
        }

        // Priority 2: Fallback to localStorage/sessionStorage
        if (!quizSessionId) {
          quizSessionId = getQuizSession();
        }

        // Wait for cookies before navigating
        const cookiesSet = await waitForCookies();
        
        if (!cookiesSet) {
          console.warn('⚠️ Cookies not detected, but proceeding with navigation...');
        }

        // ✅ ENHANCED: Navigate with quiz session if available
        if (quizSessionId) {
          // Clear from sessionStorage once used
          sessionStorage.removeItem('pending_quiz_session');
          
          navigate(`/app?quiz_session=${quizSessionId}&view=create`, {
            replace: true // Replace history to prevent back button issues
          });
        } else {
          navigate('/app', { replace: true });
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

  const getTitle = () => {
    switch (verificationStatus) {
      case 'processing':
        return 'Verifying Email...';
      case 'success':
        return 'Email Verified!';
      case 'expired':
        return 'Link Expired';
      case 'resent':
        return 'Email Sent';
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
        return 'Your email has been verified! Redirecting you now...';
      case 'expired':
        return 'Your verification link has expired. Please request a new verification email.';
      case 'resent':
        return 'We\'ve sent a new verification email. Please check your inbox.';
      case 'error':
      default:
        return 'We couldn\'t verify your email address. This might be due to an invalid or expired link.';
    }
  };

  return (
    <div className="auth-page">
      {/* GLASSMORPHISM VERIFICATION CARD */}
      <div className="auth-form verification-pending">
        <h2>{getTitle()}</h2>
        
        <div className="verification-icon">
          {getIcon()}
        </div>
        
        <p>{getDescription()}</p>
        
        {error && (
          <div className="error-text">{error}</div>
        )}
        
        {verificationStatus === 'processing' && (
          <div className="verification-progress">
            <div className="spinner"></div>
            <p>Verifying your email address...</p>
          </div>
        )}
        
        {verificationStatus === 'success' && (
          <div className="verification-actions">
            <Link to="/app" className="primary-button">
              Enter AwakeVerse
            </Link>
            <Link to="/login" className="secondary-button">
              Go to Login
            </Link>
          </div>
        )}
        
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
                    padding: 'var(--space-md)',
                    marginBottom: 'var(--space-md)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-primary)'
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
        
        <div className="auth-legal-text">
          <p>Check spam folder • Links expire in 24 hours</p>
        </div>
      </div>
    </div>
  );
}