// src/components/Film/filmGenres.js
// GENRE (2026-10-12, GENRE_ROOM=1) — picked under Style for films and series. A
// positioning choice: it changes nothing on screen, it shapes how the writers' room
// helps (structure, the one question it asks, how a series episode ends). Keys match
// film_assistant.GENRES; the hint names the question the writer asks for that genre.
// Optional: no genre is a valid choice and is sent as nothing.
export const GENRES = [
  { key: 'folk_tales', label: 'Folk Tales', hint: 'a told tale with a turn or a lesson. The writer asks what it should teach.' },
  { key: 'drama',      label: 'Drama',      hint: 'someone who wants something, and pressure that rises. The writer asks what they stand to lose.' },
  { key: 'faith',      label: 'Faith',      hint: 'conviction, kindness or hope put to the test. The writer asks which tradition or message to honour.' },
  { key: 'action',     label: 'Action',     hint: 'a clear goal under pressure from the first seconds. The writer asks what happens if the hero fails.' },
  { key: 'suspense',   label: 'Suspense',   hint: 'a threat that closes in. The writer asks what the audience should be afraid of.' },
  { key: 'comedy',     label: 'Comedy',     hint: 'one comic premise, set up and paid off. The writer asks for the tone — gentle, absurd or sharp.' },
  { key: 'romance',    label: 'Romance',    hint: 'two people drawn together and kept apart. The writer asks what stands between them.' },
  { key: 'history',    label: 'History',    hint: 'a real time, place or event. The writer asks which event, and who guides us through it.' },
  { key: 'mystery',    label: 'Mystery',    hint: 'a question with fair clues. The writer asks who, what or why.' },
  { key: 'sci_fi',     label: 'Sci-Fi',     hint: 'one clear "what if", kept consistent. The writer asks what it is.' },
  { key: 'fantasy',    label: 'Fantasy',    hint: 'a world with its own rules. The writer asks for the one rule of its magic.' },
];
// ADVERTISING MODE (2026-10-18, AD_MODE=1) — "Advertise" opens Ad setup instead of the
// writers' room. It is deliberately NOT in GENRES, so it never appears for series (an ad is a
// film in v1); NewFilmModal shows it only when the server's /ad routes answer (feature-detect).
export const AD_GENRE = { key: 'advertise', label: 'Advertise',
  hint: 'a story-first video ad. Opens Ad setup: a short brief, a look, three concepts, then the script.' };
export const isAdGenre = (key) => key === AD_GENRE.key;
export const AD_LENGTHS = [10, 15, 20, 30, 45, 60];     // = ad_room.AD_LENGTHS
export const AD_RATIOS = ['9:16', '16:9'];               // = ad_room.AD_RATIOS
const AD_END_CARD = { 10: 2, 15: 3, 20: 3, 30: 3, 45: 4, 60: 4 };   // = ad_room._END_CARD_SECONDS
export const adEndCard = (s) => AD_END_CARD[s] || 3;
export const adLengthTip = (s) => `${s - adEndCard(s)}s of film + a ${adEndCard(s)}s end card`;

export const genreLabel = (key) => (isAdGenre(key) ? AD_GENRE.label
  : (GENRES.find((g) => g.key === key) || {}).label || null);
export const genreHint = (key) => {
  const g = isAdGenre(key) ? AD_GENRE : GENRES.find((x) => x.key === key);
  return g ? `${g.label}: ${g.hint}` : 'No genre — the writer follows your lead.';
};