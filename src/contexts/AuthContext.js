// src/contexts/AuthContext.js - PRODUCTION READY WITH CSRF FIX
import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "./UserContext";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

// CSRF Helper function
const getCsrfToken = () => {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('av_csrf='))
    ?.split('=')[1];
};

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const { setUser, user } = useUser();
  const navigate = useNavigate();
  
  // Add computed property for isAuthenticated - now based on user state
  const isAuthenticated = !!user;

  // Load current user from cookie session
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          method: "GET",
          credentials: 'include', // Important for cookies
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser({
            id: data.id,
            username: data.username,
            displayName: data.display_name,
            tier: data.tier,
            emailVerified: true // If we get user data, email is verified
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, [setUser]);

  const navigateToAppWithHistoryManagement = () => {
    navigate('/app', { replace: true });
    window.history.pushState({ isAppRoot: true }, '', '/app');
  };

  // Enhanced error message formatter
  const formatErrorMessage = (error, attempt = 1) => {
    // Handle network errors
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return "Connection issue. Please check your internet and try again.";
    }
    
    // Handle timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return "Request timed out. Please try again.";
    }
    
    // Handle server errors
    if (error.message.includes('500') || 
        error.message.includes('502') || 
        error.message.includes('503') ||
        error.message.includes('Internal Server Error') ||
        error.message.includes('internal server error')) {
      return `Server is temporarily busy${attempt > 1 ? ` (attempt ${attempt})` : ''}. Please try again in a moment.`;
    }
    
    // Handle email verification errors
    if (error.message.includes('verify your email') || 
        error.message.includes('email address before') ||
        error.message.includes('requires_verification')) {
      return "Please verify your email address before logging in. Check your inbox for the verification email.";
    }
    
    // Handle authentication errors
    if (error.message.includes('401') || 
        error.message.includes('Invalid credentials') ||
        error.message.includes('Invalid email or password') ||
        error.message.includes('Unauthorized')) {
      return "Invalid email or password. Please check your credentials.";
    }
    
    // Handle account locked errors
    if (error.message.includes('423') || 
        error.message.includes('temporarily locked') ||
        error.message.includes('too many attempts')) {
      return "Account temporarily locked due to failed login attempts. Please try again later.";
    }
    
    // Handle validation errors
    if (error.message.includes('400')) {
      return error.message; // Usually contains specific validation message
    }
    
    // Return the original error message for known errors
    if (error.message && !error.message.includes('Login failed')) {
      return error.message;
    }
    
    // Generic fallback
    return "Login failed. Please try again.";
  };

  // Enhanced login with retry logic - FIXED WITH CSRF
  async function loginWithRetry(credentials, maxAttempts = 2) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Login attempt ${attempt}/${maxAttempts}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        // ✅ FIXED: Add CSRF token to login
        const csrfToken = getCsrfToken();
        
        const loginRes = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken || "" // ✅ ADDED CSRF
          },
          body: JSON.stringify({ 
            email: credentials.email, 
            password: credentials.password 
          }),
          credentials: 'include', // Important for cookies
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!loginRes.ok) {
          const errorData = await loginRes.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.message || `HTTP ${loginRes.status}`;
          throw new Error(errorMessage);
        }

        // Get user data after successful login
        const userRes = await fetch(`${API}/api/auth/me`, {
          method: "GET",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!userRes.ok) {
          throw new Error("Failed to get user data after login");
        }

        const userData = await userRes.json();
        console.log("Login successful on attempt", attempt);

        setUser({
          id: userData.id,
          username: userData.username,
          displayName: userData.display_name,
          tier: userData.tier,
          emailVerified: true // If we get user data, email is verified
        });

        navigateToAppWithHistoryManagement();
        return;

      } catch (err) {
        lastError = err;
        console.error(`Login attempt ${attempt} failed:`, err.message);
        
        if (attempt === maxAttempts) {
          throw new Error(formatErrorMessage(err, attempt));
        }
        
        if (attempt < maxAttempts) {
          console.log(`Waiting 1 second before retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw new Error(formatErrorMessage(lastError || new Error("Unknown error"), maxAttempts));
  }

  // Main login function
  async function login(credentials) {
    return await loginWithRetry(credentials, 2);
  }

  // Enhanced register function - FIXED WITH CSRF
  async function register({ email, password, displayName }) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // ✅ FIXED: Add CSRF token to register
      const csrfToken = getCsrfToken();

      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "" // ✅ ADDED CSRF
        },
        body: JSON.stringify({ 
          username: email, 
          password, 
          display_name: displayName 
        }),
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const raw = await res.clone().text();

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${res.status}`;
        throw new Error(formatErrorMessage(new Error(errorMessage)));
      }

      const data = await res.json();

      // Check if email verification is required
      if (data.requires_verification) {
        return {
          success: true,
          requiresVerification: true,
          message: data.message || 'Please check your email for verification instructions.'
        };
      }

      // If no verification required, get user data
      if (data.success) {
        const userRes = await fetch(`${API}/api/auth/me`, {
          method: "GET",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser({
            id: userData.id,
            username: userData.username,
            displayName: userData.display_name,
            tier: userData.tier,
            emailVerified: true
          });

          navigateToAppWithHistoryManagement();
        }
      }

      return { success: true };

    } catch (err) {
      console.error("Registration failed:", err.message);
      throw new Error(formatErrorMessage(err));
    }
  }

  // Email verification function - FIXED WITH CSRF
  async function verifyEmail(token) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abbit(), 10000);

      // ✅ FIXED: Add CSRF token to verify-email
      const csrfToken = getCsrfToken();

      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "" // ✅ ADDED CSRF
        },
        body: JSON.stringify({ token }),
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Email verification failed');
      }

      const data = await res.json();
      
      // Get updated user data after verification
      const userRes = await fetch(`${API}/api/auth/me`, {
        method: "GET",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser({
          id: userData.id,
          username: userData.username,
          displayName: userData.display_name,
          tier: userData.tier,
          emailVerified: true
        });

        navigateToAppWithHistoryManagement();
      }

      return data;

    } catch (err) {
      console.error("Email verification failed:", err.message);
      throw new Error(formatErrorMessage(err));
    }
  }

  // Password reset request function - FIXED WITH CSRF
  async function requestPasswordReset(email) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // ✅ FIXED: Add CSRF token to forgot-password
      const csrfToken = getCsrfToken();

      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "" // ✅ ADDED CSRF
        },
        body: JSON.stringify({ email }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send reset email');
      }

      return await res.json();

    } catch (err) {
      console.error("Password reset request failed:", err.message);
      throw new Error(formatErrorMessage(err));
    }
  }

  // Password reset confirmation function - FIXED WITH CSRF
  async function resetPassword(token, newPassword) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // ✅ FIXED: Add CSRF token to reset-password
      const csrfToken = getCsrfToken();

      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "" // ✅ ADDED CSRF
        },
        body: JSON.stringify({ token, password: newPassword }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reset password');
      }

      return await res.json();

    } catch (err) {
      console.error("Password reset failed:", err.message);
      throw new Error(formatErrorMessage(err));
    }
  }

  // Resend verification email - FIXED WITH CSRF
  async function resendVerification(email) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // ✅ FIXED: Add CSRF token to resend-verification
      const csrfToken = getCsrfToken();

      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "" // ✅ ADDED CSRF
        },
        body: JSON.stringify({ email }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to resend verification');
      }

      return await res.json();

    } catch (err) {
      console.error("Resend verification failed:", err.message);
      throw new Error(formatErrorMessage(err));
    }
  }

  // Updated logout function - FIXED WITH CSRF
  async function logout() {
    try {
      // ✅ FIXED: Add CSRF token to logout
      const csrfToken = getCsrfToken();
      
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": 'application/json',
          "X-CSRF-Token": csrfToken || "" // ✅ ADDED CSRF
        },
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  }

  return (
    <AuthContext.Provider
      value={{ 
        authChecked, 
        login, 
        register, 
        logout,
        verifyEmail,
        requestPasswordReset,
        isAuthenticated,
        resetPassword,
        resendVerification,
        user // Export user for convenience
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}