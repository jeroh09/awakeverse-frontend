// src/components/ScenariosTab/TemplatesGallery/CategoryFilter.jsx
import React from 'react';
import './CategoryFilter.css';

export default function CategoryFilter({ categories, selectedCategory, onCategorySelect }) {
  // Default categories if API doesn't return any
  const defaultCategories = {
    'philosophy': { count: 3, description: 'Fundamental questions about knowledge, ethics, and existence' },
    'technology': { count: 2, description: 'Innovation, AI ethics, and technological progress' },
    'business': { count: 3, description: 'Leadership, ethics, and commerce in society' },
    'ethics': { count: 3, description: 'Moral dilemmas and ethical frameworks' },
    'fiction': { count: 2, description: 'Narrative, heroism, and the power of story' },
    'relationships': { count: 3, description: 'Love, family, friendship, and human connection' },
    'science': { count: 2, description: 'Scientific method, medicine, and human enhancement' },
    'warfare': { count: 2, description: 'Strategy, conflict resolution, and peacebuilding' }
  };

  const categoryList = Object.keys(categories.length ? categories : defaultCategories);

  return (
    <div className="category-filter">
      <div 
        className={`category-chip ${selectedCategory === null ? 'active' : ''}`}
        onClick={() => onCategorySelect('all')}
      >
        All
      </div>
      
      {categoryList.map(categoryKey => (
        <div
          key={categoryKey}
          className={`category-chip ${selectedCategory === categoryKey ? 'active' : ''}`}
          onClick={() => onCategorySelect(categoryKey)}
        >
          {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
          <span className="category-count">
            {categories[categoryKey]?.count || defaultCategories[categoryKey]?.count}
          </span>
        </div>
      ))}
    </div>
  );
}