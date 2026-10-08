import { useEffect } from 'react';
import { signOut } from '@/features/auth/signOut';
import { useConnection } from '@/store/connection';
import { useSession } from '@/store/session';
import { t } from '@/i18n';
import { runPoller } from './poller';
import { runInSingleTab } from './singleTab';

function handleUnauthorized() {
  signOut(t.auth.errors.sessionExpired);
}

/**
 * One poller per instance across all tabs, while signed in. It stops when the credentials
 * change or the layout unmounts, and hands the lock over to a waiting tab.
 */
export function usePoller() {
  const credentials = useSession((state) => state.credentials);

  useEffect(() => {
    if (!credentials) return;
    const creds = credentials;
    const controller = new AbortController();
    const { setRole, setStatus, setQueueBusy } = useConnection.getState();

    function poll() {
      return runPoller(creds, {
        signal: controller.signal,
        onUnauthorized: handleUnauthorized,
      });
    }

    void runInSingleTab(`poller:${creds.idInstance}`, poll, {
      signal: controller.signal,
      onRole: setRole,
    });

    return () => {
      controller.abort();
      setStatus('online');
      setRole('unknown');
      setQueueBusy(false);
    };
  }, [credentials]);
}
