import { describe, expect, it } from 'vitest';
import { normalizePhone, phoneDigits } from './recipient';

describe('phoneDigits', () => {
  it.each([
    ['+375 (33) 309-33-31', '375333093331'],
    ['79991234567', '79991234567'],
    ['7a9b9', '799'],
    ['++', ''],
  ])('%o → %o', (input, expected) => {
    expect(phoneDigits(input)).toBe(expected);
  });
});

describe('normalizePhone', () => {
  it.each([
    ['+375 (29) 123-45-67', '375291234567'],
    ['+7 999 123-45-67', '79991234567'],
    ['79991234567', '79991234567'],
    ['  +7-999-123-45-67  ', '79991234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['', '+7 999', '1234567890123456', '+7 999 abc 45 67', '@username'])(
    'rejects %o',
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );
});
