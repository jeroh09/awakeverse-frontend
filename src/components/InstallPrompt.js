// src/components/InstallPrompt.js
import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <button 
          className="install-prompt-close"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
        >
          <X size={20} />
        </button>
        
        <div className="install-prompt-content">
          <div className="install-prompt-icon">
            <Download size={32} />
          </div>
          
          <h3 className="install-prompt-title">
            Install AwakeVerse
          </h3>
          
          <p className="install-prompt-description">
            Add AwakeVerse to your home screen for quick access to AI conversations with historical figures and fictional characters.
          </p>
          
          <div className="install-prompt-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">⚡</span>
              <span>Faster loading</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">📱</span>
              <span>Works offline</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🎯</span>
              <span>Full screen experience</span>
            </div>
          </div>
        </div>
        
        <div className="install-prompt-actions">
          <button 
            className="install-button primary"
            onClick={handleInstall}
          >
            <Download size={18} />
            Install App
          </button>
          
          <button 
            className="install-button secondary"
            onClick={handleDismiss}
          >
            Maybe Later
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .install-prompt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }

        .install-prompt {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 2px solid #FFD700;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .install-prompt-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #FFD700;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .install-prompt-close:hover {
          background: rgba(255, 215, 0, 0.1);
        }

        .install-prompt-content {
          text-align: center;
          margin-bottom: 24px;
        }

        .install-prompt-icon {
          color: #FFD700;
          margin-bottom: 16px;
        }

        .install-prompt-title {
          color: #FFD700;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 12px 0;
          font-family: 'Cinzel Decorative', serif;
        }

        .install-prompt-description {
          color: rgba(255, 215, 0, 0.8);
          font-size: 16px;
          line-height: 1.5;
          margin: 0 0 20px 0;
        }

        .install-prompt-benefits {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 215, 0, 0.9);
          font-size: 14px;
        }

        .benefit-icon {
          font-size: 16px;
        }

        .install-prompt-actions {
          display: flex;
          gap: 12px;
          flex-direction: column;
        }

        .install-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
        }

        .install-button.primary {
          background: #FFD700;
          color: #1a1a2e;
          border: 2px solid #FFD700;
        }

        .install-button.primary:hover {
          background: #f0c200;
          border-color: #f0c200;
          transform: translateY(-1px);
        }

        .install-button.secondary {
          background: transparent;
          color: #FFD700;
          border: 2px solid rgba(255, 215, 0, 0.5);
        }

        .install-button.secondary:hover {
          border-color: #FFD700;
          background: rgba(255, 215, 0, 0.1);
        }

        @media (max-width: 480px) {
          .install-prompt {
            margin: 20px;
            padding: 20px;
          }
          
          .install-prompt-benefits {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}