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

  return (
    <div className={styles.view}>
      <ChatHeader chatId={activeChatId} />
      {/* key: a fresh list per chat, so it starts scrolled to the bottom */}
      <MessageList
        key={activeChatId}
        chatId={activeChatId}
      />
      {/* key: drafts don't leak between chats */}
      <Composer
        key={activeChatId}
        chatId={activeChatId}
      />
    </div>
  );
}
