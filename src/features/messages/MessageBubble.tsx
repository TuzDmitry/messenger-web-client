import { AlertIcon, CheckIcon, ClockIcon } from '@/ui/icons';
import type { Message } from '@/store/chats';
import { useSession } from '@/store/session';
import { formatTime } from '@/lib/formatTime';
import { t } from '@/i18n';
import { retryMessage } from './sendText';
import styles from './MessageBubble.module.css';

type MessageBubbleProps = {
  message: Message;
};

const STATUS_ICONS = {
  pending: ClockIcon,
  sent: CheckIcon,
  failed: AlertIcon,
} as const;

export function MessageBubble({ message }: MessageBubbleProps) {
  const credentials = useSession((state) => state.credentials);
  const isOut = message.direction === 'out';
  const StatusIcon = STATUS_ICONS[message.status];
  const dateTime = new Date(message.timestamp).toISOString();

  function handleRetry() {
    if (credentials) void retryMessage(credentials, message.id);
  }

  return (
    <div className={`${styles.wrapper} ${styles[message.direction]}`}>
      <div className={styles.bubble}>
        <span className={styles.text}>{message.text}</span>
        {/* Invisible spacer reserves room so the meta never overlaps the last line */}
        <span
          className={`${styles.spacer} ${isOut ? styles.spacerWithStatus : ''}`}
          aria-hidden
        />
        <span className={styles.meta}>
          <time dateTime={dateTime}>{formatTime(message.timestamp)}</time>
          {isOut && (
            <StatusIcon
              className={`${styles.status} ${styles[message.status]}`}
              aria-hidden={false}
              role="img"
              aria-label={t.message.status[message.status]}
            />
          )}
        </span>
      </div>
      {message.status === 'failed' && (
        <button
          type="button"
          className={styles.retry}
          onClick={handleRetry}
        >
          {t.message.retry}
        </button>
      )}
    </div>
  );
}
