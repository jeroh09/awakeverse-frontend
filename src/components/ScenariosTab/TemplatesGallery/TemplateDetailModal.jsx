// src/components/ScenariosTab/TemplatesGallery/TemplateDetailModal.jsx
// ✅ REDESIGNED: double-border modal shell, SVG icons throughout, no emoji
// ✅ DEFENSIVE: all original logic preserved — upgrade gate, ScenarioCreator flow, safe fallbacks

import React, { useState, useEffect, useCallback } from 'react';
import { characterCategories } from '../../../data/characterCategories';
import ScenarioCreator from '../ScenarioCreator';
import './TemplateDetailModal.css';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CategoryIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const UsersIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 20c0-3 2.2-5 5-5M21 20c0-3-2.2-5-5-5M8 15c1-.4 2-.5 4-.5s3 .1 4 .5"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 6.5C5 5.12 6.12 4 7.5 4h9c1.38 0 2.5 1.12 2.5 2.5v6c0 1.38-1.12 2.5-2.5 2.5H10l-3.5 3v-3H7.5C6.12 15 5 13.88 5 12.5v-6z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const PersonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2"
      stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function TemplateDetailModal({
  template,
  isUnlimited,
  onClose,
  onUpgradeRequired,
  currentScenarioCount = 0,
  onScenarioCreated = () => {}
}) {
  const [showCreator, setShowCreator] = useState(false);

  // Defensive: close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!template) return null;

  // ── Safe fallbacks for all template fields ─────────────────────────────────
  const templateTitle       = template.title       || 'Untitled Scenario';
  const templateDescription = template.description || 'No description available';
  const templateCategory    = template.category    || 'general';
  const maxCharacters       = template.max_characters || 4;
  const suggestedCharacters = template.suggested_characters || ['socrates', 'aristotle', 'kant', 'confucius'];
  const starterQuestions    = template.starter_questions || [
    'Is it moral to sacrifice one person to save five?',
    'How do intent and consequences factor into morality?',
    'Are there universal moral principles?'
  ];

  // ── Character info resolver (original logic preserved) ─────────────────────
  const getCharacterInfo = (charKey) => {
    for (const category of characterCategories) {
      if (category.characters && Array.isArray(category.characters)) {
        const found = category.characters.find(c => c.key === charKey);
        if (found) return { name: found.name, thumbnailUrl: found.thumbnailUrl };
      }
    }
    return {
      name: charKey.charAt(0).toUpperCase() + charKey.slice(1),
      thumbnailUrl: null
    };
  };

  // ── Handlers (original logic preserved) ────────────────────────────────────
  const handleUseTemplate = () => {
    if (!isUnlimited) {
      onUpgradeRequired('template_access');
      return;
    }
    setShowCreator(true);
  };

  const handleCreatorClose   = () => setShowCreator(false);
  const handleCreatorSuccess = (newScenario) => {
    setShowCreator(false);
    onScenarioCreated(newScenario);
    onClose();
  };

  return (
    <>
      {/* ── Modal overlay ─────────────────────────────────────────────────── */}
      <div className="tdm-overlay" onClick={onClose} role="dialog" aria-modal="true"
        aria-label={`Template details: ${templateTitle}`}>
        <div className="tdm-modal" onClick={e => e.stopPropagation()}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="tdm-header">
            {/* Category eyebrow */}
            <span className="tdm-eyebrow">
              <CategoryIcon />
              {templateCategory.charAt(0).toUpperCase() + templateCategory.slice(1)}
            </span>
            <h2 className="tdm-title">{templateTitle}</h2>

            <button
              className="tdm-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div className="tdm-body">

            {/* Meta row */}
            <div className="tdm-meta-row">
              <div className="tdm-meta-chip">
                <UsersIcon />
                <span>Up to {maxCharacters} characters</span>
              </div>
              <div className="tdm-meta-chip">
                <ChatBubbleIcon />
                <span>{starterQuestions.length} starter questions</span>
              </div>
            </div>

            {/* Description */}
            <p className="tdm-description">{templateDescription}</p>

            {/* Characters section */}
            <div className="tdm-section">
              <div className="tdm-section-label">
                <PersonIcon />
                <span>Featured Characters</span>
              </div>
              <div className="tdm-chars-grid">
                {suggestedCharacters.map((charKey, index) => {
                  const charInfo = getCharacterInfo(charKey);
                  const initial  = charInfo.name.charAt(0).toUpperCase();
                  return (
                    <div key={index} className="tdm-char-card">
                      <div
                        className="tdm-char-avatar"
                        title={charInfo.name}
                        style={charInfo.thumbnailUrl ? {
                          backgroundImage: `url(${charInfo.thumbnailUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {!charInfo.thumbnailUrl && (
                          <span className="tdm-char-initial">{initial}</span>
                        )}
                      </div>
                      <span className="tdm-char-name">{charInfo.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Questions section */}
            <div className="tdm-section">
              <div className="tdm-section-label">
                <ChatBubbleIcon />
                <span>Starter Questions</span>
              </div>
              <div className="tdm-questions-row">
                <span className="tdm-questions-count">
                  {starterQuestions.length} questions included
                </span>
                <span className="tdm-questions-hint">
                  Customise in the next step
                </span>
              </div>
            </div>

          </div>

          {/* ── Footer actions ───────────────────────────────────────────── */}
          <div className="tdm-footer">
            <button className="tdm-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className={`tdm-btn-create ${!isUnlimited ? 'tdm-btn-create--upgrade' : ''}`}
              onClick={handleUseTemplate}
            >
              {isUnlimited ? (
                <>
                  <span>Create Scenario</span>
                  <ArrowRightIcon />
                </>
              ) : (
                <>
                  <LockIcon />
                  <span>Upgrade to Create</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ScenarioCreator — original flow, untouched */}
      {showCreator && (
        <ScenarioCreator
          template={template}
          isOpen={showCreator}
          onClose={handleCreatorClose}
          onSuccess={handleCreatorSuccess}
          currentScenarioCount={currentScenarioCount}
        />
      )}
    </>
  );
}