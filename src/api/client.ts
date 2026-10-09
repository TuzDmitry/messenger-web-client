export type Credentials = {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
};

type HttpMethod = 'GET' | 'POST' | 'DELETE';

type UrlOptions = {
  /** Extra path segments after the token, e.g. `receiptId` for deleteNotification. */
  path?: Array<string | number>;
  query?: Record<string, string | number>;
};

type RequestOptions = UrlOptions & {
  httpMethod?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
};

/** `0` means the request never got an HTTP response (nKetwork failure, CORS, DNS). */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly method: string;

  constructor(method: string, status: number, body: unknown, options?: ErrorOptions) {
    const reason =
      typeof body === 'object' &&
      body !== null &&
      'reason' in body &&
      typeof body.reason === 'string'
        ? ` (${body.reason})`
        : '';
    super(
      status === 0 ? `${method}: network error` : `${method}: HTTP ${status}${reason}`,
      options,
    );
    this.name = 'ApiError';
    this.method = method;
    this.status = status;
    this.body = body;
  }
}

/** `{apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}[/{path}][?query]` */
export function buildUrl(creds: Credentials, method: string, options: UrlOptions = {}): string {
  const base = creds.apiUrl.trim().replace(/\/+$/, '');
  const segments = [
    `waInstance${creds.idInstance.trim()}`,
    method,
    creds.apiTokenInstance.trim(),
    ...(options.path ?? []),
  ].map((segment) => encodeURIComponent(String(segment)));

  const url = `${base}/${segments.join('/')}`;
  if (!options.query) return url;

  const params = new URLSearchParams(
    Object.entries(options.query).map(([key, value]) => [key, String(value)]),
  );
  return `${url}?${params}`;
}

/** Empty body → `null`, JSON → parsed value, anything else → raw text. */
async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Low-level call to a GREEN-API method. Returns the parsed body as `unknown` —
 * callers validate it with a schema. Aborts are rethrown as-is so callers can
 * tell cancellation apart from failures.
 */
export async function request(
  creds: Credentials,
  method: string,
  { httpMethod = 'GET', body, signal, ...urlOptions }: RequestOptions = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(buildUrl(creds, method, urlOptions), {
      method: httpMethod,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(method, 0, null, { cause: error });
  }

  const data = await readBody(response);
  if (!response.ok) throw new ApiError(method, response.status, data);
  return data;
}
