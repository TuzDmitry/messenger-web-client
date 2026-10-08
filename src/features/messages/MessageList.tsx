import { Fragment, useLayoutEffect, useRef } from 'react';
import { useChats } from '@/store/chats';
import { dayKey, formatDay } from '@/lib/formatTime';
import { t } from '@/i18n';
import { MessageBubble } from './MessageBubble';
import styles from './MessageList.module.css';

// Closer than this to the bottom counts as "reading the latest messages"
const STICK_TO_BOTTOM_PX = 120;

type MessageListProps = {
  chatId: string;
};

export function MessageList({ chatId }: MessageListProps) {
  const messageIds = useChats((state) => state.chats[chatId]?.messageIds);
  const messages = useChats((state) => state.messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const lastId = messageIds?.[messageIds.length - 1];
  const lastIsOutgoing = lastId ? messages[lastId]?.direction === 'out' : false;

  // New message: follow it if the user was at the bottom or sent it; don't yank them
  // away from older messages they scrolled up to read
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (scroller && (stickToBottom.current || lastIsOutgoing)) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [lastId, lastIsOutgoing]);

  function handleScroll() {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    stickToBottom.current = distance < STICK_TO_BOTTOM_PX;
  }

  if (!messageIds || messageIds.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.chip}>{t.feed.empty}</span>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={styles.scroller}
      onScroll={handleScroll}
    >
      <ol
        className={styles.list}
        aria-label={t.feed.messages}
      >
        {messageIds.map((id, index) => {
          const message = messages[id];
          if (!message) return null;
          const previous = index > 0 ? messages[messageIds[index - 1]!] : undefined;
          const startsDay = !previous || dayKey(previous.timestamp) !== dayKey(message.timestamp);

          return (
            <Fragment key={id}>
              {startsDay && (
                <li className={styles.day}>
                  <span className={styles.chip}>{formatDay(message.timestamp, t.feed)}</span>
                </li>
              )}
              <li className={styles.item}>
                <MessageBubble message={message} />
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
