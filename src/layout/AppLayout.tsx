import { t } from '@/i18n'
import { ChatsIcon } from '@/ui/icons'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={`${styles.navItem} ${styles.navItemActive}`} aria-current="page">
          <ChatsIcon />
          {t.nav.chats}
        </div>
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
    </div>
  )
}
