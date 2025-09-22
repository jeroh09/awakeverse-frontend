// src/index.js - Production version with enhanced security hardening
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

// SECURITY: Enhanced console logging protection for production
if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview') {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    error: console.error
  };
  
  // Disable all development console methods
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  
  // Enhanced error filtering for production
  console.error = (...args) => {
    const message = args.join(' ').toLowerCase();
    
    // Block security-sensitive errors
    if (message.includes('token') || 
        message.includes('login') || 
        message.includes('api') ||
        message.includes('password') ||
        message.includes('authorization') ||
        message.includes('bearer') ||
        message.includes('jwt') ||
        message.includes('credential')) {
      return; // Suppress completely
    }
    
    // Only allow critical application errors through
    if (message.includes('chunk') || 
        message.includes('script') || 
        message.includes('network')) {
      originalConsole.error('Application error occurred');
      return;
    }
    
    // All other errors are suppressed in production
  };
  
  // Basic devtools detection
  let devtools = { open: false };
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      devtools.open = true;
      return 'devtools-detector';
    }
  });
  
  setInterval(() => {
    devtools.open = false;
    console.dir(element);
    if (devtools.open) {
      console.clear();
    }
  }, 1000);
}

// SECURITY: Production-safe error boundary
window.addEventListener('error', (event) => {
  if (process.env.NODE_ENV === 'production') {
    event.preventDefault();
    // Log generic error instead of exposing details
    console.log('Application error');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (process.env.NODE_ENV === 'production') {
    event.preventDefault();
    // Log generic error instead of exposing details
    console.log('Request failed');
  }
});

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

// SECURITY: Production-safe service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Service Worker registered successfully:', registration.scope);
        }
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Show update notification (no console logging in production)
                if (window.confirm('New version available! Refresh to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(() => {
        // Silent fail in production - service worker is optional
        if (process.env.NODE_ENV !== 'production') {
          console.log('Service Worker registration failed');
        }
      });
    
    // Listen for service worker controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}

// SECURITY: Production-safe PWA installation
let deferredPrompt;
let isInstallPromptShown = false;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install prompt after delay
  setTimeout(() => {
    if (!isInstallPromptShown && deferredPrompt) {
      showInstallPrompt();
    }
  }, 10000);
});

function showInstallPrompt() {
  if (!deferredPrompt || isInstallPromptShown) return;
  
  isInstallPromptShown = true;
  
  const installBanner = document.createElement('div');
  installBanner.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 2px solid #FFD700;
      border-radius: 12px;
      padding: 16px;
      max-width: 300px;
      z-index: 10000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      font-family: 'Inter', sans-serif;
      color: #FFD700;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">Install AwakeVerse</div>
      <div style="font-size: 14px; margin-bottom: 12px; opacity: 0.9;">
        Add to home screen for quick access to your AI conversations!
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="install-yes" style="
          background: #FFD700;
          color: #1a1a2e;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          flex: 1;
        ">Install</button>
        <button id="install-no" style="
          background: transparent;
          color: #FFD700;
          border: 1px solid #FFD700;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          flex: 1;
        ">Later</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(installBanner);
  
  // Handle install button click
  document.getElementById('install-yes').addEventListener('click', async () => {
    document.body.removeChild(installBanner);
    
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        // No logging in production
        deferredPrompt = null;
      } catch (error) {
        // Silent error handling in production
      }
    }
  });
  
  // Handle "Later" button click
  document.getElementById('install-no').addEventListener('click', () => {
    document.body.removeChild(installBanner);
    deferredPrompt = null;
  });
}

// Handle successful app installation
window.addEventListener('appinstalled', () => {
  // Add PWA-specific styling without logging
  document.documentElement.classList.add('pwa-mode');
  
  const style = document.createElement('style');
  style.textContent = `
    .pwa-mode .browser-only {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
});

// Detect if running as installed PWA
if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
  document.documentElement.classList.add('pwa-mode');
  
  const style = document.createElement('style');
  style.textContent = `
    .pwa-mode .browser-only {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}