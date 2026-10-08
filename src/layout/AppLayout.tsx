import { useState } from 'react';
import { signOut } from '@/features/auth/signOut';
import { ChatList } from '@/features/chats/ChatList';
import { NewChatDialog } from '@/features/chats/NewChatDialog';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { ChatsIcon, LogoutIcon, PlusIcon } from '@/ui/icons';
import { t } from '@/i18n';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  function openSignOutDialog() {
    setConfirmingSignOut(true);
  }

  function closeSignOutDialog() {
    setConfirmingSignOut(false);
  }

  function openNewChatDialog() {
    setCreatingChat(true);
  }

  function closeNewChatDialog() {
    setCreatingChat(false);
  }

  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div
          className={`${styles.navItem} ${styles.navItemActive}`}
          aria-current="page"
        >
          <ChatsIcon />
          {t.nav.chats}
        </div>

        <button
          type="button"
          className={`${styles.navItem} ${styles.navBottom}`}
          onClick={openSignOutDialog}
        >
          <LogoutIcon />
          {t.nav.signOut}
        </button>
      </nav>

      <aside className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>{t.chats.title}</h1>
          <button
            type="button"
            className={styles.newChatButton}
            aria-label={t.newChat.open}
            title={t.newChat.open}
            onClick={openNewChatDialog}
          >
            <PlusIcon />
          </button>
        </header>
        <ChatList />
      </aside>

      <main className={styles.feed}>
        <p className={styles.placeholder}>
          <span className={styles.chip}>{t.feed.noChatSelected}</span>
        </p>
      </main>

      <NewChatDialog
        open={creatingChat}
        onClose={closeNewChatDialog}
      />

      <ConfirmDialog
        open={confirmingSignOut}
        title={t.signOutDialog.title}
        description={t.signOutDialog.description}
        confirmLabel={t.signOutDialog.confirm}
        cancelLabel={t.signOutDialog.cancel}
        onConfirm={signOut}
        onCancel={closeSignOutDialog}
      />
    </div>
  );
}
