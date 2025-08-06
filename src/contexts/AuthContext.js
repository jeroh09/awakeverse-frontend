import { createContext, useContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import { useUser } from "./UserContext";

const API = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { setUser } = useUser();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setAuthChecked(true);
      return;
    }

    try {
      const decoded = jwt_decode(savedToken);
      console.log("🔐 Token decoded on load:", decoded);
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

  async function login({ email, password }) {
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const raw = await res.clone().text();
      console.log("🧠 Raw login response:", raw);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Login failed");
      }

      const { access_token } = await res.json();
      console.log("✅ Login token:", access_token);

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
    } catch (err) {
      console.error("❌ Login failed:", err.message);
      throw err;
    }
  }

  async function register({ email, password, displayName }) {
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: email, 
          password, 
          display_name: displayName 
        }),
      });

      const raw = await res.clone().text();
      console.log("📦 Raw register response:", raw);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Registration failed");
      }

      const { access_token } = await res.json();
      console.log("✅ Registration token:", access_token);

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
    } catch (err) {
      console.error("❌ Registration failed:", err.message);
      throw err;
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ token, authChecked, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
