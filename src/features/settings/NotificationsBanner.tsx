import { useEffect, useRef, useState } from 'react';
import { Banner } from '@/ui/Banner';
import { useSession } from '@/store/session';
import { getSettings } from '@/api/methods';
import { t } from '@/i18n';
import { enableNotifications, notificationsEnabled } from './notificationSettings';
import styles from './NotificationsBanner.module.css';

type State = 'ok' | 'disabled' | 'enabling' | 'failed';

/**
 * Checks the instance settings once after sign in. If notifications are off, nothing would
 * ever arrive and nothing would say why — so a banner offers to turn them on.
 */
export function NotificationsBanner() {
  const credentials = useSession((state) => state.credentials);
  const [state, setState] = useState<State>('ok');
  const enabling = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!credentials) return;
    const creds = credentials;
    const controller = new AbortController();

    async function check() {
      try {
        const settings = await getSettings(creds, controller.signal);
        if (!controller.signal.aborted && !notificationsEnabled(settings)) setState('disabled');
      } catch {
        // Not critical: polling still works or reports its own errors
      }
    }

    void check();

    return () => {
      controller.abort();
      enabling.current?.abort();
    };
  }, [credentials]);

  async function handleEnable() {
    if (!credentials) return;
    const controller = new AbortController();
    enabling.current = controller;
    setState('enabling');
    try {
      const applied = await enableNotifications(credentials, controller.signal);
      if (!controller.signal.aborted) setState(applied ? 'ok' : 'failed');
    } catch {
      if (!controller.signal.aborted) setState('failed');
    }
  }

  if (state === 'ok') return null;

  const enableButton = (
    <button
      type="button"
      className={styles.action}
      onClick={handleEnable}
    >
      {state === 'failed' ? t.notifications.retry : t.notifications.enable}
    </button>
  );

  return (
    <Banner action={state === 'enabling' ? undefined : enableButton}>
      {t.notifications[state]}
    </Banner>
  );
}
