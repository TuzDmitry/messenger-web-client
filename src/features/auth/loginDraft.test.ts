// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLoginDraft, readLoginDraft, saveLoginDraft } from './loginDraft';

const draft = { idInstance: '4100000000', apiTokenInstance: 'token', apiUrl: '' };

describe('login draft', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('survives a reload and is cleared on sign in', () => {
    saveLoginDraft(draft);
    expect(readLoginDraft()).toEqual(draft);

    clearLoginDraft();
    expect(readLoginDraft()).toEqual({ idInstance: '', apiTokenInstance: '', apiUrl: '' });
  });

  it('does not keep an empty draft', () => {
    saveLoginDraft(draft);
    saveLoginDraft({ idInstance: '', apiTokenInstance: '', apiUrl: '' });

    expect(sessionStorage.getItem('login-draft')).toBeNull();
  });

  it('starts empty on a broken value or blocked storage', () => {
    sessionStorage.setItem('login-draft', '{not json');
    expect(readLoginDraft().idInstance).toBe('');

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(readLoginDraft().idInstance).toBe('');
  });
});
