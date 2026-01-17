// src/components/ScenariosTab/TemplatesGallery/index.jsx - COMPLETE WITH ORIGINAL HEADERS
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
  onScenarioCreated = () => {} 
}) {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6); // Show 6 templates initially (3 rows of 2)

  // Load templates and categories on mount
  useEffect(() => {
    loadTemplatesData();
  }, [selectedCategory]);

  const loadTemplatesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load templates (with optional category filter)
      const templatesPromise = getTemplates(selectedCategory);
      
      // Load categories (only once)
      const categoriesPromise = !categories.length ? getCategories() : Promise.resolve({ categories: categories });
      
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
        categories: categoriesData.categories ? Object.keys(categoriesData.categories).length : 'cached'
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
    setVisibleCount(6); // Reset to 6 when category changes
  };

  const handleTemplateSelect = (template) => {
    if (!isUnlimited) {
      onUpgradeRequired('template_access');
      return;
    }
    setSelectedTemplate(template);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  const handleScenarioCreated = (newScenario) => {
    console.log('🎭 Gallery: Scenario created, notifying parent');
    onScenarioCreated(newScenario);
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 6); // Show 6 more templates
  };

  const visibleTemplates = templates.slice(0, visibleCount);
  const hasMoreTemplates = visibleCount < templates.length;

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
      {/* ORIGINAL HEADER - KEEP INTACT */}
      <div className="gallery-header">
        <h2 className="gallery-title">Verse Dialogues</h2>
        <p className="gallery-subtitle">
          Multi-character debates powered by AI • {isUnlimited ? 'Unlimited access' : 'Upgrade required'}
        </p>
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

      {/* NEW: Show More CTA */}
      {hasMoreTemplates && (
        <button className="show-more-cta" onClick={handleShowMore}>
          <span className="cta-icon">+</span>
          <span className="cta-text">+{templates.length - visibleCount} more templates</span>
        </button>
      )}

      {/* NEW: Scroll to My Dialogues Arrow */}
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