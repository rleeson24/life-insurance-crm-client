import { describe, expect, it } from 'vitest'
import {
  cn,
  formatClientName,
  formatDate,
  formatDateTime,
  toDateInputValue,
  toDatetimeLocalValue,
  toIsoFromDatetimeLocal,
} from '@/lib/format'

describe('formatDate', () => {
  it('returns an em dash for empty values', () => {
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('formats a date-only string as a local calendar date', () => {
    expect(formatDate('2024-01-15')).toContain('2024')
    expect(formatDate('2024-01-15')).not.toBe('2024-01-15')
  })

  it('returns the original value when the date is invalid', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatDateTime', () => {
  it('returns an em dash for empty values', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('formats an ISO timestamp', () => {
    expect(formatDateTime('2024-06-01T15:05:00.000Z')).toContain('2024')
  })
})

describe('formatClientName', () => {
  it('joins first and last name', () => {
    expect(formatClientName('Jane', 'Doe')).toBe('Jane Doe')
  })

  it('falls back to legal name, then unnamed', () => {
    expect(formatClientName(null, null, 'Acme LLC')).toBe('Acme LLC')
    expect(formatClientName()).toBe('Unnamed client')
  })
})

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})

describe('date input helpers', () => {
  it('slices ISO values to yyyy-mm-dd', () => {
    expect(toDateInputValue('2024-03-09T12:00:00.000Z')).toBe('2024-03-09')
    expect(toDateInputValue(undefined)).toBe('')
  })

  it('formats a Date as datetime-local', () => {
    const value = toDatetimeLocalValue(new Date(2024, 0, 2, 3, 4))
    expect(value).toBe('2024-01-02T03:04')
  })

  it('returns an empty string for invalid datetime-local input', () => {
    expect(toDatetimeLocalValue('not-a-date')).toBe('')
  })

  it('converts datetime-local strings to ISO', () => {
    const iso = toIsoFromDatetimeLocal('2024-01-02T03:04')
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
