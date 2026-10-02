// src/utils/characterUtils.js - Character key and display name utilities

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

/**
 * Extract display name from character key
 * Converts: "user_26_captain_awake" → "Captain Awake"
 * Converts: "socrates" → "Socrates"
 */
export function getDisplayNameFromKey(characterKey) {
  if (!characterKey) return 'Unknown';
  
  // Check if it's a custom character key (user_XX_name format)
  const customKeyPattern = /^user_\d+_(.+)$/;
  const match = characterKey.match(customKeyPattern);
  
  if (match) {
    // Extract the name part and format it
    const namePart = match[1]; // e.g., "captain_awake"
    return namePart
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '); // "Captain Awake"
  }
  
  // For static characters, just capitalize first letter
  return characterKey.charAt(0).toUpperCase() + characterKey.slice(1);
}

/**
 * Get thumbnail URL for character
 * For custom: /api/premium/characters/{character_key}/thumbnail
 * For static: /character_images/{key}.jpg
 */
export function getCharacterThumbnailUrl(characterKey, isCustom = false) {
  if (!characterKey) return null;
  
  if (isCustom) {
    // Custom character thumbnail from backend
    return `${API_BASE}/api/premium/characters/${characterKey}/thumbnail`;
  }
  
  // Static character thumbnail
  return `${API_BASE}/character_images/${characterKey}.jpg`;
}

/**
 * Check if character key is a custom character
 */
export function isCustomCharacterKey(characterKey) {
  if (!characterKey) return false;
  return /^user_\d+_/.test(characterKey);
}

/**
 * Format character info for display
 */
export function formatCharacterInfo(character, userCharacters = []) {
  const { key, character_key, display_name, name, type } = character;
  const charKey = key || character_key;
  
  // If display_name is already provided (from API), use it
  if (display_name) {
    return {
      key: charKey,
      name: display_name,
      thumbnailUrl: getCharacterThumbnailUrl(charKey, type === 'custom')
    };
  }
  
  // If name is provided, use it
  if (name) {
    return {
      key: charKey,
      name: name,
      thumbnailUrl: getCharacterThumbnailUrl(charKey, type === 'custom')
    };
  }
  
  // Extract from key
  return {
    key: charKey,
    name: getDisplayNameFromKey(charKey),
    thumbnailUrl: getCharacterThumbnailUrl(charKey, type === 'custom')
  };
}