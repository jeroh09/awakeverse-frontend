// src/components/StoryMode/TemplatesGallery/index.jsx - Story Templates Gallery
import React, { useState, useEffect } from 'react';
import useStoryApi from '../../../hooks/useStoryApi';
import StoryTemplateCard from './StoryTemplateCard';
import StoryTemplateDetailModal from './StoryTemplateDetailModal';
import styles from './TemplatesGallery.module.css';
import ScrollToMyStories from '../ScrollToMyStories';

export default function TemplatesGallery({ 
  onStoryCreated = () => {},
  onUpgradeRequired = () => {}
}) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(4); // Show 6 templates initially

  const { getTemplates } = useStoryApi();

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getTemplates();
      setTemplates(data.templates || []);

      console.log('📚 Story Templates loaded:', {
        count: data.templates?.length || 0
      });

    } catch (err) {
      console.error('❌ Failed to load story templates:', err);
      setError('Failed to load story templates. Please try again.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    console.log('📖 Template selected:', template.id);
    setSelectedTemplate(template);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  const handleStoryCreated = (newStory) => {
    console.log('✅ Story created from template:', newStory);
    onStoryCreated(newStory);
    setSelectedTemplate(null);
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const visibleTemplates = templates.slice(0, visibleCount);
  const hasMoreTemplates = visibleCount < templates.length;

  if (loading) {
    return (
      <div className={styles.templatesGallery}>
        <div className={styles.galleryLoading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading story templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.templatesGallery}>
        <div className={styles.galleryError}>
          <p>{error}</p>
          <button onClick={loadTemplates} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.templatesGallery}>
      {/* Header */}
      <div className={styles.galleryHeader}>
        <h2 className={styles.galleryTitle}>Story Mode</h2>
        <p className={styles.gallerySubtitle}>
          Create immersive narratives with AI characters • Era-based storytelling
        </p>
      </div>
      {/* Scroll Button */}
      <ScrollToMyStories />

      {/* Templates Grid */}
      <div className={styles.templateGrid}>
        {visibleTemplates.map(template => (
          <StoryTemplateCard
            key={template.id}
            template={template}
            onSelect={handleTemplateSelect}
          />
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <p>No story templates available.</p>
        </div>
      )}

      {/* Show More Button */}
      {hasMoreTemplates && (
        <button className={styles.showMoreButton} onClick={handleShowMore}>
          <span className={styles.buttonIcon}>+</span>
          <span className={styles.buttonText}>
            Show {Math.min(6, templates.length - visibleCount)} more templates
          </span>
        </button>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <StoryTemplateDetailModal
          template={selectedTemplate}
          onClose={handleCloseModal}
          onStoryCreated={handleStoryCreated}
          onUpgradeRequired={onUpgradeRequired}
        />
      )}
    </div>
  );
}