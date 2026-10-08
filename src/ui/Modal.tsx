import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import styles from './Modal.module.css';

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  /** Esc and backdrop click. */
  onClose: () => void;
  /** px; MAX uses 400 for confirmations and 420 for forms. */
  width?: number;
  children: ReactNode;
};

/**
 * web.max.ru modal on a native <dialog> in modal mode: focus trap, Esc and the backdrop
 * come for free, and showModal() focuses the first control inside.
 */
export function Modal({ open, title, description, onClose, width = 400, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Esc: keep the dialog open until the parent flips `open`
  function handleEscape(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  // A click that lands on the <dialog> itself (not its content) is a backdrop click
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      style={{ maxWidth: width }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleEscape}
      onClick={handleBackdropClick}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2
            id={titleId}
            className={styles.title}
          >
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className={styles.description}
            >
              {description}
            </p>
          )}
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}
