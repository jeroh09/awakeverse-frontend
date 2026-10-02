// src/components/Film/filmStyleMedia.js
// Single source of truth for style-preview clip URLs. Nothing else hardcodes
// these paths — so switching CDN base, or graduating from 5-file (one master
// per style, cropped) to 15-file (one clip per style × aspect) framing, is a
// change in this file only.
//
// Filenames are keyed on the BACKEND style key (anime | cartoon | comic_book |
// realistic | photoreal), NOT the on-screen label — the labels are inverted for
// the last two (realistic = the painterly look, photoreal = the photographic
// look). Match the footage to the key, not the word.

const STYLE_PREVIEW_BASE =
  'https://awakeverse-blog.lon1.cdn.digitaloceanspaces.com/content/film-styles';

// 5-file mode: one master per style; aspect handled by CSS object-fit:cover.
// To graduate to 15-file per-aspect framing, switch the return to:
//   `${STYLE_PREVIEW_BASE}/style-${styleKey}-${aspectSlug(aspect)}.mp4`
// (and upload style-<key>-<aspect>.mp4 to the same prefix). No other file changes.
export function stylePreviewUrl(styleKey /*, aspect */) {
  return `${STYLE_PREVIEW_BASE}/style-${styleKey}.mp4`;
}

export function stylePosterUrl(styleKey) {
  return `${STYLE_PREVIEW_BASE}/style-${styleKey}.jpg`;
}

// '9:16' -> '9x16' etc. (only needed once we're in 15-file mode)
export function aspectSlug(aspect) {
  return String(aspect).replace(':', 'x');
}