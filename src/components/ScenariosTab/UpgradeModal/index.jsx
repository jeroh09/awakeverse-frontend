// src/components/ScenariosTab/UpgradeModal/index.jsx - SIMPLE VERSION
import React from 'react';
import './UpgradeModal.css';

export default function UpgradeModal({ isOpen, onClose, reason, currentTier }) {
  if (!isOpen) return null;

  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
        <div className="upgrade-header">
          <h2>Upgrade to Unlimited</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="upgrade-content">
          <p>Verse scenarios require an Unlimited subscription.</p>
          <p>Current tier: <strong>{currentTier}</strong></p>
          
          <div className="upgrade-features">
            <h4>Professional tier includes:</h4>
            <ul>
              <li>Multi-character debates</li>
              <li>20+ scenario templates</li>
              <li>Unlimited questions</li>
              <li>Priority access to new features</li>
            </ul>
          </div>
        </div>
        
        <div className="upgrade-actions">
          <button className="cancel-button" onClick={onClose}>
            Maybe Later
          </button>
          <button 
            className="upgrade-button"
            onClick={() => window.location.href = '/premium/upgrade'}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}