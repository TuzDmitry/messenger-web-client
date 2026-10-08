import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Credentials } from '@/api/client';

type SessionState = {
  credentials: Credentials | null;
  /** Why the user was signed out, shown on the login screen. Not persisted. */
  notice: string | null;
  signIn: (credentials: Credentials) => void;
  signOut: (notice?: string) => void;
};

/** Credentials survive F5 but die with the tab (sessionStorage). */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      credentials: null,
      notice: null,
      signIn: (credentials) => set({ credentials, notice: null }),
      signOut: (notice) => {
        set({ credentials: null, notice: notice ?? null });
        // Don't leave even `{ credentials: null }` behind in storage
        useSession.persist.clearStorage();
      },
    }),
    {
      name: 'session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ credentials }) => ({ credentials }),
    },
  ),
);
