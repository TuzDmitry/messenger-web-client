import { useState } from 'react';
import { signOut } from '@/features/auth/signOut';
import { ChatList } from '@/features/chats/ChatList';
import { NewChatDialog } from '@/features/chats/NewChatDialog';
import { ChatView } from '@/features/messages/ChatView';
import { QueueBusyBanner } from '@/features/polling/QueueBusyBanner';
import { StandbyOverlay } from '@/features/polling/StandbyOverlay';
import { usePoller } from '@/features/polling/usePoller';
import { NotificationsBanner } from '@/features/settings/NotificationsBanner';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { ChatsIcon, LogoutIcon, PlusIcon } from '@/ui/icons';
import { useChats } from '@/store/chats';
import { useConnection } from '@/store/connection';
import { t } from '@/i18n';
import styles from './AppLayout.module.css';

export function AppLayout() {
  usePoller();
  const reconnecting = useConnection((state) => state.status === 'reconnecting');
  const standby = useConnection((state) => state.role === 'standby');
  // On a phone only one column fits: the list, or the open chat
  const view = useChats((state) => (state.activeChatId ? 'chat' : 'list'));
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
    <>
      {/* While another tab is active, the app is visible but inert: no clicks, focus or screen reader */}
      <div
        className={styles.layout}
        data-view={view}
        inert={standby}
      >
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
            <div className={styles.sidebarHeading}>
              <h1 className={styles.sidebarTitle}>{t.chats.title}</h1>
              <p
                className={styles.connection}
                role="status"
              >
                {reconnecting && t.connection.reconnecting}
              </p>
            </div>
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
          <NotificationsBanner />
          <QueueBusyBanner />
          <ChatView />
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
      {standby && <StandbyOverlay />}
    </>
  );
}
