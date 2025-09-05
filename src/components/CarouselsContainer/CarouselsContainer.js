import React from 'react';
import styles from './CarouselsContainer.module.css';
import characterCategories from '../../data/characterCategories';
import CategoryCarousel from '../CategoryCarousel/CategoryCarousel';

const CarouselsContainer = ({ onCharacterPreview }) => {
  return (
    <div className={styles.container}>
      {characterCategories.map(category => (
        <section key={category.key} className={styles.section}>
          <CategoryCarousel
            title={category.title}
            characters={category.characters}
            onCharacterClick={char => onCharacterPreview(char.key)}
          />
        </section>
      ))}
    </div>
  );
};

export default CarouselsContainer;
