import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";  // Correct named import
import { UserContext } from "./UserContext";

const API = "http://localhost:5000";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setAuthChecked(true);
      return;
    }

    try {
      const decoded = jwtDecode(savedToken);  // Using the correct named import
      if (!decoded.sub) throw new Error("Invalid token: missing subject");
      
      setToken(savedToken);
      setUser({
        username: decoded.sub,
        displayName: decoded.display_name || "User",
      });
    } catch (err) {
      console.error("❌ Invalid token:", err);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  }, [setUser]);

  async function login({ email, password }) {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Login failed");
    }

    const { access_token } = await res.json();
    localStorage.setItem("token", access_token);
    setToken(access_token);

    const decoded = jwtDecode(access_token);
    setUser({
      username: decoded.sub,
      displayName: decoded.display_name || "User",
    });
  }

  async function register({ email, password, displayName }) {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: email, 
        password, 
        display_name: displayName 
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Registration failed");
    }

    const { access_token } = await res.json();
    localStorage.setItem("token", access_token);
    setToken(access_token);

    const decoded = jwtDecode(access_token);
    setUser({
      username: decoded.sub,
      displayName: decoded.display_name || displayName || "User",
    });
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ 
      token, 
      authChecked, 
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
