import { useId, type InputHTMLAttributes } from 'react';
import styles from './TextField.module.css';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** One line: it shares the reserved message slot with the error. */
  hint?: string;
  error?: string;
  /** Fixed text inside the field before the value, e.g. `+` for a phone. Not part of the value. */
  prefix?: string;
};

export function TextField({ label, hint, error, prefix, ...inputProps }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={styles.field}>
      <label
        className={styles.label}
        htmlFor={id}
      >
        {label}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          className={styles.input}
          data-prefixed={prefix ? true : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...inputProps}
        />
        {/* After the input so `:disabled +` can dim it; clicks pass through to the input */}
        {prefix && (
          <span
            className={styles.prefix}
            aria-hidden
          >
            {prefix}
          </span>
        )}
      </div>
      {/* Always rendered: the slot keeps its height so errors don't shift the layout */}
      <p
        id={messageId}
        className={error ? styles.error : styles.hint}
      >
        {message}
      </p>
    </div>
  );
}
