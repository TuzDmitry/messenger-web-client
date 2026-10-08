// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useSession } from './session';

const credentials = {
  apiUrl: 'https://api.green-api.com',
  idInstance: '4100000000',
  apiTokenInstance: 'token',
};

describe('session store', () => {
  beforeEach(() => {
    useSession.setState({ credentials: null });
    sessionStorage.clear();
  });

  it('persists credentials to sessionStorage on sign in', () => {
    useSession.getState().signIn(credentials);

    expect(useSession.getState().credentials).toEqual(credentials);
    expect(JSON.parse(sessionStorage.getItem('session')!)).toMatchObject({
      state: { credentials },
    });
  });

  it('forgets credentials and clears storage on sign out', () => {
    useSession.getState().signIn(credentials);
    useSession.getState().signOut();

    expect(useSession.getState().credentials).toBeNull();
    expect(sessionStorage.getItem('session')).toBeNull();
  });
});
