export interface DimensionUnitOption {
  value: string;
  label: string;
  symbol: string;
}

export const DIMENSION_UNIT_OPTIONS: DimensionUnitOption[] = [
  { value: 'in', label: 'Inches (in)', symbol: 'in' },
  { value: 'cm', label: 'Centimeters (cm)', symbol: 'cm' },
  { value: 'mm', label: 'Millimeters (mm)', symbol: 'mm' },
  { value: 'm', label: 'Meters (m)', symbol: 'm' },
  { value: 'ft', label: 'Feet (ft)', symbol: 'ft' },
  { value: 'yd', label: 'Yards (yd)', symbol: 'yd' },
  { value: 'px', label: 'Pixels (px)', symbol: 'px' },
];

export function normalizeUnit(rawUnit?: string): string {
  if (!rawUnit) return '';
  const clean = rawUnit.trim().toLowerCase();
  if (clean === 'in' || clean === 'inch' || clean === 'inches' || clean === 'inc' || clean.includes('inch')) return 'in';
  if (clean === 'cm' || clean === 'centimeter' || clean === 'centimeters' || clean.includes('centimeter')) return 'cm';
  if (clean === 'mm' || clean === 'millimeter' || clean === 'millimeters' || clean.includes('millimeter')) return 'mm';
  if (clean === 'm' || clean === 'meter' || clean === 'meters' || clean === 'meeter' || clean.includes('meter')) return 'm';
  if (clean === 'ft' || clean === 'foot' || clean === 'feet' || clean.includes('feet')) return 'ft';
  if (clean === 'yd' || clean === 'yard' || clean === 'yards' || clean.includes('yard')) return 'yd';
  if (clean === 'px' || clean === 'pixel' || clean === 'pixels' || clean.includes('pixel')) return 'px';
  return clean;
}

export function getUnitSymbol(rawUnit?: string): string {
  if (!rawUnit) return 'in';
  const clean = normalizeUnit(rawUnit);
  const found = DIMENSION_UNIT_OPTIONS.find(
    (opt) =>
      opt.value === clean ||
      opt.symbol === clean ||
      opt.label.toLowerCase() === rawUnit.trim().toLowerCase()
  );
  return found?.symbol || clean || 'in';
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

