import { createContext, useContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import { useUser } from "./UserContext";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { setUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setAuthChecked(true);
      return;
    }

    try {
      const decoded = jwt_decode(savedToken);
      console.log("🔍 Token decoded on load:", decoded);
      if (!decoded.sub) throw new Error("Missing subject");

      setToken(savedToken);
      setUser({
        id: decoded.user_id,
        username: decoded.sub,
        displayName: decoded.display_name,
        avatarUrl: decoded.avatar_url,
      });
    } catch (err) {
      console.error("❌ Invalid token on load:", err);
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

  // 🆕 NEW: Enhanced error message formatter
  const formatErrorMessage = (error, attempt = 1) => {
    // Handle network errors
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return "Connection issue. Please check your internet and try again.";
    }
    
    // Handle timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return "Request timed out. Please try again.";
    }
    
    // Handle server errors (500, 502, 503, etc)
    if (error.message.includes('500') || 
        error.message.includes('502') || 
        error.message.includes('503') ||
        error.message.includes('Internal Server Error') ||
        error.message.includes('internal server error')) {
      return `Server is temporarily busy${attempt > 1 ? ` (attempt ${attempt})` : ''}. Please try again in a moment.`;
    }
    
    // Handle authentication errors
    if (error.message.includes('401') || 
        error.message.includes('Invalid credentials') ||
        error.message.includes('Unauthorized')) {
      return "Invalid email or password. Please check your credentials.";
    }
    
    // Handle other HTTP errors
    if (error.message.includes('400')) {
      return "Please check your email and password format.";
    }
    
    // Return the original error message for known errors
    if (error.message && !error.message.includes('Login failed')) {
      return error.message;
    }
    
    // Generic fallback
    return "Login failed. Please try again.";
  };

  // 🆕 NEW: Login with retry logic
  async function loginWithRetry(credentials, maxAttempts = 2) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔑 Login attempt ${attempt}/${maxAttempts}`);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            username: credentials.email, 
            password: credentials.password 
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Log raw response for debugging
        const raw = await res.clone().text();
        console.log(`🧠 Raw login response (attempt ${attempt}):`, raw);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.message || `HTTP ${res.status}`;
          throw new Error(errorMessage);
        }

        const { access_token } = await res.json();
        console.log("✅ Login successful on attempt", attempt);

        localStorage.setItem("token", access_token);
        setToken(access_token);

        const decoded = jwt_decode(access_token);
        console.log("🔓 Decoded login token:", decoded);

        setUser({
          id: decoded.user_id,
          username: decoded.sub,
          displayName: decoded.display_name,
          avatarUrl: decoded.avatar_url,
        });

        navigateToAppWithHistoryManagement();
        return; // Success - exit the retry loop

      } catch (err) {
        lastError = err;
        console.error(`❌ Login attempt ${attempt} failed:`, err.message);
        
        // If this is the last attempt, throw the formatted error
        if (attempt === maxAttempts) {
          throw new Error(formatErrorMessage(err, attempt));
        }
        
        // Wait before retrying (1 second)
        if (attempt < maxAttempts) {
          console.log(`⏳ Waiting 1 second before retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // This shouldn't be reached, but just in case
    throw new Error(formatErrorMessage(lastError || new Error("Unknown error"), maxAttempts));
  }

  // 🔄 UPDATED: Main login function now uses retry logic
  async function login(credentials) {
    return await loginWithRetry(credentials, 2); // Try up to 2 times
  }

  // 🔄 UPDATED: Register function with similar error handling
  async function register({ email, password, displayName }) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API}/register`, {
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
      console.log("📦 Raw register response:", raw);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${res.status}`;
        throw new Error(formatErrorMessage(new Error(errorMessage)));
      }

      const { access_token } = await res.json();
      console.log("✅ Registration successful");

      localStorage.setItem("token", access_token);
      setToken(access_token);

      const decoded = jwt_decode(access_token);
      console.log("🔓 Decoded register token:", decoded);

      setUser({
        id: decoded.user_id,
        username: decoded.sub,
        displayName: decoded.display_name,
        avatarUrl: decoded.avatar_url,
      });

      navigateToAppWithHistoryManagement();
    } catch (err) {
      console.error("❌ Registration failed:", err.message);
      throw new Error(formatErrorMessage(err));
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }

  return (
    <AuthContext.Provider
      value={{ token, authChecked, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}