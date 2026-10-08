import { describe, expect, it, vi } from 'vitest';
import type { PollerRole } from '@/store/connection';
import { runInSingleTab } from './singleTab';

/**
 * A minimal in-memory LockManager: one holder per name, a FIFO line of waiters,
 * `ifAvailable` and `signal` — the parts runInSingleTab relies on. Shared by "tabs".
 */
function fakeLocks() {
  const held = new Set<string>();
  const waiting = new Map<string, Array<() => void>>();

  function release(name: string) {
    held.delete(name);
    waiting.get(name)?.shift()?.();
  }

  async function request(
    name: string,
    options: LockOptions,
    callback: (lock: Lock | null) => Promise<unknown>,
  ) {
    if (held.has(name)) {
      if (options.ifAvailable) return callback(null);
      await new Promise<void>((resolve, reject) => {
        const queue = waiting.get(name) ?? [];
        queue.push(resolve);
        waiting.set(name, queue);
        options.signal?.addEventListener('abort', () => {
          queue.splice(queue.indexOf(resolve), 1);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    }
    held.add(name);
    try {
      return await callback({ name, mode: 'exclusive' } as Lock);
    } finally {
      release(name);
    }
  }

  return { request } as unknown as LockManager;
}

/** A "tab": its task runs until the tab is closed (aborted). */
function openTab(locks: LockManager) {
  const controller = new AbortController();
  const roles: PollerRole[] = [];
  const task = vi.fn(
    () =>
      new Promise<void>((resolve) => controller.signal.addEventListener('abort', () => resolve())),
  );
  const done = runInSingleTab('poller:1', task, {
    signal: controller.signal,
    onRole: (role) => roles.push(role),
    locks,
  });

  return { roles, task, done, close: () => controller.abort() };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('runInSingleTab', () => {
  it('runs the task in the first tab only; the second waits on standby', async () => {
    const locks = fakeLocks();
    const first = openTab(locks);
    await tick();
    const second = openTab(locks);
    await tick();

    expect(first.roles).toEqual(['active']);
    expect(second.roles).toEqual(['standby']);
    expect(second.task).not.toHaveBeenCalled();

    first.close();
    second.close();
    await Promise.all([first.done, second.done]);
  });

  it('hands over to the waiting tab when the active one closes', async () => {
    const locks = fakeLocks();
    const first = openTab(locks);
    await tick();
    const second = openTab(locks);
    await tick();

    first.close();
    await first.done;
    await tick();

    expect(second.roles).toEqual(['standby', 'active']);
    expect(second.task).toHaveBeenCalledOnce();

    second.close();
    await second.done;
  });

  it('stops waiting quietly when a standby tab is closed', async () => {
    const locks = fakeLocks();
    const first = openTab(locks);
    await tick();
    const second = openTab(locks);
    await tick();

    second.close();
    await expect(second.done).resolves.toBeUndefined();
    expect(second.task).not.toHaveBeenCalled();

    first.close();
    await first.done;
  });

  it('just runs the task where the Web Locks API is missing', async () => {
    const task = vi.fn(async () => {});
    const onRole = vi.fn();
    await runInSingleTab('poller:1', task, {
      signal: new AbortController().signal,
      onRole,
      locks: undefined,
    });

    expect(onRole).toHaveBeenCalledWith('active');
    expect(task).toHaveBeenCalledOnce();
  });
});
