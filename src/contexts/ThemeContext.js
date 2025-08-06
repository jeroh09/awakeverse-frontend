// src/contexts/ThemeContext.js
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {}
});

export function ThemeProvider({ children }) {
  // initialize from localStorage or default to false
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  // whenever darkMode changes, flip the class on <html> and persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(dm => !dm);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
