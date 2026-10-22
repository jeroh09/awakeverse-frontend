// src/components/PodcastStudio/podcastFormat.js
//
// Frame shape for the episode (2026-10-18): landscape 16:9 (default) or vertical
// 9:16 — vertical is for solo episodes. Mirrors podcast_overlays.py:
//   · card positions differ by shape; a position picked in one shape maps to its
//     equivalent in the other (mapPreset), so switching never loses a choice —
//     the line keeps what the user picked, and we show / send the mapped one;
//   · vertical cards sit in the headroom above the host, plus one band over the lap.

export const ASPECTS = [
  { id: '16:9', label: 'Landscape', sub: '16:9 · YouTube, web' },
  { id: '9:16', label: 'Vertical',  sub: '9:16 · Reels, TikTok, Shorts' },
];

const TO_VERTICAL = {
  side_panel_left: 'top_card', side_panel_right: 'top_card',
  corner_card_bl: 'corner_card_tl', corner_card_br: 'corner_card_tr',
};
const TO_LANDSCAPE = { top_card: 'side_panel_right' };
// Vertical duo (9:16, two speakers — 2026-10-22, owner's rule): only the two top
// corners are offered, above the speakers' heads. Faces must always show, and the
// lower positions cover chests and hands and clash with captions — so a card picked
// lower in 16:9 moves up. The server accepts all six small positions; this top-only
// subset stays valid when it starts enforcing the same rule.
const TO_VERTICAL_DUO = {
  corner_small_bl: 'corner_small_tl', corner_small_br: 'corner_small_tr',
  lower_third_small_left: 'corner_small_tl', lower_third_small_right: 'corner_small_tr',
};

// The equivalent position for this frame shape (unknown names pass through).
// speakers: how many speakers the episode has (2 + 9:16 = the vertical duo).
export function mapPreset(preset, aspect = '16:9', speakers = 1) {
  if (!preset) return preset;
  if (aspect === '9:16' && speakers === 2) return TO_VERTICAL_DUO[preset] || preset;
  return (aspect === '9:16' ? TO_VERTICAL : TO_LANDSCAPE)[preset] || preset;
}

// Vertical positions: [id, label, tip]  (podcast_overlays.PRESETS_SOLO_VERTICAL)
export const PRESETS_VERTICAL = [
  ['top_card',       'Top card',  'Wide card across the top, above your head · wide image (~650×320) — best for charts'],
  ['corner_card_tl', 'Top left',  'Small card top-left · 16:9 image (~320×180)'],
  ['corner_card_tr', 'Top right', 'Small card top-right · 16:9 image (~320×180)'],
  ['lower_third',    'Lower band', 'Band across your lap, above the captions · wide banner (~650×205)'],
];

// Vertical duo positions: [id, label, tip] — top corners only (see TO_VERTICAL_DUO).
export const PRESETS_VERTICAL_DUO = [
  ['corner_small_tl', 'Top left',  'Small card top-left, above the heads · 16:9 image (~320×180)'],
  ['corner_small_tr', 'Top right', 'Small card top-right, above the heads · 16:9 image (~320×180)'],
];

// [left%, top%, width%, height%] of the 9:16 frame (podcast_overlays._preset_rect, 720×1280)
// corner_small_* (vertical duo): the server has no portrait geometry for these yet,
// so the preview uses the vertical top-corner card box — update when it lands.
export const PRESET_RECT_VERTICAL = {
  top_card:       [5, 7.5, 90, 25],
  corner_card_tl: [5, 7.5, 44.03, 13.91],
  corner_card_tr: [50.97, 7.5, 44.03, 13.91],
  lower_third:    [5, 53.98, 90, 16.02],
  corner_small_tl: [5, 7.5, 44.03, 13.91],
  corner_small_tr: [50.97, 7.5, 44.03, 13.91],
};

// Image size guidance per vertical position.
export const IMAGE_HINT_VERTICAL = {
  top_card: 'wide (~650×320)',
  corner_card_tl: 'wide 16:9 (~320×180)', corner_card_tr: 'wide 16:9 (~320×180)',
  lower_third: 'wide banner (~650×205)',
  corner_small_tl: 'wide 16:9 (~320×180)', corner_small_tr: 'wide 16:9 (~320×180)',
};