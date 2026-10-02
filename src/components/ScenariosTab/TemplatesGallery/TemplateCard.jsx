// src/components/ScenariosTab/TemplatesGallery/TemplateCard.jsx
// ✅ FIXED: Real images restored as primary, gradient as fallback only
// ✅ PRESERVED: double-border, lock SVG, avatar logic, all original image paths

import React, { useState } from 'react';
import { characterCategories } from '../../../data/characterCategories';
import './TemplateCard.css';

// ── Gradient fallbacks per category — only shown if image 404s ───────────────
const CATEGORY_GRADIENTS = {
  philosophy:    'linear-gradient(135deg, #3730a3 0%, #6366f1 60%, #818cf8 100%)',
  ethics:        'linear-gradient(135deg, #065f46 0%, #059669 60%, #34d399 100%)',
  science:       'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)',
  business:      'linear-gradient(135deg, #78350f 0%, #d97706 60%, #fbbf24 100%)',
  technology:    'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 60%, #a78bfa 100%)',
  relationships: 'linear-gradient(135deg, #831843 0%, #db2777 60%, #f9a8d4 100%)',
  fiction:       'linear-gradient(135deg, #134e4a 0%, #0f766e 60%, #5eead4 100%)',
  warfare:       'linear-gradient(135deg, #450a0a 0%, #991b1b 60%, #fca5a5 100%)',
  default:       'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 60%, #7c3aed 100%)',
};

// ── Image paths — original mapping preserved exactly ─────────────────────────
const CATEGORY_IMAGES = {
  philosophy:    '/images/template-philosophy.jpg',
  business:      '/images/template-business.jpg',
  ethics:        '/images/template-ethics.jpg',
  science:       '/images/template-science.jpg',
  technology:    '/images/template-technology.jpg',
  relationships: '/images/template-relationships.jpg',
  fiction:       '/images/template-fiction.jpg',
  warfare:       '/images/template-warfare.jpg',
  default:       '/images/template-default.jpg',
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2"
      stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 6.5C5 5.12 6.12 4 7.5 4h9c1.38 0 2.5 1.12 2.5 2.5v6c0 1.38-1.12 2.5-2.5 2.5H10l-3.5 3v-3H7.5C6.12 15 5 13.88 5 12.5v-6z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

// ── Defensive image panel — shows real image, falls back to gradient ──────────
function TemplateImagePanel({ category, title }) {
  const [imgFailed, setImgFailed] = useState(false);
  const cat      = category?.toLowerCase() || 'default';
  const imgSrc   = CATEGORY_IMAGES[cat] || CATEGORY_IMAGES.default;
  const gradient = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.default;

  if (imgFailed) {
    return (
      <div className="tc-image-panel" style={{ background: gradient }} aria-hidden="true">
        <span className="tc-image-ghost">
          {(category || 'D').charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="tc-image-panel" aria-hidden="true">
      <img
        src={imgSrc}
        alt={title}
        className="tc-image"
        onError={() => setImgFailed(true)}
      />
      {/* Subtle dark overlay for text readability if needed */}
      <div className="tc-image-overlay" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TemplateCard({ template, isUnlimited, onSelect, onUpgradeRequired }) {
  if (!template?.id) return null;

  const handleClick = () => {
    if (!isUnlimited) {
      onUpgradeRequired('template_access');
      return;
    }
    onSelect(template);
  };

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

  const suggestedChars  = template.suggested_characters || [];
  const characterAvatars = suggestedChars.slice(0, 4).map((charKey) => {
    const charInfo = getCharacterInfo(charKey);
    return {
      key:          charKey,
      name:         charInfo.name,
      initial:      charInfo.name.charAt(0).toUpperCase(),
      thumbnailUrl: charInfo.thumbnailUrl,
    };
  });

  if (characterAvatars.length === 0) {
    ['Socrates', 'Aristotle', 'Kant', 'Confucius'].forEach((name, i) => {
      characterAvatars.push({ key: `fallback-${i}`, name, initial: name[0], thumbnailUrl: null });
    });
  }

  const questionCount = template.starter_questions?.length || 7;
  const overflowCount = suggestedChars.length > 4 ? suggestedChars.length - 4 : 0;

  return (
    <div
      className={`tc-card ${!isUnlimited ? 'tc-card--locked' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${template.title}${!isUnlimited ? ' — upgrade required' : ''}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* Lock indicator */}
      {!isUnlimited && (
        <div className="tc-lock" aria-label="Upgrade required">
          <LockIcon />
        </div>
      )}

      {/* Image panel — real image primary, gradient fallback */}
      <TemplateImagePanel
        category={template.category}
        title={template.title}
      />

      {/* Card body */}
      <div className="tc-body">

        <span className="tc-category-badge">
          {template.category
            ? template.category.charAt(0).toUpperCase() + template.category.slice(1)
            : 'General'}
        </span>

        <h3 className="tc-title">{template.title}</h3>
        <p className="tc-description">{template.description}</p>

        <div className="tc-avatars">
          {characterAvatars.map((char, index) => (
            <div
              key={index}
              className="tc-avatar"
              title={char.name}
              style={char.thumbnailUrl ? {
                backgroundImage: `url(${char.thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {}}
            >
              <span className="tc-avatar-initial">{char.initial}</span>
            </div>
          ))}
          {overflowCount > 0 && (
            <div className="tc-avatar tc-avatar--more" title={`+${overflowCount} more`}>
              +{overflowCount}
            </div>
          )}
        </div>

        <div className="tc-questions-badge">
          <ChatBubbleIcon />
          <span>{questionCount} starter question{questionCount !== 1 ? 's' : ''}</span>
        </div>

      </div>
    </div>
  );
}