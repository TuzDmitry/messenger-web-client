// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { signOut } from '@/features/auth/signOut';
import checkAccountFixture from '@/api/__fixtures__/checkAccount.json';
import incomingText from '@/api/__fixtures__/incomingTextMessage.json';
import sendMessageFixture from '@/api/__fixtures__/sendMessage.json';
import { t } from '@/i18n';
import { App } from './App';

type Call = { method: string; body: unknown };

const json = (body: unknown) => new Response(JSON.stringify(body));

/**
 * GREEN-API as the client sees it: routes by the method in the URL and keeps a real
 * notification queue. `receiveNotification` on an empty queue hangs like a long poll
 * until something is pushed or the poller aborts.
 */
function fakeGreenApi() {
  const queue: unknown[] = [];
  const calls: Call[] = [];
  // fetch errors are swallowed into ApiError by the client, so unknown calls are collected
  const unexpected: string[] = [];
  let wake: (() => void) | null = null;

  function nextNotification(signal?: AbortSignal | null): Promise<void> {
    if (queue.length > 0) return Promise.resolve();

    return new Promise((resolve, reject) => {
      wake = resolve;
      signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  }

  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    // `/waInstance{id}/{method}/{token}[/{receiptId}]`
    const method = new URL(String(input)).pathname.split('/')[2] ?? '';
    calls.push({ method, body: init?.body ? JSON.parse(String(init.body)) : undefined });

    switch (method) {
      case 'getStateInstance':
        return json({ stateInstance: 'authorized' });
      case 'getSettings':
        return json({ webhookUrl: '', incomingWebhook: 'yes', outgoingMessageWebhook: 'yes' });
      case 'checkAccount':
        return json(checkAccountFixture);
      case 'sendMessage':
        return json(sendMessageFixture);
      case 'receiveNotification':
        await nextNotification(init?.signal);

        return json(queue[0]);
      case 'deleteNotification':
        queue.shift();

        return json({ result: true });
      default:
        unexpected.push(method);

        return new Response('', { status: 404 });
    }
  });

  return {
    fetch,
    calls,
    unexpected,
    push(notification: unknown) {
      queue.push(notification);
      wake?.();
      wake = null;
    },
  };
}

describe('App', () => {
  beforeAll(() => {
    // jsdom has <dialog> but not its modal API
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
  });

  let api: ReturnType<typeof fakeGreenApi>;

  beforeEach(() => {
    api = fakeGreenApi();
    vi.stubGlobal('fetch', api.fetch);
  });

  afterEach(() => {
    // Unmounting stops the poller; signing out clears the stores and sessionStorage
    cleanup();
    signOut();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('signs in, starts a chat by phone, sends a message and shows the reply', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Sign in
    await user.type(screen.getByLabelText(t.auth.idInstance), '4100000000');
    await user.type(screen.getByLabelText(t.auth.apiTokenInstance), 'token');
    await user.click(screen.getByRole('button', { name: t.auth.submit }));
    await screen.findByRole('heading', { name: t.chats.title });

    // New chat by phone
    await user.click(screen.getByRole('button', { name: t.newChat.open }));
    const phoneField = screen.getByLabelText<HTMLInputElement>(t.newChat.phone);
    await user.type(phoneField, '+7 999 123-45-67');
    // The field keeps digits only; the `+` is drawn by the field
    expect(phoneField.value).toBe('79991234567');
    await user.click(screen.getByRole('button', { name: t.newChat.submit }));
    const composer = await screen.findByRole('textbox', { name: t.composer.placeholder });
    expect(api.calls.find((call) => call.method === 'checkAccount')?.body).toEqual({
      phoneNumber: 79991234567,
    });

    // Send
    await user.type(composer, 'Привет{Enter}');
    expect(await screen.findByRole('img', { name: t.message.status.sent })).toBeTruthy();
    expect(api.calls.find((call) => call.method === 'sendMessage')?.body).toEqual({
      chatId: checkAccountFixture.chatId,
      message: 'Привет',
    });

    // The reply arrives through the notification queue
    api.push(incomingText);
    const feed = screen.getByRole('list', { name: t.feed.messages });
    expect(
      await within(feed).findByText(incomingText.body.messageData.textMessageData.textMessage),
    ).toBeTruthy();
    await waitFor(() => {
      expect(api.calls.some((call) => call.method === 'deleteNotification')).toBe(true);
    });
    // The chat created by phone now carries the sender's name
    expect(
      screen.getByRole('button', { name: new RegExp(incomingText.body.senderData.senderName) }),
    ).toBeTruthy();

    expect(api.unexpected).toEqual([]);
  });
});
