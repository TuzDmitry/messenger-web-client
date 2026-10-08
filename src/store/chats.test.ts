// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { MessageNotification } from '@/api/notifications';
import { useChats } from './chats';

const store = () => useChats.getState();

function incoming(overrides: Partial<MessageNotification> = {}): MessageNotification {
  return {
    direction: 'in',
    idMessage: 'm1',
    chatId: '10000000',
    peerName: 'Иван',
    text: 'Привет',
    timestamp: 1_000,
    ...overrides,
  };
}

describe('chats store', () => {
  beforeEach(() => {
    store().reset();
    sessionStorage.clear();
  });

  describe('addChat / openChat', () => {
    it('creates a chat titled with the phone and is idempotent', () => {
      store().addChat({ chatId: '10000000', phone: '79991234567' });
      store().addChat({ chatId: '10000000', phone: '79991234567' });

      expect(store().order).toEqual(['10000000']);
      expect(store().chats['10000000']).toMatchObject({ title: '+79991234567', unread: 0 });
    });

    it('opening a chat makes it active and clears unread', () => {
      store().receive(incoming());
      expect(store().chats['10000000']!.unread).toBe(1);

      store().openChat('10000000');

      expect(store().activeChatId).toBe('10000000');
      expect(store().chats['10000000']!.unread).toBe(0);
    });
  });

  it('closing a chat goes back to the list, and new messages count as unread again', () => {
    store().receive(incoming());
    store().openChat('10000000');
    store().closeChat();
    store().receive(incoming({ idMessage: 'm2', timestamp: 2_000 }));

    expect(store().activeChatId).toBeNull();
    expect(store().chats['10000000']!.unread).toBe(1);
  });

  describe('outgoing messages', () => {
    beforeEach(() => store().addChat({ chatId: '10000000', phone: '79991234567' }));

    it('starts as pending under a local id', () => {
      const localId = store().addOutgoing('10000000', 'hi');

      expect(localId).toMatch(/^local-/);
      expect(store().messages[localId]).toMatchObject({ status: 'pending', direction: 'out' });
      expect(store().chats['10000000']!.messageIds).toEqual([localId]);
    });

    it('is re-keyed by idMessage once sent', () => {
      const localId = store().addOutgoing('10000000', 'hi');
      store().markSent(localId, 'real-1');

      expect(store().messages[localId]).toBeUndefined();
      expect(store().messages['real-1']).toMatchObject({ id: 'real-1', status: 'sent' });
      expect(store().chats['10000000']!.messageIds).toEqual(['real-1']);
    });

    it('does not duplicate when the notification arrived before the send response', () => {
      const localId = store().addOutgoing('10000000', 'hi');
      store().receive(incoming({ direction: 'out', idMessage: 'real-1', text: 'hi' }));
      store().markSent(localId, 'real-1');

      expect(Object.keys(store().messages)).toEqual(['real-1']);
      expect(store().chats['10000000']!.messageIds).toEqual(['real-1']);
    });

    it('can fail and go back to pending for a retry', () => {
      const localId = store().addOutgoing('10000000', 'hi');
      store().markFailed(localId);
      expect(store().messages[localId]!.status).toBe('failed');

      store().markPending(localId);
      expect(store().messages[localId]!.status).toBe('pending');
    });
  });

  describe('receive', () => {
    it('ignores a notification it has already seen (delete failed, it came again)', () => {
      store().receive(incoming());
      store().receive(incoming());

      expect(store().chats['10000000']!.messageIds).toEqual(['m1']);
      expect(store().chats['10000000']!.unread).toBe(1);
    });

    it('creates an unknown chat, titled by the peer name or chatId', () => {
      store().receive(incoming());
      store().receive(incoming({ idMessage: 'm2', chatId: '20000000', peerName: undefined }));

      expect(store().chats['10000000']!.title).toBe('Иван');
      expect(store().chats['20000000']!.title).toBe('20000000');
    });

    it('replaces a phone title with the name, keeping the phone', () => {
      store().addChat({ chatId: '10000000', phone: '79991234567' });
      store().receive(incoming());

      expect(store().chats['10000000']).toMatchObject({ title: 'Иван', phone: '79991234567' });
    });

    it('does not count messages in the open chat or outgoing ones as unread', () => {
      store().receive(incoming({ direction: 'out', idMessage: 'm0' }));
      expect(store().chats['10000000']!.unread).toBe(0);

      store().openChat('10000000');
      store().receive(incoming());
      expect(store().chats['10000000']!.unread).toBe(0);
    });

    it('keeps messages in time order and moves the chat to the top', () => {
      store().receive(incoming({ idMessage: 'late', timestamp: 3_000 }));
      store().receive(incoming({ idMessage: 'other', chatId: '20000000', timestamp: 4_000 }));
      store().receive(incoming({ idMessage: 'early', timestamp: 2_000 }));

      expect(store().chats['10000000']!.messageIds).toEqual(['early', 'late']);
      expect(store().order).toEqual(['10000000', '20000000']);
    });
  });

  describe('persistence', () => {
    it('turns pending messages into failed after a reload', async () => {
      store().addChat({ chatId: '10000000', phone: '79991234567' });
      const localId = store().addOutgoing('10000000', 'hi');

      await useChats.persist.rehydrate();

      expect(store().messages[localId]!.status).toBe('failed');
    });

    it('reset clears state and storage', () => {
      store().receive(incoming());
      store().reset();

      expect(store().order).toEqual([]);
      expect(sessionStorage.getItem('chats')).toBeNull();
    });
  });
});
