/**
 * Unique enough id for an optimistic message until the API gives it a real one.
 * `crypto.randomUUID` only exists in secure contexts (https, localhost): opening the dev
 * server by LAN IP from a phone is not one, so there is a fallback.
 */
export function createLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`;
  }

  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
