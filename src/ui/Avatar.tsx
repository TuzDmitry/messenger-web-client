import { PersonIcon } from './icons';
import styles from './Avatar.module.css';

const PALETTE_SIZE = 6;

type AvatarProps = {
  name: string;
  /** Stable value the color is derived from, e.g. chatId. */
  seed: string;
  /** regular: 56px (chat list), small: 40px (chat header) */
  size?: 'regular' | 'small';
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');
}

function colorIndex(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;

  return Math.abs(hash) % PALETTE_SIZE;
}

/** Initials on a color picked from the seed; a person icon when the name has no letters (a phone). */
export function Avatar({ name, seed, size = 'regular' }: AvatarProps) {
  const letters = initials(name);

  return (
    <span
      className={`${styles.avatar} ${styles[size]} ${styles[`color${colorIndex(seed)}`]}`}
      aria-hidden
    >
      {letters || <PersonIcon />}
    </span>
  );
}
