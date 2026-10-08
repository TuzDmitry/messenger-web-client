import { useChats } from '@/store/chats';
import { t } from '@/i18n';
import { ChatListItem } from './ChatListItem';
import styles from './ChatList.module.css';

export function ChatList() {
  const order = useChats((state) => state.order);

  if (order.length === 0) return <p className={styles.empty}>{t.chats.empty}</p>;

  return (
    <ul className={styles.list}>
      {order.map((chatId) => (
        <li key={chatId}>
          <ChatListItem chatId={chatId} />
        </li>
      ))}
    </ul>
  );
}
