import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import checkAccountFixture from './__fixtures__/checkAccount.json'
import incomingText from './__fixtures__/incomingTextMessage.json'
import sendMessageFixture from './__fixtures__/sendMessage.json'
import { ApiError, type Credentials } from './client'
import {
  checkAccount,
  deleteNotification,
  getSettings,
  getStateInstance,
  InvalidResponseError,
  receiveNotification,
  sendMessage,
} from './methods'

const creds: Credentials = {
  apiUrl: 'https://api.green-api.com',
  idInstance: '4100000000',
  apiTokenInstance: 'token',
}

const fetchMock = vi.fn<typeof fetch>()
const respond = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
const lastRequest = () => {
  const [url, init] = fetchMock.mock.calls.at(-1)!
  return {
    url: String(url),
    method: init?.method,
    body: init?.body && JSON.parse(String(init.body)),
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('checkAccount', () => {
  it('sends the phone as an integer and parses the real response', async () => {
    respond(checkAccountFixture)
    await expect(checkAccount(creds, '79991234567')).resolves.toEqual({
      exist: true,
      chatId: '10000000',
    })
    expect(lastRequest()).toMatchObject({ method: 'POST', body: { phoneNumber: 79991234567 } })
  })

  it('accepts exist: false without chatId', async () => {
    respond({ exist: false, fromCache: false })
    await expect(checkAccount(creds, '79991234567')).resolves.toEqual({ exist: false })
  })

  it('turns `200 { status: false, reason }` into ApiError', async () => {
    respond({ status: false, reason: 'instance is starting or not authorized' })
    const error = await checkAccount(creds, '79991234567').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 200,
      message: 'checkAccount: HTTP 200 (instance is starting or not authorized)',
    })
  })
})

describe('sendMessage', () => {
  it('returns idMessage', async () => {
    respond(sendMessageFixture)
    await expect(sendMessage(creds, '10000000', 'hi')).resolves.toBe(sendMessageFixture.idMessage)
    expect(lastRequest().body).toEqual({ chatId: '10000000', message: 'hi' })
  })
})

describe('getStateInstance / getSettings', () => {
  it('returns the state', async () => {
    respond({ stateInstance: 'authorized' })
    await expect(getStateInstance(creds)).resolves.toBe('authorized')
  })

  it('keeps only the settings we use', async () => {
    respond({
      wid: '79990000000@c.us',
      typeInstance: 'telegram',
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingMessageWebhook: 'no',
      stateWebhook: 'no',
    })
    await expect(getSettings(creds)).resolves.toEqual({
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingMessageWebhook: 'no',
    })
  })

  it('throws InvalidResponseError on an unexpected shape', async () => {
    respond({ something: 'else' })
    await expect(getStateInstance(creds)).rejects.toBeInstanceOf(InvalidResponseError)
  })
})

describe('notification queue', () => {
  it('returns null for an empty queue', async () => {
    respond(null)
    await expect(receiveNotification(creds, 20)).resolves.toBeNull()
    expect(lastRequest().url).toMatch(/receiveNotification\/token\?receiveTimeout=20$/)
  })

  it('returns the envelope without validating the body', async () => {
    respond(incomingText)
    await expect(receiveNotification(creds, 20)).resolves.toEqual({
      receiptId: incomingText.receiptId,
      body: incomingText.body,
    })

    respond({ receiptId: 7, body: 'unexpected' })
    await expect(receiveNotification(creds, 20)).resolves.toEqual({
      receiptId: 7,
      body: 'unexpected',
    })
  })

  it('deletes by receiptId', async () => {
    respond({ result: true, reason: '' })
    await expect(deleteNotification(creds, 7)).resolves.toBe(true)
    expect(lastRequest()).toMatchObject({ method: 'DELETE' })
    expect(lastRequest().url).toMatch(/deleteNotification\/token\/7$/)
  })
})
