import { describe, expect, it } from 'vitest';
import { normalizePhone } from './recipient';

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
