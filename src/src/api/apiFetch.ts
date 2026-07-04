import { getAccessToken } from '@/auth/auth'
import { apiBaseUrl } from '@/lib/config'
import type { ApiProblemDetails } from '@/types/apiModels'

export class ApiError extends Error {
  status: number
  details?: ApiProblemDetails

  constructor(message: string, status: number, details?: ApiProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let details: ApiProblemDetails | undefined

  try {
    details = (await response.json()) as ApiProblemDetails
  } catch {
    // Response body is not JSON.
  }

  const message =
    details?.detail ??
    details?.title ??
    response.statusText ??
    'Request failed'

  return new ApiError(message, response.status, details)
}

export type ApiRequestOptions = Omit<RequestInit, 'method' | 'body'>

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${apiBaseUrl}${normalizedPath}`
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = await getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function apiGet<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' })
}

export function apiPost<T>(
  path: string,
  body: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function apiPut<T>(
  path: string,
  body: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function apiPatch<T>(
  path: string,
  body: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function apiDelete<T = void>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' })
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}
