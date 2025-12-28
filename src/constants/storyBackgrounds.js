// src/constants/storyBackgrounds.js
// Default background images for Story Mode

/**
 * Default background image for custom stories (not from templates)
 * This is used when a user creates a story from scratch
 */
export const DEFAULT_STORY_BACKGROUND = '/static/story-backgrounds/default-story.jpg';

/**
 * Fallback backgrounds by era (optional enhancement)
 * Used when template doesn't have a scene_url but has an era defined
 */
export const ERA_BACKGROUNDS = {
  ancient: '/static/story-backgrounds/ancient-era.jpg',
  medieval: '/static/story-backgrounds/medieval-era.jpg',
  renaissance: '/static/story-backgrounds/renaissance-era.jpg',
  '1800s': '/static/story-backgrounds/1800s-era.jpg',
  '1890s': '/static/story-backgrounds/victorian-era.jpg',
  '1900s': '/static/story-backgrounds/early-1900s-era.jpg',
  '1950s': '/static/story-backgrounds/1950s-era.jpg',
  modern: '/static/story-backgrounds/modern-era.jpg',
  '2050s': '/static/story-backgrounds/near-future-era.jpg',
  far_future: '/static/story-backgrounds/far-future-era.jpg'
};

/**
 * Get background image URL for a story
 * Priority: template scene_url > era background > default
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

  // Priority 3: Era-based background (optional)
  if (story?.era && ERA_BACKGROUNDS[story.era.toLowerCase()]) {
    return ERA_BACKGROUNDS[story.era.toLowerCase()];
  }

  // Priority 4: Default background
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