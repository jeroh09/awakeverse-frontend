import { characterCategories } from './characterCategories';

export const CHARACTERS = Object.fromEntries(
  characterCategories
    .flatMap(group => group.characters)
    .map(({ key, name, thumbnailUrl }) => [
      key,
      { display_name: name, thumbnailUrl }
    ])
);
