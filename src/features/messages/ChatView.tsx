import { useChats } from '@/store/chats';
import { t } from '@/i18n';
import { ChatHeader } from './ChatHeader';
import { Composer } from './Composer';
import { MessageList } from './MessageList';
import styles from './ChatView.module.css';

export function ChatView() {
  const activeChatId = useChats((state) => state.activeChatId);
  const exists = useChats((state) => Boolean(activeChatId && state.chats[activeChatId]));

  if (!activeChatId || !exists) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.chip}>{t.feed.noChatSelected}</span>
      </div>
    );
  }

  // key: a fresh view per chat — the list starts scrolled to the bottom, drafts don't leak
  return (
    <div
      key={activeChatId}
      className={styles.view}
    >
      <ChatHeader chatId={activeChatId} />
      <MessageList chatId={activeChatId} />
      <Composer chatId={activeChatId} />
    </div>
  );
}
