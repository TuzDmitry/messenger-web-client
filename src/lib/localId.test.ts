import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalId } from './localId';

describe('createLocalId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses crypto.randomUUID when available', () => {
    expect(createLocalId()).toMatch(/^local-[0-9a-f-]{36}$/);
  });

  it('falls back outside secure contexts, where randomUUID is missing', () => {
    vi.stubGlobal('crypto', {});
    const ids = new Set(Array.from({ length: 100 }, createLocalId));

    expect([...ids][0]).toMatch(/^local-/);
    expect(ids.size).toBe(100);
  });
});
