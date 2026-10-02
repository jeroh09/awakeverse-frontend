// src/components/ScenariosTab/MyScenariosPanel/CreateButton.jsx
import React from 'react';
import './CreateButton.css';

export default function CreateButton({ onClick, disabled = false, variant = "primary" }) {
  return (
    <button 
      className={`create-button ${variant} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="button-icon">+</span>
      <span className="button-text">Create New Scenario</span>
    </button>
  );
}