import { ApiError, isUnauthorized, type Credentials } from '@/api/client';
import { getStateInstance } from '@/api/methods';
import { t } from '@/i18n';

export type VerifyResult = { ok: true } | { ok: false; error: string };

/** Signs in only with an authorized instance; otherwise explains what is wrong. */
export async function verifyCredentials(creds: Credentials): Promise<VerifyResult> {
  try {
    const state = await getStateInstance(creds);
    if (state === 'authorized') return { ok: true };
    return { ok: false, error: t.auth.errors.state(state) };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return t.auth.errors.unexpected;
  if (error.status === 0) return t.auth.errors.network;
  // A wrong idInstance can also show up as 404
  if (isUnauthorized(error) || error.status === 404) return t.auth.errors.wrongCredentials;
  return t.auth.errors.http(error.status);
}
