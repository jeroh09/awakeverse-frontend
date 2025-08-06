// src/components/MysticalScroll.js - Mystical Tablet Device
import React from 'react';
import { characterCategories } from '../data/characterCategories';
import './MysticalScroll.css';

export default function MysticalScroll() {
  return (
    <div className="mystical-tablet-container">
      <div className="tablet-device">
        {/* Gold Border Frame */}
        <div className="tablet-frame">
          {/* Tablet Screen/Content Area */}
          <div className="tablet-screen">
            {/* Header Section */}
            <div className="tablet-header">
              <h2 className="tablet-title">
                AI conversations with history's most radical minds.
              </h2>
              <p className="tablet-subtitle">
                Speak freely. They'll answer in character.
              </p>
            </div>
            
            {/* Divider Line */}
            <div className="tablet-divider"></div>
            
            {/* Scrollable Character List */}
            <div className="tablet-content">
              {characterCategories.map((category) => (
                <div key={category.key} className="character-category">
                  <h3 className="category-title">{category.title}</h3>
                  <ul className="character-list">
                    {category.characters.slice(0, 4).map((character) => (
                      <li key={character.key} className="character-item">
                        {character.name}
                      </li>
                    ))}
                    {category.characters.length > 4 && (
                      <li className="character-item character-item--more">
                        +{category.characters.length - 4} more...
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
            
            {/* Bottom Flourish */}
            <div className="tablet-flourish">✦ ✦ ✦</div>
          </div>
        </div>
      </div>
    </div>
  );
}