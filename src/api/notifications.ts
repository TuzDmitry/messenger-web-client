import type { z } from 'zod';
import { messageNotificationSchema } from './schemas';

export type MessageNotification = {
  direction: 'in' | 'out';
  idMessage: string;
  chatId: string;
  /** Name of the other party. For outgoing messages `senderName` is us, so only `chatName` is used. */
  peerName: string | undefined;
  text: string;
  /** Milliseconds (the API sends seconds). */
  timestamp: number;
};

export type ParsedNotification =
  | { kind: 'message'; message: MessageNotification }
  /** A type we don't handle (statuses, state changes, media…) — just delete it. */
  | { kind: 'ignored'; typeWebhook: string | undefined }
  /** Looks like a message we handle but doesn't match the schema — delete and warn. */
  | { kind: 'invalid'; error: z.ZodError };

const HANDLED_WEBHOOKS = new Set(['incomingMessageReceived', 'outgoingMessageReceived']);
const HANDLED_MESSAGES = new Set(['textMessage', 'extendedTextMessage']);

function readString(value: unknown, key: string): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === 'string' ? field : undefined;
}

export function parseNotificationBody(body: unknown): ParsedNotification {
  const typeWebhook = readString(body, 'typeWebhook');
  const typeMessage = readString(
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>).messageData
      : null,
    'typeMessage',
  );
  if (!typeWebhook || !HANDLED_WEBHOOKS.has(typeWebhook)) return { kind: 'ignored', typeWebhook };
  if (!typeMessage || !HANDLED_MESSAGES.has(typeMessage)) return { kind: 'ignored', typeWebhook };

  const result = messageNotificationSchema.safeParse(body);
  if (!result.success) return { kind: 'invalid', error: result.error };

  const { data } = result;
  const isIncoming = data.typeWebhook === 'incomingMessageReceived';
  const text =
    data.messageData.typeMessage === 'textMessage'
      ? data.messageData.textMessageData.textMessage
      : data.messageData.extendedTextMessageData.text;

  return {
    kind: 'message',
    message: {
      direction: isIncoming ? 'in' : 'out',
      idMessage: data.idMessage,
      chatId: data.senderData.chatId,
      peerName: isIncoming
        ? data.senderData.senderName || data.senderData.chatName || undefined
        : data.senderData.chatName || undefined,
      text,
      timestamp: data.timestamp * 1000,
    },
  };
}
