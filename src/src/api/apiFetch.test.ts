import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiGet, apiPost, buildQueryString } from '@/api/apiFetch'

vi.mock('@/auth/auth', () => ({
  getAccessToken: vi.fn(),
}))

import { getAccessToken } from '@/auth/auth'

describe('buildQueryString', () => {
  it('omits empty values and prefixes a question mark', () => {
    expect(buildQueryString({ search: 'jane', page: 1, empty: '', skip: null })).toBe(
      '?search=jane&page=1',
    )
    expect(buildQueryString({ search: undefined })).toBe('')
  })
})

describe('apiFetch', () => {
  beforeEach(() => {
    vi.mocked(getAccessToken).mockReset()
    vi.unstubAllGlobals()
  })

  it('sends a bearer token and returns JSON', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('token-1')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiGet<{ id: string }>('/api/me')).resolves.toEqual({ id: '1' })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.test.example/api/me')
    expect(init.method).toBe('GET')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token-1')
  })

  it('returns undefined for 204 responses', async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('no body')
        },
      }),
    )

    await expect(apiGet('/api/clients/1')).resolves.toBeUndefined()
  })

  it('throws ApiError from problem details', async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ detail: 'Tenant not found for user' }),
      }),
    )

    const error = await apiPost('/api/reports/book/export', undefined).catch(
      (caught: unknown) => caught,
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 403, message: 'Tenant not found for user' })
  })
})
