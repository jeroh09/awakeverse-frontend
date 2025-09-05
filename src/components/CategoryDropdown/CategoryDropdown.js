// src/components/CategoryDropdown/CategoryDropdown.js
import React, { useState } from 'react';
import styles from './CategoryDropdown.module.css';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function CategoryDropdown({ label, characters, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.dropdownContainer}>
      <button
        className={styles.titleButton}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        {label}
        {open
          ? <FiChevronUp className={styles.caret}/>
          : <FiChevronDown className={styles.caret}/>
        }
      </button>

      {open && (
        <ul className={styles.listContainer}>
          {characters.map(char => (
            <li key={char.key}>
              <button
                className={styles.itemButton}
                onClick={() => {
                  onSelect(char.key);
                  setOpen(false);
                }}
              >
                <img
                  src={char.thumbnailUrl}
                  alt={char.name}
                  className={styles.itemThumbnail}
                />
                <span className={styles.itemLabel}>{char.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
);
}
