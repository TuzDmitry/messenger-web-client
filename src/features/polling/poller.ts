import { useChats } from '@/store/chats';
import { useConnection } from '@/store/connection';
import { ApiError, isUnauthorized, type Credentials } from '@/api/client';
import { deleteNotification, receiveNotification } from '@/api/methods';
import { parseNotificationBody } from '@/api/notifications';

/** Seconds the server holds a request open when the queue is empty. */
export const RECEIVE_TIMEOUT_S = 20;
// A request that outlives the long-poll window by this much is considered hung
const REQUEST_TIMEOUT_MS = (RECEIVE_TIMEOUT_S + 10) * 1000;
const BACKOFF_MAX_MS = 30_000;
/**
 * GREEN-API serves one long poll per instance at a time: a concurrent one gets 408 after
 * timeout + 5 s. A request we aborted (sign out, lock handover) still counts until it
 * expires, so a single 408 is normal; several in a row mean another client reads the queue.
 */
const QUEUE_BUSY_AFTER = 3;
// 408 normally takes 25 s; this only guards against a hot loop if it ever came instantly
const MIN_GAP_AFTER_BUSY_MS = 1000;

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
  const { setStatus, setQueueBusy } = useConnection.getState();
  let failures = 0;
  let busy = 0;

  while (!signal.aborted) {
    try {
      const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]);
      const envelope = await receiveNotification(creds, RECEIVE_TIMEOUT_S, requestSignal);
      failures = 0;
      busy = 0;
      setStatus('online');
      setQueueBusy(false);
      if (!envelope) continue;

      handleBody(envelope.body);
      // If this fails, the same notification comes back and is deduplicated by idMessage
      await deleteNotification(creds, envelope.receiptId, signal);
    } catch (error) {
      if (signal.aborted) return;
      // Not a failure: the queue is just being listened to by someone else right now
      if (error instanceof ApiError && error.status === 408) {
        failures = 0;
        busy += 1;
        setStatus('online');
        if (busy >= QUEUE_BUSY_AFTER) setQueueBusy(true);
        await sleep(MIN_GAP_AFTER_BUSY_MS, signal);
        continue;
      }
      if (isUnauthorized(error)) {
        onUnauthorized();

        return;
      }
      failures += 1;
      setStatus('reconnecting');
      await sleep(backoffDelay(failures), signal);
    }
  }
}
