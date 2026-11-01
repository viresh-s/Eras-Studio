export interface CollectionOption {
  value: string;
  label: string;
}

export const DEFAULT_COLLECTION_OPTIONS: CollectionOption[] = [
  { value: 'Summer Series', label: 'Summer Series' },
  { value: 'Winter Series', label: 'Winter Series' },
  { value: 'Spring Collection', label: 'Spring Collection' },
  { value: 'Autumn Collection', label: 'Autumn Collection' },
  { value: 'Portraits', label: 'Portraits' },
  { value: 'Landscapes', label: 'Landscapes' },
  { value: 'Still Life', label: 'Still Life' },
];

export const OTHER_COLLECTION_OPTION: CollectionOption = { value: 'Other', label: 'Other' };

export const CUSTOM_COLLECTIONS_STORAGE_KEY = 'eras_custom_collections';

export function getCustomCollections(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_COLLECTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string =>
          typeof item === 'string' &&
          item.trim().length > 0 &&
          item.trim().toLowerCase() !== 'other'
      );
    }
  } catch {
    // Ignore JSON parse errors
  }
  return [];
}

export function saveCustomCollection(collection: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = collection.trim();
  if (!trimmed || trimmed.toLowerCase() === 'other') return;

  const isDefault = DEFAULT_COLLECTION_OPTIONS.some(
    (opt) => opt.value.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDefault) return;

  const existing = getCustomCollections();
  const exists = existing.some((item) => item.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    const updated = [...existing, trimmed];
    try {
      localStorage.setItem(CUSTOM_COLLECTIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }
}

export function buildCollectionOptions(
  customList: string[],
  currentCollection?: string | null
): CollectionOption[] {
  const options: CollectionOption[] = [...DEFAULT_COLLECTION_OPTIONS];

  // Append user's saved custom collections
  for (const item of customList) {
    const trimmed = item.trim();
    if (!trimmed || trimmed.toLowerCase() === 'other') continue;
    if (!options.some((opt) => opt.value.toLowerCase() === trimmed.toLowerCase())) {
      options.push({ value: trimmed, label: trimmed });
    }
  }

  // If the artwork already has a collection that isn't in options and isn't 'Other', include it
  if (currentCollection) {
    const trimmedCurrent = currentCollection.trim();
    if (
      trimmedCurrent &&
      trimmedCurrent.toLowerCase() !== 'other' &&
      !options.some((opt) => opt.value.toLowerCase() === trimmedCurrent.toLowerCase())
    ) {
      options.push({ value: trimmedCurrent, label: trimmedCurrent });
    }
  }

  // Always append 'Other' at the end
  options.push(OTHER_COLLECTION_OPTION);

  return options;
}

