// src/index.js - MINIMAL SECURITY VERSION
import './styles.css';
import './utils/csrfInterceptor';  // ✅ Add this FIRST (before React imports)
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

// MINIMAL security - only block obvious token logs
if (process.env.NODE_ENV === 'production') {
  const originalLog = console.log;
  console.log = (...args) => {
    // Only block logs that clearly contain tokens
    const message = args[0]?.toString() || '';
    if (message.includes('Bearer') || message.includes('Authorization')) {
      return; // Block only these
    }
    originalLog(...args); // Allow all other logs
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));

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
            // Don't reload here; wait for controllerchange
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
