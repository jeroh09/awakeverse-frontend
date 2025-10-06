// src/components/ScenariosTab/TemplatesGallery/index.jsx
import React, { useState, useEffect } from 'react';
import { getTemplates, getCategories } from '../../../api';
import CategoryFilter from './CategoryFilter';
import TemplateCard from './TemplateCard';
import TemplateDetailModal from './TemplateDetailModal';
import './TemplatesGallery.css';

export default function TemplatesGallery({ isUnlimited, onUpgradeRequired }) {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="gallery-header">
        <h2 className="gallery-title">Verse Scenarios</h2>
        <p className="gallery-subtitle">
          Multi-character debates powered by AI • {isUnlimited ? 'Unlimited access' : 'Upgrade required'}
        </p>
      </div>

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      <div className="template-grid">
        {templates.map(template => (
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

      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          isUnlimited={isUnlimited}
          onClose={handleCloseModal}
          onUpgradeRequired={onUpgradeRequired}
        />
      )}
    </div>
  );
}