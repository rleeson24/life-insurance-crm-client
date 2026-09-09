import type {
  BookOfBusinessRowDto,
  ClientSummaryDto,
  CurrentUserDto,
  ProductionReportDto,
  RetentionReportDto,
} from '@/types/apiModels'

export function currentUser(overrides: Partial<CurrentUserDto> = {}): CurrentUserDto {
  return {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'agent@example.com',
    tenantId: '22222222-2222-2222-2222-222222222222',
    tenantName: 'Northwind',
    role: 'Agent',
    ...overrides,
  }
}

export function clientSummary(
  overrides: Partial<ClientSummaryDto> = {},
): ClientSummaryDto {
  return {
    clientId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    firstName: 'Jane',
    lastName: 'Doe',
    legalName: null,
    primaryPhone: '555-0100',
    isActive: true,
    isAcaClient: false,
    activePlanName: 'Humana Gold',
    lastContactedAt: '2026-03-01T14:30:00.000Z',
    updatedAt: '2026-03-01T14:30:00.000Z',
    ...overrides,
  }
}

export function productionReport(
  overrides: Partial<ProductionReportDto> = {},
): ProductionReportDto {
  return {
    planYear: 2026,
    medicare: [
      { planName: 'Humana Gold', coverageStartDate: '2026-01-01', enrollmentCount: 4 },
    ],
    drug: [],
    secondary: [],
    ...overrides,
  }
}

export function retentionReport(
  rows: RetentionReportDto['rows'] = [
    { firstYear: 2024, totalCount: 10, stillActiveCount: 8 },
  ],
): RetentionReportDto {
  return { rows }
}

export function bookOfBusinessRow(
  overrides: Partial<BookOfBusinessRowDto> = {},
): BookOfBusinessRowDto {
  return {
    clientId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    firstName: 'Jane',
    lastName: 'Doe',
    legalName: null,
    primaryPhone: '555-0100',
    addressLine1: '1 Main St',
    addressLine2: null,
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    emailAddress: 'jane@example.com',
    dateOfBirth: '1950-05-01',
    medicareNumber: '1EG4-TE5-MK73',
    medicarePartAEffectiveDate: '2015-06-01',
    medicarePartBEffectiveDate: '2015-06-01',
    hasContactConsent: true,
    notes: null,
    medicarePlanName: 'Humana Gold',
    medicareCoverageStartDate: '2026-01-01',
    drugPlanName: null,
    drugCoverageStartDate: null,
    secondaryPlanName: null,
    secondaryCoverageStartDate: null,
    ...overrides,
  }
}
