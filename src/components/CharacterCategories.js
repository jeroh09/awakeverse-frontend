// src/components/CharacterCategories.js
import React, { useState, useEffect, useRef } from 'react';
import CategoryDropdown from './CategoryDropdown/CategoryDropdown';
import { characterCategories } from '../data/characterCategories';

function useMediaQuery(width) {
  const [isUnder, setIsUnder] = useState(() => window.matchMedia(`(max-width: ${width}px)`).matches);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${width}px)`);
    const handler = e => setIsUnder(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [width]);
  return isUnder;
}

export default function CharacterCategories({ onSelect }) {
  const isMobile = useMediaQuery(600);
  const [openIndex, setOpenIndex] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isMobile && openIndex !== null && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      const target = items[openIndex];
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [openIndex, isMobile]);

  if (!isMobile) {
    return (
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {characterCategories.map(cat => (
          <CategoryDropdown
            key={cat.key}
            label={cat.title}
            characters={cat.characters}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <ul
      ref={listRef}
      style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '80vh', overflowY: 'auto' }}
    >
      {characterCategories.map((cat, idx) => (
        <li key={cat.key} style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.75rem 1rem',
              fontSize: '1.125rem',
              color: '#FFD700',
              background: 'rgba(10,10,30,0.8)',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            {cat.title}
          </button>

          {openIndex === idx && (
            <div
              style={{
                marginTop: '0.5rem',
                background: 'rgba(10,10,30,0.7)',
                borderRadius: '0.25rem',
                overflow: 'hidden',
              }}
            >
              {cat.characters.map(char => (
                <button
                  key={char.key}
                  onClick={() => onSelect(char.key)}
                  onTouchStart={() => setPressedKey(char.key)}
                  onTouchEnd={() => setPressedKey(null)}
                  onMouseDown={() => setPressedKey(char.key)}
                  onMouseUp={() => setPressedKey(null)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    fontSize: '1rem',
                    color: '#FFD700',
                    background:
                      pressedKey === char.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: pressedKey === char.key ? '2px solid #FFD700' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 150ms, border 150ms',
                  }}
                >
                  {char.name}
                </button>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
