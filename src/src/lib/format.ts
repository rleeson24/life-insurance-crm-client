export function formatDate(value?: string | null): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatClientName(
  firstName?: string | null,
  lastName?: string | null,
  legalName?: string | null,
): string {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  return fullName || legalName || 'Unnamed client'
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function toDatetimeLocalValue(value?: string | Date | null): string {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''

  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toIsoFromDatetimeLocal(value: string): string {
  return new Date(value).toISOString()
}
