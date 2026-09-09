import { describe, expect, it } from 'vitest'
import {
  isListedPlanName,
  normalizePlanNameInput,
  planNameOptionLabel,
  planYearsForCoverage,
  unknownPlanName,
} from '@/lib/planNames'
import type { PlanNameDto } from '@/types/apiModels'

const catalog: PlanNameDto[] = [
  {
    planNameId: '1',
    planYear: 2026,
    name: 'Humana Gold',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('normalizePlanNameInput', () => {
  it('strips a year suffix and trims whitespace', () => {
    expect(normalizePlanNameInput('  Humana Gold - 2026  ')).toBe('Humana Gold')
    expect(normalizePlanNameInput('   ')).toBe('')
  })
})

describe('planYearsForCoverage', () => {
  it('uses the coverage start year when it is in range', () => {
    expect(planYearsForCoverage('2026-01-01')).toEqual({
      catalogYear: 2026,
      priorYear: 2025,
    })
  })

  it('falls back to the current year when coverage start is missing', () => {
    expect(planYearsForCoverage('', new Date(2024, 5, 1))).toEqual({
      catalogYear: 2024,
      priorYear: 2023,
    })
  })
})

describe('plan name catalog matching', () => {
  it('builds option labels with the catalog year', () => {
    expect(planNameOptionLabel('Humana Gold', 2026)).toBe('Humana Gold - 2026')
  })

  it('treats empty values as listed and matches names accent-insensitively', () => {
    expect(isListedPlanName('', catalog)).toBe(true)
    expect(isListedPlanName('humana gold - 2026', catalog)).toBe(true)
    expect(isListedPlanName('Aetna Silver', catalog)).toBe(false)
  })

  it('returns unknown names that are not in the catalog', () => {
    expect(unknownPlanName('Aetna Silver', catalog)).toBe('Aetna Silver')
    expect(unknownPlanName('Humana Gold', catalog)).toBeNull()
    expect(unknownPlanName('  ', catalog)).toBeNull()
  })
})
