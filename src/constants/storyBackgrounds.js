// src/constants/storyBackgrounds.js
// Default background images for Story Mode

/**
 * Default background image for custom stories (not from templates)
 * This is used when a user creates a story from scratch
 * 
 * NOTE: You need to add this file to your public/static folder
 * OR use a real URL from your assets
 */
export const DEFAULT_STORY_BACKGROUND = 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1600&q=80';

/**
 * Get background image URL for a story
 * Priority: template scene_url > template image_url > default
 * 
 * @param {Object} story - Story object
 * @returns {string} Background image URL
 */
export function getStoryBackgroundUrl(story) {
  // Priority 1: Template-specific scene URL
  if (story?.scene_url || story?.sceneUrl) {
    const sceneUrl = story.scene_url || story.sceneUrl;
    
    // If it's a relative path, make it absolute
    if (sceneUrl.startsWith('/')) {
      return `${window.location.protocol}//www.awakeverse.com${sceneUrl}`;
    }
    return sceneUrl;
  }

  // Priority 2: Template image URL
  if (story?.template_image_url || story?.image_url) {
    return story.template_image_url || story.image_url;
  }

  // Priority 3: Default background (Unsplash fallback)
  return DEFAULT_STORY_BACKGROUND;
}

/**
 * Preload background image to avoid flash
 * 
 * @param {string} url - Image URL to preload
 * @returns {Promise} Resolves when image is loaded
 */
export function preloadBackgroundImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}