import type { Message } from '@/store/chats';
import { formatTime } from '@/lib/formatTime';
import styles from './MessageBubble.module.css';

type MessageBubbleProps = {
  message: Message;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={`${styles.bubble} ${styles[message.direction]}`}>
      <span className={styles.text}>{message.text}</span>
      {/* Invisible spacer reserves room so the time never overlaps the last line */}
      <span
        className={styles.spacer}
        aria-hidden
      />
      <time
        className={styles.time}
        dateTime={new Date(message.timestamp).toISOString()}
      >
        {formatTime(message.timestamp)}
      </time>
    </div>
  );
}
