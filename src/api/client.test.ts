import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, buildUrl, request, type Credentials } from './client'

const creds: Credentials = {
  apiUrl: 'https://api.green-api.com',
  idInstance: '1101000001',
  apiTokenInstance: 'token123',
}

describe('buildUrl', () => {
  it('builds the base method URL', () => {
    expect(buildUrl(creds, 'getStateInstance')).toBe(
      'https://api.green-api.com/waInstance1101000001/getStateInstance/token123',
    )
  })

  it('tolerates trailing slashes and whitespace in credentials', () => {
    const url = buildUrl(
      {
        apiUrl: ' https://api.green-api.com// ',
        idInstance: ' 1101000001 ',
        apiTokenInstance: ' token123 ',
      },
      'getStateInstance',
    )
    expect(url).toBe('https://api.green-api.com/waInstance1101000001/getStateInstance/token123')
  })

  it('appends extra path segments after the token', () => {
    expect(buildUrl(creds, 'deleteNotification', { path: [42] })).toBe(
      'https://api.green-api.com/waInstance1101000001/deleteNotification/token123/42',
    )
  })

  it('appends query parameters', () => {
    expect(buildUrl(creds, 'receiveNotification', { query: { receiveTimeout: 20 } })).toBe(
      'https://api.green-api.com/waInstance1101000001/receiveNotification/token123?receiveTimeout=20',
    )
  })

  it('encodes path segments', () => {
    expect(buildUrl({ ...creds, apiTokenInstance: 'a/b?c' }, 'getStateInstance')).toBe(
      'https://api.green-api.com/waInstance1101000001/getStateInstance/a%2Fb%3Fc',
    )
  })
})

describe('request', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON', async () => {
    fetchMock.mockResolvedValue(new Response('{"stateInstance":"authorized"}'))
    await expect(request(creds, 'getStateInstance')).resolves.toEqual({
      stateInstance: 'authorized',
    })
  })

  it('returns null for an empty body (empty notification queue)', async () => {
    fetchMock.mockResolvedValue(new Response('null'))
    await expect(request(creds, 'receiveNotification')).resolves.toBeNull()

    fetchMock.mockResolvedValue(new Response(''))
    await expect(request(creds, 'receiveNotification')).resolves.toBeNull()
  })

  it('sends a JSON body with the given HTTP method', async () => {
    fetchMock.mockResolvedValue(new Response('{"idMessage":"1"}'))
    await request(creds, 'sendMessage', {
      httpMethod: 'POST',
      body: { chatId: '10000000', message: 'hi' },
    })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.green-api.com/waInstance1101000001/sendMessage/token123')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(init?.body).toBe('{"chatId":"10000000","message":"hi"}')
  })

  it('does not send a body or content type for GET', async () => {
    fetchMock.mockResolvedValue(new Response('{}'))
    await request(creds, 'getSettings')

    const [, init] = fetchMock.mock.calls[0]!
    expect(init?.method).toBe('GET')
    expect(init?.body).toBeUndefined()
    expect(init?.headers).toBeUndefined()
  })

  it('throws ApiError on 401 with an empty body (wrong token)', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }))
    const error = await request(creds, 'getStateInstance').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, body: null, method: 'getStateInstance' })
  })

  it('keeps the error body (JSON or text) on non-2xx', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"status":false,"reason":"Validation failed"}', { status: 400 }),
    )
    await expect(request(creds, 'checkAccount')).rejects.toMatchObject({
      status: 400,
      body: { status: false, reason: 'Validation failed' },
    })

    fetchMock.mockResolvedValue(new Response('Too Many Requests', { status: 429 }))
    await expect(request(creds, 'checkAccount')).rejects.toMatchObject({
      status: 429,
      body: 'Too Many Requests',
    })
  })

  it('wraps network failures into ApiError with status 0', async () => {
    const cause = new TypeError('Failed to fetch')
    fetchMock.mockRejectedValue(cause)
    const error = await request(creds, 'getStateInstance').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, cause })
  })

  it('rethrows aborts untouched', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('Aborted', 'AbortError')
    fetchMock.mockImplementation(() => {
      controller.abort()
      return Promise.reject(abortError)
    })

    await expect(request(creds, 'receiveNotification', { signal: controller.signal })).rejects.toBe(
      abortError,
    )
  })
})
