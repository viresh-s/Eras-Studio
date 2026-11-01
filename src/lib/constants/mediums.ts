export interface MediumOption {
  value: string;
  label: string;
}

export const DEFAULT_MEDIUM_OPTIONS: MediumOption[] = [
  { value: 'Painting', label: 'Painting' },
  { value: 'Sculpture', label: 'Sculpture' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Digital Art', label: 'Digital Art' },
  { value: 'Illustration', label: 'Illustration' },
  { value: 'Mixed Media', label: 'Mixed Media' },
];

export const OTHER_OPTION: MediumOption = { value: 'Other', label: 'Other' };

export const CUSTOM_MEDIUMS_STORAGE_KEY = 'eras_custom_mediums';

export function getCustomMediums(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_MEDIUMS_STORAGE_KEY);
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

export function saveCustomMedium(medium: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = medium.trim();
  if (!trimmed || trimmed.toLowerCase() === 'other') return;

  const isDefault = DEFAULT_MEDIUM_OPTIONS.some(
    (opt) => opt.value.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDefault) return;

  const existing = getCustomMediums();
  const exists = existing.some((item) => item.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    const updated = [...existing, trimmed];
    try {
      localStorage.setItem(CUSTOM_MEDIUMS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }
}

export function buildMediumOptions(
  customList: string[],
  currentArtType?: string | null
): MediumOption[] {
  const options: MediumOption[] = [...DEFAULT_MEDIUM_OPTIONS];

  // Append user's saved custom mediums
  for (const item of customList) {
    const trimmed = item.trim();
    if (!trimmed || trimmed.toLowerCase() === 'other') continue;
    if (!options.some((opt) => opt.value.toLowerCase() === trimmed.toLowerCase())) {
      options.push({ value: trimmed, label: trimmed });
    }
  }

  // If the artwork already has a medium that isn't in options and isn't 'Other', include it
  if (currentArtType) {
    const trimmedCurrent = currentArtType.trim();
    if (
      trimmedCurrent &&
      trimmedCurrent.toLowerCase() !== 'other' &&
      !options.some((opt) => opt.value.toLowerCase() === trimmedCurrent.toLowerCase())
    ) {
      options.push({ value: trimmedCurrent, label: trimmedCurrent });
    }
  }

  // Always append 'Other' at the end
  options.push(OTHER_OPTION);

  return options;
}

