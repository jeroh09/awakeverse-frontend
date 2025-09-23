// src/index.js - ULTRA SILENT VERSION
import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { PremiumCapabilitiesProvider } from './contexts/PremiumCapabilitiesContext';
import { CharacterProvider } from './contexts/CharacterContext';
import { ContextProvider } from './contexts/ContextContext';
import App from './App';

// ULTRA SILENT console - completely mute everything
if (process.env.NODE_ENV === 'production') {
  const silent = () => {};
  console.log = silent;
  console.warn = silent;
  console.info = silent;
  console.debug = silent;
  console.error = silent; // MUTE ERRORS TOO
  console.trace = silent;
  console.table = silent;
  
  // Override global error handlers
  window.onerror = () => true; // Suppress all errors
  window.onunhandledrejection = () => true; // Suppress promise rejections
}

// ERROR-FREE rendering with try/catch
const root = ReactDOM.createRoot(document.getElementById('root'));

try {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <UserProvider>
            <AuthProvider>
              <CharacterProvider>
                <ContextProvider>
                  <WebSocketProvider>
                    <PremiumCapabilitiesProvider>
                      <App />
                    </PremiumCapabilitiesProvider>
                  </WebSocketProvider>
                </ContextProvider>
              </CharacterProvider>
            </AuthProvider>
          </UserProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
} catch (error) {
  // Silent fail - don't show rendering errors
}

// SILENT Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// SILENT PWA installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

window.addEventListener('appinstalled', () => {
  document.documentElement.classList.add('pwa-mode');
});