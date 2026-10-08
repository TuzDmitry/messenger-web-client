import { useChats } from '@/store/chats';
import { useConnection } from '@/store/connection';
import { ApiError, type Credentials } from '@/api/client';
import { deleteNotification, receiveNotification } from '@/api/methods';
import { parseNotificationBody } from '@/api/notifications';

/** Seconds the server holds a request open when the queue is empty. */
export const RECEIVE_TIMEOUT_S = 20;
// A request that outlives the long-poll window by this much is considered hung
const REQUEST_TIMEOUT_MS = (RECEIVE_TIMEOUT_S + 10) * 1000;
const BACKOFF_MAX_MS = 30_000;

/** 1s, 2s, 4s … capped at 30s. */
export function backoffDelay(failures: number): number {
  return Math.min(1000 * 2 ** (failures - 1), BACKOFF_MAX_MS);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/** Never throws: anything we can't use is reported and still deleted, so it can't block the queue. */
function handleBody(body: unknown) {
  const parsed = parseNotificationBody(body);
  if (parsed.kind === 'message') useChats.getState().receive(parsed.message);
  if (parsed.kind === 'invalid') console.warn('Skipping a malformed notification', parsed.error);
}

type PollerOptions = {
  signal: AbortSignal;
  /** The token stopped working: the poller has stopped and the session should end. */
  onUnauthorized: () => void;
};

/**
 * The HTTP API notification queue: receive one → handle → delete it, forever.
 * Every type is deleted, even the ones we ignore, or it would come back again.
 * Runs until `signal` aborts or the credentials are rejected.
 */
export async function runPoller(creds: Credentials, { signal, onUnauthorized }: PollerOptions) {
  const { setStatus } = useConnection.getState();
  let failures = 0;

  while (!signal.aborted) {
    try {
      const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]);
      const envelope = await receiveNotification(creds, RECEIVE_TIMEOUT_S, requestSignal);
      failures = 0;
      setStatus('online');
      if (!envelope) continue;

      handleBody(envelope.body);
      // If this fails, the same notification comes back and is deduplicated by idMessage
      await deleteNotification(creds, envelope.receiptId, signal);
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        onUnauthorized();

        return;
      }
      failures += 1;
      setStatus('reconnecting');
      await sleep(backoffDelay(failures), signal);
    }
  }
}
