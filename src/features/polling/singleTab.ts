import type { PollerRole } from '@/store/connection';

type SingleTabOptions = {
  onRole: (role: PollerRole) => void;
  locks?: LockManager | undefined;
};

export type SingleTab = {
  /** Take the lock from the active tab ("use here"); that tab goes back to waiting. */
  takeOver: () => void;
  stop: () => void;
};

/**
 * Runs `task` in at most one tab per lock name (Web Locks API).
 * The tab that holds the lock runs the task; the others wait in line and take over when
 * it is released — the browser releases it even if the holder tab crashes or closes.
 * `takeOver()` steals the lock; the robbed tab aborts its task and waits again.
 * Without the API (very old browsers) the task just runs.
 */
export function startSingleTab(
  name: string,
  task: (signal: AbortSignal) => Promise<void>,
  { onRole, locks = globalThis.navigator?.locks }: SingleTabOptions,
): SingleTab {
  const stopped = new AbortController();
  let waiting = new AbortController();
  let steal = false;
  // takeOver() only makes sense while this tab is waiting in line
  let inLine = false;

  async function loop() {
    if (!locks) {
      onRole('active');
      await task(stopped.signal);

      return;
    }

    // Free right now? Then no "another tab" overlay flashes on a normal load
    let mode: 'ifAvailable' | 'wait' | 'steal' = 'ifAvailable';

    while (!stopped.signal.aborted) {
      const lost = new AbortController();
      const taskSignal = AbortSignal.any([stopped.signal, lost.signal]);
      waiting = new AbortController();
      const options: LockOptions =
        mode === 'ifAvailable'
          ? { ifAvailable: true }
          : mode === 'steal'
            ? { steal: true }
            : { signal: AbortSignal.any([stopped.signal, waiting.signal]) };

      inLine = mode === 'wait';
      try {
        const ran = await locks.request(name, options, async (lock) => {
          inLine = false;
          if (!lock) return false;
          onRole('active');
          await task(taskSignal);

          return true;
        });
        // The task finished on its own (e.g. the token was rejected): we're done
        if (ran) return;
        onRole('standby');
        mode = 'wait';
      } catch (error) {
        if (stopped.signal.aborted) return;
        if (steal) {
          // takeOver() cancelled our place in line: next round steals the lock
          steal = false;
          mode = 'steal';
        } else if (error instanceof DOMException && error.name === 'AbortError') {
          // Another tab stole the lock from us: stop working and wait in line again
          lost.abort();
          onRole('standby');
          mode = 'wait';
        } else {
          throw error;
        }
      }
    }
  }

  void loop();

  return {
    takeOver: () => {
      if (!inLine) return;
      steal = true;
      waiting.abort();
    },
    stop: () => stopped.abort(),
  };
}
