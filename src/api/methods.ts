import type { z } from 'zod'
import { ApiError, request, type Credentials } from './client'
import {
  checkAccountSchema,
  deleteNotificationSchema,
  failureSchema,
  notificationEnvelopeSchema,
  sendMessageSchema,
  setSettingsSchema,
  settingsSchema,
  stateInstanceSchema,
  type CheckAccount,
  type NotificationEnvelope,
  type Settings,
  type StateInstance,
} from './schemas'

/** The API answered 2xx, but not with what we expected. */
export class InvalidResponseError extends Error {
  readonly method: string
  readonly body: unknown

  constructor(method: string, body: unknown, cause: z.ZodError) {
    super(`${method}: unexpected response`, { cause })
    this.name = 'InvalidResponseError'
    this.method = method
    this.body = body
  }
}

function parse<T extends z.ZodType>(method: string, schema: T, data: unknown): z.infer<T> {
  // 200 with `{ status: false, reason }` is an API-level failure, not a malformed response
  if (failureSchema.safeParse(data).success) throw new ApiError(method, 200, data)
  const result = schema.safeParse(data)
  if (!result.success) throw new InvalidResponseError(method, data, result.error)
  return result.data
}

export async function getStateInstance(
  creds: Credentials,
  signal?: AbortSignal,
): Promise<StateInstance> {
  const data = await request(creds, 'getStateInstance', { signal })
  return parse('getStateInstance', stateInstanceSchema, data).stateInstance
}

export async function getSettings(creds: Credentials, signal?: AbortSignal): Promise<Settings> {
  const data = await request(creds, 'getSettings', { signal })
  return parse('getSettings', settingsSchema, data)
}

export async function setSettings(
  creds: Credentials,
  settings: Partial<Pick<Settings, 'incomingWebhook' | 'outgoingMessageWebhook'>>,
): Promise<boolean> {
  const data = await request(creds, 'setSettings', { httpMethod: 'POST', body: settings })
  return parse('setSettings', setSettingsSchema, data).saveSettings
}

/** `phoneNumber` must already be normalized to digits only. */
export async function checkAccount(creds: Credentials, phoneNumber: string): Promise<CheckAccount> {
  const data = await request(creds, 'checkAccount', {
    httpMethod: 'POST',
    // The API expects an integer; 15 digits max fits safely in a JS number
    body: { phoneNumber: Number(phoneNumber) },
  })
  return parse('checkAccount', checkAccountSchema, data)
}

export async function sendMessage(
  creds: Credentials,
  chatId: string,
  message: string,
): Promise<string> {
  const data = await request(creds, 'sendMessage', {
    httpMethod: 'POST',
    body: { chatId, message },
  })
  return parse('sendMessage', sendMessageSchema, data).idMessage
}

/** Long polling: resolves with `null` after `receiveTimeout` seconds if the queue is empty. */
export async function receiveNotification(
  creds: Credentials,
  receiveTimeout: number,
  signal?: AbortSignal,
): Promise<NotificationEnvelope | null> {
  const data = await request(creds, 'receiveNotification', {
    query: { receiveTimeout },
    signal,
  })
  return parse('receiveNotification', notificationEnvelopeSchema, data)
}

export async function deleteNotification(
  creds: Credentials,
  receiptId: number,
  signal?: AbortSignal,
): Promise<boolean> {
  const data = await request(creds, 'deleteNotification', {
    httpMethod: 'DELETE',
    path: [receiptId],
    signal,
  })
  return parse('deleteNotification', deleteNotificationSchema, data).result
}
