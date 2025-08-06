import React from 'react';
import styles from './AvatarCarousel.module.css';

const AvatarCarousel = ({ characters, onSelect }) => (
  <div className={styles.carousel}>
    {characters.map(char => (
      <div
        key={char.id}
        className={styles.wrapper}
        onClick={() => onSelect(char)}
      >
        <img src={char.avatar} className={styles.avatar} alt={char.name} />
        <div className={styles.label}>{char.name}</div>
      </div>
    ))}
  </div>
);

export default AvatarCarousel;