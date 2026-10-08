// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChats } from '@/store/chats';
import checkAccountFixture from '@/api/__fixtures__/checkAccount.json';
import type { Credentials } from '@/api/client';
import { t } from '@/i18n';
import { startChat } from './startChat';

const creds: Credentials = {
  apiUrl: 'https://api.green-api.com',
  idInstance: '4100000000',
  apiTokenInstance: 'token',
};
const fetchMock = vi.fn<typeof fetch>();
const respond = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));

describe('startChat', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    useChats.getState().reset();
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('checks the normalized phone, then adds and opens the chat', async () => {
    respond(checkAccountFixture);

    await expect(startChat(creds, '+7 (999) 123-45-67')).resolves.toEqual({
      ok: true,
      chatId: '10000000',
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]![1]?.body));
    expect(body).toEqual({ phoneNumber: 79991234567 });
    expect(useChats.getState().activeChatId).toBe('10000000');
    expect(useChats.getState().chats['10000000']).toMatchObject({ phone: '79991234567' });
  });

  it('opens an existing chat for the same phone without calling the API', async () => {
    useChats.getState().addChat({ chatId: '10000000', phone: '79991234567' });

    await expect(startChat(creds, '79991234567')).resolves.toEqual({
      ok: true,
      chatId: '10000000',
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(useChats.getState().activeChatId).toBe('10000000');
  });

  it('rejects an invalid phone without calling the API', async () => {
    await expect(startChat(creds, '+7 999')).resolves.toEqual({
      ok: false,
      error: t.newChat.errors.invalidPhone,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a number that is not registered', async () => {
    respond({ exist: false });
    await expect(startChat(creds, '79991234567')).resolves.toEqual({
      ok: false,
      error: t.newChat.errors.notFound,
    });
    expect(useChats.getState().order).toEqual([]);
  });

  it.each([
    [{ status: false, reason: 'instance is starting or not authorized' }, 200, 'notAuthorized'],
    [{ status: false, reason: 'Validation failed' }, 400, 'invalidPhone'],
    ['', 466, 'quota'],
    ['', 469, 'tooManyRequests'],
  ] as const)('maps %o / HTTP %i to %s', async (body, status, key) => {
    respond(body, status);
    await expect(startChat(creds, '79991234567')).resolves.toEqual({
      ok: false,
      error: t.newChat.errors[key],
    });
  });
});
