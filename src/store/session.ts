import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Credentials } from '@/api/client';

type SessionState = {
  credentials: Credentials | null;
  signIn: (credentials: Credentials) => void;
  signOut: () => void;
};

/** Credentials survive F5 but die with the tab (sessionStorage). */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      credentials: null,
      signIn: (credentials) => set({ credentials }),
      signOut: () => {
        set({ credentials: null });
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
