// src/components/Film/adLensArt.js
// ADVERTISING MODE (2026-10-19) — the colour of each inspiration lens in Ad setup's
// "Pick a look" step. Three swatches per lens (keys = ad_room.LENSES). A lens card shows
// the lens IMAGE once the one-off set is in (see lensImage below); until then, or if an
// image fails to load, the swatches are the card's picture. Purely presentational.

export const LENS_SWATCH = {
  // an era
  dutch_golden_age:    ['#2E2216', '#8C6A3F', '#D9C9A3'],
  elizabethan_theatre: ['#5B1A1A', '#C08A3E', '#EADBC2'],
  baroque_chiaroscuro: ['#0B0B0B', '#5C3B1E', '#E3B778'],
  edo_ukiyo_e:         ['#1F3A5F', '#E8D9B5', '#C8553D'],
  mughal_miniature:    ['#0F5257', '#B8322F', '#D8B04A'],
  art_deco_1920s:      ['#111111', '#C9A227', '#2E4A3F'],
  cinema_1970s:        ['#5A3A22', '#C27A3A', '#E7C38A'],
  neon_1980s:          ['#1A0B2E', '#FF2E88', '#2DE2E6'],
  // a city
  lagos:               ['#F2C14E', '#2A9D8F', '#E76F51'],
  tokyo:               ['#0D1B2A', '#E63977', '#7BDFF2'],
  paris:               ['#8EA4B8', '#D9CFC1', '#3D4F63'],
  mexico_city:         ['#E4572E', '#F3A712', '#29335C'],
  marrakech:           ['#B5532F', '#E9C46A', '#1D6A72'],
  mumbai:              ['#3F6E8C', '#E9B44C', '#9BC1BC'],
  // a form
  fable:               ['#2D4739', '#C9B37E', '#6B8F71'],
  heist:               ['#1B1F3B', '#B0A8B9', '#E94F37'],
  nature_documentary:  ['#2F5233', '#94B447', '#D5E5A3'],
  silent_film:         ['#1A1A1A', '#7A7A7A', '#E6E1D3'],
  opera:               ['#4A0E1E', '#B3122E', '#E8C468'],
  sports_commentary:   ['#0B6E4F', '#F5F5F5', '#FA8334'],
  noir_mystery:        ['#0E0E10', '#3A3D46', '#C9C3B5'],
  musical:             ['#F72585', '#FFD60A', '#4361EE'],
  // a feeling
  wonder:              ['#2B2D7C', '#8E90FF', '#FFE8A3'],
  nostalgia:           ['#6B4226', '#D9A55B', '#F4E1C1'],
  quiet_confidence:    ['#1C2833', '#AEB6BF', '#F2F3F4'],
  mischief:            ['#7B2CBF', '#FF9F1C', '#2EC4B6'],
  triumph:             ['#8C1C13', '#F2B134', '#1B3B6F'],
  calm:                ['#5E8C8F', '#A9C5C8', '#E7EFEF'],
};

const FALLBACK = ['#262A6B', '#6366F1', '#A5B4FC'];
export const lensSwatch = (key) => LENS_SWATCH[key] || FALLBACK;

// LENS IMAGES (G73): one 768×512 WebP per lens, shipped with the frontend in
// public/assets/film/ad-lenses/<lens_key>.webp (served by Vercel, like the My Films
// feature images). Turn LENS_IMAGES_ON to true in the same deploy that adds the files.
// A server-sent `lens.image` (if ever used) wins; a missing/broken file shows the swatches.
export const LENS_IMAGES_ON = false;
export const LENS_IMAGE_DIR = '/assets/film/ad-lenses';
export const lensImage = (lens) => (lens && lens.image)
  || (LENS_IMAGES_ON && lens && lens.key ? `${LENS_IMAGE_DIR}/${lens.key}.webp` : null);