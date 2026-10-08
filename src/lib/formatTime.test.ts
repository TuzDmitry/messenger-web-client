import { describe, expect, it } from 'vitest';
import { formatChatTime } from './formatTime';

const now = new Date(2026, 9, 8, 18, 30).getTime();

describe('formatChatTime', () => {
  it('shows only the time for today', () => {
    expect(formatChatTime(new Date(2026, 9, 8, 9, 5).getTime(), now)).toBe('09:05');
  });

  it('shows day and month for earlier this year', () => {
    expect(formatChatTime(new Date(2026, 9, 7, 23, 59).getTime(), now)).toBe('7 окт.');
  });

  it('shows the full date for previous years', () => {
    expect(formatChatTime(new Date(2025, 11, 31).getTime(), now)).toBe('31.12.25');
  });
});
