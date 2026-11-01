// src/utils/imageUtils.js
// Defensive image loading utilities to prevent infinite onError loops

/**
 * Defensive onError handler for character avatars
 * Prevents infinite loops by:
 * 1. Nullifying the onError handler immediately
 * 2. Hiding the broken image
 * 3. Creating a text fallback with character initial
 */
export const handleImageError = (e, fallbackText = 'C') => {
  e.currentTarget.onError = null;
  e.currentTarget.style.display = 'none';

  const parent = e.currentTarget.parentElement;
  if (!parent.querySelector('.text-fallback')) {
    const fallback = document.createElement('div');
    fallback.className = 'text-fallback';
    fallback.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 215, 0, 0.2);
      color: #FFD700;
      font-size: 1.2rem;
      font-weight: bold;
      border-radius: 50%;
    `;
    fallback.textContent = fallbackText.charAt(0).toUpperCase();
    parent.appendChild(fallback);
  }
};

/**
 * Get safe avatar URL with null fallback
 * Returns null instead of default-character.jpg to prevent loops
 */
export const getSafeAvatarUrl = (character) => {
  if (!character) return null;
  return character.avatar_url || character.thumbnailUrl || null;
};

/**
 * Create onError handler with character name
 * Returns a function that can be used directly in onError prop
 */
export const createImageErrorHandler = (characterName = 'C') => {
  return (e) => handleImageError(e, characterName);
};