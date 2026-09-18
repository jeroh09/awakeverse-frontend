// src/index.js - with HelmetProvider added
import './styles.css';
import './utils/csrfInterceptor';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';  // ← ADD
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { PremiumCapabilitiesProvider } from './contexts/PremiumCapabilitiesContext';
import { CharacterProvider } from './contexts/CharacterContext';
import { ContextProvider } from './contexts/ContextContext';
import App from './App';

if (process.env.NODE_ENV === 'production') {
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Bearer') || message.includes('Authorization')) {
      return;
    }
    originalLog(...args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <HelmetProvider>                      {/* ← WRAP HERE */}
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
    </HelmetProvider>                     {/* ← CLOSE HERE */}
  </React.StrictMode>
);

// Service worker registration (safe updates, single reload)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', async () => {
    let hasReloaded = false;

    const safeReload = () => {
      if (hasReloaded) return;
      hasReloaded = true;
      window.location.reload();
    };

    try {
      const reg = await navigator.serviceWorker.register('/sw.js');

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        safeReload();
      });

      console.log('Service Worker registered');
    } catch (err) {
      console.log('Service Worker registration failed', err);
    }
  });
}