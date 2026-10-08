import { create } from 'zustand';

/**
 * Optimistic: long polling only answers after a notification or the timeout, so "online"
 * is assumed until a request actually fails.
 */
export type ConnectionStatus = 'online' | 'reconnecting';

type ConnectionState = {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
};

export const useConnection = create<ConnectionState>()((set) => ({
  status: 'online',
  setStatus: (status) => set({ status }),
}));
