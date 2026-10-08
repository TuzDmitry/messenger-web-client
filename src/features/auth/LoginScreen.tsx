import { useId, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';
import { useSession } from '@/store/session';
import { t } from '@/i18n';
import { credentialsSchema, DEFAULT_API_URL } from './credentialsSchema';
import { verifyCredentials } from './verifyCredentials';
import styles from './LoginScreen.module.css';

type Field = 'idInstance' | 'apiTokenInstance' | 'apiUrl';

export function LoginScreen() {
  const signIn = useSession((state) => state.signIn);
  const [values, setValues] = useState<Record<Field, string>>({
    idInstance: '',
    apiTokenInstance: '',
    apiUrl: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const advancedId = useId();

  // apiUrl is optional (empty → default host), so only these two gate the button
  const canSubmit = values.idInstance.trim() !== '' && values.apiTokenInstance.trim() !== '';

  // One handler for all fields: the input's `name` says which one changed
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as Field;
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(undefined);
  }

  function toggleAdvanced() {
    setAdvancedOpen((open) => !open);
  }

  function bind(field: Field) {
    return {
      name: field,
      value: values[field],
      error: fieldErrors[field],
      onChange: handleChange,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    const parsed = credentialsSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) errors[issue.path[0] as Field] ??= issue.message;
      setFieldErrors(errors);
      if (errors.apiUrl) setAdvancedOpen(true);
      return;
    }

    setSubmitting(true);
    const result = await verifyCredentials(parsed.data);
    setSubmitting(false);

    if (result.ok) signIn(parsed.data);
    else setFormError(result.error);
  }

  return (
    <main className={styles.screen}>
      <form
        className={styles.card}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
      >
        <h1 className={styles.title}>{t.auth.title}</h1>

        {/* A disabled fieldset disables every control inside it, including the submit button */}
        <fieldset
          className={styles.fields}
          disabled={submitting}
        >
          <TextField
            label={t.auth.idInstance}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            {...bind('idInstance')}
          />
          <TextField
            label={t.auth.apiTokenInstance}
            type="password"
            // "off" is ignored for password fields; this stops Chrome from filling saved site logins
            autoComplete="new-password"
            {...bind('apiTokenInstance')}
          />

          {/* Not <details>: a closed <details> drops its content from layout and the card
              jumps. Here the collapsed field keeps its space but is visibility-hidden, which
              also removes it from tab order and the accessibility tree. */}
          <div className={styles.advanced}>
            <button
              type="button"
              className={styles.advancedToggle}
              aria-expanded={advancedOpen}
              aria-controls={advancedId}
              onClick={toggleAdvanced}
            >
              {t.auth.advanced}
            </button>
            <div
              id={advancedId}
              className={styles.advancedBody}
              data-open={advancedOpen}
            >
              <TextField
                label={t.auth.apiUrl}
                type="url"
                placeholder={DEFAULT_API_URL}
                hint={t.auth.apiUrlHint(DEFAULT_API_URL)}
                {...bind('apiUrl')}
              />
            </div>
          </div>

          {/* Always rendered: reserves two lines, and a live region that already exists
              announces new errors more reliably than one inserted with the text */}
          <p
            className={styles.formError}
            role="alert"
          >
            {formError}
          </p>

          <Button
            type="submit"
            disabled={!canSubmit}
          >
            {submitting ? t.auth.submitting : t.auth.submit}
          </Button>
        </fieldset>

        <p className={styles.footer}>
          {t.auth.subtitle}.{' '}
          <a
            href="https://console.green-api.com"
            target="_blank"
            rel="noreferrer"
          >
            {t.auth.consoleLink}
          </a>
        </p>
      </form>
    </main>
  );
}
