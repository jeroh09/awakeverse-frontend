// src/index.js - Smart security for different environments
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

// SMART SECURITY: Different levels for different environments
const getEnvironmentConfig = () => {
  // Vercel-specific environment variables
  const isPreview = process.env.REACT_APP_VERCEL_ENV === 'preview' || 
                    process.env.VERCEL_ENV === 'preview';
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production' && !isPreview;

  return {
    isPreview,
    isDevelopment, 
    isProduction,
    allowTokenLogging: isPreview || isDevelopment, // Allow tokens in preview/dev
    allowDetailedErrors: isPreview || isDevelopment,
    allowDebugLogs: isPreview || isDevelopment
  };
};

const envConfig = getEnvironmentConfig();

// SMART CONSOLE MANAGEMENT
if (envConfig.isProduction) {
  // PRODUCTION: Maximum security - complete silence
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  console.error = noop;
} else if (envConfig.isPreview) {
  // PREVIEW: Developer-friendly with token visibility
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args) => {
    const message = args.join(' ').toLowerCase();
    
    // Allow tokens in preview builds for debugging
    if (message.includes('token') || message.includes('bearer') || message.includes('auth')) {
      originalLog('🔐 [PREVIEW] Auth Token Debug:', ...args);
      return;
    }
    
    // Allow other debug info
    originalLog('[PREVIEW]', ...args);
  };
  
  console.error = (...args) => {
    // Always show errors in preview
    originalError('[PREVIEW ERROR]', ...args);
  };
  
  console.info = (...args) => {
    originalLog('[PREVIEW INFO]', ...args);
  };
  
  console.log('🚀 Preview Build - Debug mode enabled');
  console.log('🔐 Token debugging available for authentication testing');
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

// Service Worker - Preview-friendly
if ('serviceWorker' in navigator) {
  if (envConfig.isProduction) {
    // Production: silent registration
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  } else {
    // Preview/Dev: verbose registration
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('🔧 [PREVIEW] SW registered:', reg.scope))
      .catch(err => console.log('🔧 [PREVIEW] SW registration failed:', err));
  }
}