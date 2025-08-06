import React from 'react';
import styles from './CharacterCard.module.css';

const CharacterCard = ({ character, onClick }) => {
  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={e => e.key === 'Enter' && onClick()}
    >
      <img
        src={character.thumbnailUrl}
        alt={character.name}
        className={styles.thumbnail}
      />
      <p className={styles.name}>{character.name}</p>
    </div>
  );
};

export default CharacterCard;
