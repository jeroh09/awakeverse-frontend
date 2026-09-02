// src/components/PodcastStudio/overlayStyle.js
//
// Frontend mirror of the STYLE CONTRACT in podcast_overlays.py.
// Keep these presets in sync with STYLE_PRESETS on the backend — the backend's
// resolve_style() is authoritative; this copy exists so the UI can preview and
// so createSession can serialise the exact { recipe, ...overrides } shape.
//
// A per-beat look is stored on the line as `overlay.style`:
//     undefined                      → inherit the episode default (send nothing)
//     { recipe: 'embedded_glass' }   → a clean preset
//     { recipe: 'embedded_glass',    → preset + a few tweaks
//       warm_tint_alpha: 40 }
//
// `material` is an ORTHOGONAL axis (dark_glass | liquid_glass) that selects the
// glass surface rendered by card_render.py. It rides on the same object:
//     { recipe: 'embedded_glass', material: 'liquid_glass' }
// recipe/knobs are intensity; material is the surface. They compose freely, and
// the PIL fallback ignores material (it's consumed by the HTML face renderer).
//
// The episode-wide default is the same object shape, sent as payload.overlay_style.

export const RECIPE_INHERIT = '__inherit__';

export const STYLE_PRESETS = {
  sticker: {
    glass_frame: false, glass_content_fit: 'cover', backdrop_blur: false,
    sheen: false, rim: false, two_layer_shadow: false, warm_tint_alpha: 0,
    blur_sigma: 18, glass_tint_alpha: 165, tilt: true, tilt_strength: 0.10, vs: true,
  },
  embedded_glass: {
    glass_frame: true, glass_content_fit: 'contain', backdrop_blur: true,
    sheen: true, rim: true, two_layer_shadow: true, warm_tint_alpha: 20,
    blur_sigma: 18, glass_tint_alpha: 150, tilt: true, tilt_strength: 0.10, vs: true,
  },
  in_the_room: {
    glass_frame: true, glass_content_fit: 'contain', backdrop_blur: true,
    sheen: true, rim: true, two_layer_shadow: true, warm_tint_alpha: 28,
    blur_sigma: 26, glass_tint_alpha: 135, tilt: true, tilt_strength: 0.10, vs: true,
  },
  broadcast_clean: {
    glass_frame: true, glass_content_fit: 'contain', backdrop_blur: true,
    sheen: true, rim: true, two_layer_shadow: true, warm_tint_alpha: 0,
    blur_sigma: 16, glass_tint_alpha: 150, tilt: true, tilt_strength: 0.10, vs: true,
  },
};

// The default a beat inherits / the sensible base when someone starts tweaking.
export const DEFAULT_RECIPE = 'embedded_glass';

// ── MATERIAL AXIS ──────────────────────────────────────────────────────────
// The glass SURFACE, orthogonal to the recipe. Consumed by card_render.py's
// style_to_face(); the legacy PIL path ignores it. Keep ids in sync with
// card_render.MATERIAL_DARK / MATERIAL_LIQUID.
export const MATERIALS = { DARK: 'dark_glass', LIQUID: 'liquid_glass' };
export const DEFAULT_MATERIAL = 'dark_glass';

// Options for the material segmented control (two swatches, shown first).
export const MATERIAL_OPTIONS = [
  { id: 'dark_glass',   label: 'Dark glass',   swatch: 'dark',
    tip: 'Smoked navy glass — cinematic, text reads without help. Safe default over any footage.' },
  { id: 'liquid_glass', label: 'Liquid glass', swatch: 'liquid',
    tip: 'Near-clear refractive glass (visionOS-style). Brighter and glossier; text carries a soft scrim.' },
];

// Options for the recipe pill (order matters — single horizontal strip).
export const RECIPE_OPTIONS = [
  { id: RECIPE_INHERIT,   label: 'Episode default', tip: 'Inherit the episode-wide look — sends no per-beat style.' },
  { id: 'sticker',        label: 'Sticker',         tip: 'Flat, opaque panel — the original look. No glass, blur, or sheen.' },
  { id: 'embedded_glass', label: 'Embedded glass',  tip: 'Framed frosted glass: blurred room through the frame, sheen, rim, grounded shadow.' },
  { id: 'in_the_room',    label: 'In the room',     tip: 'Max realism — heavier backdrop blur and a deeper, softer shadow.' },
  { id: 'broadcast_clean',label: 'Broadcast clean', tip: 'Crisp frosted glass with no warm tint — matches the comparison rails.' },
];

// Tooltips for the fine-tune knobs (also used by the ? affordances).
export const KNOB_TIPS = {
  glass_frame:     'Content sits inside a frosted margin (vs filling edge-to-edge), so the glass actually shows.',
  glass_content_fit:'Contain frames the whole image; Cover fills the card and crops overflow.',
  backdrop_blur:   'True frosted glass: the video behind the panel is blurred and shows through — the biggest “it’s really there” cue.',
  blur_sigma:      'How hard to blur the room behind the glass. Higher = dreamier, lower = crisper.',
  glass_tint_alpha:'Panel opacity. Lower lets more of the blurred room through; higher is more solid and readable.',
  sheen:           'A soft diagonal light streak across the glass — the classic “this is glass” highlight.',
  rim:             'A lit top edge and soft dark base, so the panel reads as having real thickness.',
  two_layer_shadow:'Contact + cast shadow. Grounds the panel in the scene instead of floating flat.',
  warm_tint_alpha: 'Tints the panel toward the studio key light so it matches the room’s warmth.',
  tilt:            'Perspective angle. Cards lean; rails open toward center like a book.',
  tilt_strength:   'How strong the perspective lean is (0 = flat, 0.10 = the tuned default).',
  vs:              'A gradient “VS” node between the two rails, tying them into one graphic.',
};

// Keys that only apply to cards (hidden on the rails tab).
export const CARD_ONLY_KEYS = ['glass_frame', 'glass_content_fit', 'warm_tint_alpha'];

const stripRecipe = (o) =>
  Object.fromEntries(Object.entries(o || {}).filter(([k]) => k !== 'recipe'));

// Resolve a stored style object to a full set of values (for the live preview).
// Missing / inherit → falls back to the episode default preset for display.
export function resolveStyle(styleObj) {
  const recipe = styleObj?.recipe;
  const base =
    !recipe || recipe === RECIPE_INHERIT
      ? STYLE_PRESETS[DEFAULT_RECIPE]
      : STYLE_PRESETS[recipe] || STYLE_PRESETS[DEFAULT_RECIPE];
  const resolved = { ...base, ...stripRecipe(styleObj) };
  resolved.material = styleObj?.material || DEFAULT_MATERIAL;
  return resolved;
}

// The current recipe id for pill highlighting.
export function currentRecipe(styleObj) {
  if (!styleObj || styleObj.recipe === undefined) return RECIPE_INHERIT;
  return styleObj.recipe;
}

// The current material id for segmented-control highlighting.
export function currentMaterial(styleObj) {
  return styleObj?.material || DEFAULT_MATERIAL;
}

// Build the next style object when the user picks a recipe from the pill.
// `styleObj` is optional and only used to carry an explicit material override
// across the recipe change (recipe and material are orthogonal).
export function withRecipe(recipe, styleObj) {
  const mat = styleObj?.material;
  if (recipe === RECIPE_INHERIT) return mat ? { material: mat } : undefined;
  return mat ? { recipe, material: mat } : { recipe };
}

// Build the next style object when the user picks a material. Material is
// orthogonal, so this preserves recipe + any knob overrides untouched.
export function withMaterial(styleObj, material) {
  return { ...(styleObj || {}), material };
}

// Build the next style object when the user changes one knob. Starting from
// inherit adopts the default recipe as the base, then layers the override —
// preserving an explicit material (and any prior overrides) across the change.
export function withKnob(styleObj, key, value) {
  const hasRecipe =
    styleObj && styleObj.recipe !== undefined && styleObj.recipe !== RECIPE_INHERIT;
  const base = hasRecipe ? { ...styleObj } : { ...(styleObj || {}), recipe: DEFAULT_RECIPE };
  return { ...base, [key]: value };
}