export const MAX_PRICE_INR = 10000000; // 1 Crore (1,00,00,000)
export const MAX_PRICE_INR_FORMATTED = '1,00,00,000';

/**
 * Formats a raw number or string into Indian currency notation (e.g. 1,00,00,000)
 * without any currency symbol. Strips leading zeros (only positive integers)
 * and automatically caps at 1 Crore (10,000,000).
 */
export function formatIndianCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/[^0-9]/g, '').replace(/^0+/, '');
  if (!str) return '';
  let num = parseInt(str, 10);
  if (isNaN(num) || num <= 0) return '';
  if (num > MAX_PRICE_INR) {
    num = MAX_PRICE_INR;
  }
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Parses an Indian currency formatted string (e.g. "1,00,00,000") into a raw numeric value.
 * Strictly returns positive integers capped at 1 Crore, or null.
 */
export function parseIndianCurrency(val: string | null | undefined): number | null {
  if (!val) return null;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  const num = parseInt(cleaned, 10);
  if (isNaN(num) || num <= 0) return null;
  return num > MAX_PRICE_INR ? MAX_PRICE_INR : num;
}

