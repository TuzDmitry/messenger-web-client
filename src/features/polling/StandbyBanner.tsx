import { Banner } from '@/ui/Banner';
import { useConnection } from '@/store/connection';
import { t } from '@/i18n';

/** This tab waits for the poller lock: another tab receives the messages. */
export function StandbyBanner() {
  const standby = useConnection((state) => state.role === 'standby');
  if (!standby) return null;

  return <Banner>{t.connection.standby}</Banner>;
}
