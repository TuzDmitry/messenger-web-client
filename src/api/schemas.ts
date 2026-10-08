import { z } from 'zod'

// Objects are non-strict on purpose: real responses carry fields the docs don't
// mention (`wid`, `forwardingScore`, …). Unknown keys are stripped, not rejected.

/** Some methods answer HTTP 200 with `{ status: false, reason }` instead of an error code. */
export const failureSchema = z.object({
  status: z.literal(false),
  reason: z.string(),
})

export const stateInstanceSchema = z.object({
  stateInstance: z.string(),
})
export type StateInstance = z.infer<typeof stateInstanceSchema>['stateInstance']

const yesNo = z.enum(['yes', 'no'])

export const settingsSchema = z.object({
  webhookUrl: z.string(),
  incomingWebhook: yesNo,
  outgoingMessageWebhook: yesNo,
})
export type Settings = z.infer<typeof settingsSchema>

export const setSettingsSchema = z.object({
  saveSettings: z.boolean(),
})

export const checkAccountSchema = z.object({
  exist: z.boolean(),
  chatId: z.string().optional(),
})
export type CheckAccount = z.infer<typeof checkAccountSchema>

export const sendMessageSchema = z.object({
  idMessage: z.string(),
})

export const deleteNotificationSchema = z.object({
  result: z.boolean(),
})

/**
 * Only the envelope is validated here: the poller must be able to delete a
 * notification by `receiptId` even when its body is something we can't parse.
 */
export const notificationEnvelopeSchema = z
  .object({
    receiptId: z.number(),
    body: z.unknown(),
  })
  .nullable()
export type NotificationEnvelope = NonNullable<z.infer<typeof notificationEnvelopeSchema>>

const textMessageData = z.object({
  typeMessage: z.literal('textMessage'),
  textMessageData: z.object({ textMessage: z.string() }),
})

// Docs: links arrive as extendedTextMessage. Telegram sends them as plain
// textMessage (seen in the spike); kept for MAX.
const extendedTextMessageData = z.object({
  typeMessage: z.literal('extendedTextMessage'),
  extendedTextMessageData: z.object({ text: z.string() }),
})

export const messageNotificationSchema = z.object({
  typeWebhook: z.enum(['incomingMessageReceived', 'outgoingMessageReceived']),
  idMessage: z.string(),
  timestamp: z.number(),
  senderData: z.object({
    chatId: z.string(),
    chatName: z.string().optional(),
    senderName: z.string().optional(),
  }),
  messageData: z.discriminatedUnion('typeMessage', [textMessageData, extendedTextMessageData]),
})
