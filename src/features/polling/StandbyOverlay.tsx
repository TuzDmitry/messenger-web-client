import { Button } from '@/ui/Button';
import { useConnection } from '@/store/connection';
import { t } from '@/i18n';
import styles from './StandbyOverlay.module.css';

/**
 * Like WhatsApp Web's "open in another window": this tab waits for the poller lock, so the
 * app underneath is inert and a card offers to move the session here.
 */
export function StandbyOverlay() {
  const takeOver = useConnection((state) => state.takeOver);

  function handleUseHere() {
    takeOver?.();
  }

  return (
    <div className={styles.overlay}>
      <section
        className={styles.card}
        role="alertdialog"
        aria-labelledby="standby-title"
        aria-describedby="standby-text"
      >
        <h2
          id="standby-title"
          className={styles.title}
        >
          {t.standby.title}
        </h2>
        <p
          id="standby-text"
          className={styles.text}
        >
          {t.standby.text}
        </p>
        <Button
          size="medium"
          autoFocus
          onClick={handleUseHere}
        >
          {t.standby.useHere}
        </Button>
      </section>
    </div>
  );
}
