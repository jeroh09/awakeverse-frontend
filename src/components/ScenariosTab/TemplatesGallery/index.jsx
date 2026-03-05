// src/components/ScenariosTab/TemplatesGallery/index.jsx
// ✅ UPDATED: onOpenGuide prop added — renders Dialogue Guide button in header

import React, { useState, useEffect } from 'react';
import { getTemplates, getCategories } from '../../../api';
import CategoryFilter from './CategoryFilter';
import TemplateCard from './TemplateCard';
import TemplateDetailModal from './TemplateDetailModal';
import ScrollToMyDialogues from './ScrollToMyDialogues';
import './TemplatesGallery.css';

export default function TemplatesGallery({ 
  isUnlimited, 
  onUpgradeRequired,
  currentScenarioCount = 0,
  onScenarioCreated = () => {},
  onOpenGuide = null   // ✅ NEW: optional — safe if not passed
}) {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    loadTemplatesData();
  }, [selectedCategory]);

  const loadTemplatesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const templatesPromise = getTemplates(selectedCategory);
      const categoriesPromise = !categories.length
        ? getCategories()
        : Promise.resolve({ categories: categories });

      const [templatesData, categoriesData] = await Promise.all([
        templatesPromise,
        categoriesPromise
      ]);

      setTemplates(templatesData.templates || []);

      if (categoriesData.categories && !categories.length) {
        setCategories(categoriesData.categories);
      }

      console.log('🎭 Templates loaded:', {
        count: templatesData.templates?.length,
        category: selectedCategory,
        categories: categoriesData.categories
          ? Object.keys(categoriesData.categories).length
          : 'cached'
      });

    } catch (err) {
      console.error('❌ Failed to load templates:', err);
      setError('Failed to load templates. Please try again.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === 'all' ? null : category);
    setVisibleCount(6);
  };

  const handleTemplateSelect = (template) => {
    if (!isUnlimited) {
      onUpgradeRequired('template_access');
      return;
    }
    setSelectedTemplate(template);
  };

  const handleCloseModal  = () => setSelectedTemplate(null);
  const handleShowMore    = () => setVisibleCount(prev => prev + 6);

  const handleScenarioCreated = (newScenario) => {
    console.log('🎭 Gallery: Scenario created, notifying parent');
    onScenarioCreated(newScenario);
  };

  const visibleTemplates  = templates.slice(0, visibleCount);
  const hasMoreTemplates  = visibleCount < templates.length;

  if (loading) {
    return (
      <div className="templates-gallery">
        <div className="gallery-loading">
          <div className="loading-spinner"></div>
          <p>Loading scenario templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="templates-gallery">
        <div className="gallery-error">
          <p>{error}</p>
          <button onClick={loadTemplatesData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="templates-gallery">

      {/* ✅ UPDATED HEADER — guide button sits below subtitle */}
      <div className="gallery-header">
        <h2 className="gallery-title">Verse Dialogues</h2>
        <p className="gallery-subtitle">
          Multi-character debates powered by AI &bull; {isUnlimited ? 'Unlimited access' : 'Upgrade required'}
        </p>
        {onOpenGuide && (
          <button className="gallery-guide-btn" onClick={onOpenGuide}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v1M12 11v5" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round"/>
            </svg>
            Dialogue Guide
          </button>
        )}
      </div>

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      <div className="template-grid">
        {visibleTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            isUnlimited={isUnlimited}
            onSelect={handleTemplateSelect}
            onUpgradeRequired={onUpgradeRequired}
          />
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <div className="empty-state">
          <p>No templates found{selectedCategory ? ` in ${selectedCategory}` : ''}.</p>
        </div>
      )}

      {hasMoreTemplates && (
        <button className="show-more-cta" onClick={handleShowMore}>
          <span className="cta-icon"></span>
          <span className="cta-text">+{templates.length - visibleCount} more templates</span>
        </button>
      )}

      <ScrollToMyDialogues />

      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          isUnlimited={isUnlimited}
          onClose={handleCloseModal}
          onUpgradeRequired={onUpgradeRequired}
          currentScenarioCount={currentScenarioCount}
          onScenarioCreated={handleScenarioCreated}
        />
      )}
    </div>
  );
}