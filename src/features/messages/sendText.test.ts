// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChats } from '@/store/chats';
import sendMessageFixture from '@/api/__fixtures__/sendMessage.json';
import type { Credentials } from '@/api/client';
import { retryMessage, sendText } from './sendText';

const creds: Credentials = {
  apiUrl: 'https://api.green-api.com',
  idInstance: '4100000000',
  apiTokenInstance: 'token',
};
const fetchMock = vi.fn<typeof fetch>();
const store = () => useChats.getState();
const onlyMessage = () => Object.values(store().messages)[0]!;

describe('sendText', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    store().reset();
    store().addChat({ chatId: '10000000', phone: '79991234567' });
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('shows the message as pending right away, then as sent under its idMessage', async () => {
    let respond!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise((resolve) => (respond = resolve)));

    const sending = sendText(creds, '10000000', 'hi');
    expect(onlyMessage()).toMatchObject({ status: 'pending', text: 'hi' });

    respond(new Response(JSON.stringify(sendMessageFixture)));
    await sending;

    expect(onlyMessage()).toMatchObject({ id: sendMessageFixture.idMessage, status: 'sent' });
  });

  it('marks the message as failed when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await sendText(creds, '10000000', 'hi');

    expect(onlyMessage().status).toBe('failed');
  });

  it('retries a failed message in place', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await sendText(creds, '10000000', 'hi');
    const failedId = onlyMessage().id;

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(sendMessageFixture)));
    await retryMessage(creds, failedId);

    expect(Object.keys(store().messages)).toEqual([sendMessageFixture.idMessage]);
    expect(store().chats['10000000']!.messageIds).toEqual([sendMessageFixture.idMessage]);
    expect(JSON.parse(String(fetchMock.mock.calls[1]![1]?.body))).toEqual({
      chatId: '10000000',
      message: 'hi',
    });
  });
});
