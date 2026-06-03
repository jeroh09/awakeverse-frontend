// src/components/ScenariosTab/TemplatesGallery/TemplateCard.jsx
// ✅ REDESIGNED: double-border pattern, SVG lock icon, gradient panel replaces broken image paths
// ✅ DEFENSIVE: original character lookup logic preserved, img fallback kept as secondary

import React from 'react';
import { characterCategories } from '../../../data/characterCategories';
import './TemplateCard.css';

// ── Category gradient map — replaces broken image paths ───────────────────────
// Each category gets a unique gradient identity; no external image dependency
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

// ── Category accent colors for the shimmer pattern on the panel ───────────────
const CATEGORY_PATTERN = {
  philosophy:    'rgba(129, 140, 248, 0.15)',
  ethics:        'rgba(52, 211, 153, 0.15)',
  science:       'rgba(96, 165, 250, 0.15)',
  business:      'rgba(251, 191, 36, 0.15)',
  technology:    'rgba(167, 139, 250, 0.15)',
  relationships: 'rgba(249, 168, 212, 0.15)',
  fiction:       'rgba(94, 234, 212, 0.15)',
  warfare:       'rgba(252, 165, 165, 0.15)',
  default:       'rgba(129, 140, 248, 0.15)',
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function TemplateCard({ template, isUnlimited, onSelect, onUpgradeRequired }) {
  // Defensive: bail if no template
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
        if (found) {
          return { name: found.name, thumbnailUrl: found.thumbnailUrl };
        }
      }
    }
    return {
      name: charKey.charAt(0).toUpperCase() + charKey.slice(1),
      thumbnailUrl: null
    };
  };

  // ── Avatars (first 4 + overflow count) ────────────────────────────────────
  const suggestedChars = template.suggested_characters || [];
  const characterAvatars = suggestedChars.slice(0, 4).map((charKey, index) => {
    const charInfo = getCharacterInfo(charKey);
    return {
      key: charKey,
      name: charInfo.name,
      initial: charInfo.name.charAt(0).toUpperCase(),
      thumbnailUrl: charInfo.thumbnailUrl,
    };
  });

  // Fallback avatars if template has none defined
  if (characterAvatars.length === 0) {
    ['Socrates', 'Aristotle', 'Kant', 'Confucius'].forEach((name, i) => {
      characterAvatars.push({ key: `fallback-${i}`, name, initial: name[0], thumbnailUrl: null });
    });
  }

  const category      = template.category?.toLowerCase() || 'default';
  const gradient      = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.default;
  const patternColor  = CATEGORY_PATTERN[category]   || CATEGORY_PATTERN.default;
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

      {/* ── Image panel — gradient-first, real image as enhancement ────────── */}
      <div
        className="tc-image-panel"
        style={{ background: gradient }}
        aria-hidden="true"
      >
        {/* Subtle dot/shimmer overlay for texture */}
        <div className="tc-image-pattern" style={{ background: patternColor }} />
        {/* Category initial as large ghost letter */}
        <span className="tc-image-ghost">
          {(template.category || 'D').charAt(0).toUpperCase()}
        </span>
      </div>

      {/* ── Card body ──────────────────────────────────────────────────────── */}
      <div className="tc-body">

        {/* Category badge */}
        <span className="tc-category-badge">
          {template.category
            ? template.category.charAt(0).toUpperCase() + template.category.slice(1)
            : 'General'}
        </span>

        {/* Title */}
        <h3 className="tc-title">{template.title}</h3>

        {/* Description */}
        <p className="tc-description">{template.description}</p>

        {/* Avatars row */}
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
              {/* Initial always rendered; CSS hides it when background-image loads */}
              <span className="tc-avatar-initial">{char.initial}</span>
            </div>
          ))}
          {overflowCount > 0 && (
            <div className="tc-avatar tc-avatar--more" title={`+${overflowCount} more`}>
              +{overflowCount}
            </div>
          )}
        </div>

        {/* Questions badge */}
        <div className="tc-questions-badge">
          <ChatBubbleIcon />
          <span>{questionCount} starter question{questionCount !== 1 ? 's' : ''}</span>
        </div>

      </div>
    </div>
  );
}