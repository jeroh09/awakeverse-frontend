// src/components/MobileCharacterGrid.jsx
import React from 'react';

const MobileCharacterGrid = ({ characters, onCharacterSelect, showStatusIndicator = false }) => {
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: '#FFA500', text: 'Pending', icon: '⏳' },
      rejected: { color: '#ff6b6b', text: 'Rejected', icon: '❌' },
      approved: { color: '#28a745', text: 'Ready', icon: '✅' }
    };
    const config = statusConfig[status];
    if (!config || status === 'approved') return null;

    return (
      <div style={{
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        background: config.color,
        color: '#fff',
        fontSize: '0.6rem',
        fontWeight: 'bold',
        padding: '1px 4px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        zIndex: 1,
        border: '2px solid #0B1426',
        whiteSpace: 'nowrap'
      }}>
        <span style={{ fontSize: '0.5rem' }}>{config.icon}</span>
      </div>
    );
  };

  return (
    <div style={{
      width: '100%',
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      marginTop: '1rem'
    }}>
      {characters.map((character, index) => (
        <div
          key={character.key || index}
          onClick={() => onCharacterSelect(character)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '16px',
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* Status flag */}
          {showStatusIndicator && character.status && (
            <StatusBadge status={character.status} />
          )}

          {/* Avatar */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden',
            marginBottom: '0.75rem',
            border: '3px solid rgba(255, 215, 0, 0.3)',
            flexShrink: 0,
            opacity: character.status === 'rejected' ? 0.6 : 1
          }}>
            <img
              src={character.thumbnailUrl || '/images/default-character.jpg'}
              alt={character.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onError = null;
                e.target.style.display = 'none';
                
                const parent = e.target.parentElement;
                if (!parent.querySelector('.text-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'text-fallback';
                  fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,215,0,0.2);color:#FFD700;font-size:1.2rem;font-weight:bold;border-radius:50%;';
                  fallback.textContent = (character.name || 'C').charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* Info */}
          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{
              color: character.status === 'approved' ? '#FFD700' : '#FFA500',
              fontSize: '0.8rem',
              fontWeight: 600,
              margin: '0 0 0.5rem 0',
              letterSpacing: '0.5px',
              lineHeight: 1.2
            }}>
              {character.name}
            </h3>

            <p style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '0.65rem',
              lineHeight: 1.3,
              margin: 0,
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {(character.description || '').slice(0, 80)}{(character.description || '').length > 80 ? '…' : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileCharacterGrid;