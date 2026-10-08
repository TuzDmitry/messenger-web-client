import { create } from 'zustand';

/**
 * Optimistic: long polling only answers after a notification or the timeout, so "online"
 * is assumed until a request actually fails.
 */
export type ConnectionStatus = 'online' | 'reconnecting';

/**
 * Which tab receives notifications: the queue is per instance, so only one tab may poll.
 * `unknown` until the first lock attempt resolves, so nothing flashes on load.
 */
export type PollerRole = 'unknown' | 'active' | 'standby';

type ConnectionState = {
  status: ConnectionStatus;
  role: PollerRole;
  /** Another client keeps answering the same queue: some messages may go there instead. */
  queueBusy: boolean;
  /** Set while a poller runs: makes this tab the active one ("use here"). */
  takeOver: (() => void) | null;
  setStatus: (status: ConnectionStatus) => void;
  setRole: (role: PollerRole) => void;
  setQueueBusy: (queueBusy: boolean) => void;
  setTakeOver: (takeOver: (() => void) | null) => void;
};

export const useConnection = create<ConnectionState>()((set) => ({
  status: 'online',
  role: 'unknown',
  queueBusy: false,
  takeOver: null,
  setStatus: (status) => set({ status }),
  setRole: (role) => set({ role }),
  setQueueBusy: (queueBusy) => set({ queueBusy }),
  setTakeOver: (takeOver) => set({ takeOver }),
}));
