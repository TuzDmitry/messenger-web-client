import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Credentials } from '@/api/client'
import { t } from '@/i18n'
import { credentialsSchema, DEFAULT_API_URL } from './credentialsSchema'
import { verifyCredentials } from './verifyCredentials'

describe('credentialsSchema', () => {
  it('trims values and strips trailing slashes from apiUrl', () => {
    expect(
      credentialsSchema.parse({
        idInstance: ' 4100000000 ',
        apiTokenInstance: ' token ',
        apiUrl: ' https://4100.api.green-api.com/ ',
      }),
    ).toEqual({
      idInstance: '4100000000',
      apiTokenInstance: 'token',
      apiUrl: 'https://4100.api.green-api.com',
    })
  })

  it('falls back to the default apiUrl when it is left empty', () => {
    expect(
      credentialsSchema.parse({ idInstance: '4100000000', apiTokenInstance: 'token', apiUrl: '  ' })
        .apiUrl,
    ).toBe(DEFAULT_API_URL)
  })

  it.each([
    [{ idInstance: '41000abc' }, 'idInstance', t.auth.errors.idInstance],
    [{ idInstance: '' }, 'idInstance', t.auth.errors.required],
    [{ apiTokenInstance: '   ' }, 'apiTokenInstance', t.auth.errors.required],
    [{ apiUrl: 'not a url' }, 'apiUrl', t.auth.errors.apiUrl],
    [{ apiUrl: 'ftp://api.green-api.com' }, 'apiUrl', t.auth.errors.apiUrl],
  ])('rejects %o', (patch, field, message) => {
    const result = credentialsSchema.safeParse({
      idInstance: '4100000000',
      apiTokenInstance: 'token',
      apiUrl: 'https://api.green-api.com',
      ...patch,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]).toMatchObject({ path: [field], message })
  })
})

describe('verifyCredentials', () => {
  const creds: Credentials = {
    apiUrl: 'https://api.green-api.com',
    idInstance: '4100000000',
    apiTokenInstance: 'token',
  }
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('accepts an authorized instance', async () => {
    fetchMock.mockResolvedValue(new Response('{"stateInstance":"authorized"}'))
    await expect(verifyCredentials(creds)).resolves.toEqual({ ok: true })
  })

  it('explains a non-authorized state', async () => {
    fetchMock.mockResolvedValue(new Response('{"stateInstance":"notAuthorized"}'))
    await expect(verifyCredentials(creds)).resolves.toEqual({
      ok: false,
      error: t.auth.errors.state('notAuthorized'),
    })
  })

  it('reports wrong credentials on 401 with an empty body', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }))
    await expect(verifyCredentials(creds)).resolves.toEqual({
      ok: false,
      error: t.auth.errors.wrongCredentials,
    })
  })

  it('reports network failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(verifyCredentials(creds)).resolves.toEqual({
      ok: false,
      error: t.auth.errors.network,
    })
  })

  it('reports other HTTP errors with the status', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 500 }))
    await expect(verifyCredentials(creds)).resolves.toEqual({
      ok: false,
      error: t.auth.errors.http(500),
    })
  })

  it('reports an unexpected response shape', async () => {
    fetchMock.mockResolvedValue(new Response('{"foo":1}'))
    await expect(verifyCredentials(creds)).resolves.toEqual({
      ok: false,
      error: t.auth.errors.unexpected,
    })
  })
})
