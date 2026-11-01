// src/components/Film/filmPoster.js
// An episode's or film's poster image: its own THUMBNAIL (a frame of the film) first,
// the AI key art second (owner, 2026-10-12 — finished episodes wear their thumbnails,
// Netflix-style). One helper so the shelf, the episode tiles and the season board agree.
export const posterOf = (item) => (item && (item.thumbnail_url || item.key_art_url)) || null;