import { Avatar } from '@/ui/Avatar';
import { useChats } from '@/store/chats';
import { formatChatTime } from '@/lib/formatTime';
import { t } from '@/i18n';
import styles from './ChatList.module.css';

type ChatListItemProps = {
  chatId: string;
};

export function ChatListItem({ chatId }: ChatListItemProps) {
  const chat = useChats((state) => state.chats[chatId]);
  const lastMessage = useChats((state) => {
    const ids = state.chats[chatId]?.messageIds;
    const lastId = ids?.[ids.length - 1];

    return lastId ? state.messages[lastId] : undefined;
  });
  const active = useChats((state) => state.activeChatId === chatId);
  const openChat = useChats((state) => state.openChat);

  if (!chat) return null;

  const phoneLabel = chat.phone && `+${chat.phone}`;
  // Before the first message: the phone, unless it's already the title
  const placeholder = phoneLabel !== chat.title ? phoneLabel : undefined;
  const lastMessageDateTime = lastMessage && new Date(lastMessage.timestamp).toISOString();

  function handleClick() {
    openChat(chatId);
  }

  return (
    <button
      type="button"
      className={styles.item}
      aria-current={active || undefined}
      onClick={handleClick}
    >
      <Avatar
        name={chat.title}
        seed={chatId}
      />
      <span className={styles.body}>
        <span className={styles.row}>
          <span className={styles.title}>{chat.title}</span>
          {lastMessage && (
            <time
              className={styles.time}
              dateTime={lastMessageDateTime}
            >
              {formatChatTime(lastMessage.timestamp)}
            </time>
          )}
        </span>
        <span className={styles.row}>
          <span className={styles.preview}>
            {lastMessage
              ? `${lastMessage.direction === 'out' ? t.chats.you : ''}${lastMessage.text}`
              : placeholder}
          </span>
          {chat.unread > 0 && (
            <span
              className={styles.badge}
              aria-label={t.chats.unread(chat.unread)}
            >
              {chat.unread}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
