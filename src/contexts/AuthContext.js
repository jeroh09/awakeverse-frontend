// src/contexts/AuthContext.js - Enhanced with email verification support
import { createContext, useContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import { useUser } from "./UserContext";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { setUser } = useUser();
  const navigate = useNavigate();
    // Add computed property for isAuthenticated
  const isAuthenticated = !!token;

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setAuthChecked(true);
      return;
    }

    try {
      const decoded = jwt_decode(savedToken);
      if (!decoded.sub) throw new Error("Missing subject");

      setToken(savedToken);
      setUser({
        id: decoded.user_id,
        username: decoded.sub,
        displayName: decoded.display_name,
        avatarUrl: decoded.avatar_url,
        emailVerified: decoded.email_verified
      });
    } catch (err) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
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

  // Enhanced login with retry logic
  async function loginWithRetry(credentials, maxAttempts = 2) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Login attempt ${attempt}/${maxAttempts}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        // Use new auth endpoint
        const res = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            username: credentials.email, 
            password: credentials.password 
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const raw = await res.clone().text();

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.message || `HTTP ${res.status}`;
          throw new Error(errorMessage);
        }

        const data = await res.json();
        const { access_token } = data;
        console.log("Login successful on attempt", attempt);

        localStorage.setItem("token", access_token);
        setToken(access_token);

        const decoded = jwt_decode(access_token);

        setUser({
          id: decoded.user_id,
          username: decoded.sub,
          displayName: decoded.display_name,
          avatarUrl: decoded.avatar_url,
          emailVerified: decoded.email_verified
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

  // Enhanced register function
  async function register({ email, password, displayName }) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Use new auth endpoint
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: email, 
          password, 
          display_name: displayName 
        }),
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
        // Don't auto-login, return success but require verification
        return {
          success: true,
          requiresVerification: true,
          message: data.message || 'Please check your email for verification instructions.'
        };
      }

      // Legacy behavior: auto-login if token provided
      if (data.access_token) {
        const { access_token } = data;
        console.log("Registration successful with auto-login");

        localStorage.setItem("token", access_token);
        setToken(access_token);

        const decoded = jwt_decode(access_token);

        setUser({
          id: decoded.user_id,
          username: decoded.sub,
          displayName: decoded.display_name,
          avatarUrl: decoded.avatar_url,
          emailVerified: decoded.email_verified
        });

        navigateToAppWithHistoryManagement();
      }

      return { success: true };

    } catch (err) {
      console.error("Registration failed:", err.message);
      throw new Error(formatErrorMessage(err));
    }
  }

  // Email verification function
  async function verifyEmail(token) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Email verification failed');
      }

      const data = await res.json();
      
      // If verification includes auto-login
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        setToken(data.access_token);

        const decoded = jwt_decode(data.access_token);
        setUser({
          id: decoded.user_id,
          username: decoded.sub,
          displayName: decoded.display_name,
          avatarUrl: decoded.avatar_url,
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

  // Password reset request function
  async function requestPasswordReset(email) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // Password reset confirmation function
  async function resetPassword(token, newPassword) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // Resend verification email
  async function resendVerification(email) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // Add this function inside AuthProvider (before the return statement)
  function getAuthHeaders() {
    if (!token) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }

  return (
    <AuthContext.Provider
      value={{ 
        token, 
        authChecked, 
        login, 
        register, 
        logout,
        verifyEmail,
        requestPasswordReset,
        isAuthenticated,      // ← ADD THIS
        getAuthHeaders,  
        resetPassword,
        resendVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}