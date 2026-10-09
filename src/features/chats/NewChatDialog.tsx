import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';
import { TextField } from '@/ui/TextField';
import { useSession } from '@/store/session';
import { phoneDigits } from '@/lib/recipient';
import { t } from '@/i18n';
import { startChat } from './startChat';
import styles from './NewChatDialog.module.css';

type NewChatDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function NewChatDialog({ open, onClose }: NewChatDialogProps) {
  const credentials = useSession((state) => state.credentials);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  // The field keeps digits only, so there's nothing to trim
  const canSubmit = phone !== '';

  function handleClose() {
    setPhone('');
    setError(undefined);
    onClose();
  }

  // Digits only. When something was dropped, the input is fixed up in place with the caret
  // where it was: otherwise React would set the value and throw the caret to the end
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const digits = phoneDigits(input.value);
    if (digits !== input.value) {
      const caret = phoneDigits(input.value.slice(0, input.selectionStart ?? undefined)).length;
      input.value = digits;
      input.setSelectionRange(caret, caret);
    }
    setPhone(digits);
    setError(undefined);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!credentials || submitting || !canSubmit) return;

    setSubmitting(true);
    const result = await startChat(credentials, phone);
    setSubmitting(false);

    if (result.ok) handleClose();
    else setError(result.error);
  }

  return (
    <Modal
      open={open}
      title={t.newChat.title}
      width={420}
      onClose={handleClose}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
      >
        <fieldset
          className={styles.fields}
          disabled={submitting}
        >
          <TextField
            label={t.newChat.phone}
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            prefix="+"
            placeholder={t.newChat.placeholder}
            hint={t.newChat.hint}
            error={error}
            value={phone}
            onChange={handleChange}
          />
          <Button
            type="submit"
            size="medium"
            disabled={!canSubmit}
          >
            {submitting ? t.newChat.submitting : t.newChat.submit}
          </Button>
        </fieldset>
      </form>
    </Modal>
  );
}
