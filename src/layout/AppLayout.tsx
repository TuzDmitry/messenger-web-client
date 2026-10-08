import { useState } from 'react';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { ChatsIcon, LogoutIcon } from '@/ui/icons';
import { useSession } from '@/store/session';
import { t } from '@/i18n';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const signOut = useSession((state) => state.signOut);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  function openSignOutDialog() {
    setConfirmingSignOut(true);
  }

  function closeSignOutDialog() {
    setConfirmingSignOut(false);
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
        </header>
        <p className={styles.placeholder}>{t.chats.empty}</p>
      </aside>

      <main className={styles.feed}>
        <p className={styles.placeholder}>
          <span className={styles.chip}>{t.feed.noChatSelected}</span>
        </p>
      </main>

      <ConfirmDialog
        open={confirmingSignOut}
        title={t.signOutDialog.title}
        confirmLabel={t.signOutDialog.confirm}
        cancelLabel={t.signOutDialog.cancel}
        onConfirm={signOut}
        onCancel={closeSignOutDialog}
      />
    </div>
  );
}
