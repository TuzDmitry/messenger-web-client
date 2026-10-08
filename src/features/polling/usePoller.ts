import { useEffect } from 'react';
import { signOut } from '@/features/auth/signOut';
import { useConnection } from '@/store/connection';
import { useSession } from '@/store/session';
import { t } from '@/i18n';
import { runPoller } from './poller';

function handleUnauthorized() {
  signOut(t.auth.errors.sessionExpired);
}

/** One poller while signed in; it stops when the credentials change or the layout unmounts. */
export function usePoller() {
  const credentials = useSession((state) => state.credentials);

  useEffect(() => {
    if (!credentials) return;
    const controller = new AbortController();
    void runPoller(credentials, { signal: controller.signal, onUnauthorized: handleUnauthorized });

    return () => {
      controller.abort();
      useConnection.getState().setStatus('online');
    };
  }, [credentials]);
}
