import { ApiError } from '@/api/apiFetch'

export type AccessDenialReason =
  | 'no-account'
  | 'inactive-user'
  | 'inactive-org'
  | 'invalid-identity'
  | 'forbidden'
  | 'unavailable'

export function classifyAccessError(error: unknown): AccessDenialReason {
  if (!(error instanceof ApiError)) {
    return 'unavailable'
  }

  if (error.status !== 403) {
    return 'unavailable'
  }

  const detail = error.details?.detail ?? error.message

  if (detail.includes('Tenant not found')) {
    return 'no-account'
  }

  if (detail.includes('User account is inactive')) {
    return 'inactive-user'
  }

  if (detail.includes('Organization is inactive')) {
    return 'inactive-org'
  }

  if (detail.includes('oid claim') || detail.includes('personal Microsoft')) {
    return 'invalid-identity'
  }

  return 'forbidden'
}
