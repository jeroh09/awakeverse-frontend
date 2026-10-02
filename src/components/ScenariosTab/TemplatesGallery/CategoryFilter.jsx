// src/components/ScenariosTab/TemplatesGallery/CategoryFilter.jsx
// ✅ REDESIGNED: double-border pill group matching DialoguePill style
// ✅ PRESERVED: all original logic — defaultCategories, categoryList, selectedCategory, onCategorySelect

import React from 'react';
import './CategoryFilter.css';

export default function CategoryFilter({ categories, selectedCategory, onCategorySelect }) {

  // ── Defaults (original, untouched) ────────────────────────────────────────
  const defaultCategories = {
    'philosophy':    { count: 3, description: 'Fundamental questions about knowledge, ethics, and existence' },
    'technology':    { count: 2, description: 'Innovation, AI ethics, and technological progress' },
    'business':      { count: 3, description: 'Leadership, ethics, and commerce in society' },
    'ethics':        { count: 3, description: 'Moral dilemmas and ethical frameworks' },
    'fiction':       { count: 2, description: 'Narrative, heroism, and the power of story' },
    'relationships': { count: 3, description: 'Love, family, friendship, and human connection' },
    'science':       { count: 2, description: 'Scientific method, medicine, and human enhancement' },
    'warfare':       { count: 2, description: 'Strategy, conflict resolution, and peacebuilding' }
  };

  const resolvedCategories = (categories && Object.keys(categories).length)
    ? categories
    : defaultCategories;

  const categoryList = Object.keys(resolvedCategories);

  return (
    <div className="cf-wrapper" role="navigation" aria-label="Filter by category">
      <div className="cf-pill">

        {/* All */}
        <button
          className={`cf-segment ${selectedCategory === null ? 'cf-segment--active' : ''}`}
          onClick={() => onCategorySelect('all')}
          aria-pressed={selectedCategory === null}
        >
          All
        </button>

        {categoryList.map((categoryKey, index) => {
          const count     = resolvedCategories[categoryKey]?.count;
          const isActive  = selectedCategory === categoryKey;
          const label     = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);

          return (
            <React.Fragment key={categoryKey}>
              <span className="cf-divider" aria-hidden="true" />
              <button
                className={`cf-segment ${isActive ? 'cf-segment--active' : ''}`}
                onClick={() => onCategorySelect(categoryKey)}
                aria-pressed={isActive}
              >
                {label}
                {count != null && (
                  <span className="cf-count">{count}</span>
                )}
              </button>
            </React.Fragment>
          );
        })}

      </div>
    </div>
  );
}