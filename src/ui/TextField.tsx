import { useId, type InputHTMLAttributes } from 'react'
import styles from './TextField.module.css'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  /** One line: it shares the reserved message slot with the error. */
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, ...inputProps }: TextFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...inputProps}
      />
      {/* Always rendered: the slot keeps its height so errors don't shift the layout */}
      <p id={messageId} className={error ? styles.error : styles.hint}>
        {message}
      </p>
    </div>
  )
}
