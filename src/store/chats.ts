import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MessageNotification } from '@/api/notifications';

export type MessageStatus = 'pending' | 'sent' | 'failed';

export type Message = {
  /** `idMessage` from the API; a local id until an outgoing message is confirmed. */
  id: string;
  chatId: string;
  text: string;
  direction: 'in' | 'out';
  /** Milliseconds. */
  timestamp: number;
  status: MessageStatus;
};

export type Chat = {
  chatId: string;
  title: string;
  /** Digits, when the chat was created by phone. Shown under the title once it becomes a name. */
  phone?: string;
  /** Sorted by timestamp, oldest first. */
  messageIds: string[];
  unread: number;
};

type ChatsData = {
  chats: Record<string, Chat>;
  /** Chat ids, most recent activity first. */
  order: string[];
  messages: Record<string, Message>;
  activeChatId: string | null;
};

type ChatsActions = {
  /** Idempotent: an existing chat is returned untouched. */
  addChat: (chat: { chatId: string; phone: string }) => void;
  openChat: (chatId: string) => void;
  /** Back to the chat list (the only way out of a chat on a phone). */
  closeChat: () => void;
  /** Optimistic outgoing message; returns its local id. */
  addOutgoing: (chatId: string, text: string) => string;
  markSent: (localId: string, idMessage: string) => void;
  markFailed: (localId: string) => void;
  markPending: (localId: string) => void;
  /** A message from the notification queue; duplicates (same idMessage) are ignored. */
  receive: (notification: MessageNotification) => void;
  reset: () => void;
};

type ChatsState = ChatsData & ChatsActions;

const initialData: ChatsData = { chats: {}, order: [], messages: {}, activeChatId: null };

function moveToTop(order: string[], chatId: string): string[] {
  return [chatId, ...order.filter((id) => id !== chatId)];
}

/** Keeps `messageIds` ordered by timestamp; new messages are almost always the newest. */
function insertByTime(
  messageIds: string[],
  message: Message,
  messages: Record<string, Message>,
): string[] {
  let index = messageIds.length;
  while (index > 0 && messages[messageIds[index - 1]!]!.timestamp > message.timestamp) index--;

  return [...messageIds.slice(0, index), message.id, ...messageIds.slice(index)];
}

function setStatus(state: ChatsState, id: string, status: MessageStatus): Partial<ChatsState> {
  const message = state.messages[id];
  if (!message) return {};

  return { messages: { ...state.messages, [id]: { ...message, status } } };
}

export const useChats = create<ChatsState>()(
  persist(
    (set) => ({
      ...initialData,

      addChat: ({ chatId, phone }) =>
        set((state) => {
          if (state.chats[chatId]) return {};
          const chat: Chat = { chatId, title: `+${phone}`, phone, messageIds: [], unread: 0 };

          return {
            chats: { ...state.chats, [chatId]: chat },
            order: moveToTop(state.order, chatId),
          };
        }),

      openChat: (chatId) =>
        set((state) => {
          const chat = state.chats[chatId];
          if (!chat) return {};

          return {
            activeChatId: chatId,
            chats: { ...state.chats, [chatId]: { ...chat, unread: 0 } },
          };
        }),

      closeChat: () => set({ activeChatId: null }),

      addOutgoing: (chatId, text) => {
        const message: Message = {
          id: `local-${crypto.randomUUID()}`,
          chatId,
          text,
          direction: 'out',
          timestamp: Date.now(),
          status: 'pending',
        };
        set((state) => {
          const chat = state.chats[chatId];
          if (!chat) return {};
          const messages = { ...state.messages, [message.id]: message };

          return {
            messages,
            chats: {
              ...state.chats,
              [chatId]: { ...chat, messageIds: insertByTime(chat.messageIds, message, messages) },
            },
            order: moveToTop(state.order, chatId),
          };
        });

        return message.id;
      },

      // Re-keys the message by its real idMessage, so a later notification about it is a duplicate
      markSent: (localId, idMessage) =>
        set((state) => {
          const message = state.messages[localId];
          const chat = message && state.chats[message.chatId];
          if (!message || !chat) return {};

          const { [localId]: _, ...messages } = state.messages;
          // The notification may have arrived before the sendMessage response
          const alreadyReceived = Boolean(messages[idMessage]);
          if (!alreadyReceived) messages[idMessage] = { ...message, id: idMessage, status: 'sent' };
          const messageIds = alreadyReceived
            ? chat.messageIds.filter((id) => id !== localId)
            : chat.messageIds.map((id) => (id === localId ? idMessage : id));

          return { messages, chats: { ...state.chats, [chat.chatId]: { ...chat, messageIds } } };
        }),

      markFailed: (localId) => set((state) => setStatus(state, localId, 'failed')),
      markPending: (localId) => set((state) => setStatus(state, localId, 'pending')),

      receive: (notification) =>
        set((state) => {
          if (state.messages[notification.idMessage]) return {};

          const { chatId, peerName } = notification;
          const existing = state.chats[chatId];
          const chat: Chat = existing ?? {
            chatId,
            title: peerName ?? chatId,
            messageIds: [],
            unread: 0,
          };
          // A chat created by phone gets the person's name once we learn it
          const title =
            existing?.phone && peerName && chat.title === `+${chat.phone}` ? peerName : chat.title;

          const message: Message = {
            id: notification.idMessage,
            chatId,
            text: notification.text,
            direction: notification.direction,
            timestamp: notification.timestamp,
            status: 'sent',
          };
          const messages = { ...state.messages, [message.id]: message };
          const isUnread = message.direction === 'in' && state.activeChatId !== chatId;

          return {
            messages,
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                title,
                messageIds: insertByTime(chat.messageIds, message, messages),
                unread: chat.unread + (isUnread ? 1 : 0),
              },
            },
            order: moveToTop(state.order, chatId),
          };
        }),

      reset: () => {
        set(initialData);
        useChats.persist.clearStorage();
      },
    }),
    {
      name: 'chats',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ chats, order, messages, activeChatId }) => ({
        chats,
        order,
        messages,
        activeChatId,
      }),
      // A request cut off by F5 never resolves: show it as failed so the user can retry.
      // No auto-retry — if it did reach the server, the recipient would get it twice.
      merge: (persisted, current) => {
        const data = persisted as Partial<ChatsData>;
        const messages = Object.fromEntries(
          Object.entries(data.messages ?? {}).map(([id, message]) => [
            id,
            message.status === 'pending' ? { ...message, status: 'failed' as const } : message,
          ]),
        );

        return { ...current, ...data, messages };
      },
    },
  ),
);
