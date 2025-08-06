// src/components/CharacterList.js
import React from 'react';
import '../styles.css';

const CharacterList = ({ characters, onCharacterClick }) => {
    console.log("CharacterList component rendered"); // Debugging log

    return (
        <div className="character-list">
            {Object.keys(characters).map((character) => (
                <div
                    key={character}
                    className="character-item"
                    onClick={() => onCharacterClick(character)}
                >
                    <img
                        src={`/images/${character}.jpg`}
                        alt={characters[character]}
                        className="character-icon"
                    />
                    <p>{characters[character]}</p>
                </div>
            ))}
        </div>
    );
};

export default CharacterList;
