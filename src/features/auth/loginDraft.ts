const KEY = 'login-draft';

export type LoginDraft = {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
};

const EMPTY: LoginDraft = { idInstance: '', apiTokenInstance: '', apiUrl: '' };

/**
 * What the user has typed so far survives a reload: phones unload background tabs, and
 * people switch apps exactly to copy the credentials. Same storage and lifetime as the
 * credentials after sign in (sessionStorage), and cleared on sign in.
 */
export function readLoginDraft(): LoginDraft {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Partial<LoginDraft> | null;

    return {
      idInstance: typeof saved?.idInstance === 'string' ? saved.idInstance : '',
      apiTokenInstance: typeof saved?.apiTokenInstance === 'string' ? saved.apiTokenInstance : '',
      apiUrl: typeof saved?.apiUrl === 'string' ? saved.apiUrl : '',
    };
  } catch {
    // Storage blocked or a broken value: start empty
    return EMPTY;
  }
}

export function saveLoginDraft(draft: LoginDraft) {
  try {
    const isEmpty = !draft.idInstance && !draft.apiTokenInstance && !draft.apiUrl;
    if (isEmpty) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Not critical: the form just won't survive a reload
  }
}

export function clearLoginDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear
  }
}
