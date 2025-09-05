// src/components/CategoryCarousel/CategoryCarousel.js
import React from 'react';
import styles from './CategoryCarousel.module.css';
import CharacterCard from './CharacterCard';

const CategoryCarousel = ({ title, characters, onCharacterClick }) => {
  return (
    <div className={styles.carousel}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.cardsContainer}>
        {characters.map(character => (
          <CharacterCard
            key={character.key}
            character={character}
            onClick={() => onCharacterClick(character)}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryCarousel;
