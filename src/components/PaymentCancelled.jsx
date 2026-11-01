// src/components/PaymentCancelled.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
      <h2>Payment Cancelled</h2>
      <p>Your payment was cancelled. No charges were made.</p>
      <button 
        onClick={() => navigate('/pricing')}
        style={{
          background: '#FFD700',
          color: '#000',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Try Again
      </button>
    </div>
  );
};

export default PaymentCancelled;