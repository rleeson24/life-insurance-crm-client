import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/apiFetch'
import { classifyAccessError } from '@/auth/accessError'

function forbidden(detail: string) {
  return new ApiError(detail, 403, { detail, status: 403 })
}

describe('classifyAccessError', () => {
  it('returns unavailable for non-API and non-403 errors', () => {
    expect(classifyAccessError(new Error('network'))).toBe('unavailable')
    expect(classifyAccessError(new ApiError('boom', 500))).toBe('unavailable')
  })

  it('maps 403 details to denial reasons', () => {
    expect(classifyAccessError(forbidden('Tenant not found for this user.'))).toBe(
      'no-account',
    )
    expect(classifyAccessError(forbidden('User account is inactive.'))).toBe(
      'inactive-user',
    )
    expect(classifyAccessError(forbidden('Organization is inactive.'))).toBe(
      'inactive-org',
    )
    expect(classifyAccessError(forbidden('Missing oid claim on the token.'))).toBe(
      'invalid-identity',
    )
    expect(classifyAccessError(forbidden('Use a work account, not a personal Microsoft account.'))).toBe(
      'invalid-identity',
    )
    expect(classifyAccessError(forbidden('You do not have permission.'))).toBe(
      'forbidden',
    )
  })
})
