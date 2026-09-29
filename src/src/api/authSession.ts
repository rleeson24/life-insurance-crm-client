import { apiPost } from '@/api/apiFetch'
import { apiBaseUrl } from '@/lib/config'

export function recordLoginSucceeded() {
  return apiPost<void>('/api/auth/login', {})
}

export function recordLogout() {
  return apiPost<void>('/api/auth/logout', {})
}

export async function recordLoginFailed(reason: string) {
  await fetch(`${apiBaseUrl}/api/auth/login-failed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  })
}
