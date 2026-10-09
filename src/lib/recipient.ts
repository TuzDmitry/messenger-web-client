// E.164: up to 15 digits with the country code; anything under 10 can't be a full number
const MIN_DIGITS = 10;
const MAX_DIGITS = 15;

/** What the phone field keeps while typing or pasting: digits only, the `+` is drawn by the field. */
export function phoneDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * `+375 (29) 123-45-67` → `375291234567`, or `null` when it can't be a phone number.
 * Only the format is checked: which countries a messenger accepts is up to the API.
 */
export function normalizePhone(input: string): string | null {
  if (/[^\d\s()+-]/.test(input)) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return null;

  return digits;
}
