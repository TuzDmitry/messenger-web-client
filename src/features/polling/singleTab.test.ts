import { describe, expect, it, vi } from 'vitest';
import type { PollerRole } from '@/store/connection';
import { startSingleTab } from './singleTab';

/**
 * A minimal in-memory LockManager shared by "tabs": one holder per name, a FIFO line of
 * waiters, `ifAvailable`, `signal` and `steal` — the parts startSingleTab relies on.
 * As in browsers, a robbed holder's request rejects with AbortError while its callback
 * keeps running.
 */
function fakeLocks() {
  type Holder = { reject: (error: unknown) => void };
  let holder: Holder | null = null;
  const line: Array<() => void> = [];

  function release(me: Holder) {
    if (holder !== me) return;
    holder = null;
    line.shift()?.();
  }

  function request(
    _name: string,
    options: LockOptions,
    callback: (lock: Lock | null) => Promise<unknown>,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const me: Holder = { reject };

      function grant() {
        holder = me;
        callback({ name: _name, mode: 'exclusive' } as Lock).then(
          (value) => {
            if (holder === me) resolve(value);
            release(me);
          },
          (error) => {
            if (holder === me) reject(error);
            release(me);
          },
        );
      }

      if (!holder) return grant();
      if (options.ifAvailable) return void callback(null).then(resolve, reject);
      if (options.steal) {
        holder.reject(new DOMException('Stolen', 'AbortError'));
        holder = null;

        return grant();
      }
      line.push(grant);
      options.signal?.addEventListener('abort', () => {
        line.splice(line.indexOf(grant), 1);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }

  return { request } as unknown as LockManager;
}

/** A "tab": its task runs until it is aborted. */
function openTab(locks: LockManager) {
  const roles: PollerRole[] = [];
  const runs = { started: 0, aborted: 0 };
  function task(signal: AbortSignal) {
    runs.started += 1;

    return new Promise<void>((resolve) =>
      signal.addEventListener('abort', () => {
        runs.aborted += 1;
        resolve();
      }),
    );
  }
  function onRole(role: PollerRole) {
    roles.push(role);
  }
  const tab = startSingleTab('poller:1', task, { onRole, locks });

  return { roles, runs, ...tab };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('startSingleTab', () => {
  it('runs the task in the first tab only; the second waits on standby', async () => {
    const locks = fakeLocks();
    const first = openTab(locks);
    await tick();
    const second = openTab(locks);
    await tick();

    expect(first.roles).toEqual(['active']);
    expect(second.roles).toEqual(['standby']);
    expect(second.runs.started).toBe(0);

    first.stop();
    second.stop();
  });

  it('hands over to the waiting tab when the active one closes', async () => {
    const locks = fakeLocks();
    const first = openTab(locks);
    await tick();
    const second = openTab(locks);
    await tick();

    first.stop();
    await tick();

    expect(second.roles).toEqual(['standby', 'active']);
    expect(second.runs.started).toBe(1);
    second.stop();
  });

  it('"use here" takes over: the other tab stops its task and waits', async () => {
    const locks = fakeLocks();
    const first = openTab(locks);
    await tick();
    const second = openTab(locks);
    await tick();

    second.takeOver();
    await tick();
    await tick();

    expect(second.roles).toEqual(['standby', 'active']);
    expect(first.roles).toEqual(['active', 'standby']);
    expect(first.runs.aborted).toBe(1);

    // And back: the first tab can take it over again
    first.takeOver();
    await tick();
    await tick();
    expect(first.roles).toEqual(['active', 'standby', 'active']);
    expect(second.roles).toEqual(['standby', 'active', 'standby']);

    first.stop();
    second.stop();
  });

  it('ignores takeOver in the active tab', async () => {
    const locks = fakeLocks();
    const only = openTab(locks);
    await tick();

    only.takeOver();
    await tick();

    expect(only.roles).toEqual(['active']);
    expect(only.runs.aborted).toBe(0);
    only.stop();
  });

  it('just runs the task where the Web Locks API is missing', async () => {
    const task = vi.fn(async () => {});
    const onRole = vi.fn();
    startSingleTab('poller:1', task, { onRole, locks: undefined });
    await tick();

    expect(onRole).toHaveBeenCalledWith('active');
    expect(task).toHaveBeenCalledOnce();
  });
});
