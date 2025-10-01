// src/contexts/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("⚠️ No token found, user is null");
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (typeof decoded.sub === 'string') {

        fetch('https://api.awakeverse.com/api/current_user', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          credentials: 'include'
        })
          .then(res => {
            console.log("🌐 Response status:", res.status);
            return res.json();
          })
          .then(data => {
            if (!data.error) {
              setUser(data);
            } else {
              console.error('❌ current_user API error:', data.error);
              setUser(null);
            }
          })
          .catch(err => {
            console.error('❌ fetch failed:', err);
            setUser(null);
          })
          .finally(() => {
            setLoading(false);
          });

      } else {
        console.warn('❗ Invalid sub format in token');
        setUser(null);
        setLoading(false);
      }

    } catch (err) {
      console.error('❌ jwtDecode error:', err);
      setUser(null);
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
