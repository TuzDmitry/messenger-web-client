import type { Credentials } from '@/api/client';
import { getSettings, setSettings } from '@/api/methods';
import type { Settings } from '@/api/schemas';

const CHECK_EVERY_MS = 15_000;
// GREEN-API says settings take up to 5 minutes to apply
const GIVE_UP_AFTER_MS = 6 * 60_000;

/** Without these the queue stays empty: no incoming messages, no messages sent from the phone. */
export function notificationsEnabled(settings: Settings): boolean {
  return settings.incomingWebhook === 'yes' && settings.outgoingMessageWebhook === 'yes';
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  });
}

/**
 * Turns both notification types on, then re-checks until the instance reports them enabled.
 * Resolves `true` once applied, `false` if it never applied in time. Throws on API errors.
 */
export async function enableNotifications(
  creds: Credentials,
  signal: AbortSignal,
  { checkEvery = CHECK_EVERY_MS, giveUpAfter = GIVE_UP_AFTER_MS } = {},
): Promise<boolean> {
  await setSettings(creds, { incomingWebhook: 'yes', outgoingMessageWebhook: 'yes' });

  const deadline = Date.now() + giveUpAfter;
  while (!signal.aborted && Date.now() < deadline) {
    if (notificationsEnabled(await getSettings(creds, signal))) return true;
    await wait(checkEvery, signal);
  }

  return false;
}
