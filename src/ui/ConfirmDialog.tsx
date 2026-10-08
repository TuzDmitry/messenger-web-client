import { useEffect, useId, useRef, type MouseEvent, type SyntheticEvent } from 'react';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Native <dialog> in modal mode: focus trap, Esc and the backdrop come for free.
 * Like MAX, the safe action goes first and is the highlighted one.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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
    onCancel();
  }

  // A click that lands on the <dialog> itself (not its content) is a backdrop click
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onCancel();
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
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
        <div className={styles.actions}>
          <Button
            size="medium"
            autoFocus
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            size="medium"
            variant="secondary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
