import { Button } from './Button';
import { Modal } from './Modal';
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

/** Like MAX, the safe action goes first and is the highlighted (and focused) one. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
    >
      <div className={styles.actions}>
        <Button
          size="medium"
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
    </Modal>
  );
}
