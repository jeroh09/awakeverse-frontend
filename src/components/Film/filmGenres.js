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
export const genreLabel = (key) => (GENRES.find((g) => g.key === key) || {}).label || null;
export const genreHint = (key) => {
  const g = GENRES.find((x) => x.key === key);
  return g ? `${g.label}: ${g.hint}` : 'No genre — the writer follows your lead.';
};