export interface StyleOption {
  value: string;
  label: string;
}

export const DEFAULT_STYLE_OPTIONS: StyleOption[] = [
  { value: 'Abstract', label: 'Abstract' },
  { value: 'Minimalist', label: 'Minimalist' },
  { value: 'Contemporary', label: 'Contemporary' },
  { value: 'Modern', label: 'Modern' },
  { value: 'Impressionism', label: 'Impressionism' },
  { value: 'Pop Art', label: 'Pop Art' },
  { value: 'Surrealism', label: 'Surrealism' },
  { value: 'Realism', label: 'Realism' },
  { value: 'Expressionism', label: 'Expressionism' },
  { value: 'Figurative', label: 'Figurative' },
  { value: 'Portraiture', label: 'Portraiture' },
  { value: 'Landscape', label: 'Landscape' },
];

export const OTHER_STYLE_OPTION: StyleOption = { value: 'Other', label: 'Other' };

export const CUSTOM_STYLES_STORAGE_KEY = 'eras_custom_styles';

export function getCustomStyles(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_STYLES_STORAGE_KEY);
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

export function saveCustomStyle(style: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = style.trim();
  if (!trimmed || trimmed.toLowerCase() === 'other') return;

  const isDefault = DEFAULT_STYLE_OPTIONS.some(
    (opt) => opt.value.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDefault) return;

  const existing = getCustomStyles();
  const exists = existing.some((item) => item.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    const updated = [...existing, trimmed];
    try {
      localStorage.setItem(CUSTOM_STYLES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }
}

export function buildStyleOptions(
  customList: string[],
  currentStyle?: string | null
): StyleOption[] {
  const options: StyleOption[] = [...DEFAULT_STYLE_OPTIONS];

  for (const item of customList) {
    const trimmed = item.trim();
    if (!trimmed || trimmed.toLowerCase() === 'other') continue;
    if (!options.some((opt) => opt.value.toLowerCase() === trimmed.toLowerCase())) {
      options.push({ value: trimmed, label: trimmed });
    }
  }

  if (currentStyle) {
    const trimmedCurrent = currentStyle.trim();
    if (
      trimmedCurrent &&
      trimmedCurrent.toLowerCase() !== 'other' &&
      !options.some((opt) => opt.value.toLowerCase() === trimmedCurrent.toLowerCase())
    ) {
      options.push({ value: trimmedCurrent, label: trimmedCurrent });
    }
  }

  options.push(OTHER_STYLE_OPTION);
  return options;
}
