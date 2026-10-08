import { useChats } from '@/store/chats';
import type { Credentials } from '@/api/client';
import { sendMessage } from '@/api/methods';

export const MAX_MESSAGE_LENGTH = 4000;

async function deliver(creds: Credentials, localId: string, chatId: string, text: string) {
  const { markSent, markFailed } = useChats.getState();
  try {
    const idMessage = await sendMessage(creds, chatId, text);
    markSent(localId, idMessage);
  } catch {
    markFailed(localId);
  }
}

/** Optimistic send: the message shows up as pending right away, then becomes sent or failed. */
export async function sendText(creds: Credentials, chatId: string, text: string) {
  const localId = useChats.getState().addOutgoing(chatId, text);
  await deliver(creds, localId, chatId, text);
}

/** Retries a failed message in place, under the same local id. */
export async function retryMessage(creds: Credentials, localId: string) {
  const { messages, markPending } = useChats.getState();
  const message = messages[localId];
  if (!message || message.status !== 'failed') return;

  markPending(localId);
  await deliver(creds, localId, message.chatId, message.text);
}
