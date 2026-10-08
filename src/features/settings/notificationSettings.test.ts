import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Credentials } from '@/api/client';
import { enableNotifications, notificationsEnabled } from './notificationSettings';

const creds: Credentials = {
  apiUrl: 'https://api.green-api.com',
  idInstance: '4100000000',
  apiTokenInstance: 'token',
};

const settings = (incoming: 'yes' | 'no', outgoing: 'yes' | 'no') => ({
  webhookUrl: '',
  incomingWebhook: incoming,
  outgoingMessageWebhook: outgoing,
});

describe('notificationsEnabled', () => {
  it('needs both incoming and phone-sent notifications', () => {
    expect(notificationsEnabled(settings('yes', 'yes'))).toBe(true);
    expect(notificationsEnabled(settings('yes', 'no'))).toBe(false);
    expect(notificationsEnabled(settings('no', 'yes'))).toBe(false);
  });
});

describe('enableNotifications', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const respond = (body: unknown) =>
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body)));

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('turns both on, then re-checks until the instance applies them', async () => {
    respond({ saveSettings: true });
    respond(settings('no', 'no'));
    respond(settings('yes', 'yes'));

    const result = enableNotifications(creds, new AbortController().signal, { checkEvery: 1000 });
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe(true);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({
      incomingWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('gives up when the settings never apply', async () => {
    respond({ saveSettings: true });
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(settings('no', 'no'))));

    const result = enableNotifications(creds, new AbortController().signal, {
      checkEvery: 1000,
      giveUpAfter: 3000,
    });
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe(false);
  });
});
