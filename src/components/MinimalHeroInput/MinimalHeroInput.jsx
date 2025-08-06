import React from 'react';
import styles from './MinimalHeroInput.module.css'; // Fixed import path

const MinimalHeroInput = ({ value, onChange, placeholder, onFocus }) => {
  return (
    <div className={styles.searchPortal}>
      <input
        type="text"
        className={styles.searchInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={onFocus}
      />
    </div>
  );
};

export default MinimalHeroInput;