// src/utils/getFirstName.js
// Defensive: returns the first whitespace-delimited token of the user's
// display name. Never throws. Falls back to `fallback` for any bad input.
//
//   getFirstName({ displayName: 'Alexander Hamilton' }) -> 'Alexander'
//   getFirstName({ display_name: '  Ada   Lovelace ' }) -> 'Ada'
//   getFirstName({ displayName: 'Cher' })               -> 'Cher'
//   getFirstName(null) / '' / undefined                 -> 'Seeker'
export function getFirstName(user, fallback = 'Seeker') {
  try {
    const raw = user?.displayName ?? user?.display_name ?? '';
    if (typeof raw !== 'string') return fallback;
    const first = raw.trim().split(/\s+/)[0];
    return first && first.length > 0 ? first : fallback;
  } catch {
    return fallback;
  }
}

export default getFirstName;