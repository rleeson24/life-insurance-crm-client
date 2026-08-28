import type { PlanNameDto } from '@/types/apiModels'

const yearSuffixPattern = /\s+-\s+(?:19|20)\d{2}$/

export function normalizePlanNameInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.replace(yearSuffixPattern, '').trim()
}

export function planYearsForCoverage(coverageStartDate: string, now = new Date()) {
  const fromCoverage = Number(coverageStartDate.slice(0, 4))
  const catalogYear =
    coverageStartDate &&
    Number.isInteger(fromCoverage) &&
    fromCoverage >= 2000 &&
    fromCoverage <= 2100
      ? fromCoverage
      : now.getFullYear()

  return { catalogYear, priorYear: catalogYear - 1 }
}

export function planNameOptionLabel(name: string, year: number) {
  return `${name} - ${year}`
}

export function isListedPlanName(value: string, items: PlanNameDto[]) {
  const normalized = normalizePlanNameInput(value)
  if (!normalized) return true
  return items.some(
    (item) => item.name.localeCompare(normalized, undefined, { sensitivity: 'accent' }) === 0,
  )
}

export function unknownPlanName(value: string, items: PlanNameDto[]) {
  const normalized = normalizePlanNameInput(value)
  if (!normalized || isListedPlanName(normalized, items)) {
    return null
  }
  return normalized
}
