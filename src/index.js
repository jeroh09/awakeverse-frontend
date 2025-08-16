// src/index.js
import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { CharacterProvider } from './contexts/CharacterContext';
import { ContextProvider } from './contexts/ContextContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import App from './App';

// ⚡ SECURITY: Disable console logging in production
// This prevents sensitive data (JWT tokens, API responses) from appearing in browser dev tools
if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_DISABLE_CONSOLE === 'true') {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    error: console.error
  };
  
  // Disable most console methods but keep error for critical issues
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  
  // Only show critical errors in production
  console.error = (...args) => {
    // Filter out non-critical errors, only show genuine application errors
    const message = args.join(' ');
    if (message.includes('token') || message.includes('login') || message.includes('API')) {
      return; // Suppress security-sensitive error logs
    }
    originalConsole.error(...args);
  };
  
  // For development, you can re-enable console by setting REACT_APP_ENABLE_DEBUG=true
  if (process.env.REACT_APP_ENABLE_DEBUG === 'true') {
    Object.assign(console, originalConsole);
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Rest of your existing code...
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <AuthProvider>
            <CharacterProvider>
              <ContextProvider>
                <WebSocketProvider>
                  <App />
                </WebSocketProvider>
              </ContextProvider>
            </CharacterProvider>
          </AuthProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        // Note: Service worker logs are suppressed in production
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Service Worker registered successfully:', registration.scope);
        }
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, show update notification
                if (process.env.NODE_ENV !== 'production') {
                  console.log('🔄 New content is available; please refresh.');
                }
                
                // Optionally show a notification to the user
                if (window.confirm('New version available! Refresh to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(registrationError => {
        // Only show in development
        if (process.env.NODE_ENV !== 'production') {
          console.log('❌ Service Worker registration failed:', registrationError);
        }
      });
    
    // Listen for service worker controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Service worker has been updated and is now controlling the page
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Service Worker controller changed - page will reload');
      }
      window.location.reload();
    });
  });
}

// Handle app installation prompt
let deferredPrompt;
let isInstallPromptShown = false;

window.addEventListener('beforeinstallprompt', (e) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('💾 PWA install prompt available');
  }
  
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  
  // Save the event so it can be triggered later
  deferredPrompt = e;
  
  // Show custom install prompt after a delay (optional)
  setTimeout(() => {
    if (!isInstallPromptShown && deferredPrompt) {
      showInstallPrompt();
    }
  }, 10000); // Show after 10 seconds
});

// Function to show custom install prompt
function showInstallPrompt() {
  if (!deferredPrompt || isInstallPromptShown) return;
  
  isInstallPromptShown = true;
  
  // Create custom install notification
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
      <div style="font-weight: 600; margin-bottom: 8px;">📱 Install AwakeVerse</div>
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
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ User accepted the install prompt');
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log('❌ User dismissed the install prompt');
        }
      }
      
      deferredPrompt = null;
    }
  });
  
  // Handle "Later" button click
  document.getElementById('install-no').addEventListener('click', () => {
    document.body.removeChild(installBanner);
    deferredPrompt = null;
  });
}

// Handle successful app installation
window.addEventListener('appinstalled', (evt) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ AwakeVerse was installed successfully');
  }
  
  // Optional: Track installation analytics
  // analytics.track('pwa_installed');
});

// Detect if running as installed PWA
if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚀 Running as installed PWA');
  }
  
  // Add PWA-specific styling or behavior
  document.documentElement.classList.add('pwa-mode');
  
  // Hide browser UI elements that don't make sense in PWA mode
  const style = document.createElement('style');
  style.textContent = `
    .pwa-mode .browser-only {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}