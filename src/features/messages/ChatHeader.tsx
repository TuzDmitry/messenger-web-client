import { Avatar } from '@/ui/Avatar';
import { useChats } from '@/store/chats';
import styles from './ChatHeader.module.css';

type ChatHeaderProps = {
  chatId: string;
};

export function ChatHeader({ chatId }: ChatHeaderProps) {
  const chat = useChats((state) => state.chats[chatId]);
  if (!chat) return null;

  const phoneLabel = chat.phone && `+${chat.phone}`;
  // The phone as a subtitle only once the title is a name
  const subtitle = phoneLabel !== chat.title ? phoneLabel : undefined;

  return (
    <header className={styles.header}>
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
