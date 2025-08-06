import React, { useMemo } from 'react';
import { characterCategories } from '../../data/characterCategories';
import useInteractedCharacters from '../../hooks/useInteractedCharacters';
import './PrestigeHub.css';

const PrestigeHub = ({ 
  current, 
  onSelect, 
  isVisible, 
  position = 'sidebar' 
}) => {
  const { interactedCharacters, loading } = useInteractedCharacters();

  const discoveryData = useMemo(() => {
    if (loading) return { categories: [], discoveryPercentage: 0 };

    let totalDiscovered = 0;
    let totalCharacters = 0;

    const enrichedCategories = characterCategories.map(category => {
      const discovered = category.characters.filter(char => 
        interactedCharacters.includes(char.key)
      ).length;
      
      totalDiscovered += discovered;
      totalCharacters += category.characters.length;

      return {
        ...category,
        discovered,
        total: category.characters.length,
        completion: discovered / category.characters.length || 0
      };
    });

    return {
      categories: enrichedCategories.filter(cat => cat.discovered > 0),
      discoveryPercentage: totalCharacters > 0 
        ? Math.round((totalDiscovered / totalCharacters) * 100) 
        : 0,
      totalDiscovered,
      totalCharacters
    };
  }, [interactedCharacters, loading]);

  if (!isVisible) return null;

  return (
    <div className={`prestige-hub ${position}`}>
      <div className="prestige-header">
        <h3>Intellectual Network</h3>
        {position === 'sidebar' && (
          <div className="completion-badge">
            <span className="percentage">{discoveryData.discoveryPercentage}%</span>
            <span className="label">Discovered</span>
          </div>
        )}
      </div>

      <div className="prestige-categories">
        {discoveryData.categories.map(category => (
          <div
            key={category.key}
            className="prestige-category"
            onClick={() => onSelect(category.characters[0].key)}
          >
            <div className="category-icon">
              {getCategoryIcon(category.title)}
            </div>
            <div className="category-info">
              <span className="category-name">{category.title}</span>
              {position === 'sidebar' && (
                <>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${category.completion * 100}%` }}
                    />
                  </div>
                  <span className="category-stats">
                    {category.discovered}/{category.total}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {position === 'sidebar' && (
        <div className="prestige-footer">
          {discoveryData.totalDiscovered} characters discovered
        </div>
      )}
    </div>
  );
};

const getCategoryIcon = (categoryName) => {
  const icons = {
    'Detectives': '🔍',
    'Astrologers': '⭐',
    'Truthseekers': '🎯',
    'Mystics': '🔮',
    'Entrepreneurs': '💰',
    'Cupids': '💕',
    'Philosophers': '🤔',
    'Inventors': '🔬',
    'Strategos': '⚔️'
  };
  return icons[categoryName] || '✨';
};

export default PrestigeHub;