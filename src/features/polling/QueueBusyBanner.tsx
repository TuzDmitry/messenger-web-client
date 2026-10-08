import { Banner } from '@/ui/Banner';
import { useConnection } from '@/store/connection';
import { t } from '@/i18n';

/** Another app keeps reading this instance's queue, so some messages may land there. */
export function QueueBusyBanner() {
  const busy = useConnection((state) => state.queueBusy);
  if (!busy) return null;

  return <Banner>{t.connection.queueBusy}</Banner>;
}
