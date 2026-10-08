import { useChats } from '@/store/chats';
import { ApiError, type Credentials } from '@/api/client';
import { checkAccount } from '@/api/methods';
import { normalizePhone } from '@/lib/recipient';
import { t } from '@/i18n';

export type StartChatResult = { ok: true; chatId: string } | { ok: false; error: string };

/**
 * Phone → chatId via CheckAccount, then add and open the chat.
 * A phone that already has a chat is opened without an API call: checks are limited by the tariff.
 */
export async function startChat(creds: Credentials, input: string): Promise<StartChatResult> {
  const phone = normalizePhone(input);
  if (!phone) return { ok: false, error: t.newChat.errors.invalidPhone };

  const { chats, addChat, openChat } = useChats.getState();
  const existing = Object.values(chats).find((chat) => chat.phone === phone);
  if (existing) {
    openChat(existing.chatId);

    return { ok: true, chatId: existing.chatId };
  }

  try {
    const account = await checkAccount(creds, phone);
    if (!account.exist || !account.chatId) return { ok: false, error: t.newChat.errors.notFound };

    addChat({ chatId: account.chatId, phone });
    openChat(account.chatId);

    return { ok: true, chatId: account.chatId };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return t.newChat.errors.unexpected;
  if (error.status === 0) return t.newChat.errors.network;
  // 200 with `{ status: false, reason }`: the instance isn't ready
  if (error.status === 200) return t.newChat.errors.notAuthorized;
  if (error.status === 400) return t.newChat.errors.invalidPhone;
  if (error.status === 466) return t.newChat.errors.quota;
  if (error.status === 429 || error.status === 469) return t.newChat.errors.tooManyRequests;

  return t.newChat.errors.http(error.status);
}
