import { useEffect } from 'react';
import { signOut } from '@/features/auth/signOut';
import { useConnection } from '@/store/connection';
import { useSession } from '@/store/session';
import { t } from '@/i18n';
import { runPoller } from './poller';
import { startSingleTab } from './singleTab';

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
    const { setRole, setStatus, setQueueBusy, setTakeOver } = useConnection.getState();

    function poll(signal: AbortSignal) {
      return runPoller(creds, { signal, onUnauthorized: handleUnauthorized });
    }

    const tab = startSingleTab(`poller:${creds.idInstance}`, poll, { onRole: setRole });
    setTakeOver(tab.takeOver);

    return () => {
      tab.stop();
      setTakeOver(null);
      setStatus('online');
      setRole('unknown');
      setQueueBusy(false);
    };
  }, [credentials]);
}
