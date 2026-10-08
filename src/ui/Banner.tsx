import type { ReactNode } from 'react';
import styles from './Banner.module.css';

type BannerProps = {
  children: ReactNode;
  /** Optional action on the right, e.g. a button. */
  action?: ReactNode;
};

/** A non-blocking notice above the feed; stays until its cause is gone. */
export function Banner({ children, action }: BannerProps) {
  return (
    <div
      className={styles.banner}
      role="status"
    >
      <p className={styles.text}>{children}</p>
      {action}
    </div>
  );
}
