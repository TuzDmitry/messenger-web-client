// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { useChats } from '@/store/chats';
import { useSession } from '@/store/session';
import { signOut } from './signOut';

describe('signOut', () => {
  it('clears both the session and the chats, including their storage', () => {
    useSession.getState().signIn({
      apiUrl: 'https://api.green-api.com',
      idInstance: '4100000000',
      apiTokenInstance: 'token',
    });
    useChats.getState().addChat({ chatId: '10000000', phone: '79991234567' });

    signOut();

    expect(useSession.getState().credentials).toBeNull();
    expect(useChats.getState().order).toEqual([]);
    expect(sessionStorage.getItem('session')).toBeNull();
    expect(sessionStorage.getItem('chats')).toBeNull();
  });
});
