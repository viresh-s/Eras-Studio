export interface DimensionUnitOption {
  value: string;
  label: string;
  symbol: string;
}

export const DIMENSION_UNIT_OPTIONS: DimensionUnitOption[] = [
  { value: 'in', label: 'Inches (in)', symbol: 'in' },
  { value: 'cm', label: 'Centimeters (cm)', symbol: 'cm' },
  { value: 'm', label: 'Meters (m)', symbol: 'm' },
  { value: 'mm', label: 'Millimeters (mm)', symbol: 'mm' },
  { value: 'ft', label: 'Feet (ft)', symbol: 'ft' },
  { value: 'px', label: 'Pixels (px)', symbol: 'px' },
];

export function normalizeUnit(rawUnit?: string): string {
  if (!rawUnit) return '';
  const clean = rawUnit.trim().toLowerCase();
  if (clean === 'in' || clean === 'inch' || clean === 'inches' || clean === 'inc') return 'in';
  if (clean === 'cm' || clean === 'centimeter' || clean === 'centimeters') return 'cm';
  if (clean === 'm' || clean === 'meter' || clean === 'meters' || clean === 'meeter') return 'm';
  if (clean === 'mm' || clean === 'millimeter' || clean === 'millimeters') return 'mm';
  if (clean === 'ft' || clean === 'foot' || clean === 'feet') return 'ft';
  if (clean === 'px' || clean === 'pixel' || clean === 'pixels') return 'px';
  return clean;
}

export function parseDimensionsString(dimStr?: string | null): {
  width: string;
  height: string;
  unit: string;
} {
  if (!dimStr) return { width: '', height: '', unit: '' };

  const match = dimStr.match(
    /^([\d.]+)\s*[×xX*]\s*([\d.]+)(?:\s*[×xX*]\s*[\d.]+)?\s*([a-zA-Z]+)?$/
  );
  if (match) {
    const unit = normalizeUnit(match[3]);
    return {
      width: match[1] || '',
      height: match[2] || '',
      unit: unit || 'in',
    };
  }

  // Fallback check if any unit exists in string
  for (const opt of DIMENSION_UNIT_OPTIONS) {
    if (new RegExp(`\\b${opt.value}\\b`, 'i').test(dimStr)) {
      return { width: '', height: '', unit: opt.value };
    }
  }

  return { width: '', height: '', unit: '' };
}

