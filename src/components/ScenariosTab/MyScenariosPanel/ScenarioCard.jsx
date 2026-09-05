// src/components/ScenariosTab/MyScenariosPanel/ScenarioCard.jsx
// ✅ REDESIGNED: double-border shell, SVG icons replace emojis
// ✅ PRESERVED: background image logic, publish/unpublish, published badge,
//               character thumbnail fallback, all props untouched

import React from 'react';
import { characterCategories } from '../../../data/characterCategories';
import { getDisplayNameFromKey, isCustomCharacterKey } from '../../../utils/characterUtils';
import './ScenarioCard.css';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.5 2.5a2.121 2.121 0 0 1 3 3L12 14l-4 1 1-4 8.5-8.5z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"
    style={{ animation: 'sc-spin 0.8s linear infinite', display: 'inline-block' }}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"
      strokeDasharray="40 20" strokeLinecap="round"/>
  </svg>
);

const PublishIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M2 12h3M19 12h3M12 2v3M12 19v3"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.7"/>
  </svg>
);

const ChatBubbleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 6.5C5 5.12 6.12 4 7.5 4h9c1.38 0 2.5 1.12 2.5 2.5v6c0 1.38-1.12 2.5-2.5 2.5H10l-3.5 3v-3H7.5C6.12 15 5 13.88 5 12.5v-6z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CategoryIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);

const EnterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <filter id="sc-enter-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.6"/>
      </filter>
    </defs>
    <path d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      filter="url(#sc-enter-glow)"/>
  </svg>
);

const GlobeCheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M2 12h3M19 12h3M12 2v3M12 19v3"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScenarioCard({
  scenario,
  onStartDebate,
  onDelete,
  onEdit,
  onPublish,
  isDeleting   = false,
  isPublishing = false,
  userCharacters = []
}) {
  const handleStartDebate  = () => onStartDebate(scenario.id);
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      onDelete(scenario.id);
    }
  };
  const handleEdit         = () => onEdit(scenario);
  const handlePublishClick = () => onPublish(scenario);

  // ── Character info resolver (original logic, unchanged) ────────────────────
  const getCharacterInfo = (charKey) => {
    const isCustom = isCustomCharacterKey(charKey);
    if (isCustom) {
      const customChar = userCharacters.find(c => c.character_key === charKey);
      if (customChar) {
        return { name: customChar.display_name, thumbnailUrl: customChar.avatar_url, isCustom: true };
      }
      return { name: getDisplayNameFromKey(charKey), thumbnailUrl: `/images/${charKey}.jpg`, isCustom: true };
    }
    for (const category of characterCategories) {
      if (category.characters) {
        const found = category.characters.find(c => c.key === charKey);
        if (found) return { name: found.name, thumbnailUrl: found.thumbnailUrl, isCustom: false };
      }
    }
    return { name: charKey, thumbnailUrl: `/images/${charKey}.jpg`, isCustom: false };
  };

  // ── Card background image (original logic, unchanged) ─────────────────────
  const getCardBackgroundImage = () => {
    if (scenario.category) {
      const templateImageMap = {
        'philosophy':    '/images/template-philosophy.jpg',
        'business':      '/images/template-business.jpg',
        'ethics':        '/images/template-ethics.jpg',
        'science':       '/images/template-science.jpg',
        'technology':    '/images/template-technology.jpg',
        'relationships': '/images/template-relationships.jpg',
        'fiction':       '/images/template-fiction.jpg',
        'warfare':       '/images/template-warfare.jpg'
      };
      if (templateImageMap[scenario.category]) return templateImageMap[scenario.category];
    }
    const characterKeys = scenario.character_keys || scenario.characters || [];
    if (characterKeys.length > 0) {
      const firstCharInfo = getCharacterInfo(characterKeys[0]);
      if (firstCharInfo.thumbnailUrl) return firstCharInfo.thumbnailUrl;
    }
    return '/images/template-default.jpg';
  };

  const characterKeys       = scenario.character_keys || scenario.characters || [];
  const cardBackgroundImage = getCardBackgroundImage();
  const questionCount       = scenario.starter_questions?.length || 0;
  const isPublished         = scenario.is_public === true;

  // ── Avatar thumbnails (original img + fallback logic, unchanged) ──────────
  const characterThumbnails = characterKeys.slice(0, 4).map((charKey, index) => {
    const charInfo = getCharacterInfo(charKey);
    const initial  = charInfo.name.charAt(0).toUpperCase();
    return (
      <div key={index} className="character-thumbnail" title={charInfo.name}>
        {charInfo.thumbnailUrl ? (
          <img
            src={charInfo.thumbnailUrl}
            alt={charInfo.name}
            className="thumbnail-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span className="thumbnail-fallback"
          style={{ display: charInfo.thumbnailUrl ? 'none' : 'flex' }}>
          {initial}
        </span>
      </div>
    );
  });

  return (
    <div className={`scenario-card ${isDeleting ? 'deleting' : ''}`}>

      {/* Background image + overlay (original structure, unchanged) */}
      <div className="scenario-card-background"
        style={{ backgroundImage: `url(${cardBackgroundImage})` }}>
        <div className="scenario-card-overlay" />
      </div>

      {/* Card content */}
      <div className="scenario-card-content">

        {/* Header: title + icon actions */}
        <div className="scenario-header">
          <h4 className="scenario-title">{scenario.title}</h4>
          <div className="scenario-actions">

            <button
              className={`action-button publish ${isPublished ? 'published' : ''}`}
              onClick={handlePublishClick}
              disabled={isDeleting || isPublishing}
              title={
                isPublishing ? 'Processing...'
                  : isPublished ? 'Published to Market Hub · Click to unpublish'
                  : 'Publish to Market Hub'
              }
              aria-label={isPublished ? 'Unpublish from Market Hub' : 'Publish to Market Hub'}
            >
              {isPublishing ? <SpinnerIcon /> : <PublishIcon />}
            </button>

            <button
              className="action-button edit"
              onClick={handleEdit}
              disabled={isDeleting}
              title="Edit scenario"
              aria-label="Edit scenario"
            >
              <EditIcon />
            </button>

            <button
              className="action-button delete"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete scenario"
              aria-label="Delete scenario"
            >
              {isDeleting ? <SpinnerIcon /> : <DeleteIcon />}
            </button>

          </div>
        </div>

        {/* Published badge */}
        {isPublished && (
          <div className="published-badge">
            <span className="badge-icon"><GlobeCheckIcon /></span>
            <span className="badge-text">Published</span>
          </div>
        )}

        {/* Description */}
        <p className="scenario-description">{scenario.description}</p>

        {/* Meta: avatars + question count */}
        <div className="scenario-meta">
          <div className="character-thumbnails">
            {characterThumbnails}
            {characterKeys.length > 4 && (
              <div className="character-thumbnail more">
                +{characterKeys.length - 4}
              </div>
            )}
          </div>
          <div className="question-count">
            <ChatBubbleIcon />
            <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Category */}
        {scenario.category && (
          <div className="scenario-category">
            <CategoryIcon />
            <span>{scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}</span>
          </div>
        )}

        {/* Enter Dialogue CTA */}
        <button
          className="start-debate-button"
          onClick={handleStartDebate}
          disabled={isDeleting}
          aria-label={`Enter dialogue: ${scenario.title}`}
        >
          <span>Enter Dialogue</span>
          <EnterIcon />
        </button>

      </div>
    </div>
  );
}