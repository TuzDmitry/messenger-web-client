// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChats } from '@/store/chats';
import { useConnection } from '@/store/connection';
import incomingText from '@/api/__fixtures__/incomingTextMessage.json';
import outgoing from '@/api/__fixtures__/outgoingMessage.json';
import type { Credentials } from '@/api/client';
import { backoffDelay, runPoller } from './poller';

const creds: Credentials = {
  apiUrl: 'https://api.green-api.com',
  idInstance: '4100000000',
  apiTokenInstance: 'token',
};

type Step = { body: unknown; status?: number } | Error;

/**
 * Feeds the poller a scripted sequence of responses and aborts it when the script runs out,
 * so every test is a finite loop. Returns every request the poller made.
 */
async function poll(steps: Step[], onUnauthorized = vi.fn()) {
  const controller = new AbortController();
  const requests: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      requests.push(`${init?.method ?? 'GET'} ${String(url).replace(/^.*\/token/, '')}`);
      const step = steps.shift();
      if (!step) {
        controller.abort();
        throw new DOMException('Aborted', 'AbortError');
      }
      if (step instanceof Error) throw step;

      return new Response(JSON.stringify(step.body), { status: step.status ?? 200 });
    }),
  );

  const done = runPoller(creds, { signal: controller.signal, onUnauthorized });
  await vi.runAllTimersAsync();
  await done;

  return { requests, onUnauthorized };
}

const receive = 'GET ?receiveTimeout=20';
const del = (receiptId: number) => `DELETE /${receiptId}`;

describe('runPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useChats.getState().reset();
    useConnection.getState().setStatus('online');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('receives a message into the store and deletes the notification', async () => {
    const { requests } = await poll([{ body: incomingText }, { body: { result: true } }]);

    expect(requests.slice(0, 2)).toEqual([receive, del(incomingText.receiptId)]);
    expect(useChats.getState().chats['10000000']).toMatchObject({ title: 'Иван', unread: 1 });
  });

  it('puts messages sent from the phone into the feed as outgoing', async () => {
    await poll([{ body: outgoing }, { body: { result: true } }]);

    expect(Object.values(useChats.getState().messages)[0]).toMatchObject({ direction: 'out' });
  });

  it('deletes notifications it ignores, so they do not come back', async () => {
    const status = { receiptId: 5, body: { typeWebhook: 'outgoingMessageStatus' } };
    const { requests } = await poll([{ body: status }, { body: { result: true } }]);

    expect(requests.slice(0, 2)).toEqual([receive, del(5)]);
    expect(useChats.getState().order).toEqual([]);
  });

  it('deletes and reports a malformed message instead of getting stuck on it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = {
      receiptId: 6,
      body: { ...incomingText.body, messageData: { typeMessage: 'textMessage' } },
    };
    const { requests } = await poll([{ body: broken }, { body: { result: true } }]);

    expect(requests.slice(0, 2)).toEqual([receive, del(6)]);
    expect(warn).toHaveBeenCalled();
  });

  it('keeps polling on an empty queue without deleting anything', async () => {
    const { requests } = await poll([{ body: null }, { body: null }]);

    expect(requests).toEqual([receive, receive, receive]);
  });

  it('does not duplicate a message whose delete failed and that came again', async () => {
    await poll([
      { body: incomingText },
      new TypeError('Failed to fetch'),
      { body: incomingText },
      { body: { result: true } },
    ]);

    expect(useChats.getState().chats['10000000']!.messageIds).toHaveLength(1);
  });

  it('backs off after failures and reports reconnecting, then online again', async () => {
    const statuses: string[] = [];
    const unsubscribe = useConnection.subscribe((state) => statuses.push(state.status));

    await poll([
      new TypeError('Failed to fetch'),
      new TypeError('Failed to fetch'),
      { body: null },
    ]);
    unsubscribe();

    expect(statuses).toEqual(['reconnecting', 'reconnecting', 'online']);
  });

  it('stops and reports when the token is rejected', async () => {
    const { requests, onUnauthorized } = await poll([{ body: '', status: 401 }, { body: null }]);

    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(requests).toEqual([receive]);
  });
});

describe('backoffDelay', () => {
  it('doubles from 1s and caps at 30s', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(backoffDelay)).toEqual([
      1000, 2000, 4000, 8000, 16000, 30000, 30000,
    ]);
  });
});
