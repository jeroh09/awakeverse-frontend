// src/hooks/useOAuthErrorHandler.js
// CREATE THIS FILE - it doesn't exist yet

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// Error messages mapping - backend error codes to user-friendly messages
const OAUTH_ERROR_MESSAGES = {
  oauth_denied: {
    title: "Sign-in Cancelled",
    message: "You cancelled the sign-in process. No worries!",
    severity: "info"
  },
  oauth_invalid: {
    title: "Link Expired",
    message: "The sign-in link expired. Please try again.",
    severity: "warning"
  },
  invalid_state: {
    title: "Security Check Failed",
    message: "For your security, please try signing in again.",
    severity: "warning"
  },
  try_again: {
    title: "Almost There!",
    message: "Just one more click should do it. Please try signing in with Google again.",
    severity: "info"
  },
  connection_issue: {
    title: "Connection Problem",
    message: "We had trouble connecting. Please check your internet and try again.",
    severity: "warning"
  },
  unexpected_issue: {
    title: "Oops!",
    message: "Something unexpected happened. Please try again.",
    severity: "error"
  },
  database_error: {
    title: "Almost There!",
    message: "Your account may have been created. Please try signing in with Google again.",
    severity: "info"
  },
  oauth_failed: {
    title: "Please Try Again",
    message: "Please try signing in with Google one more time.",
    severity: "info"
  }
};

export function useOAuthErrorHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthError, setOauthError] = useState(null);

  useEffect(() => {
    // Check URL for ?error=something
    const errorCode = searchParams.get('error');
    
    if (errorCode) {
      // Map error code to friendly message
      const errorInfo = OAUTH_ERROR_MESSAGES[errorCode] || {
        title: "Try Again",
        message: "Please try signing in again.",
        severity: "info"
      };
      
      // Set error state
      setOauthError({
        code: errorCode,
        ...errorInfo
      });

      // Clean URL (remove ?error parameter)
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });

      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setOauthError(null);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  const clearOAuthError = () => {
    setOauthError(null);
  };

  return { 
    oauthError,      // The current error (null if none)
    clearOAuthError  // Function to manually dismiss
  };
}