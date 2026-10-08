import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  /** large: 60px (forms), medium: 52px (dialogs) — MAX sizes */
  size?: 'large' | 'medium';
};

export function Button({ variant = 'primary', size = 'large', className, ...props }: ButtonProps) {
  return (
    <button
      className={[styles.button, styles[variant], styles[size], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
