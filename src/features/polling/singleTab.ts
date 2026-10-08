import type { PollerRole } from '@/store/connection';

type SingleTabOptions = {
  signal: AbortSignal;
  onRole: (role: PollerRole) => void;
  locks?: LockManager | undefined;
};

/**
 * Runs `task` in at most one tab per lock name (Web Locks API).
 * The tab that holds the lock runs the task; the others wait in line and take over
 * when it is released — the browser releases it even if the holder tab crashes or closes.
 * Without the API (very old browsers) the task just runs.
 */
export async function runInSingleTab(
  name: string,
  task: () => Promise<void>,
  { signal, onRole, locks = globalThis.navigator?.locks }: SingleTabOptions,
): Promise<void> {
  if (!locks) {
    onRole('active');
    await task();

    return;
  }

  async function holdAndRun() {
    onRole('active');
    await task();
  }

  // Free right now? Then no "another tab" banner flashes on a normal load
  const ran = await locks.request(name, { ifAvailable: true }, async (lock) => {
    if (!lock) return false;
    await holdAndRun();

    return true;
  });
  if (ran || signal.aborted) return;

  onRole('standby');
  try {
    await locks.request(name, { signal }, holdAndRun);
  } catch (error) {
    // Aborted while waiting in line: sign out or the tab is going away
    if (!signal.aborted) throw error;
  }
}
