import { Avatar } from '@/ui/Avatar';
import { BackIcon } from '@/ui/icons';
import { useChats } from '@/store/chats';
import { t } from '@/i18n';
import styles from './ChatHeader.module.css';

type ChatHeaderProps = {
  chatId: string;
};

export function ChatHeader({ chatId }: ChatHeaderProps) {
  const chat = useChats((state) => state.chats[chatId]);
  const closeChat = useChats((state) => state.closeChat);
  if (!chat) return null;

  const phoneLabel = chat.phone && `+${chat.phone}`;
  // The phone as a subtitle only once the title is a name
  const subtitle = phoneLabel !== chat.title ? phoneLabel : undefined;

  return (
    <header className={styles.header}>
      {/* MAX has it on desktop too; on a phone it is the only way back to the list */}
      <button
        type="button"
        className={styles.back}
        aria-label={t.feed.back}
        title={t.feed.back}
        onClick={closeChat}
      >
        <BackIcon />
      </button>
      <Avatar
        name={chat.title}
        seed={chatId}
        size="small"
      />
      <div className={styles.text}>
        <h2 className={styles.title}>{chat.title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </header>
  );
}
