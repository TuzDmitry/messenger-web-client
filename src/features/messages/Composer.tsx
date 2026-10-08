import { useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { SendIcon } from '@/ui/icons';
import { useSession } from '@/store/session';
import { t } from '@/i18n';
import { MAX_MESSAGE_LENGTH, sendText } from './sendText';
import styles from './Composer.module.css';

// On touch screens autofocus would pop the keyboard up over half the chat on every open
const AUTOFOCUS = globalThis.matchMedia?.('(pointer: fine)').matches ?? false;

// Show the counter only when it starts to matter
const COUNTER_FROM = MAX_MESSAGE_LENGTH - 200;

type ComposerProps = {
  chatId: string;
};

export function Composer({ chatId }: ComposerProps) {
  const credentials = useSession((state) => state.credentials);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = text.trim() !== '';

  // Grow with the content up to the CSS max-height, then scroll
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [text]);

  function send() {
    if (!credentials || !canSend) return;
    void sendText(credentials, chatId, text.trim());
    setText('');
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
  }

  // Enter sends, Shift+Enter adds a line; never while an IME composition is in progress
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.composer}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          rows={1}
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={t.composer.placeholder}
          aria-label={t.composer.placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus={AUTOFOCUS}
        />
        {text.length >= COUNTER_FROM && (
          <span
            className={styles.counter}
            aria-live="polite"
          >
            {text.length}/{MAX_MESSAGE_LENGTH}
          </span>
        )}
        <button
          type="button"
          className={styles.send}
          aria-label={t.composer.send}
          title={t.composer.send}
          disabled={!canSend}
          onClick={send}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
